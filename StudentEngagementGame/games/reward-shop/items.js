/*
 * Catalog of the Reward Shop. Prices and texts can be changed freely.
 *
 * ⭐ Stars come from studying (see RULES in shared/rewards.js) and pay for real
 *    rewards and emergency options. Anything worth real money is expensive on purpose.
 * 💰 Coins come from the games and pay for looks only.
 *
 * Emoji must be Emoji 12 or older so Windows 10 can show them.
 */

const SHOP_INFO = {
  office: "Student office, room A 012, Mon to Thu 10:00 to 14:00",
  voucherNote: "Show the code at the student office. Codes are valid until the end of the next semester.",
};

// Real rewards for good attendance and hand-ins. Not academic, good for the atmosphere.
const REWARD_ITEMS = [
  { id: "coffee", icon: "☕", name: "Coffee voucher", desc: "One hot drink of your choice at the campus café.", price: 400 },
  { id: "stickers", icon: "🏷️", name: "Sticker pack", desc: "Five stickers with the faculty logo and a few CS jokes.", price: 450 },
  { id: "print", icon: "🖨️", name: "Printing credit", desc: "50 pages at the library printers.", price: 600 },
  { id: "meal", icon: "🍽️", name: "Mensa meal voucher", desc: "One main dish of your choice in the mensa.", price: 900 },
  { id: "gamenight", icon: "🎮", name: "Game night ticket", desc: "Entry to the student union game night, snacks included.", price: 1000 },
  { id: "cinema", icon: "🎬", name: "Campus cinema evening", desc: "One ticket for the campus cinema, popcorn included.", price: 1400 },
  { id: "tote", icon: "🛍️", name: "Tote bag", desc: "Cotton tote bag with the faculty logo.", price: 1800 },
  { id: "bottle", icon: "🥤", name: "Water bottle", desc: "Steel bottle that keeps drinks cold for a whole day.", price: 2500 },
  { id: "shirt", icon: "👕", name: "Faculty T-shirt", desc: "Pick your size at the student office.", price: 3500 },
  { id: "hoodie", icon: "🧥", name: "Faculty hoodie", desc: "Warm, soft and the rarest item in the shop.", price: 6000 },
];

// Emergency options. kind: "freeze" and "extension" go to the inventory, "voucher" gives a code.
const EMERGENCY_ITEMS = [
  {
    id: "freeze", kind: "freeze", icon: "❄️", name: "Streak Freeze", price: 150,
    desc: "Covers one missed class, so your attendance streak keeps going. Use it under My stuff.",
  },
  {
    id: "tutor", kind: "voucher", icon: "🆘", name: "Tutor priority slot", price: 300,
    desc: "A guaranteed 15-minute slot in the next tutor office hours, for when you are stuck.",
  },
  {
    id: "extension", kind: "extension", icon: "⏰", name: "24-hour extension request", price: 700,
    desc: "Ask the lecturer for 24 more hours on one assignment. The lecturer decides. One per course and semester.",
  },
];

// Looks for the main menu. vars are applied to the menu page.
const MENU_THEMES = [
  {
    id: "default", name: "Night Sky", price: 0, desc: "The standard look of the menu.",
    vars: { "--bg": "#090d1c", "--card": "#121a36", "--card-top": "#18224a", "--card-border": "#26315c", "--art-bg": "#0b1129",
      "--glow-1": "#1d4ed855", "--glow-2": "#7c3aed44", "--title-a": "#7dd3fc", "--title-b": "#a5b4fc", "--title-c": "#f0abfc",
      "--text": "#e8ecff", "--muted": "#95a0c8", "--grid-line": "#ffffff08" },
  },
  {
    id: "aurora", name: "Aurora", price: 800, desc: "Green and teal lights over a dark night.",
    vars: { "--bg": "#03110f", "--card": "#0a1f1c", "--card-top": "#0f2e28", "--card-border": "#1b4a40", "--art-bg": "#061814",
      "--glow-1": "#10b98155", "--glow-2": "#06b6d444", "--title-a": "#6ee7b7", "--title-b": "#5eead4", "--title-c": "#a5f3fc",
      "--text": "#e6fffa", "--muted": "#8fbcb3", "--grid-line": "#ffffff08" },
  },
  {
    id: "sunset", name: "Sunset", price: 900, desc: "Warm orange and pink evening colours.",
    vars: { "--bg": "#1a0b10", "--card": "#2a1219", "--card-top": "#3a1621", "--card-border": "#5c2533", "--art-bg": "#1f0c12",
      "--glow-1": "#f9731655", "--glow-2": "#ec489944", "--title-a": "#fdba74", "--title-b": "#fb7185", "--title-c": "#f0abfc",
      "--text": "#fff1f2", "--muted": "#d1a3ae", "--grid-line": "#ffffff08" },
  },
  {
    id: "terminal", name: "Terminal", price: 1100, desc: "Green text on black, like an old computer.",
    vars: { "--bg": "#020602", "--card": "#071207", "--card-top": "#0b1c0b", "--card-border": "#1f4d1f", "--art-bg": "#030a03",
      "--glow-1": "#22c55e33", "--glow-2": "#16a34a22", "--title-a": "#4ade80", "--title-b": "#86efac", "--title-c": "#bbf7d0",
      "--text": "#d9fbe3", "--muted": "#6fbf87", "--grid-line": "#22c55e14" },
  },
  {
    id: "paper", name: "Paper", price: 700, desc: "A bright, calm look like a notebook.",
    vars: { "--bg": "#f4f1ea", "--card": "#fffdf8", "--card-top": "#ffffff", "--card-border": "#ddd6c8", "--art-bg": "#ece6da",
      "--glow-1": "#f59e0b22", "--glow-2": "#3b82f622", "--title-a": "#1e3a8a", "--title-b": "#6d28d9", "--title-c": "#be185d",
      "--text": "#1f2430", "--muted": "#6b6f7a", "--grid-line": "#0000000a" },
  },
];

// Avatars shown in the shop and on the menu.
const AVATARS = [
  { id: "🎓", price: 0 }, { id: "🦊", price: 200 }, { id: "🐼", price: 200 }, { id: "🦉", price: 300 },
  { id: "🐙", price: 300 }, { id: "🤖", price: 400 }, { id: "🦖", price: 450 }, { id: "🦄", price: 500 },
  { id: "🐲", price: 600 }, { id: "👾", price: 600 },
];
