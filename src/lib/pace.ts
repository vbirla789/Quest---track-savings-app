import type { Goal } from "../data";
import { parseLocalDate } from "./dates";

/* ----------------------------------------------------------------------------
 * Pace: are you ahead of, on, or behind the schedule your own deadline implies?
 *
 * This is what the Overview screen colours everything by — the card wash, the
 * bar gradient, the percentage, and the health line under the total. Percent
 * alone can't carry it: 32% is excellent with two years left and alarming with
 * two months.
 * --------------------------------------------------------------------------*/

export type Pace = "ahead" | "on" | "behind";

const DAY = 86_400_000;
const WEEK = 7 * DAY;

/**
 * Where the goal *should* be by now.
 *
 * The model has no created-at, so `streakWeeks` stands in for time elapsed —
 * "weeks you've been saving into this" is the honest equivalent, and it's the
 * one field that already tracks it.
 */
export function expectedByNow(goal: Goal): number | null {
  if (!goal.targetDate) return null;
  const weeksLeft = Math.max(0, (parseLocalDate(goal.targetDate).getTime() - Date.now()) / WEEK);
  const elapsed = Math.max(1, goal.streakWeeks);
  return goal.target * (elapsed / (elapsed + weeksLeft));
}

export function paceOf(goal: Goal): Pace {
  const expected = expectedByNow(goal);
  // an open-ended goal has no pace to be off — treat it as simply on track
  if (expected === null) return "on";
  if (expected <= 0) return goal.saved >= goal.target ? "ahead" : "behind";
  const ratio = goal.saved / expected;
  if (ratio >= 1.05) return "ahead";
  if (ratio >= 0.95) return "on";
  return "behind";
}

/** Rupees short of the pace line. Zero once you're at or past it. */
export function behindBy(goal: Goal): number {
  const expected = expectedByNow(goal);
  if (expected === null) return 0;
  return Math.max(0, Math.round(expected - goal.saved));
}

/**
 * One rule for time across the whole product: an absolute date beyond a month
 * out, a countdown inside it. Nobody can feel "232 days", and "by 15 Dec"
 * carries no urgency when it's next week.
 */
