(() => {
  "use strict";

  const row = document.getElementById("gameRow");

  // Mini Robo Maze board for the card art: # wall, L lock, G goal, . floor.
  const MAZE_ART = [
    "..#..L",
    ".##.#.",
    "...L.G",
  ];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function mazeArt() {
    const cells = MAZE_ART.join("").split("").map((ch) => {
      if (ch === "#") return '<i class="m wall"></i>';
      if (ch === "L") return '<i class="m lock">🔒</i>';
      if (ch === "G") return '<i class="m goal">🏁</i>';
      return '<i class="m"></i>';
    }).join("");
    return `<div class="maze-art" style="--cols:${MAZE_ART[0].length}">${cells}
      <div class="mini-bot"><div class="face"><b></b><b></b></div></div></div>`;
  }

  function progressArt() {
    const bars = [70, 85, 60, 90, 100, 95, 80].map((h, i) =>
      `<i style="height:${h}%;animation-delay:${i * 0.08}s"></i>`).join("");
    return `<div class="progress-art">
      <div class="pa-kpis"><span><b>92%</b>attendance</span><span><b>89%</b>submissions</span></div>
      <div class="pa-bars">${bars}</div>
      <div class="pa-meter"><i></i></div></div>`;
  }

  function ratingArt() {
    const row = (label, on) => `<div class="ra-row"><span>${label}</span><div class="ra-dots">${
      [1, 2, 3, 4, 5].map((n) => `<i class="${n === on ? "on" : ""}"></i>`).join("")}</div></div>`;
    return `<div class="rating-art">
      <div class="ra-head">🔒 Anonymous</div>
      ${row("Clear structure", 4)}${row("Good examples", 5)}
      <div class="ra-bar"><i style="flex:1"></i><i style="flex:2"></i><i style="flex:3"></i><i style="flex:8"></i><i style="flex:6"></i></div>
    </div>`;
  }

  function shopArt() {
    return `<div class="shop-art" aria-hidden="true"><span class="chest">🎁</span>
      <span class="coin c1">⭐</span><span class="coin c2">💰</span><span class="coin c3">💰</span><span class="coin c4">⭐</span></div>`;
  }

  function commonsArt() {
    return `<div class="commons-art" aria-hidden="true">
      <div class="co-post official"><span class="co-av">🏛️</span><i></i><b>✓ Official</b></div>
      <div class="co-row">
        <div class="co-tile"><span>🤖</span><i></i></div>
        <div class="co-tile t2"><span>🎨</span><i></i></div>
      </div>
      <div class="co-post"><span class="co-av">🦉</span><i></i><em>👏 23</em></div>
    </div>`;
  }

  function cardArt(game) {
    if (game.art === "commons") return commonsArt();
    if (game.art === "shop") return shopArt();
    if (game.art === "maze") return mazeArt();
    if (game.art === "progress") return progressArt();
    if (game.art === "rating") return ratingArt();
    return `<div class="emoji-art">${escapeHtml(game.art || "🎮")}</div>`;
  }

  function buildCard(game, index) {
    const playable = !game.comingSoon && game.path;
    const el = document.createElement(playable ? "a" : "div");
    el.className = "game-card" + (playable ? "" : " soon");
    el.dataset.id = game.id;
    el.style.setProperty("--accent", game.accent || "#94a3b8");
    if (playable) {
      el.href = game.path;
    } else {
      el.setAttribute("aria-disabled", "true");
      el.tabIndex = 0;
    }

    const art = cardArt(game);
    const tags = (game.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
    let stats = [];
    if (typeof game.stats === "function") {
      try { stats = game.stats() || []; } catch (_) { stats = []; }
    }

    el.innerHTML = `
      <div class="card-num">${String(index + 1).padStart(2, "0")}</div>
      <div class="card-art">${art}</div>
      <div class="card-body">
        <h2>${escapeHtml(game.title)}</h2>
        <p>${escapeHtml(game.tagline || "")}</p>
        ${tags ? `<div class="tags">${tags}</div>` : ""}
        ${stats.length ? `<div class="stats">${stats.map((s) => `<span>${escapeHtml(s)}</span>`).join("")}</div>` : ""}
      </div>
      <div class="card-cta">${playable ? "▶ Play" : "Coming soon"}</div>`;
    return el;
  }

  // Menu theme and profile chip from the Reward Shop (shared/rewards.js).
  if (typeof Rewards !== "undefined") {
    const theme = (typeof MENU_THEMES !== "undefined" ? MENU_THEMES : []).find((t) => t.id === Rewards.equipped("theme"));
    if (theme) Object.entries(theme.vars).forEach(([k, v]) => document.body.style.setProperty(k, v));
    Rewards.sync();
    const lv = Rewards.level();
    const chip = document.getElementById("profileChip");
    chip.innerHTML = `<span class="pc-avatar" aria-hidden="true">${escapeHtml(Rewards.equipped("avatar"))}</span>
      <span class="pc-level">Level ${lv.level}</span>
      <span class="pc-bal">⭐ ${Rewards.stars()} · 💰 ${Rewards.coins()}</span>`;
    chip.hidden = false;
  }

  GAMES.forEach((g, i) => row.appendChild(buildCard(g, i)));

  // Keyboard: ← → move between cards, Enter opens (native for links).
  const cards = () => [...row.querySelectorAll(".game-card")];
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const list = cards();
    const i = list.indexOf(document.activeElement);
    const next = i < 0 ? 0 : Math.max(0, Math.min(list.length - 1, i + (e.key === "ArrowRight" ? 1 : -1)));
    list[next].focus();
    list[next].scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  });

  // Start with the first (leftmost) game selected.
  const first = cards()[0];
  if (first) first.focus({ preventScroll: true });
})();
