(() => {
  "use strict";

  const KEYS = {
    role: "courseFeedback.role.v1",
    questions: "courseFeedback.questions.v1",
    responses: "courseFeedback.responses.v1",
    done: "courseFeedback.done.v1",
    review: "courseFeedback.review.v1",
  };
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const TYPE_NAMES = { scale: "Scale 1 to 5", choice: "Single choice", text: "Text answer" };

  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

  // ---------- Storage ----------
  function load(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (_) {
      return fallback;
    }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* storage unavailable */ }
  }

  // ---------- Dates ----------
  function parseDate(str) {
    const [d, t = "00:00"] = str.split("T");
    const [y, m, day] = d.split("-").map(Number);
    const [hh, mm] = t.split(":").map(Number);
    return new Date(y, m - 1, day, hh, mm);
  }
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const endOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59);
  const NOW = SETTINGS.today ? parseDate(SETTINGS.today) : new Date();
  function dateLabel(d) {
    const year = d.getFullYear() !== NOW.getFullYear() ? ` ${d.getFullYear()}` : "";
    return `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}${year}`;
  }

  // ---------- Semesters and feedback rounds ----------
  function teachingMondays(sem) {
    const start = parseDate(sem.start);
    const end = endOf(parseDate(sem.end));
    const breaks = (sem.breaks || []).map((b) => ({ from: parseDate(b.from), to: endOf(parseDate(b.to)) }));
    const inBreak = (d) => breaks.some((b) => d >= b.from && d <= b.to);
    const out = [];
    for (let m = new Date(start); m <= end; m = addDays(m, 7)) {
      if (inBreak(m) && inBreak(addDays(m, 4))) continue;
      out.push(m);
    }
    return out;
  }

  function buildRounds(sem) {
    const mondays = teachingMondays(sem);
    const midOpen = mondays[clamp(Math.floor(mondays.length * FEEDBACK.mid.startAt), 0, mondays.length - 1)];
    const lastDay = endOf(parseDate(sem.end));
    return [
      { id: "mid", name: "Mid-semester", open: midOpen, close: endOf(addDays(midOpen, FEEDBACK.mid.days - 1)) },
      {
        id: "end", name: "End of semester",
        open: addDays(parseDate(sem.end), -FEEDBACK.end.daysBefore),
        close: endOf(addDays(lastDay, FEEDBACK.end.daysAfter)),
      },
    ];
  }

  const SEMS = [...SEMESTERS]
    .sort((a, b) => parseDate(a.start) - parseDate(b.start))
    .map((sem) => ({ sem, start: parseDate(sem.start), rounds: buildRounds(sem) }));
  const semById = Object.fromEntries(SEMS.map((s) => [s.sem.id, s]));
  const CUR = [...SEMS].reverse().find((s) => s.start <= NOW) || SEMS[0];
  const roundState = (r) => (NOW < r.open ? "upcoming" : NOW > r.close ? "closed" : "open");
  function roundStateText(r) {
    const st = roundState(r);
    if (st === "open") return `Open until ${dateLabel(r.close)}`;
    if (st === "upcoming") return `Opens ${dateLabel(r.open)}`;
    return `Closed ${dateLabel(r.close)}`;
  }

  // ---------- Questions ----------
  let questionStore = load(KEYS.questions, {});
  const qKey = (S, c) => `${S.sem.id}|${c.id}`;
  const cloneDefaults = () => DEFAULT_QUESTIONS.map((q) => ({
    id: q.id, type: q.type, text: q.text, required: !!q.required,
    allowComment: !!q.allowComment, options: q.options ? [...q.options] : undefined,
  }));
  function questionsFor(S, c) {
    const list = questionStore[qKey(S, c)];
    return Array.isArray(list) ? list : cloneDefaults();
  }
  function saveQuestions(S, c, list) {
    questionStore[qKey(S, c)] = list;
    save(KEYS.questions, questionStore);
  }

  // ---------- Responses ----------
  // Stored without any name or id of the student. "done" only remembers that this browser took part.
  let responses = load(KEYS.responses, []);
  let done = load(KEYS.done, []);
  const rKey = (S, c, r) => `${S.sem.id}|${c.id}|${r.id}`;

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rngFrom(seed) {
    let a = seed;
    return () => {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (rng, list) => list[Math.floor(rng() * list.length)];
  const gauss = (rng) => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  function weighted(rng, weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let x = rng() * total;
    for (let i = 0; i < weights.length; i++) {
      x -= weights[i];
      if (x < 0) return i;
    }
    return weights.length - 1;
  }

  // Made-up answers so the lecturer view has something to show in the demo.
  function sampleResponses(S, c, r, questions) {
    if (!FEEDBACK.sampleData) return [];
    const st = roundState(r);
    if (st === "upcoming") return [];
    const rng = rngFrom(hash(rKey(S, c, r)));
    const base = rngFrom(hash(qKey(S, c)));
    const share = 0.35 + base() * 0.3;
    const shift = (base() - 0.5) * 0.7 + (r.id === "end" ? 0.15 : 0);
    let count = Math.round((c.students || 30) * share);
    if (st === "open") {
      const f = clamp((NOW - r.open) / (r.close - r.open), 0, 1);
      count = Math.round(count * Math.min(1, 0.25 + f * 1.1));
    }
    const defaults = Object.fromEntries(DEFAULT_QUESTIONS.map((q) => [q.id, q]));
    const out = [];
    for (let i = 0; i < count; i++) {
      const a = {};
      questions.forEach((q) => {
        const d = defaults[q.id];
        if (!d || d.type !== q.type) return;
        if (q.type === "scale") {
          const v = clamp(Math.round((d.sampleMean || 3.8) + shift + gauss(rng) * 0.85), 1, 5);
          a[q.id] = { v };
          if (q.allowComment && rng() < 0.1) {
            const pool = v >= 4 ? SAMPLE_SCALE_COMMENTS.positive : v === 3 ? SAMPLE_SCALE_COMMENTS.neutral : SAMPLE_SCALE_COMMENTS.negative;
            a[q.id].c = pick(rng, pool);
          }
        } else if (q.type === "choice") {
          const n = (q.options || []).length;
          if (!n) return;
          const w = d.sampleWeights && d.sampleWeights.length === n ? d.sampleWeights : Array(n).fill(1);
          a[q.id] = { v: weighted(rng, w) };
          if (q.allowComment && rng() < 0.05) a[q.id].c = pick(rng, SAMPLE_SCALE_COMMENTS.neutral);
        } else if (q.type === "text" && d.sampleComments && rng() < 0.3) {
          a[q.id] = { t: pick(rng, d.sampleComments) };
        }
      });
      out.push({ a });
    }
    return out;
  }

  function responsesFor(S, c, r, questions) {
    const key = rKey(S, c, r);
    return sampleResponses(S, c, r, questions).concat(responses.filter((x) => x.k === key));
  }

  // ---------- Background check for the administration ----------
  // Not part of the visible survey. Students and lecturers never see these marks.
  function backgroundReview() {
    const marks = {};
    SEMS.forEach((S) => S.sem.courses.forEach((c) => S.rounds.forEach((r) => {
      if (roundState(r) === "upcoming") return;
      const qs = questionsFor(S, c).filter((q) => q.type === "scale");
      const list = responsesFor(S, c, r, qs);
      if (list.length < FEEDBACK.review.minResponses) return;
      let sum = 0;
      let cnt = 0;
      qs.forEach((q) => list.forEach((x) => {
        const a = x.a[q.id];
        if (a && a.v >= 1 && a.v <= 5) {
          sum += a.v;
          cnt++;
        }
      }));
      if (cnt && sum / cnt < FEEDBACK.review.averageBelow) {
        marks[rKey(S, c, r)] = { average: Math.round((sum / cnt) * 100) / 100, responses: list.length, checked: ymd(NOW) };
      }
    })));
    save(KEYS.review, marks);
  }

  // ---------- Grouping comments by topic ----------
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const themeMatchers = COMMENT_THEMES.map((t) => ({
    name: t.name,
    res: t.words.map((w) => new RegExp(`(^|[^a-z])${escRe(w.toLowerCase())}`, "i")),
  }));
  function themeOf(text) {
    let best = "Other";
    let bestHits = 0;
    themeMatchers.forEach((t) => {
      const hits = t.res.filter((re) => re.test(text)).length;
      if (hits > bestHits) {
        best = t.name;
        bestHits = hits;
      }
    });
    return best;
  }
  const normText = (t) => t.toLowerCase().replace(/\s+/g, " ").replace(/[\s.!?,:]+$/g, "").trim();

  // items: [{ text, q }] where q is the question index (optional)
  function groupComments(items, seed) {
    const groups = new Map();
    shuffled(items, seed).forEach((it) => {
      const theme = themeOf(it.text);
      if (!groups.has(theme)) groups.set(theme, new Map());
      const g = groups.get(theme);
      const k = normText(it.text);
      if (!g.has(k)) g.set(k, { text: it.text, count: 0, qs: new Set() });
      const e = g.get(k);
      e.count++;
      if (it.q !== undefined) e.qs.add(it.q);
    });
    return [...groups.entries()]
      .map(([name, m]) => {
        const entries = [...m.values()].sort((a, b) => b.count - a.count);
        return { name, entries, total: entries.reduce((s, e) => s + e.count, 0) };
      })
      .sort((a, b) => (a.name === "Other") - (b.name === "Other") || b.total - a.total);
  }

  function groupedList(groups, qs, withHeader = true) {
    return `<div class="groups">${groups.map((g) => `
      <div class="group">
        ${withHeader ? `<div class="group-h">${esc(g.name)} <span class="n">${g.total}</span></div>` : ""}
        <ul>${g.entries.map((e) => `<li>
          <span>${esc(e.text)}</span>
          ${e.count > 1 ? `<span class="times" tabindex="0" data-tip="Written by ${e.count} students">×${e.count}</span>` : ""}
          ${qs ? [...e.qs].sort((a, b) => a - b).map((i) => `<span class="src" tabindex="0" data-tip="${esc(qs[i].text)}">Q${i + 1}</span>`).join("") : ""}
        </li>`).join("")}</ul>
      </div>`).join("")}</div>`;
  }

  // ---------- Tooltip and toast ----------
  let toastTimer = null;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
  }
  function bindTooltip() {
    const tip = $("tip");
    const show = (el, x, y) => {
      tip.textContent = el.getAttribute("data-tip");
      tip.classList.add("show");
      const r = tip.getBoundingClientRect();
      tip.style.left = clamp(x - r.width / 2, 8, window.innerWidth - r.width - 8) + "px";
      tip.style.top = (y - r.height - 12 < 8 ? y + 16 : y - r.height - 12) + "px";
    };
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest("[data-tip]");
      if (el) show(el, e.clientX, e.clientY);
      else tip.classList.remove("show");
    });
    document.addEventListener("focusin", (e) => {
      const el = e.target.closest && e.target.closest("[data-tip]");
      if (!el) return;
      const r = el.getBoundingClientRect();
      show(el, r.left + r.width / 2, r.top);
    });
    document.addEventListener("focusout", () => tip.classList.remove("show"));
    window.addEventListener("scroll", () => tip.classList.remove("show"), { passive: true });
  }

  // ---------- Role switch ----------
  let role = load(KEYS.role, "student") === "lecturer" ? "lecturer" : "student";
  function setRole(next) {
    role = next;
    save(KEYS.role, role);
    document.querySelectorAll("#roleSwitch .seg-btn").forEach((b) => {
      const on = b.dataset.role === role;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });
    $("studentView").hidden = role !== "student";
    $("lecturerView").hidden = role !== "lecturer";
    $("subtitle").textContent = role === "student"
      ? `Anonymous feedback · ${CUR.sem.name}`
      : "Questions and results for lecturers";
    if (role === "student") showCourseList();
    else renderLecturer();
  }

  // =====================================================================
  // Student view
  // =====================================================================
  function showCourseList() {
    $("studentForm").hidden = true;
    $("studentList").hidden = false;
    const open = CUR.rounds.find((r) => roundState(r) === "open");
    $("roundInfo").textContent = open
      ? `${open.name} feedback is open until ${dateLabel(open.close)}.`
      : `No feedback round is open right now. ${CUR.rounds.map((r) => `${r.name}: ${roundStateText(r).toLowerCase()}`).join(" · ")}`;

    $("courseList").innerHTML = CUR.sem.courses.map((c) => {
      const rounds = CUR.rounds.map((r) => {
        const st = roundState(r);
        const sent = done.includes(rKey(CUR, c, r));
        let action;
        if (sent) action = `<span class="sent">✓ Sent</span>`;
        else if (st === "open") action = `<button type="button" class="btn primary small" data-open="${esc(c.id)}|${r.id}">Give feedback</button>`;
        else if (st === "upcoming") action = `<span class="muted small">${roundStateText(r)}</span>`;
        else action = `<span class="muted small">Closed</span>`;
        return `<div class="round-row ${st}${sent ? " sent-row" : ""}">
          <span class="round-name">${r.name}</span>
          ${st === "open" && !sent ? `<span class="muted small">until ${dateLabel(r.close)}</span>` : "<span></span>"}
          ${action}
        </div>`;
      }).join("");
      return `<div class="course-item">
        <span class="c-icon" aria-hidden="true">${c.icon || "📘"}</span>
        <div class="c-info"><b>${esc(c.name)}</b><span class="muted">${esc(c.lecturer || "")}</span></div>
        <div class="c-rounds">${rounds}</div>
      </div>`;
    }).join("");
  }

  let formCtx = null;

  function scaleInput(q) {
    return `<div class="scale">
      <span class="scale-end">${esc(SCALE_LABELS[0])}</span>
      <div class="scale-opts">${[1, 2, 3, 4, 5].map((v) => `
        <label class="scale-opt" title="${esc(SCALE_LABELS[v - 1])}">
          <span class="scale-num">${v}</span>
          <input type="radio" name="${esc(q.id)}" value="${v}">
          <i class="radio" aria-hidden="true"></i>
        </label>`).join("")}</div>
      <span class="scale-end">${esc(SCALE_LABELS[4])}</span>
    </div>`;
  }
  function choiceInput(q) {
    return `<div class="choice">${(q.options || []).map((o, i) => `
      <label class="choice-opt"><input type="radio" name="${esc(q.id)}" value="${i}"><i class="radio" aria-hidden="true"></i><span>${esc(o)}</span></label>`).join("")}
    </div>`;
  }

  function openForm(S, c, r, preview) {
    formCtx = { S, c, r, preview, questions: questionsFor(S, c) };
    $("studentList").hidden = true;
    const box = $("studentForm");
    box.hidden = false;
    const qs = formCtx.questions;
    box.innerHTML = `
      <button type="button" class="link-btn back-link" id="formBack">${preview ? "← Back to the question editor" : "← All courses"}</button>
      ${preview ? `<div class="preview-banner">Preview. This is what students see. Nothing is sent.</div>` : ""}
      <form id="gform" class="gform" novalidate>
        <div class="gcard head-card">
          <h2>${esc(r.name)} feedback</h2>
          <p class="head-course"><span aria-hidden="true">${c.icon || ""}</span> ${esc(c.name)} · ${esc(c.lecturer || "")} · ${esc(S.sem.name)}</p>
          <p class="muted">Please answer honestly. It takes about 3 minutes and helps to improve the course while it is still running.</p>
          <p class="anon-line">🔒 Anonymous. Your name is not saved with your answers.</p>
          <p class="req-note"><span class="req">*</span> Required</p>
        </div>
        ${qs.map((q, i) => `
          <div class="gcard q-card" data-qid="${esc(q.id)}">
            <div class="q-text">${i + 1}. ${esc(q.text)}${q.required ? ' <span class="req">*</span>' : ""}</div>
            ${q.type === "scale" ? scaleInput(q) : q.type === "choice" ? choiceInput(q) : `<textarea class="answer-text" name="${esc(q.id)}" rows="3" placeholder="Your answer"></textarea>`}
            ${q.type !== "text" && q.allowComment ? `
              <button type="button" class="link-btn add-comment">+ Add a comment</button>
              <textarea class="comment" rows="2" placeholder="Comment (optional)" hidden></textarea>` : ""}
            <p class="q-error" hidden>This is a required question.</p>
          </div>`).join("")}
        <div class="form-actions">
          <button type="submit" class="btn primary">${preview ? "Send (disabled in preview)" : "Send feedback"}</button>
          <button type="button" class="link-btn" id="clearForm">Clear form</button>
        </div>
      </form>`;
    window.scrollTo({ top: 0 });
  }

  function bindForm() {
    const box = $("studentForm");
    box.addEventListener("click", (e) => {
      if (e.target.closest("#formBack")) {
        if (formCtx && formCtx.preview) setRole("lecturer");
        else showCourseList();
        return;
      }
      const add = e.target.closest(".add-comment");
      if (add) {
        const ta = add.nextElementSibling;
        ta.hidden = false;
        add.hidden = true;
        ta.focus();
        return;
      }
      if (e.target.closest("#clearForm")) {
        if (!confirm("Clear all answers in this form?")) return;
        $("gform").reset();
        box.querySelectorAll(".comment").forEach((t) => { t.hidden = true; });
        box.querySelectorAll(".add-comment").forEach((b) => { b.hidden = false; });
        box.querySelectorAll(".q-card.invalid").forEach((c) => c.classList.remove("invalid"));
        box.querySelectorAll(".q-error").forEach((p) => { p.hidden = true; });
      }
    });
    box.addEventListener("change", (e) => {
      const card = e.target.closest(".q-card");
      if (card && card.classList.contains("invalid")) {
        card.classList.remove("invalid");
        card.querySelector(".q-error").hidden = true;
      }
    });
    box.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!formCtx) return;
      const form = $("gform");
      const answers = {};
      let firstInvalid = null;
      formCtx.questions.forEach((q) => {
        const card = form.querySelector(`.q-card[data-qid="${CSS.escape(q.id)}"]`);
        let entry = null;
        if (q.type === "text") {
          const t = card.querySelector(".answer-text").value.trim();
          if (t) entry = { t };
        } else {
          const checked = card.querySelector("input[type=radio]:checked");
          if (checked) entry = { v: Number(checked.value) };
          const com = card.querySelector(".comment");
          if (com && com.value.trim()) entry = Object.assign(entry || {}, { c: com.value.trim() });
        }
        const missing = q.required && (!entry || (q.type !== "text" && entry.v === undefined));
        card.classList.toggle("invalid", missing);
        card.querySelector(".q-error").hidden = !missing;
        if (missing && !firstInvalid) firstInvalid = card;
        if (entry) answers[q.id] = entry;
      });
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        toast("Please answer the questions marked as required.");
        return;
      }
      if (formCtx.preview) {
        toast("Preview only. Nothing was sent.");
        return;
      }
      const { S, c, r } = formCtx;
      const key = rKey(S, c, r);
      responses.push({ k: key, a: answers, d: ymd(NOW) });
      save(KEYS.responses, responses);
      done.push(key);
      save(KEYS.done, done);
      backgroundReview();
      Rewards.sync(); // +stars for taking part, nothing about the answers
      showThanks(c, r);
    });
  }

  function showThanks(c, r) {
    $("studentForm").innerHTML = `
      <div class="gcard head-card thanks">
        <span class="thanks-icon" aria-hidden="true">✓</span>
        <h2>Thank you</h2>
        <p>Your ${esc(r.name.toLowerCase())} feedback for <b>${esc(c.name)}</b> was sent anonymously.</p>
        <p class="muted">${esc(c.lecturer || "The lecturer")} sees the results as percentages once at least ${FEEDBACK.minResponses} students have answered.</p>
        <button type="button" class="btn primary" id="formBack">Back to your courses</button>
      </div>`;
    formCtx = null;
    window.scrollTo({ top: 0 });
  }

  // =====================================================================
  // Lecturer view
  // =====================================================================
  const lv = { sem: CUR.sem.id, course: CUR.sem.courses[0].id, round: null, tab: "results" };

  function defaultRound(S) {
    const open = S.rounds.find((r) => roundState(r) === "open");
    if (open) return open.id;
    const closed = S.rounds.filter((r) => roundState(r) === "closed");
    return closed.length ? closed[closed.length - 1].id : S.rounds[0].id;
  }
  const lvS = () => semById[lv.sem];
  const lvC = () => lvS().sem.courses.find((c) => c.id === lv.course) || lvS().sem.courses[0];
  const lvR = () => lvS().rounds.find((r) => r.id === lv.round) || lvS().rounds[0];

  function renderLecturerFilters() {
    const S = lvS();
    if (!S.sem.courses.some((c) => c.id === lv.course)) lv.course = S.sem.courses[0].id;
    if (!lv.round) lv.round = defaultRound(S);
    $("lvSem").innerHTML = [...SEMS].reverse().map((s) =>
      `<option value="${esc(s.sem.id)}"${s.sem.id === lv.sem ? " selected" : ""}>${esc(s.sem.name)}${s === CUR ? " (current)" : ""}</option>`).join("");
    $("lvCourse").innerHTML = S.sem.courses.map((c) =>
      `<option value="${esc(c.id)}"${c.id === lv.course ? " selected" : ""}>${c.icon || ""} ${esc(c.name)} · ${esc(c.lecturer || "")}</option>`).join("");
    $("lvRound").innerHTML = S.rounds.map((r) => {
      const st = roundState(r);
      return `<button type="button" class="seg-btn${r.id === lv.round ? " on" : ""}" data-round="${r.id}" aria-pressed="${r.id === lv.round}">
        ${r.name} <span class="state-dot ${st}" aria-hidden="true"></span><span class="seg-sub">${st === "open" ? "open" : st === "upcoming" ? "upcoming" : "closed"}</span></button>`;
    }).join("");
    document.querySelectorAll(".tabs .tab").forEach((t) => {
      const on = t.dataset.tab === lv.tab;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on);
    });
    $("resultsPanel").hidden = lv.tab !== "results";
    $("questionsPanel").hidden = lv.tab !== "questions";
  }

  function renderLecturer() {
    renderLecturerFilters();
    if (lv.tab === "results") renderResults();
    else renderEditor();
  }

  // ---------- Aggregation ----------
  function aggregate(q, list) {
    if (q.type === "scale") {
      const counts = [0, 0, 0, 0, 0];
      const comments = [];
      list.forEach((r) => {
        const a = r.a[q.id];
        if (!a) return;
        if (a.v >= 1 && a.v <= 5) counts[a.v - 1]++;
        if (a.c) comments.push(a.c);
      });
      const n = counts.reduce((s, x) => s + x, 0);
      const mean = n ? counts.reduce((s, x, i) => s + x * (i + 1), 0) / n : null;
      return { n, counts, mean, agree: pct(counts[3] + counts[4], n), comments };
    }
    if (q.type === "choice") {
      const counts = (q.options || []).map(() => 0);
      const comments = [];
      list.forEach((r) => {
        const a = r.a[q.id];
        if (!a) return;
        if (a.v >= 0 && a.v < counts.length) counts[a.v]++;
        if (a.c) comments.push(a.c);
      });
      return { n: counts.reduce((s, x) => s + x, 0), counts, comments };
    }
    const texts = list.map((r) => r.a[q.id] && r.a[q.id].t).filter(Boolean);
    return { n: texts.length, texts };
  }

  // Shown in a fixed shuffled order so nobody can match comments to the time they were sent.
  function shuffled(list, seed) {
    const rng = rngFrom(hash(seed));
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // ---------- Result charts ----------
  function likertBar(agg) {
    const segs = agg.counts.map((n, i) => {
      const p = agg.n ? (n / agg.n) * 100 : 0;
      if (!n) return "";
      const label = p >= 9 ? `<span>${Math.round(p)}%</span>` : "";
      return `<i class="lk lk${i + 1}" style="flex-grow:${n}" tabindex="0"
        data-tip="${esc(`${SCALE_LABELS[i]}: ${Math.round(p)}% (${n} of ${agg.n})`)}">${label}</i>`;
    }).join("");
    return `<div class="likert" role="img" aria-label="${esc(agg.counts.map((n, i) => `${SCALE_LABELS[i]} ${pct(n, agg.n)}%`).join(", "))}">${segs}</div>`;
  }
  const likertLegend = () => `<div class="legend lk-legend">${SCALE_LABELS.map((l, i) =>
    `<span><i class="key lk${i + 1}"></i>${esc(l)}</span>`).join("")}</div>`;

  function choiceBars(q, agg) {
    return `<div class="cbars">${(q.options || []).map((o, i) => {
      const p = pct(agg.counts[i], agg.n);
      return `<div class="cbar-row">
        <span class="cbar-label">${esc(o)}</span>
        <div class="cbar-track" tabindex="0" data-tip="${esc(`${o}: ${p}% (${agg.counts[i]} of ${agg.n})`)}">
          <i class="cbar" style="width:${p}%"></i><span class="cbar-val" style="left:${p}%">${p}%</span>
        </div>
      </div>`;
    }).join("")}</div>`;
  }

  function commentList(items, seed, label) {
    if (!items.length) return "";
    return `<details class="comments">
      <summary>${label} (${items.length})</summary>
      <div class="scroll-box">${groupedList(groupComments(items.map((text) => ({ text })), seed))}</div>
    </details>`;
  }

  // Every comment and written answer of the round, grouped by topic.
  function themeOverview(qs, aggs, seed) {
    const items = [];
    qs.forEach((q, i) => {
      const a = aggs[q.id];
      (a.comments || []).forEach((text) => items.push({ text, q: i }));
      (a.texts || []).forEach((text) => items.push({ text, q: i }));
    });
    if (!items.length) return "";
    const groups = groupComments(items, seed + "|all");
    const max = Math.max(...groups.map((g) => g.total));
    return `<div class="card theme-card">
      <div class="card-head">
        <h2>What students mention</h2>
        <p class="muted">All comments and written answers, grouped by topic. Q shows the question.</p>
      </div>
      <div class="themes">${groups.map((g) => `
        <details class="theme-row">
          <summary>
            <span class="t-name">${esc(g.name)}</span>
            <span class="t-bar" aria-hidden="true"><i style="width:${Math.round((g.total / max) * 100)}%"></i></span>
            <span class="t-count">${g.total} ${g.total === 1 ? "mention" : "mentions"}</span>
          </summary>
          ${groupedList([g], qs, false)}
        </details>`).join("")}
      </div>
    </div>`;
  }

  function renderResults() {
    const S = lvS();
    const c = lvC();
    const r = lvR();
    const st = roundState(r);
    const qs = questionsFor(S, c);
    const list = responsesFor(S, c, r, qs);
    const n = list.length;
    const panel = $("resultsPanel");

    const statusLine = `<div class="card status-card">
      <span class="c-icon" aria-hidden="true">${c.icon || "📘"}</span>
      <div><b>${esc(r.name)} feedback · ${esc(c.name)}</b>
        <span class="muted">${esc(c.lecturer || "")} · ${esc(S.sem.name)} · ${roundStateText(r)}${st === "open" ? " · results so far" : ""}</span></div>
    </div>`;

    if (st === "upcoming") {
      panel.innerHTML = statusLine + `<div class="card empty-card">This round opens on ${dateLabel(r.open)}. Results will appear here as soon as students answer.</div>`;
      return;
    }
    if (n < FEEDBACK.minResponses) {
      panel.innerHTML = statusLine + `<div class="card empty-card">
        <b>Not enough answers yet.</b> Results appear from ${FEEDBACK.minResponses} answers on, so that nobody can be recognised.
        Answers so far: ${n}.</div>`;
      return;
    }

    // Key figures
    const scaleQs = qs.filter((q) => q.type === "scale");
    const aggs = Object.fromEntries(qs.map((q) => [q.id, aggregate(q, list)]));
    let sum = 0;
    let cnt = 0;
    let agreeN = 0;
    scaleQs.forEach((q) => {
      const a = aggs[q.id];
      a.counts.forEach((x, i) => { sum += x * (i + 1); cnt += x; });
      agreeN += a.counts[3] + a.counts[4];
    });
    const avg = cnt ? sum / cnt : null;
    const comments = qs.reduce((s, q) => s + (aggs[q.id].comments ? aggs[q.id].comments.length : 0) + (aggs[q.id].texts ? aggs[q.id].texts.length : 0), 0);

    // Change since the mid-semester round
    let deltaText = "";
    let midAggs = null;
    if (r.id === "end") {
      const mid = S.rounds.find((x) => x.id === "mid");
      const midList = responsesFor(S, c, mid, qs);
      if (midList.length >= FEEDBACK.minResponses) {
        midAggs = Object.fromEntries(scaleQs.map((q) => [q.id, aggregate(q, midList)]));
        let ms = 0;
        let mc = 0;
        scaleQs.forEach((q) => midAggs[q.id].counts.forEach((x, i) => { ms += x * (i + 1); mc += x; }));
        if (mc && avg !== null) {
          const d = avg - ms / mc;
          deltaText = `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} since mid-semester`;
        }
      }
    }

    const tiles = [
      { label: "Responses", value: `${n}`, detail: `of ${c.students || "?"} students · ${pct(n, c.students || n)}% took part` },
      { label: "Average rating", value: avg !== null ? `${avg.toFixed(1)}<small>of 5</small>` : "n/a", detail: deltaText || "across all scale questions" },
      { label: "Agreement", value: `${pct(agreeN, cnt)}%`, detail: "answered Agree or Strongly agree" },
      { label: "Comments", value: `${comments}`, detail: "written answers and notes" },
    ];

    panel.innerHTML = statusLine + `
      <section class="kpis">${tiles.map((t) => `
        <div class="card kpi"><span class="label">${t.label}</span><span class="value">${t.value}</span><span class="detail">${t.detail}</span></div>`).join("")}
      </section>
      ${themeOverview(qs, aggs, rKey(S, c, r))}
      ${qs.map((q, i) => {
        const a = aggs[q.id];
        let body = "";
        if (q.type === "scale") {
          let delta = "";
          if (midAggs && midAggs[q.id] && midAggs[q.id].mean !== null && a.mean !== null) {
            const d = a.mean - midAggs[q.id].mean;
            delta = `<span class="delta">${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} since mid</span>`;
          }
          body = a.n ? `
            <div class="scale-result">
              ${likertBar(a)}
              <div class="scale-stats"><b>${a.mean.toFixed(1)}</b><span class="muted">average</span><b>${a.agree}%</b><span class="muted">agree</span>${delta}</div>
            </div>
            ${likertLegend()}
            <details class="table-view"><summary>Show as table</summary><table><thead><tr><th>Answer</th><th>Share</th><th>Count</th></tr></thead><tbody>${
              a.counts.map((x, k) => `<tr><td>${esc(SCALE_LABELS[k])}</td><td>${pct(x, a.n)}%</td><td>${x}</td></tr>`).join("")}</tbody></table></details>
            ${commentList(a.comments, rKey(S, c, r) + q.id, "Comments")}`
            : `<p class="muted">No answers to this question yet.</p>`;
        } else if (q.type === "choice") {
          body = a.n ? choiceBars(q, a) + commentList(a.comments, rKey(S, c, r) + q.id, "Comments") : `<p class="muted">No answers to this question yet.</p>`;
        } else {
          body = a.n
            ? `<div class="scroll-box">${groupedList(groupComments(a.texts.map((text) => ({ text })), rKey(S, c, r) + q.id))}</div>`
            : `<p class="muted">No written answers yet.</p>`;
        }
        return `<div class="card result-card">
          <div class="rq-head"><span class="rq-num">${i + 1}</span><h3>${esc(q.text)}</h3><span class="type-tag">${TYPE_NAMES[q.type]} · ${a.n} answers</span></div>
          ${body}
        </div>`;
      }).join("")}`;
  }

  // ---------- Question editor ----------
  let editList = [];
  let saveTimer = null;

  function renderEditor() {
    const S = lvS();
    const c = lvC();
    editList = questionsFor(S, c).map((q) => ({ ...q, options: q.options ? [...q.options] : undefined }));
    const panel = $("questionsPanel");
    panel.innerHTML = `
      <div class="card editor-intro">
        <div>
          <h2>Questions for ${esc(c.name)}</h2>
          <p class="muted">Students see these questions in both rounds. Changes are saved right away and apply to everyone who answers from now on.
          The note about anonymity and the option to contact the administration are always added and cannot be removed.</p>
        </div>
        <div class="editor-actions">
          <span id="saveState" class="muted small" aria-live="polite"></span>
          <button type="button" class="btn" id="previewBtn">👁 Preview as student</button>
        </div>
      </div>
      <div id="eqList" class="eq-list"></div>
      <div class="editor-foot">
        <button type="button" class="btn primary" id="addQuestion">+ Add question</button>
        <button type="button" class="link-btn" id="resetQuestions">Reset to the default questions</button>
      </div>`;
    renderEqList();
  }

  function renderEqList() {
    $("eqList").innerHTML = editList.map((q, i) => `
      <div class="card eq-card" data-idx="${i}">
        <div class="eq-head">
          <span class="rq-num">${i + 1}</span>
          <label class="select"><span class="sr-only">Type</span>
            <select class="eq-type">${Object.entries(TYPE_NAMES).map(([k, v]) => `<option value="${k}"${q.type === k ? " selected" : ""}>${v}</option>`).join("")}</select>
          </label>
          <div class="eq-tools">
            <button type="button" class="icon-btn" data-act="up" ${i === 0 ? "disabled" : ""} aria-label="Move up" data-tip="Move up">↑</button>
            <button type="button" class="icon-btn" data-act="down" ${i === editList.length - 1 ? "disabled" : ""} aria-label="Move down" data-tip="Move down">↓</button>
            <button type="button" class="icon-btn" data-act="delete" aria-label="Delete question" data-tip="Delete question">🗑</button>
          </div>
        </div>
        <textarea class="eq-text" rows="2" placeholder="Question text">${esc(q.text)}</textarea>
        ${q.type === "choice" ? `
          <label class="eq-label">Answers to choose from, one per line</label>
          <textarea class="eq-options" rows="${Math.max(3, (q.options || []).length)}">${esc((q.options || []).join("\n"))}</textarea>` : ""}
        ${q.type === "scale" ? `<p class="muted small">Students answer from 1 (${esc(SCALE_LABELS[0])}) to 5 (${esc(SCALE_LABELS[4])}).</p>` : ""}
        <div class="eq-flags">
          <label class="check-line"><input type="checkbox" class="eq-req"${q.required ? " checked" : ""}> Required</label>
          ${q.type !== "text" ? `<label class="check-line"><input type="checkbox" class="eq-comment"${q.allowComment ? " checked" : ""}> Allow a comment</label>` : ""}
        </div>
      </div>`).join("") || `<div class="card empty-card">No questions yet. Add one below.</div>`;
  }

  function persistEditor(now) {
    clearTimeout(saveTimer);
    const run = () => {
      const clean = editList.map((q) => ({
        ...q,
        text: q.text.trim() || "Untitled question",
        options: q.type === "choice" ? (q.options || []).map((o) => o.trim()).filter(Boolean) : undefined,
      }));
      saveQuestions(lvS(), lvC(), clean);
      const s = $("saveState");
      if (s) s.textContent = "✓ Saved";
    };
    if (now) run();
    else saveTimer = setTimeout(run, 350);
    const s = $("saveState");
    if (s && !now) s.textContent = "Saving…";
  }

  function bindEditor() {
    const panel = $("questionsPanel");
    panel.addEventListener("input", (e) => {
      const card = e.target.closest(".eq-card");
      if (!card) return;
      const q = editList[Number(card.dataset.idx)];
      if (e.target.classList.contains("eq-text")) q.text = e.target.value;
      if (e.target.classList.contains("eq-options")) q.options = e.target.value.split("\n");
      persistEditor(false);
    });
    panel.addEventListener("change", (e) => {
      const card = e.target.closest(".eq-card");
      if (!card) return;
      const q = editList[Number(card.dataset.idx)];
      if (e.target.classList.contains("eq-type")) {
        q.type = e.target.value;
        if (q.type === "choice" && !(q.options && q.options.length)) q.options = ["Option 1", "Option 2"];
        if (q.type === "text") q.allowComment = false;
        persistEditor(true);
        renderEqList();
        return;
      }
      if (e.target.classList.contains("eq-req")) q.required = e.target.checked;
      if (e.target.classList.contains("eq-comment")) q.allowComment = e.target.checked;
      persistEditor(true);
    });
    panel.addEventListener("click", (e) => {
      if (e.target.closest("#addQuestion")) {
        editList.push({ id: "q" + Date.now().toString(36), type: "scale", text: "", required: false, allowComment: true });
        persistEditor(true);
        renderEqList();
        const last = $("eqList").lastElementChild;
        if (last) {
          last.scrollIntoView({ behavior: "smooth", block: "center" });
          last.querySelector(".eq-text").focus();
        }
        return;
      }
      if (e.target.closest("#resetQuestions")) {
        if (!confirm("Replace the questions of this course with the default questions?")) return;
        delete questionStore[qKey(lvS(), lvC())];
        save(KEYS.questions, questionStore);
        renderEditor();
        toast("Default questions restored.");
        return;
      }
      if (e.target.closest("#previewBtn")) {
        const S = lvS();
        const r = S.rounds.find((x) => roundState(x) === "open") || lvR();
        role = "student";
        document.querySelectorAll("#roleSwitch .seg-btn").forEach((b) => b.classList.toggle("on", b.dataset.role === "student"));
        $("lecturerView").hidden = true;
        $("studentView").hidden = false;
        openForm(S, lvC(), r, true);
        return;
      }
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const idx = Number(btn.closest(".eq-card").dataset.idx);
      if (btn.dataset.act === "delete") {
        if (!confirm("Delete this question? Its results are no longer shown.")) return;
        editList.splice(idx, 1);
      } else {
        const to = btn.dataset.act === "up" ? idx - 1 : idx + 1;
        [editList[idx], editList[to]] = [editList[to], editList[idx]];
      }
      persistEditor(true);
      renderEqList();
    });
  }

  // ---------- Wiring ----------
  function bindLecturer() {
    $("lvSem").addEventListener("change", (e) => {
      lv.sem = e.target.value;
      lv.round = defaultRound(lvS());
      renderLecturer();
    });
    $("lvCourse").addEventListener("change", (e) => {
      lv.course = e.target.value;
      renderLecturer();
    });
    $("lvRound").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-round]");
      if (!b) return;
      lv.round = b.dataset.round;
      renderLecturer();
    });
    document.querySelector(".tabs").addEventListener("click", (e) => {
      const t = e.target.closest(".tab");
      if (!t) return;
      lv.tab = t.dataset.tab;
      renderLecturer();
    });
  }

  $("minResp").textContent = FEEDBACK.minResponses;
  backgroundReview();
  bindTooltip();
  bindForm();
  bindEditor();
  bindLecturer();
  $("roleSwitch").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-role]");
    if (b) setRole(b.dataset.role);
  });
  $("courseList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-open]");
    if (!b) return;
    const [cid, rid] = b.dataset.open.split("|");
    openForm(CUR, CUR.sem.courses.find((c) => c.id === cid), CUR.rounds.find((r) => r.id === rid), false);
  });
  setRole(role);
  Rewards.sync();
})();
