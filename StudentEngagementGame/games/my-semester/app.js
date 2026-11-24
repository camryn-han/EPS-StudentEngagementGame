(() => {
  "use strict";

  const STORE_KEY = "mySemester.records.v2";
  const DAY_MS = 86400000;
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const IMPORTANCE = ["", "Light", "Normal", "Useful", "Important", "Key session"];
  const SOON_DAYS = 5; // open assignments due in fewer days than this are shown in yellow
  const STATUS_FILTERS = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "done", label: "Handed in" },
    { id: "missed", label: "Not handed in" },
  ];

  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  // ---------- Dates ----------
  function parseDate(str) {
    const [d, t = "00:00"] = str.split("T");
    const [y, m, day] = d.split("-").map(Number);
    const [hh, mm] = t.split(":").map(Number);
    return new Date(y, m - 1, day, hh, mm);
  }
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isoMinute = (d) => `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shortDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const endOfDay = (str) => {
    const d = parseDate(str);
    d.setHours(23, 59);
    return d;
  };

  const NOW = SETTINGS.today ? parseDate(SETTINGS.today) : new Date();
  const daysFromNow = (d) => Math.round((startOfDay(d) - startOfDay(NOW)) / DAY_MS);

  function dayLabel(d) {
    const diff = daysFromNow(d);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff > 1 && diff < 7) return WEEKDAYS[d.getDay()];
    const year = d.getFullYear() !== NOW.getFullYear() ? ` ${d.getFullYear()}` : "";
    return `${WEEKDAYS[d.getDay()].slice(0, 3)} ${shortDate(d)}${year}`;
  }
  function inDays(d) {
    const diff = daysFromNow(d);
    if (diff <= 0) return "today";
    if (diff === 1) return "tomorrow";
    return `in ${diff} days`;
  }

  // ---------- Saved records (the student's own ticks) ----------
  let records = { att: {}, sub: {}, coffee: STUDENT.coffeeSoFar || 0 };
  function loadRecords() {
    try {
      const r = JSON.parse(localStorage.getItem(STORE_KEY));
      if (r && typeof r === "object") {
        records.att = r.att && typeof r.att === "object" ? r.att : {};
        records.sub = r.sub && typeof r.sub === "object" ? r.sub : {};
        if (typeof r.coffee === "number") records.coffee = Math.max(0, Math.floor(r.coffee));
      }
    } catch (_) { /* storage unavailable: use sample data only */ }
  }
  function saveRecords() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(records)); } catch (_) { /* ignore */ }
    Rewards.sync(); // stars and streak notifications
  }

  // ---------- Every semester's timetable (built in shared/progress.js) ----------
  const BUILT = StudyProgress.semesters;
  const byId = Object.fromEntries(BUILT.map((b) => [b.sem.id, b]));
  // Current semester: the latest one that has already started.
  const CUR = [...BUILT].reverse().find((b) => b.semStart <= NOW) || BUILT[0];

  const isPast = (s) => s.start <= NOW;
  function attended(s) {
    if (!isPast(s)) return null;
    return s.id in records.att ? !!records.att[s.id] : !s.missedInData;
  }
  function submittedAt(a) {
    const v = a.id in records.sub ? records.sub[a.id] : a.submitted;
    return v ? parseDate(v) : null;
  }
  const gradedTag = (a, short) => a.graded
    ? `<span class="graded-tag" title="Counts toward the final grade"><span aria-hidden="true">🎓</span> Graded${
      !short && a.gradeShare ? ` · ${a.gradeShare}% of grade` : ""}</span>`
    : "";
  const courseBadge = (c) =>
    `<span class="badge" title="${esc(c.name)}"><span class="ci" aria-hidden="true">${c.icon || ""}</span>${esc(c.code)}</span>`;

  // ---------- Statistics (current semester) ----------
  function computeStats(B) {
    const held = B.sessions.filter(isPast);
    const att = held.filter(attended);
    const s = {};
    s.held = held.length;
    s.attended = att.length;
    s.total = B.sessions.length;
    s.remaining = s.total - s.held;
    s.attendanceRate = s.held ? Math.round((s.attended / s.held) * 100) : 0;
    s.bestPossible = s.total ? Math.round(((s.attended + s.remaining) / s.total) * 100) : 0;

    let run = 0;
    s.bestStreak = 0;
    held.forEach((x) => {
      run = attended(x) ? run + 1 : 0;
      s.bestStreak = Math.max(s.bestStreak, run);
    });
    s.currentStreak = run;

    const recent = held.filter((x) => NOW - x.start <= 28 * DAY_MS);
    s.recentRate = recent.length ? Math.round((recent.filter(attended).length / recent.length) * 100) : null;

    s.early = att.filter((x) => x.start.getHours() < 9).length;
    s.minutes = att.reduce((sum, x) => sum + (x.end - x.start) / 60000, 0);
    s.hours = Math.round(s.minutes / 60);
    s.heartbeats = Math.round(s.minutes * (STUDENT.heartRate || 72));
    s.km = Math.round(s.attended * (STUDENT.walkKmToClass || 0) * 2 * 10) / 10;
    s.coffee = records.coffee;
    s.coffeePerClass = s.attended ? (s.coffee / s.attended).toFixed(2) : "0";

    s.attendedByCourse = {};
    s.heldByCourse = {};
    held.forEach((x) => {
      s.heldByCourse[x.course.id] = (s.heldByCourse[x.course.id] || 0) + 1;
      if (attended(x)) s.attendedByCourse[x.course.id] = (s.attendedByCourse[x.course.id] || 0) + 1;
    });
    s.fullCourses = B.sem.courses
      .filter((c) => s.heldByCourse[c.id] && s.attendedByCourse[c.id] === s.heldByCourse[c.id])
      .map((c) => c.name);

    const byDay = {};
    held.forEach((x) => {
      const d = x.start.getDay();
      byDay[d] = byDay[d] || { held: 0, att: 0 };
      byDay[d].held++;
      if (attended(x)) byDay[d].att++;
    });
    s.favouriteDay = Object.entries(byDay)
      .map(([d, v]) => ({ name: WEEKDAYS[d], rate: Math.round((v.att / v.held) * 100), held: v.held }))
      .sort((a, b) => b.rate - a.rate || b.held - a.held)[0] || null;

    const dueSoFar = B.assignments.filter((a) => parseDate(a.due) <= NOW);
    const subs = B.assignments.map((a) => ({ a, at: submittedAt(a), due: parseDate(a.due) })).filter((x) => x.at);
    s.dueSoFar = dueSoFar.length;
    s.submittedOfDue = dueSoFar.filter((a) => submittedAt(a)).length;
    s.submissionRate = s.dueSoFar ? Math.round((s.submittedOfDue / s.dueSoFar) * 100) : 100;
    s.submitted = subs.length;
    s.onTime = subs.filter((x) => x.at <= x.due).length;
    s.earlySubmissions = subs.filter((x) => x.due - x.at >= DAY_MS).length;
    s.nightOwl = subs.filter((x) => x.at.getHours() >= 22).length;
    const margins = subs.filter((x) => x.at <= x.due).map((x) => Math.round((x.due - x.at) / 60000));
    s.closestFinish = margins.length ? Math.min(...margins) : null;
    s.openCount = B.assignments.filter((a) => !submittedAt(a) && parseDate(a.due) > NOW).length;

    const currentWeek = B.weeks.findIndex((w) => NOW < addDays(w.monday, 7));
    s.week = currentWeek === -1 ? B.weeks.length : currentWeek + 1;
    s.weeksTotal = B.weeks.length;
    s.semesterProgress = Math.max(0, Math.min(100, Math.round(((NOW - B.semStart) / (B.semEnd - B.semStart)) * 100)));
    return s;
  }

  function statusWord(rate) {
    if (rate >= 90) return "Excellent";
    if (rate >= 75) return "On track";
    if (rate >= 50) return "Building up";
    return "Getting started";
  }

  // ---------- Header & KPIs ----------
  function renderHeader() {
    $("subtitle").textContent =
      `${STUDENT.name} · ${CUR.sem.name} · ${WEEKDAYS[NOW.getDay()]}, ${NOW.getDate()} ${MONTHS[NOW.getMonth()]} ${NOW.getFullYear()}`;
  }

  function meter(pct, markPct, label) {
    const mark = markPct !== undefined
      ? `<i class="mark" style="left:${markPct}%" data-tip="${esc(label)}"></i>` : "";
    return `<div class="meter" role="img" aria-label="${pct}%"><i class="fill" style="width:${pct}%"></i>${mark}</div>`;
  }

  function renderKpis(s) {
    const tiles = [
      {
        label: "Attendance",
        value: `${s.attendanceRate}%`,
        detail: `${s.attended} of ${s.held} classes`,
        meter: meter(s.attendanceRate, s.bestPossible, `Up to ${s.bestPossible}% possible by the end of the semester`),
        note: `${statusWord(s.attendanceRate)} · up to ${s.bestPossible}% possible`,
      },
      {
        label: "Submissions",
        value: `${s.submissionRate}%`,
        detail: `${s.submittedOfDue} of ${s.dueSoFar} due so far · ${s.onTime} on time`,
        meter: meter(s.submissionRate),
        note: `${statusWord(s.submissionRate)} · ${s.openCount} open`,
      },
      {
        label: "Current streak",
        value: `${s.currentStreak}<small>classes</small>`,
        detail: `in a row · longest ${s.bestStreak}`,
        meter: meter(s.bestStreak ? Math.round((s.currentStreak / s.bestStreak) * 100) : 0),
        note: s.currentStreak >= s.bestStreak && s.currentStreak > 0
          ? "Your longest run so far" : `${s.bestStreak - s.currentStreak} more to match your longest run`,
      },
      {
        label: "Semester",
        value: `Week ${Math.min(s.week, s.weeksTotal)}<small>of ${s.weeksTotal}</small>`,
        detail: `${s.semesterProgress}% of the semester done`,
        meter: meter(s.semesterProgress),
        note: `${s.total - s.held} classes ahead`,
      },
    ];
    $("kpis").innerHTML = tiles.map((t) => `
      <div class="card kpi">
        <span class="label">${t.label}</span>
        <span class="value">${t.value}</span>
        <span class="detail">${t.detail}</span>
        ${t.meter}
        <span class="note">${t.note}</span>
      </div>`).join("");
  }

  // ---------- Week chart ----------
  function weekRows(B) {
    return B.weeks.map((w) => {
      const held = w.sessions.filter(isPast);
      const att = held.filter(attended).length;
      return {
        label: `W${w.index + 1}`,
        range: `${shortDate(w.monday)} to ${shortDate(addDays(w.monday, 4))}`,
        held: held.length,
        attended: att,
        total: w.sessions.length,
        rate: held.length ? Math.round((att / held.length) * 100) : null,
        partial: held.length > 0 && held.length < w.sessions.length,
      };
    });
  }

  function renderWeekChart(s) {
    const rows = weekRows(CUR);
    const box = $("weekChart");
    const W = Math.max(280, box.clientWidth);
    const H = 200;
    const m = { top: 18, right: 4, bottom: 24, left: 34 };
    const pw = W - m.left - m.right;
    const ph = H - m.top - m.bottom;
    const band = pw / rows.length;
    const bw = Math.min(24, band * 0.62);
    const y = (v) => m.top + ph - (v / 100) * ph;
    const every = band < 26 ? 2 : 1;
    const lastIdx = rows.reduce((acc, r, i) => (r.rate !== null ? i : acc), -1);

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Attendance rate per teaching week">`;
    [0, 50, 100].forEach((v) => {
      svg += `<line class="${v === 0 ? "baseline" : "gridline"}" x1="${m.left}" x2="${W - m.right}" y1="${y(v)}" y2="${y(v)}"/>`;
      svg += `<text class="tick" x="${m.left - 6}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`;
    });
    rows.forEach((r, i) => {
      const cx = m.left + band * i + band / 2;
      const x = cx - bw / 2;
      if (r.rate !== null && r.rate > 0) {
        const top = y(r.rate);
        const rad = Math.min(4, y(0) - top);
        svg += `<path class="bar${r.partial ? " partial" : ""}" d="M${x},${y(0)} V${top + rad} Q${x},${top} ${x + rad},${top} H${x + bw - rad} Q${x + bw},${top} ${x + bw},${top + rad} V${y(0)} Z"/>`;
      } else if (r.rate === null) {
        svg += `<rect class="future" x="${x}" y="${y(0) - 2}" width="${bw}" height="2" rx="1"/>`;
      }
      if (i === lastIdx) {
        svg += `<text class="val" x="${cx}" y="${y(r.rate) - 6}" text-anchor="middle">${r.rate}%</text>`;
      }
      if (i % every === 0) {
        svg += `<text class="tick" x="${cx}" y="${H - 6}" text-anchor="middle">${r.label}</text>`;
      }
      const tip = r.rate === null
        ? `Week ${i + 1} (${r.range})\n${r.total} classes coming up`
        : `Week ${i + 1} (${r.range})\n${r.attended} of ${r.held} classes · ${r.rate}%${r.partial ? `\n${r.total - r.held} still to come this week` : ""}`;
      svg += `<rect class="hit" x="${m.left + band * i}" y="${m.top}" width="${band}" height="${ph}" tabindex="0" data-tip="${esc(tip)}"/>`;
    });
    svg += "</svg>";
    box.innerHTML = svg;

    $("weekSub").textContent = s.recentRate !== null ? `Last 4 weeks: ${s.recentRate}%` : "";
    $("weekTable").innerHTML = `<table><thead><tr><th>Week</th><th>Dates</th><th>Attended</th><th>Rate</th></tr></thead><tbody>${
      rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.range}</td><td>${r.rate === null ? "n/a" : `${r.attended} / ${r.held}`}</td><td>${r.rate === null ? "upcoming" : r.rate + "%"}</td></tr>`).join("")
    }</tbody></table>`;
  }

  // ---------- Course chart ----------
  function renderCourseChart(s) {
    const rows = CUR.sem.courses.map((c) => {
      const held = s.heldByCourse[c.id] || 0;
      const att = s.attendedByCourse[c.id] || 0;
      const due = CUR.assignments.filter((a) => a.course === c.id && parseDate(a.due) <= NOW);
      const sub = due.filter((a) => submittedAt(a)).length;
      return {
        c,
        att: held ? Math.round((att / held) * 100) : null,
        attText: `${att} of ${held} classes`,
        sub: due.length ? Math.round((sub / due.length) * 100) : null,
        subText: due.length ? `${sub} of ${due.length} due assignments` : "nothing due yet",
      };
    });
    const bar = (v, cls, tip) => v === null
      ? `<div class="c-track"><span class="c-val none" style="left:0">nothing due yet</span></div>`
      : `<div class="c-track" tabindex="0" data-tip="${esc(tip)}"><i class="c-bar ${cls}" style="width:${v}%"></i><span class="c-val" style="left:${v}%">${v}%</span></div>`;
    $("courseChart").innerHTML = rows.map((r) => `
      <div class="c-row">
        <div class="c-name"><b><span class="ci" aria-hidden="true">${r.c.icon || ""}</span>${esc(r.c.code)}</b>${esc(r.c.name)}</div>
        <div class="c-bars">
          ${bar(r.att, "b1", `${r.c.name}\nAttendance: ${r.att}% (${r.attText})`)}
          ${bar(r.sub, "b2", `${r.c.name}\nSubmissions: ${r.sub}% (${r.subText})`)}
        </div>
      </div>`).join("") +
      `<div class="c-axis"><i></i><div><span style="left:0">0%</span><span style="left:50%">50%</span><span style="left:100%">100%</span></div></div>`;

    $("courseTable").innerHTML = `<table><thead><tr><th>Course</th><th>Attendance</th><th>Submissions</th></tr></thead><tbody>${
      rows.map((r) => `<tr><td>${esc(r.c.name)}</td><td>${r.att === null ? "n/a" : `${r.att}% (${r.attText})`}</td><td>${r.sub === null ? "n/a" : `${r.sub}% (${r.subText})`}</td></tr>`).join("")
    }</tbody></table>`;
  }

  // ---------- Upcoming ----------
  function importance(sess) {
    const c = sess.course;
    let score = c.weight || 1;
    const reasons = [];
    if (c.weight >= 3) reasons.push("Core course");
    const due = CUR.assignments
      .filter((a) => a.course === c.id && !submittedAt(a))
      .map((a) => ({ a, d: parseDate(a.due) }))
      .filter((x) => x.d >= sess.start && x.d - sess.start <= 7 * DAY_MS)
      .sort((p, q) => p.d - q.d)[0];
    if (due) {
      // A graded deadline counts one step more than a practice one.
      score += due.a.graded ? 2 : 1;
      const dl = dayLabel(due.d);
      reasons.push(`${due.a.graded ? "🎓 Graded: " : ""}${due.a.title.split(":")[0]} due ${/^(Today|Tomorrow)$/.test(dl) ? dl.toLowerCase() : dl}`);
    }
    if (c.exam) {
      const days = (parseDate(c.exam) - sess.start) / DAY_MS;
      if (days >= 0 && days <= 28) {
        score++;
        const w = Math.max(1, Math.round(days / 7));
        reasons.push(`Exam in ${w} week${w === 1 ? "" : "s"}`);
      }
    }
    if (sess.highlight) {
      score += 2;
      reasons.push(sess.highlight);
    }
    return { level: Math.max(1, Math.min(5, score)), reasons };
  }

  function renderUpcoming() {
    const next = CUR.sessions.filter((x) => x.end > NOW).slice(0, 6);
    if (!next.length) {
      $("upcoming").innerHTML = `<li class="muted">No more classes this semester.</li>`;
      return;
    }
    $("upcoming").innerHTML = next.map((x) => {
      const imp = importance(x);
      const live = x.start <= NOW;
      const segs = [1, 2, 3, 4, 5].map((n) => `<i class="${n <= imp.level ? "on" : ""}"></i>`).join("");
      return `<li class="up">
        <div class="up-when"><b>${live ? '<span class="now-tag">Now</span>' : dayLabel(x.start)}</b><span>${hm(x.start)} to ${hm(x.end)}</span></div>
        <div class="up-what">
          <div class="title">${courseBadge(x.course)}${esc(x.topic)}</div>
          <div class="meta">${esc(x.course.name)} · ${esc(x.slot.type)} · ${esc(x.slot.room)}</div>
          ${imp.reasons.length ? `<div class="reasons">${imp.reasons.map((r) => `<span class="reason">${esc(r)}</span>`).join("")}</div>` : ""}
        </div>
        <div class="imp" data-tip="Importance ${imp.level} of 5" tabindex="0">
          <div class="imp-meter" role="img" aria-label="Importance ${imp.level} of 5">${segs}</div>
          <span class="imp-label">${IMPORTANCE[imp.level]}</span>
        </div>
      </li>`;
    }).join("");
  }

  function renderDeadlines() {
    const open = CUR.assignments
      .filter((a) => !submittedAt(a) && parseDate(a.due) > NOW)
      .sort((a, b) => parseDate(a.due) - parseDate(b.due))
      .slice(0, 5);
    $("deadlines").innerHTML = open.length ? open.map((a) => {
      const d = parseDate(a.due);
      return `<li class="${a.graded ? "graded" : ""}"><span>${courseBadge(CUR.courseById[a.course])}${esc(a.title)}${gradedTag(a, true)}</span>
        <span class="when">${dayLabel(d)}, ${hm(d)}<br>${inDays(d)}</span></li>`;
    }).join("") : `<li class="empty">Nothing open. Everything due is handed in.</li>`;
  }

  // ---------- Achievements & facts ----------
  let unlockedBefore = null;
  let factIndex = 0;

  function evalAchievements(s) {
    return ACHIEVEMENTS.map((a) => {
      let v = 0;
      try { v = Number(a.value(s)) || 0; } catch (_) { v = 0; }
      return { a, v, done: v >= a.goal };
    });
  }

  function renderAchievements(s) {
    const list = evalAchievements(s);
    const unlocked = list.filter((x) => x.done);
    const fresh = unlockedBefore ? unlocked.filter((x) => !unlockedBefore.has(x.a.id)) : [];
    $("achSub").textContent = `${unlocked.length} of ${list.length} unlocked`;

    const sorted = [...unlocked, ...list.filter((x) => !x.done).sort((p, q) => q.v / q.a.goal - p.v / p.a.goal)];
    $("achievements").innerHTML = sorted.map(({ a, v, done }) => {
      if (done) {
        let stat = "";
        try { stat = a.stat(s); } catch (_) { stat = ""; }
        return `<div class="ach${fresh.some((f) => f.a.id === a.id) ? " new" : ""}">
          <span class="icon" aria-hidden="true">${a.icon}</span>
          <h3>${esc(a.title)}</h3>
          <span class="stat">${esc(stat)}</span>
          <span></span>
          <p class="fact"><b>Fun fact:</b> ${esc(a.fact)}</p>
        </div>`;
      }
      const pct = Math.min(100, Math.round((v / a.goal) * 100));
      const shown = Number.isInteger(v) ? v : v.toFixed(1);
      return `<div class="ach locked">
        <span class="icon" aria-hidden="true">${a.icon}</span>
        <h3>${esc(a.title)}</h3>
        <span class="stat">${esc(a.how)}</span>
        <div class="prog">${meter(pct)}<span>${a.unit === "%" ? `${shown}% of ${a.goal}%` : `${shown} of ${a.goal} ${esc(a.unit)}`}</span></div>
      </div>`;
    }).join("");

    if (fresh.length) toast(`Achievement unlocked: ${fresh[0].a.icon} ${fresh[0].a.title}`);
    unlockedBefore = new Set(unlocked.map((x) => x.a.id));
    return unlocked;
  }

  function renderFact(unlocked) {
    if (!unlocked.length) {
      $("factText").textContent = "Unlock an achievement to reveal your first fun fact.";
      $("factFrom").textContent = "";
      return;
    }
    const pick = unlocked[factIndex % unlocked.length].a;
    $("factText").textContent = pick.fact;
    $("factFrom").textContent = `From “${pick.title}”`;
  }

  function renderNumbers(s) {
    const items = [
      ["Time in class", `${s.hours} h`],
      ["Heartbeats in class", `≈ ${s.heartbeats.toLocaleString("en-US")}`],
      ["Walked to class", `≈ ${s.km} km`],
      ["Coffee per class", `${s.coffeePerClass} ☕`],
      ["Classes before 9:00", `${s.early}`],
      ["Best weekday", s.favouriteDay ? `${s.favouriteDay.name} (${s.favouriteDay.rate}%)` : "n/a"],
    ];
    $("numbers").innerHTML = items.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    $("coffeeCount").textContent = records.coffee;
  }

  // ---------- Filters ----------
  const view = {
    recSem: CUR.sem.id,
    asSem: CUR.sem.id,
    asCourse: "all",
    asStatus: "all",
    asType: "all",
  };
  const TYPE_FILTERS = [
    { id: "all", label: "All types" },
    { id: "graded", label: "🎓 Graded" },
    { id: "practice", label: "Not graded" },
  ];
  const matchesType = (a) =>
    view.asType === "all" || (view.asType === "graded" ? !!a.graded : !a.graded);

  function fillSemesterSelect(sel, value) {
    sel.innerHTML = [...BUILT].reverse().map((b) =>
      `<option value="${esc(b.sem.id)}"${b.sem.id === value ? " selected" : ""}>${esc(b.sem.name)}${b === CUR ? " (current)" : ""}</option>`
    ).join("");
  }

  // ---------- Attendance records ----------
  function renderRecords() {
    const B = byId[view.recSem];
    const todayKey = ymd(NOW);
    const held = B.sessions.filter(isPast);
    const att = held.filter(attended).length;
    $("recSummary").textContent = held.length
      ? `${att} of ${held.length} classes attended (${Math.round((att / held.length) * 100)}%)${B.sessions.length > held.length ? ` · ${B.sessions.length - held.length} still to come` : ""}`
      : "This semester has not started yet.";

    $("records").innerHTML = B.sem.courses.map((c) => {
      let lastWeek = -1;
      const mine = B.sessions.filter((x) => x.course === c);
      const mineHeld = mine.filter(isPast);
      const mineAtt = mineHeld.filter(attended).length;
      const cells = mine.map((x) => {
        const weekStart = x.week !== lastWeek;
        lastWeek = x.week;
        const a = attended(x);
        const cls = a === null ? "future" : a ? "attended" : "missed";
        const today = ymd(x.start) === todayKey ? " today" : "";
        const label = `${WEEKDAYS[x.start.getDay()].slice(0, 3)} ${shortDate(x.start)} ${x.start.getFullYear()}, ${hm(x.start)} · ${x.slot.type}\n${x.topic}\n${a === null ? "Upcoming" : a ? "Attended. Click to change." : "Not attended. Click to change."}`;
        const common = `class="rc ${cls}${weekStart ? " week-start" : ""}${today}" data-tip="${esc(label)}"`;
        return a === null
          ? `<span ${common} aria-label="${esc(label)}"></span>`
          : `<button type="button" ${common} data-session="${esc(x.id)}" aria-pressed="${a}" aria-label="${esc(label)}"></button>`;
      }).join("");
      const rate = mineHeld.length ? `${Math.round((mineAtt / mineHeld.length) * 100)}%` : "";
      return `<div class="r-row">${courseBadge(c)}<div class="r-cells">${cells}</div><span class="r-rate">${rate}</span></div>`;
    }).join("");
  }

  // ---------- Assignments ----------
  function assignmentStatus(a) {
    const due = parseDate(a.due);
    const at = submittedAt(a);
    if (at) return { key: "done", label: at <= due ? "On time" : "Handed in", icon: "✓" };
    if (due > NOW) {
      const d = daysFromNow(due);
      const label = d <= 0 ? "Due today" : d === 1 ? "Due tomorrow" : `Due in ${d} days`;
      return { key: "open", label, icon: "○", soon: d < SOON_DAYS };
    }
    return { key: "missed", label: "Not handed in", icon: "•" };
  }

  function renderAssignmentFilters() {
    const B = byId[view.asSem];
    if (view.asCourse !== "all" && !B.courseById[view.asCourse]) view.asCourse = "all";
    const count = (pred) => B.assignments.filter(pred).length;

    const chip = (id, label, n, icon) =>
      `<button type="button" class="chip${view.asCourse === id ? " on" : ""}" data-course="${esc(id)}" aria-pressed="${view.asCourse === id}">
        ${icon ? `<span class="ci" aria-hidden="true">${icon}</span>` : ""}${esc(label)}<span class="n">${n}</span></button>`;
    $("asCourses").innerHTML = chip("all", "All courses", B.assignments.length) +
      B.sem.courses.map((c) => chip(c.id, c.code, count((a) => a.course === c.id), c.icon)).join("");

    const inCourse = (a) => view.asCourse === "all" || a.course === view.asCourse;
    const inStatus = (a) => view.asStatus === "all" || assignmentStatus(a).key === view.asStatus;
    $("asStatus").innerHTML = STATUS_FILTERS.map((f) => {
      const n = count((a) => inCourse(a) && matchesType(a) && (f.id === "all" || assignmentStatus(a).key === f.id));
      return `<button type="button" class="seg-btn${view.asStatus === f.id ? " on" : ""}" data-status="${f.id}" aria-pressed="${view.asStatus === f.id}">${f.label} <span class="n">${n}</span></button>`;
    }).join("");
    $("asType").innerHTML = TYPE_FILTERS.map((f) => {
      const n = count((a) => inCourse(a) && inStatus(a) &&
        (f.id === "all" || (f.id === "graded" ? !!a.graded : !a.graded)));
      return `<button type="button" class="seg-btn${view.asType === f.id ? " on" : ""}" data-type="${f.id}" aria-pressed="${view.asType === f.id}">${f.label} <span class="n">${n}</span></button>`;
    }).join("");
  }

  function renderAssignments() {
    renderAssignmentFilters();
    const B = byId[view.asSem];
    const items = B.assignments
      .filter((a) => (view.asCourse === "all" || a.course === view.asCourse) && matchesType(a))
      .map((a) => ({ a, st: assignmentStatus(a), due: parseDate(a.due) }))
      .filter((x) => view.asStatus === "all" || x.st.key === view.asStatus);

    const done = items.filter((x) => x.st.key === "done").length;
    const closed = items.filter((x) => x.st.key !== "open").length;
    const graded = items.filter((x) => x.a.graded).length;
    $("asSummary").textContent = items.length
      ? `${items.length} shown · ${done} of ${closed} due handed in · ${items.length - closed} open · ${graded} graded`
      : "";

    const groups = [
      { key: "open", title: "Open", list: items.filter((x) => x.st.key === "open").sort((p, q) => p.due - q.due) },
      { key: "done", title: "Handed in", list: items.filter((x) => x.st.key === "done").sort((p, q) => q.due - p.due) },
      { key: "missed", title: "Not handed in", list: items.filter((x) => x.st.key === "missed").sort((p, q) => q.due - p.due) },
    ].filter((g) => g.list.length);

    if (!groups.length) {
      $("assignments").innerHTML = `<p class="as-empty">No assignments match these filters.</p>`;
      return;
    }
    $("assignments").innerHTML = groups.map((g) => `
      <div class="as-group">
        <h4 class="as-group-h">${g.title} <span class="n">${g.list.length}</span></h4>
        ${g.list.map(({ a, st, due }) => {
          const c = B.courseById[a.course];
          const at = submittedAt(a);
          const when = at
            ? `Handed in ${shortDate(at)}, ${hm(at)}`
            : `Due ${dayLabel(due).replace(/^(Today|Tomorrow)$/, (w) => w.toLowerCase())}, ${hm(due)}`;
          return `<div class="as-item ${st.key}${st.soon ? " soon" : ""}${a.graded ? " graded" : ""}">
            <span class="as-icon" aria-hidden="true">${c.icon || "📄"}</span>
            <div class="as-main">
              <div class="as-title">${esc(a.title)}${gradedTag(a)}</div>
              <div class="as-meta">${esc(c.code)} · ${esc(c.name)} · ${when}</div>
            </div>
            <span class="pill ${st.key}${st.soon ? " soon" : ""}"><span aria-hidden="true">${st.icon}</span> ${st.label}</span>
            <button type="button" class="as-check" data-assignment="${esc(a.id)}" aria-pressed="${!!at}"
              aria-label="${at ? "Mark as not handed in" : "Mark as handed in"}: ${esc(a.title)}"
              data-tip="${at ? "Mark as not handed in" : "Mark as handed in"}">✓</button>
          </div>`;
        }).join("")}
      </div>`).join("");
  }

  // ---------- Toast & tooltip ----------
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
      const left = Math.min(window.innerWidth - r.width - 8, Math.max(8, x - r.width / 2));
      const top = y - r.height - 12 < 8 ? y + 16 : y - r.height - 12;
      tip.style.left = left + "px";
      tip.style.top = top + "px";
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

  // ---------- Render all ----------
  let lastStats = null;
  function renderAll() {
    const s = computeStats(CUR);
    lastStats = s;
    renderHeader();
    renderKpis(s);
    renderWeekChart(s);
    renderCourseChart(s);
    renderUpcoming();
    renderDeadlines();
    const unlocked = renderAchievements(s);
    renderFact(unlocked);
    renderNumbers(s);
    renderRecords();
    renderAssignments();
  }

  function refocus(selector) {
    const el = document.querySelector(selector);
    if (el) el.focus();
  }

  function bindEvents() {
    fillSemesterSelect($("recSem"), view.recSem);
    fillSemesterSelect($("asSem"), view.asSem);
    $("recSem").addEventListener("change", (e) => {
      view.recSem = e.target.value;
      renderRecords();
    });
    $("asSem").addEventListener("change", (e) => {
      view.asSem = e.target.value;
      view.asCourse = "all";
      renderAssignments();
      $("assignments").scrollTop = 0;
    });
    $("asCourses").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-course]");
      if (!b) return;
      view.asCourse = b.dataset.course;
      renderAssignments();
      refocus(`#asCourses button[data-course="${CSS.escape(view.asCourse)}"]`);
    });
    $("asStatus").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-status]");
      if (!b) return;
      view.asStatus = b.dataset.status;
      renderAssignments();
      refocus(`#asStatus button[data-status="${view.asStatus}"]`);
    });
    $("asType").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-type]");
      if (!b) return;
      view.asType = b.dataset.type;
      renderAssignments();
      refocus(`#asType button[data-type="${view.asType}"]`);
    });

    $("records").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-session]");
      if (!b) return;
      const sess = byId[view.recSem].sessions.find((x) => x.id === b.dataset.session);
      records.att[sess.id] = !attended(sess);
      saveRecords();
      renderAll();
      refocus(`button[data-session="${CSS.escape(sess.id)}"]`);
    });
    $("assignments").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-assignment]");
      if (!b) return;
      const a = byId[view.asSem].assignments.find((x) => x.id === b.dataset.assignment);
      const due = parseDate(a.due);
      // Ticking counts as handed in now, or at the deadline if that has already passed.
      records.sub[a.id] = submittedAt(a) ? null : isoMinute(NOW < due ? NOW : due);
      saveRecords();
      const box = $("assignments");
      const keep = box.scrollTop;
      renderAll();
      box.scrollTop = keep;
      refocus(`button[data-assignment="${CSS.escape(a.id)}"]`);
    });
    $("coffeePlus").addEventListener("click", () => {
      records.coffee++;
      saveRecords();
      renderAll();
    });
    $("coffeeMinus").addEventListener("click", () => {
      records.coffee = Math.max(0, records.coffee - 1);
      saveRecords();
      renderAll();
    });
    $("factNext").addEventListener("click", () => {
      factIndex++;
      renderFact(evalAchievements(lastStats).filter((x) => x.done));
    });
    $("resetBtn").addEventListener("click", () => {
      if (!confirm("Remove your own ticks and coffee count and go back to the sample data?")) return;
      records = { att: {}, sub: {}, coffee: STUDENT.coffeeSoFar || 0 };
      try { localStorage.removeItem(STORE_KEY); } catch (_) { /* ignore */ }
      renderAll();
    });
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => renderWeekChart(lastStats), 120);
    });
  }

  loadRecords();
  factIndex = Math.floor(NOW / DAY_MS); // a different fact each day
  bindTooltip();
  bindEvents();
  renderAll();
  Rewards.sync();
})();
