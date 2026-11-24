/*
 * Achievements for "My Semester".
 *
 * Each achievement unlocks a fun fact. The facts are just interesting to know.
 * They have nothing to do with grades or progress.
 *
 *   id      unique name
 *   icon    emoji (Emoji 12 or older, so Windows 10 can show it)
 *   title   short name
 *   how     how to unlock it (shown while locked)
 *   goal    number to reach
 *   value   function(s) -> current number (see the list of `s` fields below)
 *   unit    word shown with the progress, e.g. "classes"
 *   stat    function(s) -> a personal line shown once unlocked
 *   fact    the fun fact revealed once unlocked
 *
 * Fields of `s` (computed from data.js plus the student's own ticks):
 *   attended, held, attendanceRate (0–100), bestStreak, currentStreak, early,
 *   submitted, onTime, earlySubmissions, nightOwl, closestFinish (minutes or null),
 *   coffee, coffeePerClass, km, hours, heartbeats, fullCourses (names),
 *   semesterProgress (0–100), favouriteDay ({ name, rate })
 */
const ACHIEVEMENTS = [
  {
    id: "first", icon: "🎒", title: "First Steps",
    how: "Attend your first class.", goal: 1, unit: "class",
    value: (s) => s.attended,
    stat: (s) => `${s.attended} classes attended so far.`,
    fact: "The word “robot” comes from the Czech “robota” (forced labour). It first appeared in Karel Čapek's play R.U.R. in 1920.",
  },
  {
    id: "regular", icon: "📅", title: "Regular",
    how: "Reach 75% attendance.", goal: 75, unit: "%",
    value: (s) => s.attendanceRate,
    stat: (s) => `Attendance at ${s.attendanceRate}%.`,
    fact: "Ada Lovelace published what is considered the first algorithm meant for a machine. That was in 1843, about a century before the first electronic computers.",
  },
  {
    id: "streak", icon: "🔥", title: "On a Roll",
    how: "Attend 15 classes in a row.", goal: 15, unit: "in a row",
    value: (s) => s.bestStreak,
    stat: (s) => `Longest run: ${s.bestStreak} classes in a row.`,
    fact: "An octopus has three hearts: two pump blood through the gills, one through the rest of the body.",
  },
  {
    id: "early", icon: "🌅", title: "Early Bird",
    how: "Attend 20 classes that start before 9:00.", goal: 20, unit: "early classes",
    value: (s) => s.early,
    stat: (s) => `${s.early} classes attended before 9:00.`,
    fact: "Sunlight needs about 8 minutes and 20 seconds to reach Earth. The sunrise you see has already happened.",
  },
  {
    id: "coffee", icon: "☕", title: "Coffee Scientist",
    how: "Log 20 cups of coffee.", goal: 20, unit: "cups",
    value: (s) => s.coffee,
    stat: (s) => `Coffee to class ratio: ${s.coffeePerClass} cups per class.`,
    fact: "Coffee “beans” are not beans: they are the seeds of a red fruit called the coffee cherry.",
  },
  {
    id: "marathon", icon: "👟", title: "Marathon Walker",
    how: "Walk 42.2 km to and from class.", goal: 42.2, unit: "km",
    value: (s) => s.km,
    stat: (s) => `About ${s.km} km walked to class, that is ${(s.km / 42.195).toFixed(1)} marathons.`,
    fact: "The Eiffel Tower can grow by up to about 15 cm in summer, because the iron expands in the heat.",
  },
  {
    id: "surfer", icon: "🏄", title: "Deadline Surfer",
    how: "Hand something in within the last hour before its deadline.", goal: 1, unit: "close finish",
    value: (s) => (s.closestFinish !== null && s.closestFinish <= 60 ? 1 : 0),
    stat: (s) => `Closest finish: ${s.closestFinish} minutes before a deadline.`,
    fact: "The shortest war on record, between Britain and Zanzibar in 1896, lasted roughly 40 minutes.",
  },
  {
    id: "ahead", icon: "🕒", title: "Ahead of Time",
    how: "Hand in 3 assignments a day or more early.", goal: 3, unit: "early hand-ins",
    value: (s) => s.earlySubmissions,
    stat: (s) => `${s.earlySubmissions} assignments handed in a day or more early.`,
    fact: "A day on Venus (243 Earth days) is longer than its whole year (225 Earth days).",
  },
  {
    id: "owl", icon: "🦉", title: "Night Owl",
    how: "Hand in 2 assignments after 22:00.", goal: 2, unit: "late-night hand-ins",
    value: (s) => s.nightOwl,
    stat: (s) => `${s.nightOwl} assignments handed in after 22:00.`,
    fact: "Owls cannot move their eyes, so they turn their heads instead, up to about 270 degrees.",
  },
  {
    id: "full", icon: "💯", title: "Full House",
    how: "Attend every class of one course.", goal: 1, unit: "course",
    value: (s) => s.fullCourses.length,
    stat: (s) => `Every class attended in: ${s.fullCourses.join(", ")}.`,
    fact: "Wombats produce cube-shaped droppings. They are the only animal known to do so.",
  },
  {
    id: "halfway", icon: "🧭", title: "Halfway There",
    how: "Reach the middle of the semester.", goal: 50, unit: "%",
    value: (s) => s.semesterProgress,
    stat: (s) => `${s.semesterProgress}% of the semester done.`,
    fact: "Your brain is about 2% of your body weight but uses around 20% of its energy.",
  },
  {
    id: "paper", icon: "📚", title: "Paper Trail",
    how: "Hand in 10 assignments.", goal: 10, unit: "hand-ins",
    value: (s) => s.submitted,
    stat: (s) => `${s.submitted} assignments handed in.`,
    fact: "Botanically, bananas are berries, but strawberries are not.",
  },
  {
    id: "hours", icon: "🧠", title: "Hour Collector",
    how: "Spend 100 hours in class.", goal: 100, unit: "hours",
    value: (s) => s.hours,
    stat: (s) => `${s.hours} hours in class, about ${s.heartbeats.toLocaleString("en-US")} heartbeats.`,
    fact: "The @ sign in e-mail addresses was chosen by Ray Tomlinson in 1971, for the first network e-mail.",
  },
  {
    id: "bug", icon: "🐛", title: "Bug Hunter",
    how: "Attend 10 programming classes.", goal: 10, unit: "PROG classes",
    value: (s) => s.attendedByCourse.prog1 || 0,
    stat: (s) => `${s.attendedByCourse.prog1 || 0} Programming classes attended.`,
    fact: "In 1947 a real moth was found stuck in the Harvard Mark II computer and taped into the logbook as the “first actual case of bug being found”.",
  },
];
