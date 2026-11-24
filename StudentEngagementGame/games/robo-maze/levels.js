/*
 * Levels for Robo Maze.
 *
 * Map legend (every row must have the same length):
 *   S  start of the robot (exactly one)
 *   G  goal (exactly one)
 *   .  free floor
 *   #  wall
 *   L  locked tile – answer a question to open it
 */
const LEVELS = [
  {
    name: "Hello, Robot",
    hint: "Program a few moves, press Run, and open the lock on the way.",
    map: [
      "S...#.",
      "###.#.",
      "....#.",
      ".####.",
      "...L.G",
      "####..",
    ],
  },
  {
    name: "Two Doors",
    hint: "Not every lock leads somewhere. Plan your route first!",
    map: [
      "S.#.....",
      ".##.###.",
      "...L..#.",
      "###.#.#.",
      "..#.#...",
      "..#L####",
      ".#.....L",
      "G..###..",
    ],
  },
  {
    name: "The Corridor",
    hint: "Long programs save time. Queue many moves at once.",
    map: [
      "S...#.....",
      "###.#.###.",
      "....#...#.",
      ".######L#.",
      "...L....#.",
      "##.####.##",
      "...#..#...",
      ".#.#L.#.#L",
      ".#...##L#.",
      "...#....#G",
    ],
  },
  {
    name: "Final Exam",
    hint: "Three locks stand between you and the goal, whichever way you go.",
    map: [
      "S....#.....",
      "####.#.###.",
      ".....#...#.",
      ".#####L#.#.",
      ".#.....#.#.",
      ".#.###.#L##",
      "...#...#...",
      "####L###.##",
      ".....L.....",
      ".###.#####L",
      "...#...#..G",
    ],
  },
];
