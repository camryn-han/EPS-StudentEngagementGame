(() => {
  "use strict";

  // ---------- Constants ----------
  const DIRS = {
    up:    { dr: -1, dc:  0, sym: "↑" },
    down:  { dr:  1, dc:  0, sym: "↓" },
    left:  { dr:  0, dc: -1, sym: "←" },
    right: { dr:  0, dc:  1, sym: "→" },
  };
  const KEY_TO_DIR = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
  };
  const POINTS_CORRECT = 100;
  const POINTS_WRONG = -25;
  const POINTS_GOAL = 200;
  const SPEED_MS = [0, 650, 450, 300, 180, 90]; // index = slider value

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const boardEl = $("board");
  const programEl = $("program");
  const scoreEl = $("score");
  const toastEl = $("toast");
  const qModal = $("qModal");
  const winModal = $("winModal");

  // ---------- State ----------
  let score = 0;
  let soundOn = true;
  let deck = [];            // shuffled question indices
  let S = null;             // current level state
  let robotEl = null;
  let activeQuestion = null;

  // ---------- Helpers ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = (r, c) => r + "," + c;
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  // ---------- Sound (tiny WebAudio beeps) ----------
  let audioCtx = null;
  function tone(freq, dur = 0.08, type = "square", vol = 0.05, delay = 0) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime + delay;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (_) { /* audio not available */ }
  }
  const sfx = {
    add:     () => tone(660, 0.04, "square", 0.03),
    move:    () => tone(420, 0.05, "triangle", 0.06),
    bump:    () => tone(110, 0.18, "sawtooth", 0.06),
    correct: () => { tone(523, 0.1, "triangle", 0.08); tone(659, 0.1, "triangle", 0.08, 0.1); tone(784, 0.16, "triangle", 0.08, 0.2); },
    wrong:   () => { tone(300, 0.15, "sawtooth", 0.05); tone(200, 0.25, "sawtooth", 0.05, 0.15); },
    unlock:  () => { tone(880, 0.06, "square", 0.04); tone(1320, 0.1, "square", 0.04, 0.07); },
    win:     () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.08, i * 0.11)),
  };

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(msg, kind = "") {
    toastEl.textContent = msg;
    toastEl.className = "toast show " + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.className = "toast " + kind), 2600);
  }

  // ---------- Score ----------
  function addScore(delta) {
    score = Math.max(0, score + delta);
    scoreEl.textContent = score;
    scoreEl.classList.remove("bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("bump");
    if (delta > 0) {
      if (S) S.coinsEarned += delta;
      addCoins(delta);
    }
  }

  // ---------- Coins and skins (shared wallet in shared/rewards.js) ----------
  // Skins are bought in the Reward Shop. Robo Maze only earns coins and shows the equipped skin.
  const ownsSkin = (id) => id === "classic" || Rewards.owns("maze:" + id);

  function affordableNewSkins() {
    return SKINS.filter((s) => !ownsSkin(s.id) && s.price <= Rewards.coins());
  }

  function updateCoins(animate = false) {
    $("coins").textContent = Rewards.coins();
    $("shopBtn").classList.toggle("has-new", affordableNewSkins().length > 0);
    if (animate) {
      const badge = $("coinsBadge");
      badge.classList.remove("bump");
      void badge.offsetWidth;
      badge.classList.add("bump");
    }
  }

  function addCoins(n) {
    const before = affordableNewSkins().map((s) => s.id);
    Rewards.earnCoins(n);
    updateCoins(true);
    const fresh = affordableNewSkins().filter((s) => !before.includes(s.id));
    if (fresh.length) {
      setTimeout(() => toast(`🛒 You can now afford "${fresh[0].name}" in the Reward Shop.`, "good"), 900);
    }
  }

  // ---------- Skins ----------
  function currentSkin() {
    const id = Rewards.equipped("maze");
    return (ownsSkin(id) && SKINS.find((s) => s.id === id)) || SKINS[0];
  }

  function applySkin() {
    const skin = currentSkin();
    document.documentElement.dataset.skin = skin.id;
    $("legendLock").textContent = skin.lock;
    $("legendGoal").textContent = skin.goal;
    if (S) {
      for (let r = 0; r < S.rows; r++) {
        for (let c = 0; c < S.cols; c++) decorateCell(cellEl(r, c), r, c);
      }
      markReachableLocks();
    }
  }

  // ---------- Questions ----------
  function drawQuestion() {
    if (deck.length === 0) deck = shuffle(QUESTIONS.map((_, i) => i));
    return deck.pop();
  }

  // ---------- Level loading ----------
  function loadLevel(index) {
    const L = LEVELS[index];
    const grid = L.map.map((row) => row.split(""));
    let start = null;
    let goal = null;
    grid.forEach((row, r) => row.forEach((ch, c) => {
      if (ch === "S") { start = { r, c }; grid[r][c] = "."; }
      if (ch === "G") { goal = { r, c }; grid[r][c] = "."; }
    }));

    S = {
      index,
      grid,
      rows: grid.length,
      cols: grid[0].length,
      start,
      goal,
      robot: { r: start.r, c: start.c, dir: "right" },
      program: [],
      pc: 0,
      errorAt: -1,
      running: false,
      finished: false,
      steps: 0,
      correct: 0,
      wrong: 0,
      scoreAtStart: score,
      coinsEarned: 0,
      tileQuestion: {},       // "r,c" -> question index (kept if the player skips)
      visited: new Set([key(start.r, start.c)]),
    };

    $("levelName").textContent = `Level ${index + 1}: ${L.name}`;
    $("levelHint").textContent = L.hint || "";
    $("levelSelect").value = String(index);

    buildBoard();
    renderProgram();
    updateStats();
  }

  function cellType(r, c) {
    if (r < 0 || c < 0 || r >= S.rows || c >= S.cols) return "#";
    return S.grid[r][c];
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    boardEl.style.setProperty("--cols", S.cols);
    fitBoard();

    for (let r = 0; r < S.rows; r++) {
      for (let c = 0; c < S.cols; c++) {
        const el = document.createElement("div");
        el.dataset.r = r;
        el.dataset.c = c;
        decorateCell(el, r, c);
        boardEl.appendChild(el);
      }
    }

    robotEl = document.createElement("div");
    robotEl.className = "robot";
    robotEl.innerHTML = '<div class="bot"><div class="face"><i class="eye"></i><i class="eye"></i></div></div>';
    boardEl.appendChild(robotEl);
    placeRobot(true);
  }

  function cellEl(r, c) {
    return boardEl.children[r * S.cols + c];
  }

  function decorateCell(el, r, c) {
    paintCell(el, S.grid[r][c], r, c, currentSkin(), {
      isStart: r === S.start.r && c === S.start.c,
      isGoal: r === S.goal.r && c === S.goal.c,
      visited: S.visited.has(key(r, c)),
      seed: S.index,
    });
  }

  /** Draws one tile in the look of `skin` (used for the maze and the shop previews). */
  function paintCell(el, t, r, c, skin, o) {
    el.className = "cell";
    el.innerHTML = "";
    el.removeAttribute("title");
    if (t === "#") {
      el.classList.add("wall");
    } else if (t === "L") {
      el.classList.add("lock");
      el.innerHTML = `<span>${skin.lock}</span>`;
      el.title = "Locked tile";
    } else {
      el.classList.add("floor");
      if ((r + c) % 2) el.classList.add("alt");
      if (o.isGoal) {
        el.classList.add("goal");
        el.innerHTML = `<span>${skin.goal}</span>`;
      } else if (o.isStart) {
        el.classList.add("start");
      } else {
        if (o.visited) el.classList.add("visited");
        if (skin.decor && skin.decor.length && (r * 7 + c * 13 + o.seed * 5) % 6 === 0) {
          const d = skin.decor[(r * 3 + c + o.seed) % skin.decor.length];
          el.innerHTML = `<span class="decor">${d}</span>`;
        }
      }
    }
  }

  function fitBoard() {
    const area = boardEl.closest(".board-area");
    const maxW = Math.max(240, area.clientWidth - 24);
    const maxH = Math.max(260, window.innerHeight - 260);
    const size = Math.floor(Math.min(maxW / S.cols, maxH / S.rows, 64));
    boardEl.style.setProperty("--cell", Math.max(26, size) + "px");
  }

  function placeRobot(instant = false) {
    if (instant) robotEl.style.transition = "none";
    robotEl.style.setProperty("--r", S.robot.r);
    robotEl.style.setProperty("--c", S.robot.c);
    robotEl.dataset.dir = S.robot.dir;
    if (instant) {
      void robotEl.offsetWidth;
      robotEl.style.transition = "";
    }
    markReachableLocks();
  }

  function markReachableLocks() {
    boardEl.querySelectorAll(".cell.lock").forEach((el) => {
      const r = +el.dataset.r;
      const c = +el.dataset.c;
      const adjacent = Math.abs(r - S.robot.r) + Math.abs(c - S.robot.c) === 1;
      el.classList.toggle("reachable", adjacent);
      el.title = adjacent ? "Click to answer a question and unlock" : "Locked. Move the robot next to it first";
    });
  }

  // ---------- Stats ----------
  function updateStats() {
    $("statSteps").textContent = S.steps;
    $("statCorrect").textContent = S.correct;
    $("statWrong").textContent = S.wrong;
    $("statLocks").textContent = S.grid.flat().filter((t) => t === "L").length;
    scoreEl.textContent = score;
  }

  // ---------- Program ----------
  function renderProgram() {
    programEl.innerHTML = "";
    S.program.forEach((dir, i) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.innerHTML = `${DIRS[dir].sym}<span class="num">${i + 1}</span>`;
      if (i < S.pc) chip.classList.add("done");
      if (i === S.errorAt) chip.classList.add("error");
      chip.title = i < S.pc ? "Already executed" : "Click to remove";
      chip.addEventListener("click", () => removeAction(i));
      programEl.appendChild(chip);
    });
    const pending = S.program.length - S.pc;
    $("programInfo").textContent =
      S.program.length === 0 ? "empty" : `${pending} to run · ${S.pc} done`;
    programEl.scrollTop = programEl.scrollHeight;
    updateButtons();
  }

  function highlightChip(i) {
    [...programEl.children].forEach((ch, j) => ch.classList.toggle("current", j === i));
    const chip = programEl.children[i];
    if (chip) chip.scrollIntoView({ block: "nearest" });
  }

  function updateButtons() {
    const busy = S.running || S.finished;
    const pending = S.program.length - S.pc;
    $("runBtn").disabled = busy || pending === 0;
    $("stepBtn").disabled = busy || pending === 0;
    $("undoBtn").disabled = busy || pending === 0;
    $("clearBtn").disabled = busy || S.program.length === 0;
    $("resetBtn").disabled = S.running || S.finished;
    document.querySelectorAll(".dir-btn").forEach((b) => (b.disabled = busy));
  }

  function addAction(dir) {
    if (S.running || S.finished || isModalOpen()) return;
    const btn = document.querySelector(`.dir-btn[data-dir="${dir}"]`);
    if (btn) {
      btn.classList.add("pressed");
      setTimeout(() => btn.classList.remove("pressed"), 120);
    }
    S.program.push(dir);
    S.errorAt = -1;
    sfx.add();
    renderProgram();
    if ($("instantMode").checked) run();
  }

  function removeAction(i) {
    if (S.running || i < S.pc) return;
    S.program.splice(i, 1);
    S.errorAt = -1;
    renderProgram();
  }

  function undoAction() {
    if (S.running || S.program.length <= S.pc) return;
    S.program.pop();
    S.errorAt = -1;
    renderProgram();
  }

  function clearProgram() {
    if (S.running) return;
    S.program = [];
    S.pc = 0;
    S.errorAt = -1;
    renderProgram();
  }

  function resetRobot() {
    if (S.running || S.finished) return;
    S.robot = { r: S.start.r, c: S.start.c, dir: "right" };
    S.pc = 0;
    S.errorAt = -1;
    placeRobot();
    renderProgram();
    toast("Robot is back at the start. Your program can run again from the beginning.");
  }

  // ---------- Execution ----------
  function moveDelay() {
    return SPEED_MS[+$("speed").value] || 300;
  }

  async function run() {
    if (S.running || S.finished || S.pc >= S.program.length) {
      if (!S.running && !S.finished && S.pc >= S.program.length) toast("Add some movement actions first.");
      return;
    }
    S.running = true;
    S.errorAt = -1;
    renderProgram();
    robotEl.style.setProperty("--move-ms", Math.min(240, moveDelay() * 0.8) + "ms");

    while (S.running && S.pc < S.program.length) {
      highlightChip(S.pc);
      const result = executeOne();
      await sleep(moveDelay());
      if (result !== "ok") break;
    }

    S.running = false;
    highlightChip(-1);
    renderProgram();
  }

  async function step() {
    if (S.running || S.finished || S.pc >= S.program.length) return;
    S.errorAt = -1;
    highlightChip(S.pc);
    S.running = true;
    updateButtons();
    executeOne();
    await sleep(Math.min(250, moveDelay()));
    S.running = false;
    highlightChip(-1);
    renderProgram();
  }

  /** Executes the instruction at S.pc. Returns "ok", "wall", "lock" or "goal". */
  function executeOne() {
    const dir = S.program[S.pc];
    const d = DIRS[dir];
    S.robot.dir = dir;
    const nr = S.robot.r + d.dr;
    const nc = S.robot.c + d.dc;
    const t = cellType(nr, nc);

    if (t === "#") {
      bumpRobot(d);
      S.errorAt = S.pc;
      toast("💥 Bonk! A wall is in the way. Remove or change the red action.", "bad");
      return "wall";
    }
    if (t === "L") {
      bumpRobot(d);
      S.errorAt = S.pc;
      const lockEl = cellEl(nr, nc);
      lockEl.classList.remove("shake");
      void lockEl.offsetWidth;
      lockEl.classList.add("shake");
      setTimeout(() => openQuestion(nr, nc), 450);
      return "lock";
    }

    S.robot.r = nr;
    S.robot.c = nc;
    S.pc++;
    S.steps++;
    sfx.move();
    placeRobot();
    if (!(nr === S.start.r && nc === S.start.c) && !(nr === S.goal.r && nc === S.goal.c)) {
      S.visited.add(key(nr, nc));
      cellEl(nr, nc).classList.add("visited");
    }
    updateStats();

    if (nr === S.goal.r && nc === S.goal.c) {
      S.finished = true;
      setTimeout(winLevel, 350);
      return "goal";
    }
    return "ok";
  }

  function bumpRobot(d) {
    placeRobot();
    sfx.bump();
    robotEl.style.setProperty("--bx", d.dc * 18 + "%");
    robotEl.style.setProperty("--by", d.dr * 18 + "%");
    robotEl.classList.remove("bump");
    void robotEl.offsetWidth;
    robotEl.classList.add("bump");
    setTimeout(() => robotEl.classList.remove("bump"), 400);
  }

  // ---------- Question dialog ----------
  function isModalOpen() {
    return !qModal.classList.contains("hidden") || !winModal.classList.contains("hidden");
  }

  function openQuestion(r, c) {
    if (S.finished || isModalOpen() || cellType(r, c) !== "L") return;
    const k = key(r, c);
    if (S.tileQuestion[k] === undefined) S.tileQuestion[k] = drawQuestion();
    const qi = S.tileQuestion[k];
    const Q = QUESTIONS[qi];

    activeQuestion = { r, c, k, Q, answered: false, wasCorrect: false };

    $("qTopic").textContent = Q.topic || "Question";
    $("qText").textContent = Q.q;
    const codeEl = $("qCode");
    if (Q.code) {
      codeEl.textContent = Q.code;
      codeEl.classList.remove("hidden");
    } else {
      codeEl.classList.add("hidden");
    }

    const optsEl = $("qOptions");
    optsEl.innerHTML = "";
    const order = shuffle(Q.options.map((_, i) => i));
    order.forEach((optIndex, pos) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "q-option";
      b.dataset.opt = optIndex;
      b.innerHTML = `<span class="key">${pos + 1}</span><span>${escapeHtml(Q.options[optIndex])}</span>`;
      b.addEventListener("click", () => answer(optIndex));
      optsEl.appendChild(b);
    });

    $("qFeedback").className = "q-feedback hidden";
    $("qContinue").classList.add("hidden");
    $("qCancel").classList.remove("hidden");
    qModal.classList.remove("hidden");
    optsEl.firstChild.focus();
  }

  function answer(optIndex) {
    const A = activeQuestion;
    if (!A || A.answered) return;
    A.answered = true;
    const correct = optIndex === A.Q.answer;
    A.wasCorrect = correct;
    Rewards.quiz(correct); // quiz streak notification and bonus coins

    [...$("qOptions").children].forEach((b) => {
      const i = +b.dataset.opt;
      b.disabled = true;
      if (i === A.Q.answer) b.classList.add("correct");
      else if (i === optIndex) b.classList.add("wrong");
      else b.classList.add("dim");
    });

    const fb = $("qFeedback");
    if (correct) {
      S.correct++;
      addScore(POINTS_CORRECT);
      sfx.correct();
      fb.className = "q-feedback good";
      fb.innerHTML = `<b>✅ Correct! +${POINTS_CORRECT}</b>${escapeHtml(A.Q.explain || "")}`;
    } else {
      S.wrong++;
      addScore(POINTS_WRONG);
      sfx.wrong();
      fb.className = "q-feedback bad";
      fb.innerHTML = `<b>❌ Not quite. ${POINTS_WRONG}</b>${escapeHtml(A.Q.explain || "")}<br><span class="muted">The tile stays locked. Try again for a new question.</span>`;
    }
    // A new question is drawn next time this tile is opened.
    delete S.tileQuestion[A.k];
    updateStats();

    $("qCancel").classList.add("hidden");
    const cont = $("qContinue");
    cont.textContent = correct ? "Unlock tile 🔓" : "Continue";
    cont.classList.remove("hidden");
    cont.focus();
  }

  function closeQuestion() {
    const A = activeQuestion;
    qModal.classList.add("hidden");
    activeQuestion = null;
    if (A && A.wasCorrect) unlockTile(A.r, A.c);
  }

  function unlockTile(r, c) {
    S.grid[r][c] = ".";
    const el = cellEl(r, c);
    decorateCell(el, r, c);
    el.classList.add("unlocking");
    setTimeout(() => el.classList.remove("unlocking"), 650);
    sfx.unlock();
    markReachableLocks();
    updateStats();
    if (S.errorAt >= 0) {
      S.errorAt = -1;
      renderProgram();
    }
    const pending = S.program.length - S.pc;
    toast(pending > 0 ? "🔓 Unlocked! Press Run to continue your program." : "🔓 Unlocked! The way is free.", "good");
  }

  // ---------- Win ----------
  function winLevel() {
    addScore(POINTS_GOAL);
    sfx.win();
    robotEl.classList.add("happy");

    const stars = S.wrong === 0 ? 3 : S.wrong <= 2 ? 2 : 1;
    $("winStars").innerHTML = [1, 2, 3]
      .map((n, i) => `<span class="${n <= stars ? "" : "off"}" style="animation-delay:${i * 0.15}s">⭐</span>`)
      .join("");

    const last = S.index === LEVELS.length - 1;
    $("winTitle").textContent = last ? "All levels complete! 🎓" : "Goal reached!";
    $("winStats").innerHTML = `
      <span>Steps</span><span>${S.steps}</span>
      <span>Correct answers</span><span>${S.correct}</span>
      <span>Wrong answers</span><span>${S.wrong}</span>
      <span>Level points</span><span>+${score - S.scoreAtStart}</span>
      <span>Total score</span><span>${score}</span>
      <span>Coins earned</span><span>💰 +${S.coinsEarned}</span>
      <span>Coins in wallet</span><span>💰 ${Rewards.coins()}</span>`;
    $("nextBtn").textContent = last ? "Play again from Level 1" : "Next level →";
    winModal.classList.remove("hidden");
    $("nextBtn").focus();
    updateButtons();
  }

  function nextLevel() {
    winModal.classList.add("hidden");
    if (S.index === LEVELS.length - 1) {
      score = 0;
      loadLevel(0);
    } else {
      loadLevel(S.index + 1);
    }
  }

  function replayLevel() {
    winModal.classList.add("hidden");
    score = S.scoreAtStart;
    loadLevel(S.index);
  }

  // ---------- Events ----------
  function bindEvents() {
    document.querySelectorAll(".dir-btn").forEach((b) =>
      b.addEventListener("click", () => addAction(b.dataset.dir)));
    $("runBtn").addEventListener("click", run);
    $("stepBtn").addEventListener("click", step);
    $("undoBtn").addEventListener("click", undoAction);
    $("clearBtn").addEventListener("click", clearProgram);
    $("resetBtn").addEventListener("click", resetRobot);
    $("qCancel").addEventListener("click", closeQuestion);
    $("qContinue").addEventListener("click", closeQuestion);
    $("nextBtn").addEventListener("click", nextLevel);
    $("replayBtn").addEventListener("click", replayLevel);


    $("soundBtn").addEventListener("click", () => {
      soundOn = !soundOn;
      $("soundBtn").textContent = soundOn ? "🔊" : "🔇";
    });

    const sel = $("levelSelect");
    LEVELS.forEach((L, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = `${i + 1}. ${L.name}`;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => {
      if (S.running) { sel.value = S.index; return; }
      winModal.classList.add("hidden");
      score = S.finished ? score : S.scoreAtStart;
      loadLevel(+sel.value);
      sel.blur();
    });

    boardEl.addEventListener("click", (e) => {
      const cell = e.target.closest(".cell");
      if (!cell || !cell.classList.contains("lock") || S.running) return;
      const r = +cell.dataset.r;
      const c = +cell.dataset.c;
      if (Math.abs(r - S.robot.r) + Math.abs(c - S.robot.c) !== 1) {
        cell.classList.remove("shake");
        void cell.offsetWidth;
        cell.classList.add("shake");
        toast("Move the robot next to this lock first.");
        return;
      }
      openQuestion(r, c);
    });

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT" && e.target.type !== "checkbox") return;

      if (!qModal.classList.contains("hidden")) {
        const n = parseInt(e.key, 10);
        if (activeQuestion && !activeQuestion.answered && n >= 1) {
          const b = $("qOptions").children[n - 1];
          if (b) { e.preventDefault(); b.click(); }
        } else if (e.key === "Escape" && activeQuestion && !activeQuestion.answered) {
          closeQuestion();
        }
        return; // Enter/Space activate the focused button natively
      }
      if (!winModal.classList.contains("hidden")) return;

      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (KEY_TO_DIR[k]) {
        e.preventDefault();
        addAction(KEY_TO_DIR[k]);
      } else if (k === "Enter") {
        e.preventDefault();
        run();
      } else if (k === "Backspace") {
        e.preventDefault();
        undoAction();
      }
    });

    window.addEventListener("resize", () => {
      if (!S) return;
      fitBoard();
    });
  }

  // ---------- Start ----------
  bindEvents();
  applySkin();
  updateCoins();
  loadLevel(0);
})();
