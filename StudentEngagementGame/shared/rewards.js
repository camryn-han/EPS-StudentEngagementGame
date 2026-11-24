/*
 * Rewards shared by every page of Study Arcade.
 *
 * Two currencies:
 *   💰 Coins  come from the games (Robo Maze). They buy skins and other looks.
 *   ⭐ Stars  come from studying: attended classes, hand-ins, feedback rounds and
 *             streak bonuses. They buy real rewards and emergency options.
 * Stars are counted from shared/semesters.js plus the student's ticks
 * (shared/progress.js), so they cannot be farmed by replaying a game.
 *
 * Pages that load shared/progress.js before this file get Stars and streaks.
 * Pages without it (Robo Maze) still have Coins, skins and quiz streaks.
 *
 * Everything is stored in studyArcade.wallet.v1 in this browser.
 */
const Rewards = (() => {
  "use strict";

  const KEY = "studyArcade.wallet.v1";
  const OLD_MAZE_KEY = "roboMaze.shop.v1";

  const RULES = {
    attend: 10,        // ⭐ per attended class
    onTime: 15,        // ⭐ per assignment handed in on time
    late: 5,           // ⭐ per assignment handed in late
    feedback: 20,      // ⭐ per feedback round sent
    attendMilestones: [[5, 25], [10, 50], [15, 75], [20, 100], [30, 150], [50, 250]], // streak, bonus ⭐
    subMilestones: [[3, 30], [5, 50], [10, 100]],                                    // on-time streak, bonus ⭐
    quizMilestones: [[3, 50], [5, 100], [10, 200]],                                  // correct in a row, bonus 💰
  };
  const LEVEL_TITLES = ["Newcomer", "Freshman", "Regular", "Dedicated", "Committed", "Campus Regular",
    "Study Star", "Campus Hero", "Scholar", "Legend"];

  function fresh() {
    return {
      v: 1,
      coins: 0,
      starsSpent: 0,
      owned: ["maze:classic", "theme:default", "avatar:🎓"],
      equipped: { maze: "classic", theme: "default", avatar: "🎓" },
      inventory: {},
      frozen: [],
      vouchers: [],
      requests: [],
      milestones: {},
      quiz: { streak: 0, best: 0 },
      seen: null,
      feed: [],
    };
  }

  function load() {
    let w = null;
    try { w = JSON.parse(localStorage.getItem(KEY)); } catch (_) { w = null; }
    if (!w || typeof w !== "object") {
      w = fresh();
      // Take over coins and skins from the old Robo Maze shop.
      try {
        const old = JSON.parse(localStorage.getItem(OLD_MAZE_KEY));
        if (old && typeof old.coins === "number") {
          w.coins = Math.max(0, Math.floor(old.coins));
          (old.owned || []).forEach((id) => { if (!w.owned.includes("maze:" + id)) w.owned.push("maze:" + id); });
          if (old.equipped) w.equipped.maze = old.equipped;
          localStorage.removeItem(OLD_MAZE_KEY);
        }
      } catch (_) { /* nothing to take over */ }
    }
    const base = fresh();
    Object.keys(base).forEach((k) => { if (w[k] === undefined) w[k] = base[k]; });
    w.equipped = Object.assign(base.equipped, w.equipped);
    return w;
  }
  let w = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (_) { /* storage unavailable */ }
  }

  // ---------- Notifications ----------
  const CSS = `
  #rw-toasts { position: fixed; top: 72px; right: 16px; z-index: 1000; display: flex; flex-direction: column; gap: 8px;
    width: min(340px, calc(100vw - 32px)); pointer-events: none; }
  .rw-toast { pointer-events: auto; display: grid; grid-template-columns: 36px 1fr auto; gap: 10px; align-items: center;
    padding: 10px 12px; border-radius: 12px; background: #1a1a19; color: #f0efec;
    border: 1px solid rgba(255,255,255,.12); box-shadow: 0 10px 30px rgba(0,0,0,.35);
    font: 13px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif; cursor: pointer;
    animation: rw-in .35s cubic-bezier(.2,1.3,.5,1); }
  .rw-toast.out { animation: rw-out .3s ease forwards; }
  .rw-toast .rw-icon { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px;
    background: rgba(255,255,255,.08); font-size: 20px; }
  .rw-toast b { display: block; font-size: 14px; }
  .rw-toast span.rw-text { color: #c3c2b7; }
  .rw-toast .rw-reward { font-weight: 700; color: #fcd27a; white-space: nowrap; }
  @keyframes rw-in { from { opacity: 0; transform: translateX(30px) scale(.96); } }
  @keyframes rw-out { to { opacity: 0; transform: translateX(30px); } }
  @media (prefers-reduced-motion: reduce) { .rw-toast, .rw-toast.out { animation: none; } }`;

  let box = null;
  function ensureBox() {
    if (box || typeof document === "undefined" || !document.body) return box;
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    box = document.createElement("div");
    box.id = "rw-toasts";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
    return box;
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  function notify(n, keepInFeed = true) {
    if (keepInFeed) {
      w.feed.unshift({ ...n, t: new Date().toISOString() });
      w.feed = w.feed.slice(0, 40);
      save();
    }
    const b = ensureBox();
    if (!b) return;
    const el = document.createElement("div");
    el.className = "rw-toast";
    el.innerHTML = `<span class="rw-icon" aria-hidden="true">${esc(n.icon || "⭐")}</span>
      <div><b>${esc(n.title)}</b>${n.text ? `<span class="rw-text">${esc(n.text)}</span>` : ""}</div>
      <span class="rw-reward">${esc(n.reward || "")}</span>`;
    const close = () => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 300);
    };
    el.addEventListener("click", close);
    b.appendChild(el);
    while (b.children.length > 3) b.firstElementChild.remove();
    setTimeout(close, 5500);
  }

  // ---------- Stars ----------
  let last = null;
  const hasProgress = () => typeof StudyProgress !== "undefined";
  function feedbackCount() {
    try { return (JSON.parse(localStorage.getItem("courseFeedback.done.v1")) || []).length; } catch (_) { return 0; }
  }
  function progress() {
    if (!hasProgress()) return null;
    last = StudyProgress.compute(w.frozen);
    return last;
  }
  function breakdown() {
    const p = last || progress();
    if (!p) return null;
    const fb = feedbackCount();
    const bonus = Object.values(w.milestones).reduce((s, x) => s + x, 0);
    return {
      attended: p.lifetime.attended, attendStars: p.lifetime.attended * RULES.attend,
      onTime: p.lifetime.onTime, onTimeStars: p.lifetime.onTime * RULES.onTime,
      late: p.lifetime.late, lateStars: p.lifetime.late * RULES.late,
      feedback: fb, feedbackStars: fb * RULES.feedback,
      bonusStars: bonus,
    };
  }
  function starsEarned() {
    const b = breakdown();
    if (!b) return w.seen ? w.seen.earned || 0 : 0;
    return b.attendStars + b.onTimeStars + b.lateStars + b.feedbackStars + b.bonusStars;
  }
  const stars = () => Math.max(0, starsEarned() - w.starsSpent);

  function level() {
    const xp = starsEarned();
    let n = 1;
    while (100 * ((n + 1) * n) / 2 <= xp) n++;
    const from = 100 * (n * (n - 1)) / 2;
    const to = 100 * ((n + 1) * n) / 2;
    return { level: n, title: LEVEL_TITLES[Math.min(n - 1, LEVEL_TITLES.length - 1)], xp, from, to, share: (xp - from) / (to - from) };
  }

  // Compare with the last visit and announce what is new.
  function sync() {
    const p = progress();
    if (!p) return [];
    const cur = p.current;
    const first = !w.seen;
    const notes = [];
    RULES.attendMilestones.forEach(([n, bonus]) => {
      const k = `${cur.semId}|attend|${n}`;
      if (cur.bestStreak >= n && !(k in w.milestones)) {
        w.milestones[k] = bonus;
        if (!first) notes.push({ icon: "🏅", title: `Milestone: ${n} classes in a row`, text: "Bonus for your attendance streak.", reward: `+${bonus} ⭐` });
      }
    });
    RULES.subMilestones.forEach(([n, bonus]) => {
      const k = `${cur.semId}|sub|${n}`;
      if (cur.bestSubStreak >= n && !(k in w.milestones)) {
        w.milestones[k] = bonus;
        if (!first) notes.push({ icon: "🏅", title: `Milestone: ${n} hand-ins on time in a row`, text: "Bonus for your submission streak.", reward: `+${bonus} ⭐` });
      }
    });
    const fb = feedbackCount();
    if (first) {
      notes.push({ icon: "👋", title: "Rewards are on", text: "Your classes and hand-ins so far already count.", reward: `${stars()} ⭐` });
    } else {
      const s = w.seen;
      const dA = p.lifetime.attended - s.attended;
      const dOn = p.lifetime.onTime - s.onTime;
      const dLate = p.lifetime.late - s.late;
      const dF = fb - s.feedback;
      if (dA > 0) {
        notes.unshift({
          icon: "🔥", title: `Attendance streak: ${cur.streak} in a row`,
          text: dA === 1 ? "One more class attended. Keep it going." : `${dA} more classes attended. Keep it going.`,
          reward: `+${dA * RULES.attend} ⭐`,
        });
      } else if (s.streak >= 3 && cur.streak < s.streak) {
        notes.push({
          icon: "❄️", title: `Streak ended at ${s.streak}`,
          text: (w.inventory.freeze || 0) > 0 ? "You own a Streak Freeze. Use it in the shop to save the streak." : "A Streak Freeze from the shop can save it.",
        });
      }
      if (dOn > 0) {
        notes.push({
          icon: "📬", title: cur.subStreak > 1 ? `Submission streak: ${cur.subStreak} on time` : "Handed in on time",
          text: "Nice and punctual.", reward: `+${dOn * RULES.onTime} ⭐`,
        });
      }
      if (dLate > 0) notes.push({ icon: "📨", title: "Handed in", text: "A bit late, but it counts.", reward: `+${dLate * RULES.late} ⭐` });
      if (dF > 0) notes.push({ icon: "🗳️", title: "Thanks for your feedback", text: "Your answers were sent anonymously.", reward: `+${dF * RULES.feedback} ⭐` });
    }
    w.seen = {
      attended: p.lifetime.attended, onTime: p.lifetime.onTime, late: p.lifetime.late,
      feedback: fb, streak: cur.streak, subStreak: cur.subStreak, earned: starsEarned(),
    };
    save();
    notes.forEach((n) => notify(n));
    return notes;
  }

  // ---------- Quiz streak (review questions in the games) ----------
  function quiz(correct) {
    if (correct) {
      w.quiz.streak++;
      w.quiz.best = Math.max(w.quiz.best, w.quiz.streak);
      const n = w.quiz.streak;
      const hit = RULES.quizMilestones.find(([m]) => m === n);
      if (hit) w.coins += hit[1];
      save();
      notify({
        icon: "🧠", title: `Quiz streak: ${n} correct in a row`,
        text: hit ? "Bonus coins for the streak." : n === 1 ? "Good start." : "Keep going.",
        reward: hit ? `+${hit[1]} 💰` : "",
      });
    } else {
      if (w.quiz.streak >= 3) {
        notify({ icon: "🧠", title: `Quiz streak ended at ${w.quiz.streak}`, text: "Try the next one. A new streak starts now." });
      }
      w.quiz.streak = 0;
      save();
    }
  }

  // ---------- Coins, items, inventory ----------
  function earnCoins(n) {
    w.coins += Math.max(0, Math.floor(n));
    save();
  }
  function spend(currency, amount) {
    if (currency === "coins") {
      if (w.coins < amount) return false;
      w.coins -= amount;
    } else {
      if (stars() < amount) return false;
      w.starsSpent += amount;
    }
    save();
    return true;
  }
  function makeCode() {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const part = () => Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
    return `SA-${part()}-${part()}`;
  }

  return {
    RULES,
    coins: () => w.coins,
    stars,
    starsEarned,
    breakdown,
    level,
    progress: () => last || progress(),
    quizStreak: () => ({ ...w.quiz }),
    earnCoins,
    spend,
    owns: (id) => w.owned.includes(id),
    own: (id) => { if (!w.owned.includes(id)) { w.owned.push(id); save(); } },
    equipped: (slot) => w.equipped[slot],
    equip: (slot, value) => { w.equipped[slot] = value; save(); },
    inventory: (id) => w.inventory[id] || 0,
    addInventory: (id, n) => { w.inventory[id] = Math.max(0, (w.inventory[id] || 0) + n); save(); },
    frozen: () => [...w.frozen],
    freeze: (sessionId) => {
      if ((w.inventory.freeze || 0) < 1 || w.frozen.includes(sessionId)) return false;
      w.inventory.freeze--;
      w.frozen.push(sessionId);
      save();
      return true;
    },
    vouchers: () => [...w.vouchers],
    addVoucher: (item) => {
      const v = { item: item.id, name: item.name, icon: item.icon, code: makeCode(), date: new Date().toISOString() };
      w.vouchers.unshift(v);
      save();
      return v;
    },
    requests: () => [...w.requests],
    addRequest: (req) => { w.requests.unshift({ ...req, date: new Date().toISOString(), status: "Waiting for the lecturer" }); save(); },
    feed: () => [...w.feed],
    notify,
    sync,
    quiz,
    reset: () => { w = fresh(); save(); },
  };
})();
