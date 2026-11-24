(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const pad = (n) => String(n).padStart(2, "0");
  const dateText = (d) => `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const fmt = (n) => Number(n).toLocaleString("en-US");
  const TABS = ["rewards", "emergency", "skins", "mine", "earn"];

  // ---------- Balance and profile ----------
  function bump(id) {
    const el = $(id).parentElement;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  function renderWallet() {
    $("starsBal").textContent = fmt(Rewards.stars());
    $("coinsBal").textContent = fmt(Rewards.coins());
  }

  function renderProfile() {
    const lv = Rewards.level();
    const p = Rewards.progress();
    const cur = p ? p.current : { streak: 0, bestStreak: 0, subStreak: 0 };
    const quiz = Rewards.quizStreak();
    const streak = (icon, value, label, hot) =>
      `<div class="streak${hot ? " hot" : ""}"><span class="s-icon" aria-hidden="true">${icon}</span><b>${value}</b><span>${label}</span></div>`;
    $("profile").innerHTML = `
      <div class="avatar" aria-hidden="true">${esc(Rewards.equipped("avatar"))}</div>
      <div>
        <div class="lvl-title">Level ${lv.level}<small>${esc(lv.title)}</small></div>
        <div class="xp" role="img" aria-label="${Math.round(lv.share * 100)}% to the next level"><i style="width:${Math.round(lv.share * 100)}%"></i></div>
        <div class="xp-text">${fmt(lv.xp - lv.from)} of ${fmt(lv.to - lv.from)} Stars to level ${lv.level + 1} · ${fmt(lv.xp)} Stars earned in total</div>
      </div>
      <div class="streaks">
        ${streak("🔥", cur.streak, `classes in a row<br>best ${cur.bestStreak}`, cur.streak >= 5)}
        ${streak("📬", cur.subStreak, "hand-ins on time<br>in a row", cur.subStreak >= 3)}
        ${streak("🧠", quiz.streak, `quiz answers in a row<br>best ${quiz.best}`, quiz.streak >= 3)}
        ${streak("❄️", Rewards.inventory("freeze"), "Streak Freezes<br>ready", false)}
      </div>`;
  }

  // ---------- Generic item card ----------
  function priceButton(price, currency, onLabel) {
    const have = currency === "stars" ? Rewards.stars() : Rewards.coins();
    const sym = currency === "stars" ? "⭐" : "💰";
    if (have >= price) {
      return { can: true, html: `<button type="button" class="btn gold" data-buy>${onLabel}</button>` };
    }
    const pct = Math.round((have / price) * 100);
    return {
      can: false,
      html: `<div><div class="need">${fmt(price - have)} ${sym} to go</div><div class="progress"><i style="width:${pct}%"></i></div></div>`,
    };
  }

  function itemCard(item, currency, opts) {
    const sym = currency === "stars" ? "⭐" : "💰";
    const pb = priceButton(item.price, currency, opts.label);
    return `<div class="item${pb.can ? " can" : ""}" data-id="${esc(item.id)}" data-kind="${esc(opts.kind)}">
      ${opts.tag ? `<span class="tag${opts.tagHave ? " have" : ""}">${esc(opts.tag)}</span>` : ""}
      <span class="item-icon" aria-hidden="true">${item.icon}</span>
      <h3>${esc(item.name)}</h3>
      <p>${esc(item.desc)}</p>
      <div class="price-row"><span class="price ${currency}">${sym} ${fmt(item.price)}</span>${pb.html}</div>
    </div>`;
  }

  function renderRewards() {
    $("rewardGrid").innerHTML = REWARD_ITEMS.map((it) => itemCard(it, "stars", { kind: "reward", label: "Redeem", tag: "Real reward" })).join("");
  }

  function renderEmergency() {
    $("emergencyGrid").innerHTML = EMERGENCY_ITEMS.map((it) => {
      const n = Rewards.inventory(it.id);
      return itemCard(it, "stars", { kind: "emergency", label: "Get it", tag: n ? `You have ${n}` : "", tagHave: !!n });
    }).join("");
  }

  // ---------- Skins ----------
  const PREVIEW_MAP = ["S..#.L", ".#.L.G", "...#.."];
  function mazePreview(skin) {
    let n = 0;
    const cells = PREVIEW_MAP.join("").split("").map((ch, i) => {
      const r = Math.floor(i / 6);
      const c = i % 6;
      const alt = (r + c) % 2 ? " alt" : "";
      if (ch === "#") return `<div class="cell wall"></div>`;
      if (ch === "L") return `<div class="cell lock"><span>${skin.lock}</span></div>`;
      if (ch === "G") return `<div class="cell floor goal${alt}"><span>${skin.goal}</span></div>`;
      if (ch === "S") return `<div class="cell floor start${alt}"></div>`;
      n++;
      const decor = skin.decor && n === 4 ? `<span class="decor">${skin.decor[0]}</span>` : "";
      return `<div class="cell floor${alt}${n === 1 ? " visited" : ""}">${decor}</div>`;
    }).join("");
    return `<div data-skin="classic" class="prev-wrap"><div class="board-frame" data-skin="${esc(skin.id)}">
      <div class="board" style="--cols:6">${cells}
        <div class="robot" data-dir="right" style="--r:0;--c:2"><div class="bot"><div class="face"><i class="eye"></i><i class="eye"></i></div></div></div>
      </div></div></div>`;
  }

  function cosmeticButton(kind, id, price) {
    const owned = price === 0 || Rewards.owns(`${kind}:${id}`);
    const equippedNow = Rewards.equipped(kind) === id;
    if (equippedNow) return { cls: "owned", html: `<button type="button" class="btn ok" disabled>✓ In use</button>` };
    if (owned) return { cls: "owned", html: `<button type="button" class="btn equip" data-equip>Use</button>` };
    const pb = priceButton(price, "coins", "Buy");
    return { cls: pb.can ? "can" : "", html: pb.html };
  }

  function renderSkins() {
    $("mazeGrid").innerHTML = SKINS.map((s) => {
      const b = cosmeticButton("maze", s.id, s.price);
      return `<div class="item ${b.cls}" data-id="${esc(s.id)}" data-kind="maze">
        ${mazePreview(s)}
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.desc)}</p>
        <div class="price-row"><span class="price coins">${s.price ? `💰 ${fmt(s.price)}` : "Free"}</span>${b.html}</div>
      </div>`;
    }).join("");

    $("themeGrid").innerHTML = MENU_THEMES.map((t) => {
      const b = cosmeticButton("theme", t.id, t.price);
      const v = t.vars;
      return `<div class="item ${b.cls}" data-id="${esc(t.id)}" data-kind="theme">
        <div class="theme-prev" style="background: radial-gradient(120px 80px at 10% 0%, ${v["--glow-1"]}, transparent), radial-gradient(140px 90px at 100% 100%, ${v["--glow-2"]}, transparent), ${v["--bg"]}">
          <i style="background:${v["--card"]};border:1px solid ${v["--card-border"]}"></i>
          <i style="background:linear-gradient(135deg, ${v["--title-a"]}, ${v["--title-b"]})"></i>
          <i style="background:${v["--card"]};border:1px solid ${v["--card-border"]}"></i>
        </div>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.desc)}</p>
        <div class="price-row"><span class="price coins">${t.price ? `💰 ${fmt(t.price)}` : "Free"}</span>${b.html}</div>
      </div>`;
    }).join("");

    $("avatarGrid").innerHTML = AVATARS.map((a) => {
      const owned = a.price === 0 || Rewards.owns(`avatar:${a.id}`);
      const on = Rewards.equipped("avatar") === a.id;
      let btn;
      if (on) btn = `<button type="button" class="btn ok" disabled>✓ In use</button>`;
      else if (owned) btn = `<button type="button" class="btn equip" data-equip>Use</button>`;
      else if (Rewards.coins() >= a.price) btn = `<button type="button" class="btn gold" data-buy>💰 ${a.price}</button>`;
      else btn = `<span class="need">💰 ${a.price}</span>`;
      return `<div class="av${on ? " on" : ""}" data-id="${esc(a.id)}" data-kind="avatar"><span class="face">${a.id}</span>${btn}</div>`;
    }).join("");
  }

  // ---------- My stuff ----------
  function lastMissedInfo() {
    const p = Rewards.progress();
    if (!p || !p.current.lastMissed) return null;
    const s = p.current.lastMissed;
    const after = StudyProgress.compute([...Rewards.frozen(), s.id]).current.streak;
    return { s, before: p.current.streak, after };
  }

  function openAssignments() {
    const B = StudyProgress.current;
    const done = new Set(Rewards.requests().filter((r) => r.semId === B.sem.id).map((r) => r.course));
    let rec = { sub: {} };
    try { rec = JSON.parse(localStorage.getItem("mySemester.records.v2")) || rec; } catch (_) { /* sample data only */ }
    return B.assignments.filter((a) => {
      const sub = a.id in (rec.sub || {}) ? rec.sub[a.id] : a.submitted;
      return !sub && StudyProgress.parseDate(a.due) > StudyProgress.NOW && !done.has(a.course);
    }).map((a) => ({ a, c: B.courseById[a.course] }));
  }

  function renderMine() {
    const freezes = Rewards.inventory("freeze");
    const ext = Rewards.inventory("extension");
    const miss = lastMissedInfo();
    const open = openAssignments();
    const inv = [];
    inv.push(`<div class="inv">
      <span class="item-icon" aria-hidden="true">❄️</span>
      <div><h3>Streak Freeze × ${freezes}</h3>
        ${miss
          ? `<p>Your last missed class: ${esc(miss.s.course.name)}, ${dateText(miss.s.start)} ${pad(miss.s.start.getHours())}:${pad(miss.s.start.getMinutes())}.
             A freeze turns your streak from ${miss.before} into <b>${miss.after}</b> classes in a row.</p>
             <div class="row"><button type="button" class="btn gold" id="useFreeze" ${freezes ? "" : "disabled"}>Use a Streak Freeze</button>
             ${freezes ? "" : '<span class="need">Get one under Emergency.</span>'}</div>`
          : `<p>No missed class to cover. Your streak is safe.</p>`}
      </div></div>`);
    inv.push(`<div class="inv">
      <span class="item-icon" aria-hidden="true">⏰</span>
      <div><h3>Extension requests × ${ext}</h3>
        ${ext && open.length
          ? `<p>Pick the assignment. The request goes to the lecturer, who decides.</p>
             <div class="row"><select id="extSelect" aria-label="Assignment">${open.map(({ a, c }) =>
               `<option value="${esc(a.id)}">${c.icon || ""} ${esc(c.code)} · ${esc(a.title)}</option>`).join("")}</select>
             <button type="button" class="btn gold" id="useExt">Send request</button></div>`
          : `<p>${ext ? "No open assignment left for a request this semester." : "Get one under Emergency when a deadline gets tight."}</p>`}
        ${Rewards.requests().map((r) => `<div class="request"><b>${esc(r.courseCode)} · ${esc(r.title)}</b><br><span class="muted">${esc(r.status)} · sent ${dateText(new Date(r.date))}</span></div>`).join("")}
      </div></div>`);
    $("inventory").innerHTML = inv.join("");

    const vs = Rewards.vouchers();
    $("vouchers").innerHTML = vs.length
      ? vs.map((v) => `<div class="voucher"><span class="item-icon" aria-hidden="true">${v.icon}</span>
          <div><b>${esc(v.name)}</b><div class="code">${esc(v.code)}</div><small>Redeemed ${dateText(new Date(v.date))} · ${esc(SHOP_INFO.office)}</small></div></div>`).join("")
        + `<p class="empty">${esc(SHOP_INFO.voucherNote)}</p>`
      : `<p class="empty">No vouchers yet. Redeem a reward and its code appears here.</p>`;

    const feed = Rewards.feed();
    $("feed").innerHTML = feed.length
      ? feed.map((n) => {
        const t = new Date(n.t);
        return `<li><span class="f-icon" aria-hidden="true">${esc(n.icon || "⭐")}</span>
          <div><b>${esc(n.title)}</b>${n.text ? `<span class="muted">${esc(n.text)}</span>` : ""}</div>
          <span class="f-side">${n.reward ? `<span class="f-reward">${esc(n.reward)}</span>` : ""}<span class="f-time">${dateText(t)}, ${pad(t.getHours())}:${pad(t.getMinutes())}</span></span></li>`;
      }).join("")
      : `<li class="empty">Nothing yet. Streaks and rewards show up here.</li>`;
  }

  // ---------- How to earn ----------
  function renderEarn() {
    const R = Rewards.RULES;
    $("starRules").innerHTML = `
      <tr><td>Attend a class</td><td>+${R.attend} ⭐</td></tr>
      <tr><td>Hand in on time</td><td>+${R.onTime} ⭐</td></tr>
      <tr><td>Hand in late</td><td>+${R.late} ⭐</td></tr>
      <tr><td>Send a feedback round (anonymous)</td><td>+${R.feedback} ⭐</td></tr>
      ${R.attendMilestones.map(([n, b]) => `<tr><td>🔥 ${n} classes in a row</td><td>+${b} ⭐</td></tr>`).join("")}
      ${R.subMilestones.map(([n, b]) => `<tr><td>📬 ${n} hand-ins on time in a row</td><td>+${b} ⭐</td></tr>`).join("")}`;
    $("coinRules").innerHTML = `
      <tr><td>Robo Maze: correct answer</td><td>+100 💰</td></tr>
      <tr><td>Robo Maze: reach the goal</td><td>+200 💰</td></tr>
      ${R.quizMilestones.map(([n, b]) => `<tr><td>🧠 ${n} quiz answers right in a row</td><td>+${b} 💰</td></tr>`).join("")}`;
    const b = Rewards.breakdown();
    $("breakdown").innerHTML = b ? `
      <tr><td>${fmt(b.attended)} classes attended</td><td>${fmt(b.attendStars)} ⭐</td></tr>
      <tr><td>${fmt(b.onTime)} hand-ins on time</td><td>${fmt(b.onTimeStars)} ⭐</td></tr>
      <tr><td>${fmt(b.late)} late hand-ins</td><td>${fmt(b.lateStars)} ⭐</td></tr>
      <tr><td>${fmt(b.feedback)} feedback rounds</td><td>${fmt(b.feedbackStars)} ⭐</td></tr>
      <tr><td>Streak bonuses</td><td>${fmt(b.bonusStars)} ⭐</td></tr>
      <tr class="total"><td>Earned in total</td><td>${fmt(Rewards.starsEarned())} ⭐</td></tr>
      <tr><td>Spent</td><td>−${fmt(Rewards.starsEarned() - Rewards.stars())} ⭐</td></tr>
      <tr class="total"><td>Available now</td><td>${fmt(Rewards.stars())} ⭐</td></tr>` : "";
  }

  function renderAll() {
    renderWallet();
    renderProfile();
    renderRewards();
    renderEmergency();
    renderSkins();
    renderMine();
    renderEarn();
  }

  // ---------- Modal ----------
  function showModal(html) {
    $("modalCard").innerHTML = html;
    $("modal").hidden = false;
    const first = $("modalCard").querySelector("button");
    if (first) first.focus();
  }
  const closeModal = () => { $("modal").hidden = true; };

  function confirmRedeem(item, onYes) {
    showModal(`<div class="big" aria-hidden="true">${item.icon}</div>
      <h2>Redeem ${esc(item.name)}?</h2>
      <p>This costs <b>⭐ ${fmt(item.price)}</b>. You get a code to show at the ${esc(SHOP_INFO.office.split(",")[0].toLowerCase())}.</p>
      <p>Stars cannot be refunded after redeeming.</p>
      <div class="modal-actions"><button type="button" class="btn" data-close>Cancel</button><button type="button" class="btn gold" data-yes>Redeem</button></div>`);
    $("modalCard").querySelector("[data-yes]").addEventListener("click", onYes, { once: true });
  }

  function showVoucher(v) {
    showModal(`<div class="big" aria-hidden="true">${v.icon}</div>
      <h2>${esc(v.name)}</h2>
      <p>Your code:</p>
      <div class="code">${esc(v.code)}</div>
      <p>${esc(SHOP_INFO.voucherNote)}</p>
      <p>${esc(SHOP_INFO.office)}</p>
      <div class="modal-actions"><button type="button" class="btn gold" data-close>Done</button></div>`);
  }

  // ---------- Buying ----------
  function buyStarsItem(item) {
    const isReal = REWARD_ITEMS.includes(item);
    const go = () => {
      if (!Rewards.spend("stars", item.price)) return;
      bump("starsBal");
      if (isReal || item.kind === "voucher") {
        const v = Rewards.addVoucher(item);
        Rewards.notify({ icon: item.icon, title: `${item.name} redeemed`, text: "Your code is under My stuff.", reward: `−${fmt(item.price)} ⭐` });
        renderAll();
        showVoucher(v);
      } else {
        Rewards.addInventory(item.id, 1);
        Rewards.notify({ icon: item.icon, title: `${item.name} added`, text: "Use it under My stuff.", reward: `−${fmt(item.price)} ⭐` });
        closeModal();
        renderAll();
      }
    };
    if (isReal) confirmRedeem(item, go);
    else go();
  }

  function buyCosmetic(kind, id, price, name) {
    if (!Rewards.spend("coins", price)) return;
    Rewards.own(`${kind}:${id}`);
    Rewards.equip(kind, id);
    bump("coinsBal");
    Rewards.notify({ icon: "🎨", title: `${name} unlocked`, text: "It is in use now.", reward: `−${fmt(price)} 💰` });
    renderAll();
  }

  function bindEvents() {
    $("tabs").addEventListener("click", (e) => {
      const t = e.target.closest(".tab");
      if (t) showTab(t.dataset.tab, true);
    });
    window.addEventListener("hashchange", () => showTab(location.hash.slice(1), false));

    document.querySelector(".wrap").addEventListener("click", (e) => {
      const card = e.target.closest("[data-kind]");
      if (!card) return;
      const kind = card.dataset.kind;
      const id = card.dataset.id;
      if (e.target.closest("[data-buy]")) {
        if (kind === "reward") buyStarsItem(REWARD_ITEMS.find((x) => x.id === id));
        else if (kind === "emergency") buyStarsItem(EMERGENCY_ITEMS.find((x) => x.id === id));
        else if (kind === "maze") {
          const s = SKINS.find((x) => x.id === id);
          buyCosmetic("maze", id, s.price, s.name);
        } else if (kind === "theme") {
          const t = MENU_THEMES.find((x) => x.id === id);
          buyCosmetic("theme", id, t.price, `Theme ${t.name}`);
        } else if (kind === "avatar") {
          buyCosmetic("avatar", id, AVATARS.find((x) => x.id === id).price, `Avatar ${id}`);
        }
      } else if (e.target.closest("[data-equip]")) {
        Rewards.equip(kind, id);
        renderAll();
      }
    });

    $("inventory").addEventListener("click", (e) => {
      if (e.target.closest("#useFreeze")) {
        const miss = lastMissedInfo();
        if (miss && Rewards.freeze(miss.s.id)) {
          Rewards.sync();
          Rewards.notify({ icon: "❄️", title: `Streak saved: ${miss.after} in a row`, text: "The missed class no longer breaks your streak." });
          renderAll();
        }
      }
      if (e.target.closest("#useExt")) {
        const id = $("extSelect").value;
        const hit = openAssignments().find((x) => x.a.id === id);
        if (!hit || Rewards.inventory("extension") < 1) return;
        Rewards.addInventory("extension", -1);
        Rewards.addRequest({ semId: StudyProgress.current.sem.id, course: hit.c.id, courseCode: hit.c.code, assignment: hit.a.id, title: hit.a.title });
        Rewards.notify({ icon: "⏰", title: "Extension request sent", text: `${hit.c.lecturer || "The lecturer"} decides about ${hit.a.title}.` });
        renderAll();
      }
    });

    $("modal").addEventListener("click", (e) => {
      if (e.target === $("modal") || e.target.closest("[data-close]")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("modal").hidden) closeModal();
    });

    // Tooltips for elements with data-tip
    const tip = $("tip");
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest("[data-tip]");
      if (!el) { tip.classList.remove("show"); return; }
      tip.textContent = el.dataset.tip;
      tip.classList.add("show");
      const r = tip.getBoundingClientRect();
      tip.style.left = Math.min(window.innerWidth - r.width - 8, Math.max(8, e.clientX - r.width / 2)) + "px";
      tip.style.top = (e.clientY + 18) + "px";
    });
  }

  function showTab(name, push) {
    const tab = TABS.includes(name) ? name : "rewards";
    document.querySelectorAll(".tab").forEach((t) => {
      const on = t.dataset.tab === tab;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on);
    });
    document.querySelectorAll(".panel").forEach((p) => { p.hidden = p.dataset.panel !== tab; });
    if (push && location.hash !== "#" + tab) history.replaceState(null, "", "#" + tab);
  }

  Rewards.sync();
  bindEvents();
  renderAll();
  showTab(location.hash.slice(1), false);
})();
