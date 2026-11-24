/*
 * Games shown in the main menu, left to right.
 *
 * Fields:
 *   id         unique name, also used for the card's look in hub.css
 *   title      shown on the card
 *   tagline    one short line under the title
 *   path       page to open, relative to the project's index.html
 *   tags       small labels on the card
 *   accent     card highlight colour
 *   art        "maze" (Robo Maze mini board), "progress" (mini dashboard), "rating" (mini form),
 *              "shop" (treasure), "commons" (mini forum) or an emoji
 *   stats()    optional: returns short text lines (e.g. saved progress)
 *   comingSoon true = greyed-out placeholder that can't be opened
 */
// Number of Robo Maze skins owned (classic counts too).
const SKIN_COUNT = () => 1 + ["forest", "desert", "candy", "ice", "ocean", "lava", "neon", "space", "retro"]
  .filter((id) => Rewards.owns("maze:" + id)).length;

const GAMES = [
  {
    id: "robo-maze",
    title: "Robo Maze",
    tagline: "Program the robot. Unlock tiles with knowledge.",
    path: "games/robo-maze/index.html",
    tags: ["Programming", "Quiz", "4 levels"],
    accent: "#38bdf8",
    art: "maze",
    stats() {
      if (typeof Rewards === "undefined") return [];
      const skins = SKIN_COUNT();
      return [`💰 ${Rewards.coins()} coins`, `🎨 ${skins} skin${skins === 1 ? "" : "s"}`];
    },
  },
  {
    id: "my-semester",
    title: "My Semester",
    tagline: "Attendance, submissions, upcoming classes and fun facts.",
    path: "games/my-semester/index.html",
    tags: ["Progress", "Achievements"],
    accent: "#a5b4fc",
    art: "progress",
    stats() {
      try {
        const r = JSON.parse(localStorage.getItem("mySemester.records.v2"));
        return r && typeof r.coffee === "number" ? [`☕ ${r.coffee} cups logged`] : [];
      } catch (_) {
        return [];
      }
    },
  },
  {
    id: "course-feedback",
    title: "Course Feedback",
    tagline: "Rate lectures anonymously, twice per semester. Lecturers see the results.",
    path: "games/course-feedback/index.html",
    tags: ["Anonymous", "Student and lecturer"],
    accent: "#9085e9",
    art: "rating",
  },
  {
    id: "reward-shop",
    title: "Reward Shop",
    tagline: "Spend Stars on real rewards and Coins on new looks. Streaks pay off.",
    path: "games/reward-shop/index.html",
    tags: ["Rewards", "Streaks", "Skins"],
    accent: "#fcd27a",
    art: "shop",
    stats() {
      return typeof Rewards === "undefined" ? [] : [`⭐ ${Rewards.stars()} stars`, `💰 ${Rewards.coins()} coins`];
    },
  },
  {
    id: "campus-commons",
    title: "Campus Commons",
    tagline: "Show your projects, share your view, find people. A safe space.",
    path: "games/campus-commons/index.html",
    tags: ["Exhibition", "Forum", "Kind only"],
    accent: "#5ec4b6",
    art: "commons",
    stats() {
      try {
        const s = JSON.parse(localStorage.getItem("campusCommons.state.v1"));
        const n = s && Array.isArray(s.posts) ? s.posts.length : 0;
        return n ? [`✍️ ${n} post${n === 1 ? "" : "s"} by you`] : [];
      } catch (_) {
        return [];
      }
    },
  },
  {
    id: "soon-2",
    title: "Coming soon",
    tagline: "More ways to learn by playing.",
    art: "🎲",
    comingSoon: true,
  },
];
