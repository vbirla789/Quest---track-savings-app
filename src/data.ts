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

import { parseLocalDate, toLocalISO } from "./lib/dates";

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

/** How often the user intends to pay in. Drives the streak grid's granularity. */
export type Cycle = "daily" | "weekly" | "monthly";

export type Goal = {
  id: string;
  name: string;
  cycle: Cycle;
  target: number;
  saved: number;
  /** recurring weekly auto-save that funds the "on track" projection */
  weeklyAutoSave: number;
  streakWeeks: number;
  /** ISO yyyy-mm-dd, kept so the edit sheet can prefill the date wheel */
  targetDate?: string;
  squad: SquadMember[]; // friends saving toward the same goal
  contributions: Contribution[];
};

/**
 * A squad member is a name plus an optional photo — contacts picked from the
 * phone often have no picture, and the avatar falls back to initials the way iOS
 * does. Storing bare image paths couldn't express that.
 */
export type SquadMember = { name: string; avatar?: string };

export type Friend = {
  id: string;
  name: string;
  avatar: string; // image path
  avatarBg: string;
  goal: string;
  progress: number; // 0..1
};

/**
 * Deadlines are relative, not literal dates.
 *
 * Hardcoding "2026-08-07" means the card reads "9 days left" today, "3 days
 * left" next week, and "Due today" after that — the seeded pace states quietly
 * rot. Anchoring to now keeps the demo saying what the design says.
 */
function inDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalISO(d);
}

/**
 * The recurring autopay, one row per month.
 *
 * `weeklyAutoSave` existed on the model but never appeared in the ledger, so the
 * "Weekly cycle" group read as empty and the streak grid had holes in months the
 * user was demonstrably saving. One row a month keeps the list short.
 */
function autoSaves(prefix: string, monthly: number, months: number): Contribution[] {
  return Array.from({ length: months }, (_, i) => ({
    id: `${prefix}-auto-${i}`,
    source: "auto" as const,
    label: "Weekly cycle",
    amount: monthly,
    daysAgo: daysAgoIn(i + 1, 2),
  }));
}

/**
 * Days between today and the given day of a month N months back.
 *
 * The Progress chart buckets on the real calendar, so history has to be anchored
 * to months rather than to a fixed `daysAgo`. Hardcoding 45 would drift between
 * MAY and JUN depending on when you open the app.
 */
function daysAgoIn(monthsBack: number, day: number) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const then = new Date(now.getFullYear(), now.getMonth() - monthsBack, day);
  return Math.max(0, Math.round((today.getTime() - then.getTime()) / 86_400_000));
}

const LADAKH_DUE = inDays(9);
const IPHONE_DUE = inDays(24);
const GOA_DUE = inDays(139);

/* Copy and figures match Figma node 12045:71457. streakWeeks is also what the
   pace maths reads as time elapsed, so each goal is tuned to land in a distinct
   state: Ladakh ahead, iPhone behind, Goa exactly on pace. */
