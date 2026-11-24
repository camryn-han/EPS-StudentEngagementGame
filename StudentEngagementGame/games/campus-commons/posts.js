/*
 * Campus Commons: settings and example posts.
 *
 * COMMONS
 *   school        name and icon used for official posts of the school
 *   guidelines    house rules shown in the side bar
 *   nudgeWords    words that trigger a friendly "Want to rephrase?" before posting (whole words, any case)
 *   reactions     kind reactions only, there is no downvote
 *   otherKinds    categories for posts of the type "Other"
 *   reportReasons choices when a student reports a post
 *   coverEmojis, coverColors   choices for a project cover without an image
 *   maxImageSide  uploaded images are scaled down to this many pixels on the long side
 *
 * SEED_POSTS: example posts so the page is not empty. Fields:
 *   id         unique
 *   type       "project", "post" or "other"
 *   source     "school" (official), "course" (lecturer of a course) or "student"
 *   course     course id of the current semester (shared/semesters.js), needed for source "course"
 *   author     students only: { name, avatar }
 *   anonymous  students only: true hides the name
 *   hoursAgo   age of the post, so the demo always looks fresh
 *   pinned     true keeps it on top (staff can change this in the page)
 *   title, text
 *   kind       type "other" only: one of otherKinds
 *   event      optional: { inDays, time, place }
 *   tags, team, link, cover   projects: cover is { emoji, colors: [a, b] }
 *   badge      optional achievement card: { icon, text }
 *   reactions  starting counts per reaction id
 *   comments   [{ name, avatar } or { anonymous: true } or { course } or { school: true }, hoursAgo, text]
 */

const COMMONS = {
  school: { name: "Student Office", icon: "🏛️" },
  guidelines: [
    ["🤝", "Be kind. Criticise ideas, never people."],
    ["🔒", "Keep private things private, yours and other people's."],
    ["🎨", "Show your own work and name everyone who helped."],
    ["🚩", "Something feels wrong? Use Report. Only the team sees reports."],
  ],
  nudgeWords: ["stupid", "idiot", "idiots", "dumb", "loser", "losers", "moron", "pathetic", "useless", "ugly", "shut up", "hate you", "worst teacher"],
  reactions: [
    { id: "clap", icon: "👏", label: "Applause" },
    { id: "heart", icon: "❤️", label: "Love it" },
    { id: "idea", icon: "💡", label: "Helpful" },
    { id: "support", icon: "🤝", label: "Support" },
  ],
  otherKinds: ["Event", "Study group", "Lost and found", "Question", "Support"],
  reportReasons: ["Unkind or hurtful", "Private information", "Spam or advertising", "Something else"],
  coverEmojis: ["🤖", "💻", "🎨", "📊", "🎮", "🔬", "📱", "🎵", "🧩", "🌍", "📷", "🛠️"],
  coverColors: [
    ["#3b82f6", "#8b5cf6"], ["#10b981", "#0ea5e9"], ["#f59e0b", "#ef4444"],
    ["#ec4899", "#8b5cf6"], ["#475569", "#0f172a"], ["#14b8a6", "#84cc16"],
  ],
  maxImageSide: 900,
};

