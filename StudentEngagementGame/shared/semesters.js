/*
 * Shared semester data, used by "My Semester" and "Course Feedback".
 * Replace it with your own semesters.
 *
 * Dates are written as "YYYY-MM-DD", times as "HH:MM", date and time as "YYYY-MM-DDTHH:MM".
 * Students can also tick classes and submissions in the page itself. Those
 * changes are saved in their browser and laid over this file.
 *
 * The page picks the current semester by itself: the latest one that has
 * already started. Add a new block to SEMESTERS each term and the filters
 * follow automatically.
 */

const SETTINGS = {
  today: null,                  // e.g. "2026-11-20T12:00" to freeze the date for a demo, null = real date
};

const STUDENT = {
  name: "Alex",
  walkKmToClass: 1.2,           // one way, used for the "distance walked" fact
  coffeeSoFar: 31,              // starting value for the coffee counter
  heartRate: 72,                // beats per minute, used for a fun fact
};

/*
 * Semesters, oldest first.
 *   id, name     short unique id and display name
 *   start, end   first day (a Monday) and last day with classes
 *   breaks       weeks without classes
 *   courses      see below
 *   assignments  see below
 *
 * Course fields:
 *   id        short name, unique inside the semester
 *   code      2 to 5 letter badge
 *   icon      emoji shown next to the course (Emoji 12 or older)
 *   name      full course name
 *   lecturer  name of the lecturer (shown in Course Feedback)
 *   students  number of enrolled students (used for the feedback response rate)
 *   weight    1 to 3, how central the course is (base of the importance meter)
 *   slots     weekly classes: day (Mon to Fri), start, end, type, room
 *   exam      exam date (raises importance in the 4 weeks before), or null
 *   topics    optional, one topic per teaching week (break weeks are skipped)
 *   missed    start times ("YYYY-MM-DDTHH:MM") of classes the student did not attend
 *   highlights  optional: { "YYYY-MM-DD": "note" } for specially important sessions
 *
 * Assignment fields:
 *   id         unique across all semesters
 *   course     course id
 *   title      shown in the list
 *   due        deadline
 *   submitted  when it was handed in, or null
 *   graded     optional: true if it counts toward the final grade (shown with a purple frame)
 *   gradeShare optional: share of the final grade in percent, shown next to the "Graded" tag
 */
