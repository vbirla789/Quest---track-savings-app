import { motion } from "framer-motion";
import { inrPlain } from "../lib/format";
import type { MonthBucket } from "../lib/pace";

/* ----------------------------------------------------------------------------
 * Progress chart — Figma node 12048:82481.
 *
 * Five calendar months in #e6e6e6 plus the current month outlined in black, an
 * average line pinned across the completed months, and a callout on the current
 * bar. Everything is positioned from the data: the average line's height is the
 * average, the callout sits on top of whatever the current bar measures.
 * --------------------------------------------------------------------------*/

const PLOT_H = 167;
const BAR_W = 24;

/** Compact form for the chart labels — ₹17k rather than ₹17,000. */
function short(amount: number) {
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}k`;
  return `₹${inrPlain(amount)}`;
}

export default function MonthlyChart({
  buckets,
  hidden = false,
}: {
  buckets: MonthBucket[];
  hidden?: boolean;
}) {
  const max = Math.max(...buckets.map((b) => b.amount), 1);
  const past = buckets.filter((b) => !b.recent);
  const avg = past.length ? past.reduce((s, b) => s + b.amount, 0) / past.length : 0;
  const current = buckets.find((b) => b.recent);

  const height = (amount: number) => Math.max(3, (amount / max) * PLOT_H);
  const label = (amount: number) => (hidden ? "₹•••" : short(amount));

  return (
    <div className="flex w-full flex-col items-start">
      <div className="relative w-full" style={{ height: PLOT_H }}>
        {/* Gridlines sit between the bars and overshoot the plot, as in the
            design. z-0 so the bars and overlays stay above them. */}
        {buckets.slice(1).map((_, i) => (
          <span
            key={i}
            className="absolute z-0 w-px bg-[#f0f0f0]"
            style={{
              left: `${((i + 1) / buckets.length) * 100}%`,
              top: -14,
              bottom: -25,
            }}
          />
        ))}

        <div className="relative z-10 flex h-full items-end justify-between">
          {buckets.map((b) => (
            <motion.span
              key={b.label}
              className={
                b.recent ? "shrink-0 border border-black bg-white" : "shrink-0 bg-[#e6e6e6]"
              }
              style={{ width: BAR_W }}
              initial={{ height: 0 }}
              animate={{ height: height(b.amount) }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            />
          ))}
        </div>

        {/* Average across the completed months. Stops short of the current bar —
            a month still in progress hasn't earned a comparison yet. */}
        {avg > 0 && (
          <motion.div
            className="absolute z-20 flex items-center"
            style={{ left: 0, right: `${(1 / buckets.length) * 100}%`, bottom: height(avg) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.25 }}
          >
            <span className="h-0 flex-1 border-t border-dashed border-[#02c96c]" />
            <span className="shrink-0 rounded-[23px] border border-[#02c96c] bg-white px-2 py-0.5 font-mono text-[11px] font-medium uppercase leading-[1.4] text-[#02c96c]">
              Avg {label(avg)}
            </span>
            <span className="h-0 flex-1 border-t border-dashed border-[#02c96c]" />
          </motion.div>
        )}

        {/* Callout on the current bar */}
        {current && (
          <motion.div
            className="absolute z-20 flex flex-col items-center"
            style={{
              // centre on the last bar, then lift clear of its top
              right: 0,
              width: BAR_W,
              bottom: height(current.amount) + 8,
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.25 }}
          >
            <span
              className="whitespace-nowrap rounded-[3px] bg-white px-2 py-1 font-mono text-[12px] font-medium uppercase leading-[1.4] text-black"
              style={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.25)) drop-shadow(0 1px 2px rgba(0,0,0,0.12))" }}
            >
              {label(current.amount)}
            </span>
            <img src="/icons/chart-caret.svg" alt="" className="h-[6px] w-[14px] rotate-180" />
          </motion.div>
        )}
      </div>

      <div className="flex w-full flex-col items-start gap-2 pt-0">
        <span className="h-px w-full bg-[#e6e6e6]" />
        <div className="flex w-full items-center justify-between font-mono text-[12px] font-medium uppercase leading-[1.4]">
          {buckets.map((b) => (
            <span
              key={b.label}
              className={`shrink-0 text-center ${b.recent ? "text-black" : "text-[#787878]"}`}
              style={{ width: b.recent ? undefined : BAR_W }}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