const SEED_POSTS = [
  {
    id: "s-welcome", type: "post", source: "school", pinned: true, hoursAgo: 24 * 30,
    title: "Welcome to Campus Commons",
    text: "This is your place to show what you made, share what you think and find people to learn with.\n\n🛠️ Projects: things you built, drew, wrote or researched. They appear in the Exhibition.\n💬 Posts: opinions, tips and experiences.\n📌 Other: events, study groups, lost and found, questions.\n\nBe kind, criticise ideas and not people, and keep private things private. If something feels wrong, use Report. Reports go to the team and are never shown to others.",
    reactions: { clap: 34, heart: 21, idea: 5, support: 12 },
    comments: [
      { name: "Lea S.", avatar: "🦄", hoursAgo: 24 * 29, text: "Finally a place for the pixel art 😄" },
    ],
  },
  {
    id: "s-support", type: "other", kind: "Support", source: "school", pinned: true, hoursAgo: 24 * 12,
    title: "Need to talk? Free and confidential counselling",
    text: "The student counselling team is there for stress, exam nerves, homesickness or anything else on your mind. It is free and confidential. Drop in without an appointment on Tuesdays 13:00 to 15:00 in room A 108, or write to them first if talking feels like too much.",
    reactions: { heart: 15, support: 18 },
  },
  {
    id: "s-showcase", type: "other", kind: "Event", source: "school", hoursAgo: 24 * 4,
    title: "Project Showcase Night",
    text: "Show your project to students, lecturers and companies from the region. Posters, demos, games, art, research, everything counts. To take part, add your project to the Exhibition and mention the Showcase in the text.",
    event: { inDays: 26, time: "18:00", place: "Main hall" },
    reactions: { clap: 22, idea: 4 },
    comments: [
      { name: "Tim R.", avatar: "🤖", hoursAgo: 60, text: "Can teams of three share one table?" },
      { school: true, hoursAgo: 52, text: "Yes, one table per project, however big the team is." },
    ],
  },
  {
    id: "s-library", type: "post", source: "school", hoursAgo: 24 * 2 + 5,
    title: "Longer library hours in the exam weeks",
    text: "From 11 January the library stays open until 22:00 on weekdays and from 10:00 to 18:00 on Saturdays. Group rooms can be booked one week ahead at the front desk.",
    reactions: { clap: 9, idea: 17 },
  },
  {
    id: "c-prog-sheet4", type: "post", source: "course", course: "prog1", hoursAgo: 30,
    title: "Great solutions from Sheet 4",
    text: "Many of you found elegant ways to split the problem into small functions. Three solutions, shared with permission, are now in the course folder. Look at how each function does exactly one thing and has a name that says what it does.",
    reactions: { clap: 11, idea: 19 },
    comments: [
      { name: "Jonas B.", avatar: "🐼", hoursAgo: 26, text: "Mine is one of them, thank you! 🙌" },
    ],
  },
  {
    id: "c-db-teams", type: "other", kind: "Study group", source: "course", course: "db", hoursAgo: 24 * 5,
    title: "Find your project team",
    text: "The database project runs in teams of three. Write a comment with what you like to work on (design, SQL, frontend) and find your team here before 1 December.",
    reactions: { idea: 6 },
    comments: [
      { name: "Sara M.", avatar: "🐙", hoursAgo: 24 * 5 - 3, text: "Looking for a team, I like the ER design part." },
      { name: "Tim R.", avatar: "🤖", hoursAgo: 24 * 4, text: "Sara, Noah and I still have one place. SQL and a bit of frontend." },
      { name: "Sara M.", avatar: "🐙", hoursAgo: 24 * 4 - 2, text: "Deal! 🎉" },
    ],
  },
  {
    id: "c-math-extra", type: "other", kind: "Event", source: "course", course: "math", hoursAgo: 20,
    title: "Extra exercise session",
    text: "Bring the exercises you got stuck on. We go through whatever you ask for, no new material.",
    event: { inDays: 6, time: "16:00", place: "H 205" },
    reactions: { clap: 5, support: 8 },
  },
  {
    id: "c-arch-adder", type: "project", source: "course", course: "arch", hoursAgo: 24 * 8,
    title: "Built in class: a 4-bit adder from logic gates",
    text: "In week 4 every group built one part of a 4-bit adder on the breadboard, and in the end we connected them into one working circuit. 5 + 9 = 14 on the LEDs, on the second try. Thanks to all 46 of you.",
    tags: ["Hardware", "Logic gates", "Group work"],
    cover: { emoji: "🔌", colors: ["#475569", "#0f172a"] },
    reactions: { clap: 28, heart: 6, idea: 3 },
  },
  {
    id: "u-route", type: "project", source: "student", author: { name: "Mia K.", avatar: "🦉" }, course: "prog1", hoursAgo: 9,
    title: "Robo route planner",
    text: "A small Python program that finds the shortest path through a maze with breadth first search. It started as a joke after playing Robo Maze, and then I wanted to know how it really works. Next step: slow tiles that cost more, so I need Dijkstra.",
    tags: ["Python", "Algorithms", "BFS"],
    team: ["Mia K.", "Jonas B."],
    cover: { emoji: "🤖", colors: ["#3b82f6", "#8b5cf6"] },
    reactions: { clap: 23, heart: 9, idea: 14 },
    comments: [
      { name: "Noah P.", avatar: "🦖", hoursAgo: 7, text: "Does it show the path step by step? Would love to see that at the Showcase." },
      { name: "Mia K.", avatar: "🦉", hoursAgo: 6, text: "Not yet, but that is a great idea." },
    ],
  },
  {
    id: "u-mensa", type: "project", source: "student", author: { name: "Jonas B.", avatar: "🐼" }, hoursAgo: 24 * 3,
    title: "Mensa menu in your pocket",
    text: "A tiny web page that shows today's Mensa menu with icons for vegetarian and vegan dishes. It works offline once loaded, so it is fine in the basement too.",
    tags: ["HTML", "CSS", "JavaScript"],
    cover: { emoji: "📱", colors: ["#10b981", "#0ea5e9"] },
    reactions: { clap: 15, heart: 12, idea: 7 },
  },
  {
    id: "u-pixel", type: "project", source: "student", author: { name: "Lea S.", avatar: "🦄" }, hoursAgo: 24 * 6,
    title: "The campus in pixel art",
    text: "Drew our main building in 64 by 64 pixels over the autumn break. 11 hours, 23 colours and one very patient cat on my lap.",
    tags: ["Art", "Pixel art"],
    cover: { emoji: "🎨", colors: ["#ec4899", "#8b5cf6"] },
    reactions: { clap: 19, heart: 31 },
    comments: [
      { name: "Sara M.", avatar: "🐙", hoursAgo: 24 * 5, text: "The tiny bike in front of the door 😍" },
    ],
  },
  {
    id: "u-sqlbot", type: "project", source: "student", author: { name: "Tim R.", avatar: "🤖" }, course: "db", hoursAgo: 24 * 10,
    title: "SQL question of the day bot",
    text: "A chat bot that asks one SQL question per day and explains the answer afterwards. Writing the explanations taught me more than reading the slides twice.",
    tags: ["SQL", "Python", "Learning"],
    cover: { emoji: "📊", colors: ["#f59e0b", "#ef4444"] },
    reactions: { clap: 12, idea: 16 },
  },
  {
    id: "u-recordings", type: "post", source: "student", anonymous: true, hoursAgo: 14,
    title: "Lecture recordings help me more than I expected",
    text: "I work two evenings a week and sometimes cannot stay focused at 8:15. Rewatching parts at my own speed has made a big difference for me. I would love to have them for all courses, not only for Programming.",
    reactions: { support: 27, idea: 8, heart: 3 },
    comments: [
      { anonymous: true, hoursAgo: 12, text: "Same here, especially for Maths." },
      { course: "math", hoursAgo: 8, text: "Thanks for saying it. We are checking whether the room can record from January." },
    ],
  },
  {
    id: "u-tips", type: "post", source: "student", author: { name: "Sara M.", avatar: "🐙" }, hoursAgo: 24 * 7,
    title: "Five things I wish I knew in my first semester",
    text: "1. Start the exercise sheets on the day they come out, even just for 20 minutes.\n2. Office hours are not only for problems. Lecturers like good questions.\n3. Find two people you can study with.\n4. Sleep beats one more hour of revision.\n5. Nobody understands everything the first time. Really nobody.",
    reactions: { idea: 41, heart: 17, clap: 9 },
    comments: [
      { name: "Noah P.", avatar: "🦖", hoursAgo: 24 * 6, text: "Number 5 needs to be printed on the wall of H 101." },
    ],
  },
  {
    id: "u-streak", type: "post", source: "student", author: { name: "Noah P.", avatar: "🦖" }, hoursAgo: 4,
    title: "20 classes in a row",
    text: "Never thought I would say it, but the morning lectures got a lot easier once they became a routine. Coffee helped too.",
    badge: { icon: "🔥", text: "20 classes in a row" },
    reactions: { clap: 14, support: 6 },
  },
  {
    id: "u-nervous", type: "other", kind: "Question", source: "student", anonymous: true, hoursAgo: 24 + 3,
    title: "Is anyone else nervous about the first exams?",
    text: "It is my first semester and I have no idea how the exams here will feel. How do you prepare?",
    reactions: { support: 22, heart: 5 },
    comments: [
      { name: "Sara M.", avatar: "🐙", hoursAgo: 24, text: "Totally normal. Old exams in the course folders helped me most." },
      { name: "Jonas B.", avatar: "🐼", hoursAgo: 23, text: "Join the Maths study group on Thursdays, we do exactly that." },
      { school: true, hoursAgo: 20, text: "The counselling team also runs a short workshop on exam nerves. See the pinned post." },
    ],
  },
  {
    id: "u-bottle", type: "other", kind: "Lost and found", source: "student", author: { name: "Lea S.", avatar: "🦄" }, hoursAgo: 28,
    title: "Lost: blue water bottle in H 101",
    text: "It has stickers of a fox and a planet. I probably left it after the Databases lecture on Wednesday. Please leave it at the Student Office if you find it. Thank you!",
    reactions: { support: 3 },
  },
  {
    id: "u-mathgroup", type: "other", kind: "Study group", source: "student", author: { name: "Jonas B.", avatar: "🐼" }, course: "math", hoursAgo: 24 * 9,
    title: "Maths study group on Thursdays",
    text: "We meet every Thursday at 17:00 in the library, group room 3. Everyone is welcome, also if you are behind. Especially then.",
    reactions: { heart: 7, support: 11 },
  },
];