export function timeLabel(goal: Goal): string {
  if (!goal.targetDate) return "Ongoing";
  const days = Math.max(0, Math.ceil((parseLocalDate(goal.targetDate).getTime() - Date.now()) / DAY));
  if (days === 0) return "Due today";
  if (days <= 30) return `${days} day${days === 1 ? "" : "s"} left`;
  return `by ${parseLocalDate(goal.targetDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
}

/** Full target date — "15 Dec 2026" — for the detail hero. */
export function targetDateLabel(goal: Goal): string {
  if (!goal.targetDate) return "Ongoing";
  return parseLocalDate(goal.targetDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** One bad goal drags the headline down; every goal ahead lifts it. */
export function overallPace(goals: Goal[]): Pace {
  const active = goals.filter((g) => g.saved < g.target);
  if (active.length === 0) return "ahead";
  const paces = active.map(paceOf);
  if (paces.includes("behind")) return "behind";
  return paces.every((p) => p === "ahead") ? "ahead" : "on";
}

/* Copy and palette from the Financial health component (node 12047:82461).
   Deliberately not the card palette — the cards read green/amber/blue for
   progress, this reads purple/blue/red for status, and the design keeps them
   separate. */
export const PACE_LABEL: Record<Pace, string> = {
  ahead: "Well ahead",
  on: "Right on pace",
  behind: "Slipping back",
};

/* The other vocabulary: green/amber/blue for *progress*, used by the goal cards
   and the detail hero. Shared so tapping a green card can't open a purple hero. */
export const PACE_CARD: Record<Pace, { text: string; from: string; to: string; wash: string }> = {
  ahead: { text: "#00c86a", from: "#5ee7b7", to: "#00c86a", wash: "#edfcf7" },
  on: { text: "#0a59ff", from: "#b8cbf4", to: "#0a59ff", wash: "#edf2fd" },
  behind: { text: "#f9ca4d", from: "#f7eaca", to: "#f9ca4d", wash: "#fdf9ef" },
};

export const PACE_PILL: Record<Pace, { text: string; dot: string; halo: string }> = {
  ahead: { text: "#6417d9", dot: "#9459ee", halo: "rgba(100,23,217,0.3)" },
  on: { text: "#0a59ff", dot: "#3b82f6", halo: "rgba(59,130,246,0.3)" },
  behind: { text: "#f01600", dot: "#ff5847", halo: "rgba(240,22,0,0.3)" },
};

/** Total stashed in the last `days` days, across every goal. */
export function recentTotal(goals: Goal[], days = 14): number {
  let sum = 0;
  for (const goal of goals) {
    for (const c of goal.contributions) if (c.daysAgo < days) sum += c.amount;
  }
  return sum;
}

export type MonthBucket = { label: string; amount: number; recent: boolean };

/**
 * Calendar months, oldest first, with the current month last and labelled
 * RECENT — the shape the Progress chart draws.
 *
 * Bucketed on the real calendar rather than fixed 30-day windows, so a bar
 * labelled MAR contains exactly what March contains.
 */
export function monthlyTotals(goals: Goal[], months = 12): MonthBucket[] {
  const now = new Date();
  const slots = new Map<string, number>();
  const buckets: MonthBucket[] = [];

  for (let back = months - 1; back >= 0; back--) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    slots.set(`${d.getFullYear()}-${d.getMonth()}`, buckets.length);
    buckets.push({
      /* Sliced to three: en-GB abbreviates September as "Sept", which is one
         character wider than every other label and breaks the axis rhythm. */
      label:
        back === 0
          ? "RECENT"
          : d.toLocaleDateString("en-GB", { month: "short" }).slice(0, 3).toUpperCase(),
      amount: 0,
      recent: back === 0,
    });
  }

  for (const goal of goals) {
    for (const c of goal.contributions) {
      const d = new Date();
      d.setDate(d.getDate() - c.daysAgo);
      const slot = slots.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (slot !== undefined && slot !== buckets.length - 1) buckets[slot].amount += c.amount;
    }
  }
  /* RECENT is the same 14-day window the headline reports, not the calendar
     month to date — otherwise the bar and the number above it disagree. */
  buckets[buckets.length - 1].amount = recentTotal(goals, 14);
  return buckets;
}

/* ---------------------------------------------------------------------------
 * Goal detail derivations — Figma node 36:348 (unBox benchmarking).
 * -------------------------------------------------------------------------*/

export type Milestone = { amount: number; level: number; earned: boolean };

/** Quarter, half, whole — the thresholds the design marks out. */
export function milestones(goal: Goal): Milestone[] {
  return [0.25, 0.5, 1].map((f, i) => ({
    amount: Math.round(goal.target * f),
    level: i + 1,
    earned: goal.saved >= goal.target * f,
  }));
}

export type StreakMonth = { label: string; hit: boolean; current: boolean };

/**
 * Did this goal receive anything in each of the last `count` months?
 *
 * The grid is real history rather than decoration, which also means the streak
 * count below it can be derived instead of asserted.
 */
export function streakMonths(goal: Goal, count = 12): StreakMonth[] {
  const now = new Date();
  const out: StreakMonth[] = [];
  for (let back = count - 1; back >= 0; back--) {
    const month = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const hit = goal.contributions.some((c) => {
      const d = new Date();
      d.setDate(d.getDate() - c.daysAgo);
      return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
    });
    out.push({
      label: month.toLocaleDateString("en-GB", { month: "short" }).slice(0, 3).toUpperCase(),
      hit,
      current: back === 0,
    });
  }
  return out;
}

/** Consecutive months with a contribution, counting back from the last one. */
export function streakLength(goal: Goal): number {
  const months = streakMonths(goal, 24);
  let run = 0;
  for (let i = months.length - 1; i >= 0; i--) {
    if (months[i].hit) run++;
    else if (run > 0 || !months[i].current) break;
  }
  return run;
}

export type SavedGroup = {
  label: string;
  colour: string;
  halo: string;
  amount: number;
  count: number;
  share: number;
};

/**
 * "How you have saved it" — three groups by how the money arrived.
 *
 * Shares are computed from the amounts so the column adds to 100%, and the
 * groups are sorted largest first.
 */
export function savedBreakdown(goal: Goal): SavedGroup[] {
  const defs = [
    { label: "Weekly cycle", sources: ["auto"], colour: "#9459ee", halo: "rgba(100,23,217,0.3)" },
    { label: "Bonus Add on", sources: ["boost"], colour: "#3b82f6", halo: "rgba(59,130,246,0.3)" },
    { label: "Others", sources: ["skip", "roundup"], colour: "#f9ca51", halo: "rgba(249,202,81,0.3)" },
  ] as const;

  const total = goal.contributions.reduce((s, c) => s + c.amount, 0) || 1;
  return defs
    .map((d) => {
      const rows = goal.contributions.filter((c) => (d.sources as readonly string[]).includes(c.source));
      const amount = rows.reduce((s, c) => s + c.amount, 0);
      return {
        label: d.label,
        colour: d.colour,
        halo: d.halo,
        amount,
        count: rows.length,
        share: (amount / total) * 100,
      };
    })
    .filter((g) => g.count > 0)
    .sort((a, b) => b.amount - a.amount);
}
