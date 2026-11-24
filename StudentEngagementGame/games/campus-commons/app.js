(() => {
  "use strict";

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const pad = (n) => String(n).padStart(2, "0");
  const HOUR = 3600e3;
  const DAY = 24 * HOUR;
  const dateText = (d) => `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const text2html = (s) => esc(s).replace(/\n/g, "<br>");
  const SHORT_TEXT = 320;

  const NOW = StudyProgress.NOW.getTime();
  const FIXED = !!(typeof SETTINGS !== "undefined" && SETTINGS.today);
  const now = () => (FIXED ? NOW : Date.now());
  const B = StudyProgress.current;
  const COURSES = B.sem.courses;
  const courseById = (id) => B.courseById[id] || null;

  const TYPES = {
    project: { icon: "🛠️", label: "Project", tab: "Projects" },
    post: { icon: "💬", label: "Post", tab: "Posts" },
    other: { icon: "📌", label: "Other", tab: "Other" },
  };
  const SOURCES = {
    school: { label: "School", badge: "✓ Official" },
    course: { label: "Courses", badge: "Course" },
    student: { label: "Students", badge: "Student" },
  };
  const TYPE_HINTS = {
    project: "Something you built, drew, wrote or researched. It appears in the Exhibition with your name.",
    post: "An opinion, a tip or an experience. You can post it anonymously.",
    other: "Events, study groups, lost and found, questions.",
  };

  // ---------- Storage ----------
  const KEY = "campusCommons.state.v1";
  const ROLE_KEY = "campusCommons.role.v1";
  const blank = () => ({ posts: [], comments: {}, reacts: {}, reports: {}, hidden: [], removed: [], pins: {} });
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === "object") return Object.assign(blank(), s);
    } catch (_) { /* start empty */ }
    return blank();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (_) { return false; }
  }
  let state = load();
  let role = "student";
  try { role = localStorage.getItem(ROLE_KEY) === "staff" ? "staff" : "student"; } catch (_) { /* default */ }

  // ---------- Posts ----------
  const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function eventTs(ev) {
    if (!ev) return null;
    const [h, m] = (ev.time || "00:00").split(":").map(Number);
    if (typeof ev.inDays === "number") return startOfDay(NOW) + ev.inDays * DAY + (h * 60 + m) * 60e3;
    if (ev.date) return new Date(`${ev.date}T${ev.time || "00:00"}`).getTime();
    return null;
  }
  const SEEDS = SEED_POSTS.map((p) => ({
    ...p,
    seed: true,
    t: NOW - (p.hoursAgo || 0) * HOUR,
    event: p.event ? { ...p.event, ts: eventTs(p.event) } : null,
    comments: (p.comments || []).map((c, i) => ({ ...c, id: `${p.id}-c${i}`, t: NOW - (c.hoursAgo || 0) * HOUR })),
  }));

  function allPosts() {
    const removed = new Set(state.removed);
    return SEEDS.concat(state.posts).filter((p) => !removed.has(p.id));
  }
  const getPost = (id) => allPosts().find((p) => p.id === id);
  const isPinned = (p) => (p.id in state.pins ? state.pins[p.id] : !!p.pinned);
  const commentsOf = (p) => (p.comments || []).concat(state.comments[p.id] || []);
  function reactionCounts(p) {
    const mine = state.reacts[p.id];
    const out = {};
    COMMONS.reactions.forEach((r) => { out[r.id] = ((p.reactions || {})[r.id] || 0) + (mine === r.id ? 1 : 0); });
    return out;
  }
  const reactionTotal = (p) => Object.values(reactionCounts(p)).reduce((s, n) => s + n, 0);

  function me() {
    const avatar = typeof Rewards !== "undefined" ? Rewards.equipped("avatar") : "🎓";
    return { name: STUDENT.name, avatar };
  }

  // Who wrote it: avatar, name, small line, badge and colour class.
  function authorOf(p) {
    if (p.source === "school") {
      return { av: COMMONS.school.icon, cls: "school", name: COMMONS.school.name, sub: "", badge: SOURCES.school.badge };
    }
    if (p.source === "course") {
      const c = courseById(p.course);
      return { av: c ? c.icon : "📚", cls: "course", name: c ? c.name : p.course, sub: c ? c.lecturer : "", badge: SOURCES.course.badge };
    }
    if (p.anonymous) return { av: "🕊️", cls: "anon", name: "Anonymous student", sub: "", badge: SOURCES.student.badge };
    const a = p.author || me();
    return { av: a.avatar, cls: "student", name: a.name + (p.mine ? " (you)" : ""), sub: "", badge: SOURCES.student.badge };
  }
  function commentAuthor(c) {
    if (c.school) return { av: COMMONS.school.icon, cls: "school", name: COMMONS.school.name, badge: "✓ Official" };
    if (c.course) {
      const co = courseById(c.course);
      return { av: co ? co.icon : "📚", cls: "course", name: co ? co.lecturer : "Lecturer", badge: co ? co.code : "Course" };
    }
    if (c.anonymous) return { av: "🕊️", cls: "anon", name: "Anonymous student" };
    return { av: c.avatar, cls: "student", name: c.name + (c.mine ? " (you)" : "") };
  }

  function ago(t) {
    const d = now() - t;
    if (d < 60e3) return "just now";
    if (d < HOUR) return `${Math.floor(d / 60e3)} min ago`;
    if (d < DAY) return `${Math.floor(d / HOUR)} h ago`;
    const days = Math.floor(d / DAY);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    return dateText(new Date(t));
  }
  function eventWhen(ts) {
    const d = new Date(ts);
    const days = Math.round((startOfDay(ts) - startOfDay(now())) / DAY);
    const rel = days === 0 ? "today" : days === 1 ? "tomorrow" : days > 1 ? `in ${days} days` : days === -1 ? "yesterday" : `${-days} days ago`;
    return { text: `${dateText(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`, rel };
  }

  // Friendly check for words that might hurt someone.
  function nudgeHits(str) {
    const low = " " + String(str).toLowerCase().replace(/[^a-z0-9äöüß ]+/g, " ") + " ";
    return COMMONS.nudgeWords.filter((w) => low.includes(" " + w + " "));
  }
  const nudgeText = (hits) => `🕊️ <b>Want to rephrase?</b> Words like “${esc(hits.join("”, “"))}” might hurt someone. In a safe space we criticise ideas, not people.`;

  // ---------- View state (not saved, so the page always opens on everything) ----------
  const view = { type: "all", source: "all", course: "all", sort: "new", q: "", mine: false, showHidden: false };
  const openComments = new Set();
  const expanded = new Set();
  let reportOpen = null;

  function matches(p, skip) {
    if (role === "student" && !view.showHidden && state.hidden.includes(p.id)) return false;
    if (skip !== "type" && view.type !== "all" && p.type !== view.type) return false;
    if (skip !== "source" && view.source !== "all" && p.source !== view.source) return false;
    if (view.course !== "all" && p.course !== view.course) return false;
    if (view.mine && !p.mine) return false;
    if (view.q) {
      const a = authorOf(p);
      const hay = [p.title, p.text, p.kind, a.name, a.sub, ...(p.tags || []), ...(p.team || [])].join(" ").toLowerCase();
      if (!view.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  }
  function sorted(list) {
    const by = {
      new: (a, b) => b.t - a.t,
      top: (a, b) => reactionTotal(b) - reactionTotal(a) || b.t - a.t,
      talk: (a, b) => commentsOf(b).length - commentsOf(a).length || b.t - a.t,
    }[view.sort];
    const out = list.slice().sort(by);
    if (view.sort === "new") out.sort((a, b) => isPinned(b) - isPinned(a));
    return out;
  }

  // ---------- Rendering: one post ----------
  function coverHtml(p, cls) {
    const c = p.cover || { emoji: TYPES.project.icon, colors: COMMONS.coverColors[0] };
    if (c.img && /^data:image\/(jpeg|png|webp);base64,/.test(c.img)) {
      return `<div class="cover ${cls}"><img src="${c.img}" alt="Cover of ${esc(p.title)}"></div>`;
    }
    const [a, b] = c.colors || COMMONS.coverColors[0];
    return `<div class="cover ${cls}" style="background:linear-gradient(135deg, ${esc(a)}, ${esc(b)})" aria-hidden="true">${esc(c.emoji || "🛠️")}</div>`;
  }

  function typeChip(p) {
    const T = TYPES[p.type];
    return `<span class="chip type-${p.type}">${T.icon} ${esc(p.kind && p.type === "other" ? p.kind : T.label)}</span>`;
  }

  function courseChip(p) {
    if (!p.course || p.source === "course") return "";
    const c = courseById(p.course);
    return c ? `<span class="chip" title="${esc(c.name)}">${c.icon} ${esc(c.code)}</span>` : "";
  }

  function commentsHtml(p) {
    const list = commentsOf(p).slice().sort((a, b) => a.t - b.t);
    const items = list.map((c) => {
      const a = commentAuthor(c);
      return `<div class="cmt"><span class="av sm ${a.cls}" aria-hidden="true">${esc(a.av)}</span>
        <div class="cmt-body"><div class="p-name">${esc(a.name)}${a.badge ? `<span class="src-badge ${a.cls}">${esc(a.badge)}</span>` : ""}<span class="muted small">${ago(c.t)}</span></div>
        <p>${text2html(c.text)}</p></div>
        ${c.mine ? `<button type="button" class="cmt-del" data-act="del-comment" data-cid="${esc(c.id)}" title="Delete your comment" aria-label="Delete your comment">✕</button>` : ""}</div>`;
    }).join("");
    const anon = role === "student" ? `<label><input type="checkbox" name="anon"> Anonymous</label>` : "";
    const as = role === "staff" ? `<span class="muted small">as ${esc(COMMONS.school.name)}</span>` : "";
    return `<div class="comments">${items}
      <form class="cmt-form" data-pid="${esc(p.id)}">
        <input type="text" name="text" maxlength="500" placeholder="Write a kind comment" aria-label="Write a comment" autocomplete="off">
        ${anon}${as}<button type="submit" class="btn small primary">Send</button>
        <div class="nudge" hidden></div>
      </form></div>`;
  }

  function reportBoxHtml(p) {
    return `<div class="report-box"><p><b>Why are you reporting this?</b> Only the team sees reports. The post is hidden for you right away.</p>
      <div class="row">${COMMONS.reportReasons.map((r) => `<button type="button" class="btn small" data-act="report-reason" data-reason="${esc(r)}">${esc(r)}</button>`).join("")}
      <button type="button" class="link-btn" data-act="report-cancel">Cancel</button></div></div>`;
  }

  function article(p, inModal) {
    const a = authorOf(p);
    const pinned = isPinned(p);
    const counts = reactionCounts(p);
    const mine = state.reacts[p.id];
    const cmts = commentsOf(p).length;
    const long = !inModal && p.text.length > SHORT_TEXT && !expanded.has(p.id);
    const body = long ? text2html(p.text.slice(0, SHORT_TEXT).replace(/\s+\S*$/, "")) + "…" : text2html(p.text);
    const showCmts = inModal || openComments.has(p.id);
    const report = state.reports[p.id];

    let extras = "";
    if (p.type === "project") {
      extras += (p.team && p.team.length ? `<div class="meta-box"><span>👥 <b>Team:</b> ${esc(p.team.join(", "))}</span></div>` : "");
      extras += (p.tags && p.tags.length ? `<div class="tags">${p.tags.map((t) => `<span class="chip"># ${esc(t)}</span>`).join("")}</div>` : "");
      if (p.link && /^https?:\/\//i.test(p.link)) {
        extras += `<a class="p-link" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(p.link.replace(/^https?:\/\//i, ""))}</a>`;
      }
    }
    if (p.event && p.event.ts) {
      const w = eventWhen(p.event.ts);
      extras += `<div class="meta-box"><span>📅 <b>${esc(w.text)}</b> (${esc(w.rel)})</span>${p.event.place ? `<span>📍 ${esc(p.event.place)}</span>` : ""}</div>`;
    }
    if (p.badge) {
      extras += `<div class="badge-att"><span class="b-icon" aria-hidden="true">${esc(p.badge.icon)}</span><div><b>${esc(p.badge.text)}</b><small>Achievement from Study Arcade</small></div></div>`;
    }

    const reacts = COMMONS.reactions.map((r) =>
      `<button type="button" class="react${mine === r.id ? " on" : ""}" data-act="react" data-r="${r.id}" aria-pressed="${mine === r.id}" title="${esc(r.label)}">${r.icon}${counts[r.id] ? `<span>${counts[r.id]}</span>` : ""}</button>`).join("");

    const actions = [];
    if (role === "staff") {
      if (report) actions.push(`<span class="report-count" title="Reported in this browser">🚩 Reported: ${esc(report.reason)}</span>`);
      actions.push(`<button type="button" class="foot-btn" data-act="pin">${pinned ? "📌 Unpin" : "📌 Pin"}</button>`);
      actions.push(`<button type="button" class="foot-btn" data-act="remove">🗑️ Remove</button>`);
    } else if (p.mine) {
      actions.push(`<button type="button" class="foot-btn" data-act="delete">🗑️ Delete</button>`);
    } else if (!report) {
      actions.push(`<button type="button" class="foot-btn" data-act="report">🚩 Report</button>`);
    }

    return `<article class="post src-${p.source} type-${p.type}${pinned ? " pinned" : ""}" data-pid="${esc(p.id)}">
      <header class="p-head">
        <span class="av ${a.cls}" aria-hidden="true">${esc(a.av)}</span>
        <div class="p-who">
          <div class="p-name">${esc(a.name)}<span class="src-badge ${p.source}">${esc(a.badge)}</span></div>
          <div class="p-sub">${a.sub ? `<span>${esc(a.sub)}</span><span class="sep"></span>` : ""}<span>${ago(p.t)}</span></div>
        </div>
        ${pinned ? `<span class="pin-tag">📌 Pinned</span>` : ""}
      </header>
      <div class="tags">${typeChip(p)}${courseChip(p)}</div>
      ${p.type === "project" ? coverHtml(p, "") : ""}
      <h3>${esc(p.title)}</h3>
      <p class="p-text">${body}</p>
      ${long ? `<button type="button" class="link-btn more-btn" data-act="more">Read more</button>` : ""}
      ${extras}
      <footer class="p-foot">
        ${reacts}
        ${inModal ? `<span class="foot-btn" aria-hidden="true">💬 ${cmts}</span>` : `<button type="button" class="foot-btn" data-act="comments" aria-expanded="${showCmts}">💬 ${plural(cmts, "comment")}</button>`}
        <span class="spacer"></span>
        ${actions.join("")}
      </footer>
      ${reportOpen === p.id ? reportBoxHtml(p) : ""}
      ${showCmts ? commentsHtml(p) : ""}
    </article>`;
  }

  function tile(p) {
    const a = authorOf(p);
    return `<article class="tile src-${p.source}" data-pid="${esc(p.id)}" data-act="open" tabindex="0" role="button" aria-label="Open project ${esc(p.title)}">
      ${coverHtml(p, "tile-cover")}
      <div class="tile-body">
        <div class="tags">${isPinned(p) ? `<span class="chip">📌 Pinned</span>` : ""}${courseChip(p)}<span class="src-badge ${p.source}">${esc(a.badge)}</span></div>
        <h3>${esc(p.title)}</h3>
        <div class="by"><span class="av ${a.cls}" aria-hidden="true">${esc(a.av)}</span>${esc(a.name)}</div>
        <p>${esc(p.text)}</p>
        ${p.tags && p.tags.length ? `<div class="tags">${p.tags.slice(0, 3).map((t) => `<span class="chip"># ${esc(t)}</span>`).join("")}</div>` : ""}
        <div class="tile-foot"><span>👏 ${reactionTotal(p)}</span><span>💬 ${commentsOf(p).length}</span><span class="muted">${ago(p.t)}</span></div>
      </div>
    </article>`;
  }

  // Re-draw one post wherever it is shown (feed, gallery, open project).
  function refresh(id) {
    const p = getPost(id);
    document.querySelectorAll(`[data-pid="${id}"]`).forEach((el) => {
      if (el.tagName === "FORM") return;
      if (!p) { el.remove(); return; }
      el.outerHTML = el.classList.contains("tile") ? tile(p) : article(p, !!el.closest("#modal"));
    });
  }

  // ---------- Rendering: page ----------
  function renderFilters() {
    const base = allPosts().filter((p) => matches(p, "type"));
    const tabs = [["all", "Everything", base.length]].concat(Object.entries(TYPES).map(([k, T]) =>
      [k, `${T.icon} ${T.tab}`, base.filter((p) => p.type === k).length]));
    $("typeTabs").innerHTML = tabs.map(([k, label, n]) =>
      `<button type="button" class="type-tab${view.type === k ? " on" : ""}" role="tab" aria-selected="${view.type === k}" data-type="${k}">${label}<span class="n">${n}</span></button>`).join("");

    const srcBase = allPosts().filter((p) => matches(p, "source"));
    const srcs = [["all", "Everyone", "", srcBase.length]].concat(Object.entries(SOURCES).map(([k, S]) =>
      [k, k === "school" ? `🏛️ ${S.label} (official)` : k === "course" ? `📚 ${S.label}` : `🎓 ${S.label}`, k, srcBase.filter((p) => p.source === k).length]));
    $("sourceFilter").innerHTML = srcs.map(([k, label, dot, n]) =>
      `<button type="button" class="src-btn${view.source === k ? " on" : ""}" data-source="${k}" aria-pressed="${view.source === k}"><span class="dot ${dot}"></span>${label}<span class="n">${n}</span></button>`).join("");

    document.querySelectorAll("#sortSeg .seg-btn").forEach((b) => b.classList.toggle("on", b.dataset.sort === view.sort));
    document.querySelectorAll("#roleSwitch .seg-btn").forEach((b) => b.classList.toggle("on", b.dataset.role === role));
  }

  function renderFeed() {
    const list = sorted(allPosts().filter((p) => matches(p)));
    const feed = $("feed");
    const gallery = view.type === "project";
    feed.className = gallery ? "gallery" : "";
    $("feedIntro").textContent = gallery
      ? "🖼️ Exhibition: projects from students and courses. Open one to see more and leave a comment."
      : "";
    if (!list.length) {
      feed.className = "";
      feed.innerHTML = `<div class="empty-feed"><b aria-hidden="true">🌱</b>Nothing here yet. ${view.mine ? "Write your first post." : "Try another filter or start something yourself."}</div>`;
    } else {
      feed.innerHTML = list.map((p) => (gallery ? tile(p) : article(p, false))).join("");
    }
    const hiddenCount = role === "student" ? state.hidden.filter((id) => getPost(id)).length : 0;
    const note = $("hiddenNote");
    note.hidden = !hiddenCount;
    note.innerHTML = hiddenCount
      ? `${plural(hiddenCount, "post")} hidden after your report. <button type="button" class="link-btn" data-act="toggle-hidden">${view.showHidden ? "Hide again" : "Show"}</button>`
      : "";
  }

  function renderEvents() {
    const t0 = startOfDay(now());
    const evs = allPosts().filter((p) => p.event && p.event.ts >= t0).sort((a, b) => a.event.ts - b.event.ts).slice(0, 4);
    $("events").innerHTML = evs.length ? evs.map((p) => {
      const d = new Date(p.event.ts);
      return `<li><button type="button" data-act="goto" data-goto="${esc(p.id)}">
        <span class="ev-date">${MONTHS[d.getMonth()]}<b>${d.getDate()}</b></span>
        <span><span class="ev-title">${esc(p.title)}</span><br><span class="ev-sub">${pad(d.getHours())}:${pad(d.getMinutes())}${p.event.place ? ` · ${esc(p.event.place)}` : ""} · ${esc(authorOf(p).name)}</span></span>
      </button></li>`;
    }).join("") : `<li class="empty">No events planned. Post one under 📌 Other.</li>`;
  }

  function render() {
    $("subtitle").textContent = role === "staff"
      ? "Staff view: post as the school or a course, pin posts and remove posts that break the rules."
      : "Show your work, share your view. A safe space for everyone.";
    renderFilters();
    renderFeed();
    renderEvents();
  }

  function fillStatic() {
    $("guidelines").innerHTML = COMMONS.guidelines.map(([icon, txt]) => `<li><span aria-hidden="true">${icon}</span><span>${esc(txt)}</span></li>`).join("");
    $("courseFilter").innerHTML = `<option value="all">All courses</option>` +
      COURSES.map((c) => `<option value="${esc(c.id)}">${c.icon} ${esc(c.code)} · ${esc(c.name)}</option>`).join("");
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(msg, undo) {
    const el = $("toast");
    el.innerHTML = `<span>${msg}</span>${undo ? `<button type="button">Undo</button>` : ""}`;
    el.hidden = false;
    if (undo) el.querySelector("button").addEventListener("click", () => { undo(); el.hidden = true; }, { once: true });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 6000);
  }

  // ---------- Modal ----------
  function openModal(html) {
    $("modalCard").innerHTML = html;
    $("modal").hidden = false;
    document.body.classList.add("locked");
  }
  function closeModal() {
    $("modal").hidden = true;
    $("modalCard").innerHTML = "";
    document.body.classList.remove("locked");
  }
  function openProject(id) {
    const p = getPost(id);
    if (!p) return;
    openModal(`<div class="modal-head"><button type="button" class="btn small" data-close>✕ Close</button></div>${article(p, true)}`);
  }

  // ---------- Composer ----------
  function earnedBadges() {
    const out = [];
    if (typeof Rewards === "undefined") return out;
    const lv = Rewards.level();
    if (lv.level > 1) out.push({ icon: "⭐", text: `Level ${lv.level}: ${lv.title}` });
    const p = Rewards.progress();
    if (p) {
      if (p.current.bestStreak >= 3) out.push({ icon: "🔥", text: `${p.current.bestStreak} classes in a row` });
      if (p.current.bestSubStreak >= 2) out.push({ icon: "📬", text: `${p.current.bestSubStreak} hand-ins on time in a row` });
      if (p.lifetime.attended > 0) out.push({ icon: "🎒", text: `${p.lifetime.attended} classes attended` });
    }
    const q = Rewards.quizStreak();
    if (q.best >= 3) out.push({ icon: "🧠", text: `${q.best} quiz answers right in a row` });
    return out;
  }

  let draft = null;

  function asOptions() {
    if (role === "staff") {
      return [`<option value="school">${COMMONS.school.icon} ${esc(COMMONS.school.name)} (official)</option>`]
        .concat(COURSES.map((c) => `<option value="course:${esc(c.id)}">${c.icon} ${esc(c.code)} · ${esc(c.lecturer)}</option>`)).join("");
    }
    const m = me();
    return `<option value="me">${esc(m.avatar)} ${esc(m.name)} (you)</option><option value="anon">🕊️ Anonymous student</option>`;
  }

  function openComposer() {
    draft = { type: "post", cover: { emoji: COMMONS.coverEmojis[0], colors: COMMONS.coverColors[0] }, confirmed: false };
    const badges = earnedBadges();
    openModal(`<form id="composer" class="composer" novalidate>
      <h2 style="margin:0">✏️ New post</h2>
      <div class="seg" role="group" aria-label="Type" id="cType">
        ${Object.entries(TYPES).map(([k, T]) => `<button type="button" class="seg-btn" data-ctype="${k}">${T.icon} ${T.label}</button>`).join("")}
      </div>
      <p class="type-hint" id="cHint"></p>
      <div class="row2">
        <label class="field"><span>Post as</span><select id="cAs">${asOptions()}</select></label>
        <label class="field"><span>Course</span><select id="cCourse"><option value="">No course</option>${COURSES.map((c) => `<option value="${esc(c.id)}">${c.icon} ${esc(c.code)} · ${esc(c.name)}</option>`).join("")}</select></label>
      </div>
      <label class="field"><span>Title</span><input id="cTitle" maxlength="90" autocomplete="off"><span class="count" id="cTitleN">0 / 90</span></label>
      <label class="field"><span>Text</span><textarea id="cText" maxlength="1500" rows="6"></textarea><span class="count" id="cTextN">0 / 1500</span></label>

      <div data-for="project" class="composer">
        <div class="field"><span>Cover</span>
          <div class="cover-pick">
            <div id="cCover"></div>
            <div>
              <div class="pick-row" id="cEmoji" aria-label="Cover symbol">${COMMONS.coverEmojis.map((e) => `<button type="button" data-emoji="${e}" aria-label="Symbol ${e}">${e}</button>`).join("")}</div>
              <div class="pick-row" id="cColor" aria-label="Cover colours">${COMMONS.coverColors.map((c, i) => `<button type="button" data-color="${i}" aria-label="Colour ${i + 1}" style="background:linear-gradient(135deg, ${c[0]}, ${c[1]})"></button>`).join("")}</div>
              <label class="upload">🖼️ Or an image: <input type="file" id="cImg" accept="image/*"></label>
              <button type="button" class="link-btn" id="cImgClear" hidden>Remove image</button>
            </div>
          </div>
        </div>
        <div class="row2">
          <label class="field"><span>Tags (comma separated, up to 5)</span><input id="cTags" placeholder="Python, Games"></label>
          <label class="field"><span>Team (comma separated)</span><input id="cTeam" placeholder="Names of everyone who helped"></label>
        </div>
        <label class="field"><span>Link (optional)</span><input id="cLink" type="url" placeholder="https://"></label>
      </div>

      <div data-for="other" class="composer">
        <label class="field"><span>Category</span><select id="cKind">${COMMONS.otherKinds.map((k) => `<option>${esc(k)}</option>`).join("")}</select></label>
        <div class="row3" id="cEvent">
          <label class="field"><span>Date</span><input id="cDate" type="date"></label>
          <label class="field"><span>Time</span><input id="cTime" type="time" value="18:00"></label>
          <label class="field"><span>Place</span><input id="cPlace" maxlength="60"></label>
        </div>
      </div>

      ${role === "student" && badges.length ? `<label class="field"><span>Show an achievement (optional)</span><select id="cBadge"><option value="">None</option>${badges.map((b, i) => `<option value="${i}">${b.icon} ${esc(b.text)}</option>`).join("")}</select></label>` : ""}
      ${role === "staff" ? `<label class="check" style="margin:0"><input type="checkbox" id="cPin"> 📌 Pin to the top</label>` : ""}

      <div class="nudge" id="cNudge" hidden></div>
      <p class="form-error" id="cError" hidden></p>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>Cancel</button>
        <button type="submit" class="btn primary" id="cPublish">Publish</button>
      </div>
    </form>`);
    draft.badges = badges;
    syncComposer();
    $("cTitle").focus();
  }

  function syncComposer() {
    const t = draft.type;
    document.querySelectorAll("#cType .seg-btn").forEach((b) => b.classList.toggle("on", b.dataset.ctype === t));
    $("cHint").textContent = TYPE_HINTS[t];
    document.querySelectorAll("#composer [data-for]").forEach((el) => { el.hidden = el.dataset.for !== t; });
    $("cEvent").hidden = $("cKind").value !== "Event";
    const as = $("cAs");
    if (role === "student") {
      const anon = as.querySelector('option[value="anon"]');
      anon.disabled = t === "project";
      anon.textContent = t === "project" ? "🕊️ Anonymous (not for projects)" : "🕊️ Anonymous student";
      if (t === "project" && as.value === "anon") as.value = "me";
    }
    const course = $("cCourse");
    if (as.value.startsWith("course:")) {
      course.value = as.value.slice(7);
      course.disabled = true;
    } else {
      course.disabled = false;
    }
    $("cTitleN").textContent = `${$("cTitle").value.length} / 90`;
    $("cTextN").textContent = `${$("cText").value.length} / 1500`;
    const prev = { title: $("cTitle").value || "Your project", cover: draft.cover };
    $("cCover").innerHTML = coverHtml(prev, "");
    document.querySelectorAll("#cEmoji button").forEach((b) => b.classList.toggle("on", !draft.cover.img && b.dataset.emoji === draft.cover.emoji));
    document.querySelectorAll("#cColor button").forEach((b) => b.classList.toggle("on", !draft.cover.img && COMMONS.coverColors[b.dataset.color] === draft.cover.colors));
    $("cImgClear").hidden = !draft.cover.img;
  }

  function resetNudge() {
    draft.confirmed = false;
    $("cNudge").hidden = true;
    $("cPublish").textContent = "Publish";
  }

  // Scale an image down and turn it into a small JPEG data URL.
  function readImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) { reject(new Error("type")); return; }
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const k = Math.min(1, COMMONS.maxImageSide / Math.max(img.width, img.height));
          const cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(img.width * k));
          cv.height = Math.max(1, Math.round(img.height * k));
          const ctx = cv.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, cv.width, cv.height);
          ctx.drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL("image/jpeg", 0.82));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  const splitList = (s, max) => s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, max);

  function publish() {
    const err = $("cError");
    const fail = (msg) => { err.textContent = msg; err.hidden = false; };
    err.hidden = true;
    const type = draft.type;
    const title = $("cTitle").value.trim();
    const body = $("cText").value.trim();
    if (title.length < 3) return fail("Please add a title.");
    if (body.length < 10) return fail("Please write a few words in the text.");
    const link = type === "project" ? $("cLink").value.trim() : "";
    if (link && !/^https?:\/\/\S+\.\S+$/i.test(link)) return fail("The link has to start with https:// or http://.");
    let event = null;
    if (type === "other" && $("cKind").value === "Event") {
      if (!$("cDate").value) return fail("Please pick the date of the event.");
      event = { date: $("cDate").value, time: $("cTime").value || "00:00", place: $("cPlace").value.trim() };
      event.ts = eventTs(event);
    }
    const tags = type === "project" ? splitList($("cTags").value, 5) : [];
    const team = type === "project" ? splitList($("cTeam").value, 12) : [];
    const hits = nudgeHits([title, body, ...tags].join(" "));
    if (hits.length && !draft.confirmed) {
      $("cNudge").innerHTML = nudgeText(hits) + " You can edit your text or post it anyway.";
      $("cNudge").hidden = false;
      $("cPublish").textContent = "Post anyway";
      draft.confirmed = true;
      return;
    }

    const as = $("cAs").value;
    const post = {
      id: "u" + Date.now().toString(36),
      type,
      source: role === "staff" ? (as === "school" ? "school" : "course") : "student",
      course: as.startsWith("course:") ? as.slice(7) : ($("cCourse").value || null),
      mine: true,
      t: now(),
      title,
      text: body,
      reactions: {},
    };
    if (role === "student") {
      if (as === "anon" && type !== "project") post.anonymous = true;
      else post.author = me();
      const bi = $("cBadge") ? $("cBadge").value : "";
      if (bi !== "") post.badge = draft.badges[+bi];
    }
    if (role === "staff" && $("cPin").checked) post.pinned = true;
    if (type === "project") Object.assign(post, { tags, team, link, cover: draft.cover });
    if (type === "other") post.kind = $("cKind").value;
    if (event) post.event = event;

    state.posts.unshift(post);
    if (!save()) {
      state.posts.shift();
      return fail(draft.cover.img ? "Could not save the post. The image is too large for the browser storage, try a smaller one." : "Could not save the post in this browser.");
    }
    closeModal();
    Object.assign(view, { type: "all", source: "all", course: "all", q: "", mine: false });
    $("search").value = "";
    $("courseFilter").value = "all";
    $("mineFilter").checked = false;
    render();
    focusPost(post.id);
    toast(`${TYPES[type].icon} Published. Thanks for sharing!`);
  }

  function focusPost(id) {
    const el = document.querySelector(`#feed [data-pid="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1700);
  }

  // ---------- Actions ----------
  function postAction(act, id, btn) {
    const p = getPost(id);
    if (!p) return;
    if (act === "react") {
      const r = btn.dataset.r;
      if (state.reacts[id] === r) delete state.reacts[id];
      else state.reacts[id] = r;
      save();
      refresh(id);
    } else if (act === "comments") {
      if (openComments.has(id)) openComments.delete(id); else openComments.add(id);
      refresh(id);
      if (openComments.has(id)) {
        const input = document.querySelector(`#feed form[data-pid="${id}"] input[name="text"]`);
        if (input) input.focus();
      }
    } else if (act === "more") {
      expanded.add(id);
      refresh(id);
    } else if (act === "report") {
      reportOpen = id;
      refresh(id);
    } else if (act === "report-cancel") {
      reportOpen = null;
      refresh(id);
    } else if (act === "report-reason") {
      reportOpen = null;
      state.reports[id] = { reason: btn.dataset.reason, t: now() };
      if (!state.hidden.includes(id)) state.hidden.push(id);
      save();
      if (!$("modal").hidden) closeModal();
      render();
      toast("🚩 Thanks for telling us. The post is hidden for you and the team will look at it.", () => {
        delete state.reports[id];
        state.hidden = state.hidden.filter((x) => x !== id);
        save();
        render();
      });
    } else if (act === "pin") {
      state.pins[id] = !isPinned(p);
      save();
      render();
      if (!$("modal").hidden) refresh(id);
    } else if (act === "delete" || act === "remove") {
      const own = state.posts.findIndex((x) => x.id === id);
      let undo;
      if (act === "delete" && own >= 0) {
        const [gone] = state.posts.splice(own, 1);
        undo = () => { state.posts.splice(own, 0, gone); save(); render(); };
      } else {
        state.removed.push(id);
        undo = () => { state.removed = state.removed.filter((x) => x !== id); save(); render(); };
      }
      save();
      if (!$("modal").hidden) closeModal();
      render();
      toast(act === "delete" ? "🗑️ Your post was deleted." : "🗑️ Post removed for everyone.", undo);
    }
  }

  function sendComment(form) {
    const id = form.dataset.pid;
    const input = form.querySelector('input[name="text"]');
    const txt = input.value.trim();
    if (!txt) { input.focus(); return; }
    const nudge = form.querySelector(".nudge");
    const hits = nudgeHits(txt);
    if (hits.length && form.dataset.confirmed !== "1") {
      nudge.innerHTML = nudgeText(hits);
      nudge.hidden = false;
      form.dataset.confirmed = "1";
      form.querySelector('button[type="submit"]').textContent = "Send anyway";
      return;
    }
    const c = { id: "uc" + Date.now().toString(36), t: now(), text: txt.slice(0, 500), mine: true };
    if (role === "staff") c.school = true;
    else if (form.querySelector('input[name="anon"]').checked) c.anonymous = true;
    else Object.assign(c, me());
    (state.comments[id] = state.comments[id] || []).push(c);
    if (!save()) { state.comments[id].pop(); toast("Could not save the comment in this browser."); return; }
    openComments.add(id);
    refresh(id);
    const again = document.querySelector(`#feed form[data-pid="${id}"] input[name="text"]`);
    if (again && !document.querySelector("#modal:not([hidden])")) again.focus();
  }

  function deleteComment(cid, id) {
    const list = state.comments[id] || [];
    state.comments[id] = list.filter((c) => c.id !== cid);
    save();
    refresh(id);
  }

  function bindEvents() {
    $("roleSwitch").addEventListener("click", (e) => {
      const b = e.target.closest("[data-role]");
      if (!b || b.dataset.role === role) return;
      role = b.dataset.role;
      try { localStorage.setItem(ROLE_KEY, role); } catch (_) { /* view only */ }
      reportOpen = null;
      view.showHidden = false;
      render();
    });
    $("typeTabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-type]");
      if (b) { view.type = b.dataset.type; render(); }
    });
    $("sourceFilter").addEventListener("click", (e) => {
      const b = e.target.closest("[data-source]");
      if (b) { view.source = b.dataset.source; render(); }
    });
    $("sortSeg").addEventListener("click", (e) => {
      const b = e.target.closest("[data-sort]");
      if (b) { view.sort = b.dataset.sort; render(); }
    });
    $("courseFilter").addEventListener("change", (e) => { view.course = e.target.value; render(); });
    $("mineFilter").addEventListener("change", (e) => { view.mine = e.target.checked; render(); });
    let searchTimer = null;
    $("search").addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { view.q = e.target.value.trim(); render(); }, 150);
    });
    $("newPost").addEventListener("click", openComposer);

    // Clicks inside the feed, the side bar and the modal.
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]") || e.target === $("modal")) { closeModal(); return; }
      const ctype = e.target.closest("[data-ctype]");
      if (ctype && draft) { draft.type = ctype.dataset.ctype; resetNudge(); syncComposer(); return; }
      const emo = e.target.closest("[data-emoji]");
      if (emo && draft) { draft.cover = { emoji: emo.dataset.emoji, colors: draft.cover.colors || COMMONS.coverColors[0] }; $("cImg").value = ""; syncComposer(); return; }
      const col = e.target.closest("[data-color]");
      if (col && draft) { draft.cover = { emoji: draft.cover.emoji || COMMONS.coverEmojis[0], colors: COMMONS.coverColors[+col.dataset.color] }; $("cImg").value = ""; syncComposer(); return; }
      if (e.target.closest("#cImgClear") && draft) { draft.cover = { emoji: COMMONS.coverEmojis[0], colors: COMMONS.coverColors[0] }; $("cImg").value = ""; syncComposer(); return; }

      const actEl = e.target.closest("[data-act]");
      if (!actEl) return;
      const act = actEl.dataset.act;
      if (act === "toggle-hidden") { view.showHidden = !view.showHidden; render(); return; }
      if (act === "goto") {
        Object.assign(view, { type: "all", source: "all", course: "all", q: "", mine: false });
        $("search").value = "";
        $("courseFilter").value = "all";
        $("mineFilter").checked = false;
        render();
        focusPost(actEl.dataset.goto);
        return;
      }
      if (act === "open") { openProject(actEl.dataset.pid); return; }
      const holder = actEl.closest("[data-pid]");
      if (!holder) return;
      if (act === "del-comment") { deleteComment(actEl.dataset.cid, holder.dataset.pid); return; }
      postAction(act, holder.dataset.pid, actEl);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("modal").hidden) closeModal();
      if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("tile")) {
        e.preventDefault();
        openProject(e.target.dataset.pid);
      }
    });

    document.addEventListener("submit", (e) => {
      e.preventDefault();
      if (e.target.id === "composer") publish();
      else if (e.target.classList.contains("cmt-form")) sendComment(e.target);
    });

    document.addEventListener("input", (e) => {
      if (!draft || !e.target.closest("#composer")) return;
      if (e.target.id === "cTitle" || e.target.id === "cText" || e.target.id === "cTags") resetNudge();
      if (e.target.id === "cTitle" || e.target.id === "cText") syncComposer();
    });
    document.addEventListener("change", (e) => {
      if (!draft || !e.target.closest("#composer")) return;
      if (e.target.id === "cAs" || e.target.id === "cKind") syncComposer();
      if (e.target.id === "cImg") {
        const file = e.target.files && e.target.files[0];
        readImage(file).then((url) => {
          draft.cover = { img: url, emoji: draft.cover.emoji, colors: draft.cover.colors };
          syncComposer();
        }).catch(() => {
          $("cError").textContent = "That file could not be read as an image.";
          $("cError").hidden = false;
        });
      }
    });

    // Comment forms reset their "Send anyway" state when the text changes.
    document.addEventListener("input", (e) => {
      const form = e.target.closest && e.target.closest(".cmt-form");
      if (!form || form.dataset.confirmed !== "1") return;
      form.dataset.confirmed = "";
      form.querySelector(".nudge").hidden = true;
      form.querySelector('button[type="submit"]').textContent = "Send";
    });
  }

  fillStatic();
  bindEvents();
  render();
})();
