/*
 * Study progress shared by My Semester, the Reward Shop and the menu.
 * Needs shared/semesters.js before it.
 *
 * Builds the timetable of every semester and reads the student's own ticks
 * from My Semester (mySemester.records.v2), so all pages count the same way.
 */
const StudyProgress = (() => {
  "use strict";

  const RECORDS_KEY = "mySemester.records.v2";
  const DAY_INDEX = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  const pad = (n) => String(n).padStart(2, "0");

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
  const endOfDay = (str) => {
    const d = parseDate(str);
    d.setHours(23, 59);
    return d;
  };
  const NOW = SETTINGS.today ? parseDate(SETTINGS.today) : new Date();

  // One semester: teaching weeks and every single class.
  function buildSemester(sem) {
    const semStart = parseDate(sem.start);
    const semEnd = endOfDay(sem.end);
    const breaks = (sem.breaks || []).map((b) => ({ from: parseDate(b.from), to: endOfDay(b.to) }));
    const inBreak = (d) => breaks.some((b) => d >= b.from && d <= b.to);
    const weeks = [];
    const sessions = [];
    let teach = 0;
    for (let monday = new Date(semStart); monday <= semEnd; monday = addDays(monday, 7)) {
      if (inBreak(monday) && inBreak(addDays(monday, 4))) continue;
      const week = { index: teach, monday, sessions: [] };
      sem.courses.forEach((course) => course.slots.forEach((slot) => {
        const date = addDays(monday, DAY_INDEX[slot.day] - 1);
        if (date > semEnd || inBreak(date)) return;
        const [sh, sm] = slot.start.split(":").map(Number);
        const [eh, em] = slot.end.split(":").map(Number);
        const key = `${ymd(date)}T${slot.start}`;
        const s = {
          id: `${sem.id}|${course.id}|${key}`,
          course, slot,
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), sh, sm),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), eh, em),
          week: teach,
          topic: (course.topics && course.topics[teach]) || `Week ${teach + 1}`,
          highlight: course.highlights ? course.highlights[ymd(date)] : undefined,
          missedInData: (course.missed || []).includes(key),
        };
        week.sessions.push(s);
        sessions.push(s);
      }));
      week.sessions.sort((a, b) => a.start - b.start);
      weeks.push(week);
      teach++;
    }
    sessions.sort((a, b) => a.start - b.start);
    return {
      sem, semStart, semEnd, weeks, sessions,
      assignments: sem.assignments || [],
      courseById: Object.fromEntries(sem.courses.map((c) => [c.id, c])),
    };
  }

  const BUILT = [...SEMESTERS]
    .sort((a, b) => parseDate(a.start) - parseDate(b.start))
    .map(buildSemester);
  const CURRENT = [...BUILT].reverse().find((b) => b.semStart <= NOW) || BUILT[0];

  function readRecords() {
    try {
      const r = JSON.parse(localStorage.getItem(RECORDS_KEY));
      return { att: (r && r.att) || {}, sub: (r && r.sub) || {} };
    } catch (_) {
      return { att: {}, sub: {} };
    }
  }

  /*
   * Counts across all semesters plus streaks of the current semester.
   * frozen: ids of missed classes covered by a Streak Freeze. They neither break
   * nor extend the attendance streak.
   */
  function compute(frozen) {
    const rec = readRecords();
    const freeze = new Set(frozen || []);
    const attendedOf = (s) => (s.id in rec.att ? !!rec.att[s.id] : !s.missedInData);
    const submittedOf = (a) => {
      const v = a.id in rec.sub ? rec.sub[a.id] : a.submitted;
      return v ? parseDate(v) : null;
    };

    const life = { attended: 0, held: 0, onTime: 0, late: 0 };
    BUILT.forEach((B) => {
      B.sessions.forEach((s) => {
        if (s.start > NOW) return;
        life.held++;
        if (attendedOf(s)) life.attended++;
      });
      B.assignments.forEach((a) => {
        const at = submittedOf(a);
        if (!at) return;
        if (at <= parseDate(a.due)) life.onTime++;
        else life.late++;
      });
    });

    // Attendance streak in the current semester
    let run = 0;
    let best = 0;
    let lastMissed = null;
    CURRENT.sessions.filter((s) => s.start <= NOW).forEach((s) => {
      if (attendedOf(s)) run++;
      else if (freeze.has(s.id)) { /* covered: the streak goes on */ }
      else {
        run = 0;
        lastMissed = s;
      }
      best = Math.max(best, run);
    });

    // On-time submission streak in the current semester (open ones are skipped)
    let subRun = 0;
    let subBest = 0;
    [...CURRENT.assignments]
      .sort((a, b) => parseDate(a.due) - parseDate(b.due))
      .forEach((a) => {
        const at = submittedOf(a);
        const due = parseDate(a.due);
        if (!at && due > NOW) return;
        if (at && at <= due) subRun++;
        else subRun = 0;
        subBest = Math.max(subBest, subRun);
      });

    return {
      lifetime: life,
      current: {
        semId: CURRENT.sem.id,
        semName: CURRENT.sem.name,
        streak: run,
        bestStreak: best,
        lastMissed,
        subStreak: subRun,
        bestSubStreak: subBest,
      },
    };
  }

  return { parseDate, ymd, addDays, endOfDay, NOW, buildSemester, semesters: BUILT, current: CURRENT, compute };
})();
