import type { ContributionSource } from "../data";

/* ----------------------------------------------------------------------------
 * Stash categories — how the money was saved, not what it would have been
 * spent on.
 *
 * One source of truth, shared by the Add-money chips and the ledger rows, so a
 * stash shows the same icon in both places. Each entry also carries the
 * ContributionSource it maps to, which keeps the derived data honest (a
 * "Cooked in" stash really is a `skip`).
 *
 * Icons and insets come from the M-Icon system library; the files under
 * public/icons are the exact exports, rendered through MaskIcon so they can
 * take the colour of whatever they sit in.
 * --------------------------------------------------------------------------*/

export type Category = {
  id: string;
  label: string;
  icon: string;
  inset: string;
  source: ContributionSource;
};

export const CATEGORIES: Category[] = [
  {
    id: "cooked",
    label: "Cooked in",
    icon: "/icons/cat-cooked.svg", // delivery-box-cross-circle: an order you didn't place
    inset: "10.86% 5.21% 5.2% 10.86%",
    source: "skip",
  },
  {
    id: "cab",
    label: "Skipped cab",
    icon: "/icons/cat-ride.svg", // direction: a trip you didn't take
    inset: "11.82% 11.81% 6% 6.01%",
    source: "skip",
  },
  {
    id: "roundup",
    label: "Round-ups",
    icon: "/icons/cat-roundup.svg", // currency-note-wave
    inset: "18.23% 5.2% 17.96% 5.21%",
    source: "roundup",
  },
  {
    id: "cashback",
    label: "Cashback",
    icon: "/icons/cat-cashback.svg", // payment-receive: money coming back
    inset: "13.54% 9.37% 17.71% 9.38%",
    source: "boost",
  },
  {
    id: "bonus",
    label: "Bonus",
    icon: "/icons/cat-bonus.svg", // star
    inset: "13.5% 13.55% 13.65% 13.57%",
    source: "boost",
  },
  {
    id: "others",
    label: "Others",
    icon: "/icons/cat-other.svg", // category
    inset: "11.46% 15.63% 13.54% 15.63%",
    source: "boost",
  },
];

export function categoryById(id?: string) {
  return id ? CATEGORIES.find((c) => c.id === id) : undefined;
}
