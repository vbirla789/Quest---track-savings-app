// ---------------------------------------------------------------------------
// Mock domain model for the "Quest" savings prototype.
//
// The core question the brief raises — "how do we know how much a user is
// saving?" — is answered here by modelling every rupee as a *contribution*
// with a source. Real apps combine a few mechanics; we surface four:
//   - auto     recurring UPI autopay / mandate (e.g. ₹500 every Friday)
//   - roundup  spare change rounded up from everyday spends
//   - skip     the "Skip-to-Save" hook: skipped a food order, stashed the cash
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
  /** category id for stashes added in-app, so the ledger shows its icon */
  categoryId?: string;
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
  /** ISO yyyy-mm-dd, kept so the edit sheet can prefill the date wheel */
  targetDate?: string;
  squad: string[]; // avatar image paths of friends saving toward the same goal
  contributions: Contribution[];
};

export type Friend = {
  id: string;
  name: string;
  avatar: string; // image path
  avatarBg: string;
  goal: string;
  progress: number; // 0..1
};

export const GOALS: Goal[] = [
  {
    id: "goa",
    name: "Goa trip",
    emoji: "🏖️",
    target: 80000,
    saved: 61200,
    weeklyAutoSave: 2500,
    streakWeeks: 12,
    deadline: "Dec 2026",
    targetDate: "2026-12-15",
    squad: ["/avatars/arthur.png", "/avatars/wei.png", "/avatars/natalia.png"],
    contributions: [
      { id: "g1", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 320, daysAgo: 0 },
      { id: "g2", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 148, daysAgo: 1 },
      { id: "g3", categoryId: "cab", source: "skip", label: "Skipped cab", amount: 540, daysAgo: 2 },
      { id: "g4", categoryId: "cashback", source: "boost", label: "Cashback", amount: 1000, daysAgo: 4 },
      { id: "g5", categoryId: "bonus", source: "boost", label: "Bonus", amount: 2500, daysAgo: 6 },
    ],
  },
  {
    id: "iphone",
    name: "iPhone 17 pro",
    emoji: "📱",
    target: 134900,
    saved: 42800,
    weeklyAutoSave: 3000,
    streakWeeks: 8,
    deadline: "Mar 2027",
    targetDate: "2027-03-15",
    squad: ["/avatars/wei.png"],
    contributions: [
      { id: "i1", categoryId: "bonus", source: "boost", label: "Bonus", amount: 3000, daysAgo: 1 },
      { id: "i2", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 232, daysAgo: 2 },
      { id: "i3", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 1180, daysAgo: 3 },
      { id: "i4", categoryId: "cab", source: "skip", label: "Skipped cab", amount: 260, daysAgo: 5 },
    ],
  },
  {
    id: "emergency",
    name: "Rainy day fund",
    emoji: "🛟",
    target: 50000,
    saved: 47500,
    weeklyAutoSave: 1500,
    streakWeeks: 21,
    deadline: "Ongoing",
    squad: [],
    contributions: [
      { id: "e1", categoryId: "cashback", source: "boost", label: "Cashback", amount: 1500, daysAgo: 1 },
      { id: "e2", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 96, daysAgo: 3 },
      { id: "e3", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 410, daysAgo: 5 },
    ],
  },
];

export const FRIENDS: Friend[] = [
  { id: "aarav", name: "Aarav", avatar: "/avatars/arthur.png", avatarBg: "#c0d5ff", goal: "Goa trip", progress: 0.9 },
  { id: "diya", name: "Diya", avatar: "/avatars/natalia.png", avatarBg: "#c0eaff", goal: "MacBook Air", progress: 0.54 },
  { id: "kabir", name: "Kabir", avatar: "/avatars/wei.png", avatarBg: "#e1e4ea", goal: "Goa trip", progress: 0.4 },
];

// XP model: every ₹ saved is 1 XP. A level is 20k XP. Simple, legible, and it
// means completing a goal always visibly moves the level bar.
export const XP_PER_LEVEL = 20000;

export function levelFromXp(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL);
  const into = xp % XP_PER_LEVEL;
  return { level, into, toNext: XP_PER_LEVEL, pct: into / XP_PER_LEVEL };
}

/** Weeks left at the current weekly savings rate → a projected finish date. */
export function weeksToGoal(goal: Goal) {
  const remaining = Math.max(0, goal.target - goal.saved);
  if (goal.weeklyAutoSave <= 0) return Infinity;
  return Math.ceil(remaining / goal.weeklyAutoSave);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Days until the deadline. Goals created in-app carry a `targetDate`; for an
 * open-ended goal we fall back to the projection off the current saving rate,
 * so the card always has something honest to show.
 */
export function daysToGoal(goal: Goal) {
  if (goal.targetDate) {
    return Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / DAY_MS));
  }
  const weeks = weeksToGoal(goal);
  return weeks === Infinity ? Infinity : weeks * 7;
}