const SEMESTERS = [
  {
    id: "ws25",
    name: "Winter 2025/26",
    start: "2025-10-13",
    end: "2026-02-06",
    breaks: [{ from: "2025-12-22", to: "2026-01-04", label: "Winter break" }],
    courses: [
      {
        id: "intro", code: "INTRO", icon: "🧩", name: "Introduction to CS", weight: 3,
        lecturer: "Dr. Jonas Keller", students: 64,
        slots: [
          { day: "Mon", start: "10:15", end: "11:45", type: "Lecture", room: "H 101" },
          { day: "Wed", start: "08:15", end: "09:45", type: "Exercise", room: "S 204" },
        ],
        exam: "2026-02-09",
        missed: ["2025-11-12T08:15", "2026-01-14T08:15"],
      },
      {
        id: "la", code: "LA", icon: "📐", name: "Linear Algebra", weight: 3,
        lecturer: "Prof. Dr. Miriam Hoffmann", students: 58,
        slots: [
          { day: "Tue", start: "10:15", end: "11:45", type: "Lecture", room: "H 3" },
          { day: "Thu", start: "14:15", end: "15:45", type: "Exercise", room: "S 110" },
        ],
        exam: "2026-02-12",
        missed: ["2025-10-30T14:15", "2025-12-04T14:15", "2026-01-22T14:15"],
      },
      {
        id: "web", code: "WEB", icon: "🌐", name: "Web Basics", weight: 2,
        lecturer: "Sara Novak", students: 32,
        slots: [{ day: "Fri", start: "10:15", end: "11:45", type: "Lab", room: "PC Lab 1" }],
        exam: null,
        missed: [],
      },
      {
        id: "eng", code: "ENG", icon: "🗣️", name: "Technical English", weight: 1,
        lecturer: "Dr. Emily Carter", students: 28,
        slots: [{ day: "Thu", start: "08:15", end: "09:45", type: "Seminar", room: "S 012" }],
        exam: null,
        missed: ["2025-11-20T08:15", "2026-01-29T08:15"],
      },
    ],
    assignments: [
      { id: "intro1", course: "intro", title: "Sheet 1: Bits and bytes", due: "2025-10-24T23:59", submitted: "2025-10-22T17:30" },
      { id: "intro2", course: "intro", title: "Sheet 2: Boolean logic", due: "2025-11-07T23:59", submitted: "2025-11-07T21:10" },
      { id: "intro3", course: "intro", title: "Sheet 3: Algorithms", due: "2025-11-21T23:59", submitted: "2025-11-20T15:45" },
      { id: "intro4", course: "intro", title: "Sheet 4: Sorting", due: "2025-12-05T23:59", submitted: "2025-12-05T23:20" },
      { id: "intro5", course: "intro", title: "Sheet 5: Searching", due: "2025-12-19T23:59", submitted: "2025-12-17T12:00" },
      { id: "intro6", course: "intro", title: "Sheet 6: Complexity", due: "2026-01-16T23:59", submitted: "2026-01-15T19:30" },
      { id: "la1", course: "la", title: "Problem set 1: Vectors", due: "2025-10-30T23:59", submitted: "2025-10-29T20:00" },
      { id: "la2", course: "la", title: "Problem set 2: Matrices", due: "2025-11-20T23:59", submitted: "2025-11-21T09:30" },
      { id: "la3", course: "la", title: "Problem set 3: Determinants", due: "2025-12-11T23:59", submitted: "2025-12-10T18:15" },
      { id: "la4", course: "la", title: "Problem set 4: Eigenvalues", due: "2026-01-22T23:59", submitted: null },
      { id: "web1", course: "web", title: "Project 1: Personal page", due: "2025-11-28T23:59", submitted: "2025-11-26T22:40", graded: true, gradeShare: 40 },
      { id: "web2", course: "web", title: "Project 2: Small web app", due: "2026-01-30T23:59", submitted: "2026-01-29T16:00", graded: true, gradeShare: 60 },
      { id: "eng1", course: "eng", title: "Presentation slides", due: "2025-12-18T08:00", submitted: "2025-12-16T21:00", graded: true, gradeShare: 30 },
    ],
  },
  {
    id: "ss26",
    name: "Summer 2026",
    start: "2026-04-13",
    end: "2026-07-17",
    breaks: [{ from: "2026-05-25", to: "2026-05-29", label: "Whitsun break" }],
    courses: [
      {
        id: "algo", code: "ALGO", icon: "🧮", name: "Algorithms and Data Structures", weight: 3,
        lecturer: "Prof. Dr. Thomas Brandt", students: 55,
        slots: [
          { day: "Mon", start: "08:15", end: "09:45", type: "Lecture", room: "H 2" },
          { day: "Wed", start: "12:15", end: "13:45", type: "Exercise", room: "S 204" },
        ],
        exam: "2026-07-22",
        missed: ["2026-05-06T12:15", "2026-06-22T08:15"],
      },
      {
        id: "stat", code: "STAT", icon: "📊", name: "Statistics", weight: 2,
        lecturer: "Dr. Aylin Demir", students: 47,
        slots: [{ day: "Tue", start: "14:15", end: "15:45", type: "Lecture", room: "H 3" }],
        exam: "2026-07-24",
        missed: ["2026-06-16T14:15"],
      },
      {
        id: "os", code: "OS", icon: "⚙️", name: "Operating Systems", weight: 2,
        lecturer: "Prof. Dr. Peter Lang", students: 44,
        slots: [{ day: "Thu", start: "10:15", end: "11:45", type: "Lecture", room: "H 101" }],
        exam: "2026-07-27",
        missed: [],
      },
      {
        id: "net", code: "NET", icon: "📡", name: "Computer Networks", weight: 2,
        lecturer: "Dr. Marco Rossi", students: 40,
        slots: [{ day: "Fri", start: "08:15", end: "09:45", type: "Lecture", room: "H 2" }],
        exam: null,
        missed: ["2026-04-24T08:15", "2026-07-03T08:15"],
      },
    ],
    assignments: [
      { id: "algo1", course: "algo", title: "Sheet 1: Arrays", due: "2026-04-22T23:59", submitted: "2026-04-21T18:00" },
      { id: "algo2", course: "algo", title: "Sheet 2: Linked lists", due: "2026-05-06T23:59", submitted: "2026-05-06T22:50" },
      { id: "algo3", course: "algo", title: "Sheet 3: Stacks and queues", due: "2026-05-20T23:59", submitted: null },
      { id: "algo4", course: "algo", title: "Sheet 4: Trees", due: "2026-06-10T23:59", submitted: "2026-06-09T14:20" },
      { id: "algo5", course: "algo", title: "Sheet 5: Hashing", due: "2026-06-24T23:59", submitted: "2026-06-24T23:35" },
      { id: "algo6", course: "algo", title: "Sheet 6: Graphs", due: "2026-07-08T23:59", submitted: "2026-07-06T20:10" },
      { id: "stat1", course: "stat", title: "Exercise set 1", due: "2026-05-04T12:00", submitted: "2026-05-02T11:00" },
      { id: "stat2", course: "stat", title: "Exercise set 2", due: "2026-06-01T12:00", submitted: "2026-06-02T09:15" },
      { id: "stat3", course: "stat", title: "Exercise set 3", due: "2026-06-29T12:00", submitted: "2026-06-28T19:45" },
      { id: "os1", course: "os", title: "Lab 1: Processes", due: "2026-05-14T23:59", submitted: "2026-05-13T21:30", graded: true, gradeShare: 20 },
      { id: "os2", course: "os", title: "Lab 2: Scheduling", due: "2026-06-18T23:59", submitted: "2026-06-17T16:40", graded: true, gradeShare: 20 },
      { id: "net1", course: "net", title: "Lab 1: Packet capture", due: "2026-06-05T23:59", submitted: "2026-06-04T13:00", graded: true, gradeShare: 15 },
      { id: "net2", course: "net", title: "Lab 2: Routing", due: "2026-07-10T23:59", submitted: "2026-07-09T22:05", graded: true, gradeShare: 15 },
    ],
  },
  {
    id: "ws26",
    name: "Winter 2026/27",
    start: "2026-10-12",
    end: "2027-02-05",
    breaks: [{ from: "2026-12-21", to: "2027-01-03", label: "Winter break" }],
    courses: [
      {
        id: "prog1", code: "PROG", icon: "💻", name: "Programming 1", weight: 3,
        lecturer: "Prof. Dr. Lena Weber", students: 52,
        slots: [
          { day: "Mon", start: "10:15", end: "11:45", type: "Lecture", room: "H 101" },
          { day: "Thu", start: "08:15", end: "09:45", type: "Lab", room: "PC Lab 2" },
        ],
        exam: "2027-02-08",
        topics: ["Tools and first program", "Variables and types", "Conditions", "Loops", "Functions", "Lists",
          "Recursion", "Strings", "Files", "Classes", "Objects", "Testing", "Algorithms recap", "Mock exam", "Exam Q&A"],
        missed: ["2026-10-22T08:15"],
        highlights: { "2026-11-23": "Exam-relevant: recursion" },
      },
      {
        id: "math", code: "MATH", icon: "➗", name: "Mathematics for CS", weight: 3,
        lecturer: "Dr. Felix Braun", students: 60,
        slots: [
          { day: "Tue", start: "08:15", end: "09:45", type: "Lecture", room: "H 3" },
          { day: "Fri", start: "12:15", end: "13:45", type: "Exercise", room: "S 204" },
        ],
        exam: "2027-02-11",
        topics: ["Sets", "Logic", "Proofs", "Induction", "Relations", "Functions", "Combinatorics",
          "Graphs", "Number theory", "Modular arithmetic", "Matrices", "Linear systems", "Probability", "Recap", "Exam Q&A"],
        missed: ["2026-11-06T12:15"],
      },
      {
        id: "arch", code: "ARCH", icon: "🖥️", name: "Computer Architecture", weight: 2,
        lecturer: "Prof. Dr. Hannah Schulz", students: 46,
        slots: [{ day: "Wed", start: "14:15", end: "15:45", type: "Lecture", room: "H 2" }],
        exam: "2027-02-15",
        topics: ["Binary numbers", "Logic gates", "Circuits", "ALU", "Memory", "CPU basics", "Instruction sets",
          "Assembly", "Pipelines", "Caches", "I/O", "Interrupts", "Performance", "Recap", "Q&A"],
        missed: [],
      },
      {
        id: "db", code: "DB", icon: "🗄️", name: "Databases", weight: 2,
        lecturer: "Dr. Omar Haddad", students: 42,
        slots: [{ day: "Wed", start: "10:15", end: "11:45", type: "Lecture", room: "H 101" }],
        exam: "2027-02-17",
        topics: ["Why databases", "ER models", "Relational model", "SQL basics", "Joins", "Aggregation",
          "Normal forms", "Indexes", "Transactions", "Project kick-off", "NoSQL", "Security", "Project demos", "Recap", "Q&A"],
        missed: ["2026-10-28T10:15"],
        highlights: { "2026-12-16": "Project demo day" },
      },
      {
        id: "writ", code: "WRIT", icon: "✍️", name: "Academic Writing", weight: 1,
        lecturer: "Julia Fischer", students: 25,
        slots: [{ day: "Fri", start: "08:15", end: "09:45", type: "Seminar", room: "S 110" }],
        exam: null,
        topics: ["Finding sources", "Reading papers", "Citing", "Structure", "Paragraphs", "Peer review",
          "Abstracts", "Figures and tables", "Editing", "Presenting", "Feedback", "Revision", "Final essay", "Wrap-up", "Wrap-up"],
        missed: ["2026-10-16T08:15"],
      },
    ],
    assignments: [
      { id: "p1", course: "prog1", title: "Sheet 1: Hello World", due: "2026-10-23T23:59", submitted: "2026-10-21T19:05" },
      { id: "p2", course: "prog1", title: "Sheet 2: Conditions", due: "2026-10-30T23:59", submitted: "2026-10-30T23:41" },
      { id: "p3", course: "prog1", title: "Sheet 3: Loops", due: "2026-11-06T23:59", submitted: "2026-11-05T22:30" },
      { id: "p4", course: "prog1", title: "Sheet 4: Functions", due: "2026-11-13T23:59", submitted: "2026-11-12T16:20" },
      { id: "p5", course: "prog1", title: "Sheet 5: Lists", due: "2026-11-20T23:59", submitted: null },
      { id: "p6", course: "prog1", title: "Sheet 6: Recursion", due: "2026-11-27T23:59", submitted: null },
      { id: "p7", course: "prog1", title: "Sheet 7: Strings", due: "2026-12-04T23:59", submitted: null },
      { id: "p8", course: "prog1", title: "Sheet 8: Files", due: "2026-12-18T23:59", submitted: null },
      { id: "p9", course: "prog1", title: "Sheet 9: Classes", due: "2027-01-15T23:59", submitted: null },
      { id: "m1", course: "math", title: "Problem set 1", due: "2026-10-27T23:59", submitted: "2026-10-26T21:15" },
      { id: "m2", course: "math", title: "Problem set 2", due: "2026-11-10T23:59", submitted: null },
      { id: "m3", course: "math", title: "Problem set 3", due: "2026-11-24T23:59", submitted: null },
      { id: "m4", course: "math", title: "Problem set 4", due: "2026-12-08T23:59", submitted: null },
      { id: "m5", course: "math", title: "Problem set 5", due: "2027-01-19T23:59", submitted: null },
      { id: "a1", course: "arch", title: "Lab report: Logic gates", due: "2026-10-30T12:00", submitted: "2026-10-29T10:45", graded: true, gradeShare: 10 },
      { id: "a2", course: "arch", title: "Lab report: ALU", due: "2026-11-27T12:00", submitted: null, graded: true, gradeShare: 10 },
      { id: "a3", course: "arch", title: "Lab report: Caches", due: "2027-01-15T12:00", submitted: null, graded: true, gradeShare: 10 },
      { id: "d1", course: "db", title: "Project milestone 1: ER model", due: "2026-11-04T23:59", submitted: "2026-11-02T14:00", graded: true, gradeShare: 10 },
      { id: "d2", course: "db", title: "Project milestone 2: Schema", due: "2026-12-02T23:59", submitted: null, graded: true, gradeShare: 15 },
      { id: "d3", course: "db", title: "Project milestone 3: Queries", due: "2027-01-27T23:59", submitted: null, graded: true, gradeShare: 25 },
      { id: "w1", course: "writ", title: "Essay outline", due: "2026-11-15T23:59", submitted: "2026-11-15T22:48" },
      { id: "w2", course: "writ", title: "Essay draft", due: "2026-12-13T23:59", submitted: null, graded: true, gradeShare: 20 },
      { id: "w3", course: "writ", title: "Final essay", due: "2027-02-05T23:59", submitted: null, graded: true, gradeShare: 50 },
    ],
  },
];
