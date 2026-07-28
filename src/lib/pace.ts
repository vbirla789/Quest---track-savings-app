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

/** One bad goal drags the headline down; every goal ahead lifts it. */
export function overallPace(goals: Goal[]): Pace {
  const active = goals.filter((g) => g.saved < g.target);
  if (active.length === 0) return "ahead";
  const paces = active.map(paceOf);
  if (paces.includes("behind")) return "behind";
  return paces.every((p) => p === "ahead") ? "ahead" : "on";
}

export const PACE_LABEL: Record<Pace, string> = {
  ahead: "Running early",
  on: "Right on pace",
  behind: "Falling behind",
};

/**
 * Contributions bucketed by day, oldest first.
 *
 * Daily rather than weekly on purpose: the seeded ledger spans about a week, so
 * weekly buckets collapse into a single spike with nine empty columns beside it.
 * A day-level window is the largest one this data can actually fill.
 */
export function dailyTotals(goals: Goal[], days = 14): number[] {
  const buckets = new Array(days).fill(0);
  for (const goal of goals) {
    for (const c of goal.contributions) {
      if (c.daysAgo < days) buckets[days - 1 - c.daysAgo] += c.amount;
    }
  }
  return buckets;
}
