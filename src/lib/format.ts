const inr0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** ₹80,000 — Indian digit grouping, no paise. */
export function inr(n: number) {
  return inr0.format(Math.round(n));
}

/** 80,000 without the symbol, for when we render ₹ separately at a big size. */
export function inrPlain(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(n),
  );
}

export function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}
