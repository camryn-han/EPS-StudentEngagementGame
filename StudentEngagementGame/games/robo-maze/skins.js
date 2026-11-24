/*
 * Skins for the Skin Shop.
 *
 * The colours and textures of each skin live in skins.css under
 * [data-skin="<id>"]. Here you set what the shop shows and which symbols the
 * maze uses:
 *   id      must match the selector in skins.css
 *   name    shown in the shop
 *   price   cost in coins (0 = free)
 *   desc    one line for the shop card
 *   goal    symbol on the goal tile
 *   lock    symbol on locked tiles
 *   decor   (optional) small decorations scattered over some floor tiles
 */
const SKINS = [
  {
    id: "classic",
    name: "Classic Lab",
    price: 0,
    desc: "The robot's home lab. Clean, blue and tidy.",
    goal: "🏁",
    lock: "🔒",
  },
  {
    id: "forest",
    name: "Hedge Garden",
    price: 300,
    desc: "Grass paths, leafy hedges and wooden gates.",
    goal: "🏡",
    lock: "🔒",
    decor: ["🌼", "🍄", "🌷", "🌿"],
  },
  {
    id: "desert",
    name: "Desert Temple",
    price: 400,
    desc: "Sandstone bricks, hot sand and a hidden gem.",
    goal: "💎",
    lock: "🔒",
    decor: ["🌵", "🐪", "🦂"],
  },
  {
    id: "candy",
    name: "Candy Land",
    price: 500,
    desc: "Candy-cane walls and chocolate doors.",
    goal: "🍭",
    lock: "🔒",
    decor: ["🍬", "🧁", "🍩"],
  },
  {
    id: "ice",
    name: "Crystal Cave",
    price: 600,
    desc: "Slippery ice floors between glowing crystals.",
    goal: "💠",
    lock: "🔒",
    decor: ["❄️"],
  },
  {
    id: "ocean",
    name: "Deep Sea",
    price: 700,
    desc: "A coral reef maze with moving light rays.",
    goal: "🐚",
    lock: "🔒",
    decor: ["🐟", "🐙", "🐠"],
  },
  {
    id: "lava",
    name: "Lava Dungeon",
    price: 800,
    desc: "Glowing lava walls and iron bars. Don't touch!",
    goal: "👑",
    lock: "🔒",
    decor: ["🦴", "🔥"],
  },
  {
    id: "neon",
    name: "Neon Grid",
    price: 900,
    desc: "Inside the computer: glowing lines in the dark.",
    goal: "💾",
    lock: "🔐",
  },
  {
    id: "space",
    name: "Space Station",
    price: 1000,
    desc: "Metal decks, hazard doors and open space.",
    goal: "🚀",
    lock: "🔒",
    decor: ["✨"],
  },
  {
    id: "retro",
    name: "Retro Pocket",
    price: 1200,
    desc: "Four shades of green, like an old handheld.",
    goal: "★",
    lock: "?",
  },
];