export const GOALS: Goal[] = [
  {
    id: "ladakh",
    cycle: "monthly",
    name: "Ladakh ride",
    target: 50000,
    saved: 43500,
    weeklyAutoSave: 2500,
    streakWeeks: 5,
    targetDate: LADAKH_DUE,
    squad: [],
    contributions: [
      { id: "l1", categoryId: "cashback", source: "boost", label: "Cashback", amount: 1500, daysAgo: 1 },
      { id: "l2", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 96, daysAgo: 3 },
      { id: "l3", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 410, daysAgo: 5 },
      { id: "l4", categoryId: "bonus", source: "boost", label: "Bonus", amount: 4200, daysAgo: daysAgoIn(1, 18) },
      { id: "l5", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 1840, daysAgo: daysAgoIn(1, 6) },
      { id: "l6", categoryId: "cab", source: "skip", label: "Skipped cab", amount: 960, daysAgo: daysAgoIn(2, 21) },
      { id: "l7", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 640, daysAgo: daysAgoIn(3, 12) },
      { id: "l8", categoryId: "cashback", source: "boost", label: "Cashback", amount: 2100, daysAgo: daysAgoIn(4, 9) },
      { id: "l9", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 1250, daysAgo: daysAgoIn(5, 15) },
      { id: "l10", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 520, daysAgo: daysAgoIn(6, 17) },
      { id: "l11", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 780, daysAgo: daysAgoIn(7, 8) },
      { id: "l12", categoryId: "cashback", source: "boost", label: "Cashback", amount: 430, daysAgo: daysAgoIn(9, 23) },
      ...autoSaves("l", 2400, 11),
    ],
  },
  {
    id: "iphone",
    cycle: "monthly",
    name: "iPhone 17 pro",
    target: 134900,
    saved: 32400,
    weeklyAutoSave: 3000,
    streakWeeks: 8,
    targetDate: IPHONE_DUE,
    squad: [],
    contributions: [
      { id: "i1", categoryId: "bonus", source: "boost", label: "Bonus", amount: 3000, daysAgo: 1 },
      { id: "i2", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 232, daysAgo: 2 },
      { id: "i3", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 1180, daysAgo: 3 },
      { id: "i4", categoryId: "cab", source: "skip", label: "Skipped cab", amount: 260, daysAgo: 5 },
      { id: "i5", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 2600, daysAgo: daysAgoIn(1, 24) },
      { id: "i6", categoryId: "cashback", source: "boost", label: "Cashback", amount: 3400, daysAgo: daysAgoIn(1, 11) },
      { id: "i7", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 720, daysAgo: daysAgoIn(2, 8) },
      { id: "i8", categoryId: "bonus", source: "boost", label: "Bonus", amount: 5000, daysAgo: daysAgoIn(3, 27) },
      { id: "i9", categoryId: "cab", source: "skip", label: "Skipped cab", amount: 1180, daysAgo: daysAgoIn(4, 19) },
      { id: "i10", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 2250, daysAgo: daysAgoIn(5, 4) },
      { id: "i11", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 610, daysAgo: daysAgoIn(6, 5) },
      { id: "i12", categoryId: "bonus", source: "boost", label: "Bonus", amount: 1900, daysAgo: daysAgoIn(8, 14) },
      { id: "i13", categoryId: "cab", source: "skip", label: "Skipped cab", amount: 540, daysAgo: daysAgoIn(10, 2) },
      ...autoSaves("i", 2000, 11),
    ],
  },
  {
    id: "goa",
    cycle: "monthly",
    name: "Goa trip",
    target: 50000,
    saved: 25000,
    weeklyAutoSave: 2500,
    streakWeeks: 20,
    targetDate: GOA_DUE,
    squad: [
      { name: "Aarav", avatar: "/avatars/arthur.png" },
      { name: "Kabir", avatar: "/avatars/wei.png" },
      { name: "Diya", avatar: "/avatars/natalia.png" },
    ],
    contributions: [
      { id: "g1", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 320, daysAgo: 0 },
      { id: "g2", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 148, daysAgo: 1 },
      { id: "g3", categoryId: "cab", source: "skip", label: "Skipped cab", amount: 540, daysAgo: 2 },
      { id: "g4", categoryId: "cashback", source: "boost", label: "Cashback", amount: 1000, daysAgo: 4 },
      { id: "g5", categoryId: "bonus", source: "boost", label: "Bonus", amount: 2500, daysAgo: 6 },
      { id: "g6", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 2900, daysAgo: daysAgoIn(1, 20) },
      { id: "g7", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 830, daysAgo: daysAgoIn(2, 14) },
      { id: "g8", categoryId: "cashback", source: "boost", label: "Cashback", amount: 1600, daysAgo: daysAgoIn(2, 3) },
      { id: "g9", categoryId: "bonus", source: "boost", label: "Bonus", amount: 3800, daysAgo: daysAgoIn(3, 22) },
      { id: "g10", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 1450, daysAgo: daysAgoIn(4, 26) },
      { id: "g11", categoryId: "cab", source: "skip", label: "Skipped cab", amount: 2050, daysAgo: daysAgoIn(5, 10) },
      { id: "g12", categoryId: "cooked", source: "skip", label: "Cooked in", amount: 900, daysAgo: daysAgoIn(7, 19) },
      { id: "g13", categoryId: "roundup", source: "roundup", label: "Round-ups", amount: 340, daysAgo: daysAgoIn(9, 6) },
      { id: "g14", categoryId: "cashback", source: "boost", label: "Cashback", amount: 1100, daysAgo: daysAgoIn(11, 12) },
      ...autoSaves("g", 1500, 11),
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
    return Math.max(0, Math.ceil((parseLocalDate(goal.targetDate).getTime() - Date.now()) / DAY_MS));
  }
  const weeks = weeksToGoal(goal);
  return weeks === Infinity ? Infinity : weeks * 7;
}

/**
 * Stand-in for the phone's address book, for the contact picker.
 *
 * Most entries deliberately have no photo — that's the common case, and it's
 * what exercises the initials fallback.
 */
export const CONTACTS: SquadMember[] = [
  { name: "Aarav Mehta", avatar: "/avatars/arthur.png" },
  { name: "Ananya Rao" },
  { name: "Devika Nair" },
  { name: "Diya Kapoor", avatar: "/avatars/natalia.png" },
  { name: "Ishaan Verma" },
  { name: "Kabir Shah", avatar: "/avatars/wei.png" },
  { name: "Meera Iyer" },
  { name: "Nikhil Bose" },
  { name: "Riya Sharma" },
  { name: "Rohan Gupta" },
  { name: "Saanvi Joshi" },
  { name: "Vivaan Reddy" },
];
