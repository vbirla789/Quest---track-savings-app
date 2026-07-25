// ---------------------------------------------------------------------------
// Mock domain model for the "Quest" savings prototype.
//
// The core question the brief raises — "how do we know how much a user is
// saving?" — is answered here by modelling every rupee as a *contribution*
// with a source. Real apps combine a few mechanics; we surface four:
//   - auto     recurring UPI autopay / mandate (e.g. ₹500 every Friday)
//   - roundup  spare change rounded up from everyday spends
//   - skip     the Swiggy-native hook: skipped a food order, stashed the cash
//   - boost    a one-off manual top-up
// A goal's `saved` is just the sum of its contributions, so progress, savings
// rate, streaks and the projected finish date are all derived, not stored.
// ---------------------------------------------------------------------------

export type ContributionSource = "auto" | "roundup" | "skip" | "boost";

export type Contribution = {
  id: string;
  source: ContributionSource;
  label: string;
  amount: number;
  daysAgo: number;
};

export type Goal = {
  id: string;
  name: string;
  emoji: string;
  target: number;
  saved: number;
  /** recurring weekly auto-save that funds the "on track" projection */
  weeklyAutoSave: number;
  streakWeeks: number;
  deadline: string;
  gradient: [string, string];
  glow: string;
  squad: string[]; // avatar emoji of friends saving toward the same goal
  contributions: Contribution[];
};

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  goal: string;
  progress: number; // 0..1
  color: string;
};

export const SOURCE_META: Record<
  ContributionSource,
  { icon: string; tint: string }
> = {
  auto: { icon: "🔁", tint: "#6C5CE7" },
  roundup: { icon: "🪙", tint: "#22D3EE" },
  skip: { icon: "🍜", tint: "#FF7A2F" },
  boost: { icon: "⚡", tint: "#B8FF3C" },
};

export const GOALS: Goal[] = [
  {
    id: "goa",
    name: "Goa Trip",
    emoji: "🏝️",
    target: 80000,
    saved: 61200,
    weeklyAutoSave: 2500,
    streakWeeks: 12,
    deadline: "Dec 2026",
    gradient: ["#FF8A3D", "#FF3D77"],
    glow: "rgba(255,90,120,0.55)",
    squad: ["🦊", "🐼", "🐨"],
    contributions: [
      { id: "g1", source: "skip", label: "Cooked instead of ordering", amount: 320, daysAgo: 0 },
      { id: "g2", source: "roundup", label: "Round-ups · 9 spends", amount: 148, daysAgo: 1 },
      { id: "g3", source: "auto", label: "Friday auto-stash", amount: 2500, daysAgo: 2 },
      { id: "g4", source: "skip", label: "Skipped 2 late-night orders", amount: 540, daysAgo: 4 },
      { id: "g5", source: "boost", label: "Manual boost", amount: 1000, daysAgo: 6 },
    ],
  },
  {
    id: "iphone",
    name: "iPhone 17 Pro",
    emoji: "📱",
    target: 134900,
    saved: 42800,
    weeklyAutoSave: 3000,
    streakWeeks: 7,
    deadline: "Mar 2027",
    gradient: ["#6C5CE7", "#22D3EE"],
    glow: "rgba(108,92,231,0.55)",
    squad: ["🐯"],
    contributions: [
      { id: "i1", source: "auto", label: "Friday auto-stash", amount: 3000, daysAgo: 2 },
      { id: "i2", source: "roundup", label: "Round-ups · 14 spends", amount: 232, daysAgo: 2 },
      { id: "i3", source: "skip", label: "Cooked all week 🔥", amount: 1180, daysAgo: 3 },
    ],
  },
  {
    id: "emergency",
    name: "Rainy Day Fund",
    emoji: "🛟",
    target: 50000,
    saved: 47500,
    weeklyAutoSave: 1500,
    streakWeeks: 21,
    deadline: "Ongoing",
    gradient: ["#14E8A0", "#0BA5EC"],
    glow: "rgba(20,232,160,0.5)",
    squad: [],
    contributions: [
      { id: "e1", source: "auto", label: "Weekly safety net", amount: 1500, daysAgo: 1 },
      { id: "e2", source: "roundup", label: "Round-ups · 6 spends", amount: 96, daysAgo: 3 },
      { id: "e3", source: "skip", label: "Meal-prep Sunday", amount: 410, daysAgo: 5 },
    ],
  },
];

export const FRIENDS: Friend[] = [
  { id: "aarav", name: "Aarav", avatar: "🦊", goal: "Goa Trip", progress: 0.82, color: "#FF8A3D" },
  { id: "diya", name: "Diya", avatar: "🐼", goal: "MacBook Air", progress: 0.54, color: "#6C5CE7" },
  { id: "kabir", name: "Kabir", avatar: "🐨", goal: "Goa Trip", progress: 0.4, color: "#22D3EE" },
];

// XP model: every ₹ saved is 1 XP. A level is 25k XP. Simple, legible, and it
// means completing a goal always visibly moves the level bar.
export const XP_PER_LEVEL = 25000;

export function levelFromXp(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  return { level, into, toNext: XP_PER_LEVEL, pct: into / XP_PER_LEVEL };
}

/** Weeks left at the current weekly savings rate → a projected finish date. */
export function weeksToGoal(goal: Goal) {
  const remaining = Math.max(0, goal.target - goal.saved);
  if (goal.weeklyAutoSave <= 0) return Infinity;
  return Math.ceil(remaining / goal.weeklyAutoSave);
}
