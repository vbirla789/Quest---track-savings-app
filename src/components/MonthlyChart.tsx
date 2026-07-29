import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { inrPlain } from "../lib/format";
import type { MonthBucket } from "../lib/pace";

/* ----------------------------------------------------------------------------
 * Progress chart — Figma node 12048:82481.
 *
 * Months in #e6e6e6 with the selected one outlined in black, an average line
 * across the completed months, and a callout on the selection. Everything is
 * positioned from the data: the average line sits at the average, the callout
 * rides whatever the selected bar measures.
 *
 * The strip scrolls horizontally through the full history and the indicator
 * underneath is a real scrollbar — it reports position and can be dragged.
 * --------------------------------------------------------------------------*/

const PLOT_H = 167;
const BAR_W = 24;
/** Six columns fill the 335px column, so the rest is reachable by scrolling. */
const COL_W = 56;

/** Compact form for the chart labels — ₹17k rather than ₹17,000. */
function short(amount: number) {
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}k`;
  return `₹${inrPlain(amount)}`;
}

export default function MonthlyChart({
  buckets,
  selected,
  onSelect,
  hidden = false,
}: {
  buckets: MonthBucket[];
  selected: number;
  onSelect: (index: number) => void;
  hidden?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(1);

  const max = Math.max(...buckets.map((b) => b.amount), 1);
  const past = buckets.filter((b) => !b.recent && b.amount > 0);
  const avg = past.length ? past.reduce((s, b) => s + b.amount, 0) / past.length : 0;

  const height = (amount: number) => Math.max(3, (amount / max) * PLOT_H);
  const label = (amount: number) => (hidden ? "₹•••" : short(amount));

  /* Opens on the recent end, then keeps the thumb in sync. A native listener
     rather than React's onScroll prop — that didn't fire for programmatic
     scrollLeft changes, which is exactly what dragging the indicator does. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sync = () => {
      const span = el.scrollWidth - el.clientWidth;
      setProgress(span <= 0 ? 1 : el.scrollLeft / span);
    };
    el.scrollLeft = el.scrollWidth;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    return () => el.removeEventListener("scroll", sync);
  }, [buckets.length]);

  /** Drag the indicator to scroll — the strip is also swipeable directly. */
  const drag = (e: React.PointerEvent) => {
    const track = trackRef.current;
    const el = scrollRef.current;
    if (!track || !el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (clientX: number) => {
      const rect = track.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      el.scrollLeft = t * (el.scrollWidth - el.clientWidth);
      /* Move the thumb from the drag itself rather than waiting for the scroll
         event it causes — the drag already knows the fraction, and a setter-driven
         scroll doesn't always echo back an event. Swipes still come through the
         listener. */
      setProgress(t);
    };
    move(e.clientX);
    const onMove = (ev: PointerEvent) => move(ev.clientX);
    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
  };

  const stripW = buckets.length * COL_W;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div ref={scrollRef} className="phone-scroll w-full overflow-x-auto">
        <div className="relative" style={{ width: stripW }}>
          <div className="relative" style={{ height: PLOT_H }}>
            {/* Dotted gridlines on every column boundary, overshooting the plot. */}
            {buckets.map((_, i) =>
              i === 0 ? null : (
                <span
                  key={i}
                  className="absolute z-0 border-l border-dotted border-[#d8d8d8]"
                  style={{ left: i * COL_W, top: -14, bottom: -25 }}
                />
              ),
            )}

            {buckets.map((b, i) => (
              <button
                key={b.label}
                onClick={() => onSelect(i)}
                aria-label={`${b.label}: ${label(b.amount)}`}
                className="absolute bottom-0 top-0 z-10 flex items-end justify-center"
                style={{ left: i * COL_W, width: COL_W }}
              >
                <motion.span
                  className={
                    i === selected
                      ? "block border border-black bg-white"
                      : "block bg-[#e6e6e6]"
                  }
                  style={{ width: BAR_W }}
                  initial={{ height: 0 }}
                  animate={{ height: height(b.amount) }}
                  transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                />
              </button>
            ))}

            {/* Average across the completed months, drawn the full width of the
                strip as the design has it — a reference line you read against
                every column, including the one still filling. */}
            {avg > 0 && (
              <div
                className="absolute z-20 flex items-center"
                style={{ left: 0, width: stripW, bottom: height(avg) }}
              >
                <span className="h-0 flex-1 border-t border-dotted border-[#02c96c]" />
                {/* Sticky: centred across twelve months the pill spends most of
                    its life off screen, so it pins to the viewport edge instead
                    of scrolling away from the line it labels. */}
                <span className="sticky left-3 right-3 shrink-0 rounded-[23px] border border-[#02c96c] bg-white px-2 py-0.5 font-mono text-[11px] font-medium uppercase leading-[1.4] text-[#02c96c]">
                  Avg {label(avg)}
                </span>
                <span className="h-0 flex-1 border-t border-dotted border-[#02c96c]" />
              </div>
            )}

            {/* Callout on the selection. shrink-0 on both children matters: a
                flex item narrower than its text shrinks to the column and the
                nowrap label spills to one side, which knocked the caret off
                centre. */}
            <motion.div
              className="pointer-events-none absolute z-30 flex flex-col items-center"
              style={{ width: COL_W, bottom: height(buckets[selected].amount) + 8 }}
              animate={{ left: selected * COL_W }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            >
              <span
                className="-mb-[3px] shrink-0 whitespace-nowrap rounded-[3px] bg-white px-2 py-1 font-mono text-[12px] font-medium uppercase leading-[1.4] text-black"
                style={{
                  filter:
                    "drop-shadow(0 1px 0 rgba(0,0,0,0.25)) drop-shadow(0 1px 2px rgba(0,0,0,0.12))",
                }}
              >
                {label(buckets[selected].amount)}
              </span>
              <img
                src="/icons/chart-caret.svg"
                alt=""
                className="h-[6px] w-[14px] shrink-0 rotate-180"
              />
            </motion.div>
          </div>

          <div className="flex flex-col items-start gap-2 pt-0">
            <span className="w-full border-t border-dotted border-[#d8d8d8]" />
            <div className="relative h-[17px] w-full">
              {buckets.map((b, i) => (
                <span
                  key={b.label}
                  className={`absolute text-center font-mono text-[12px] font-medium uppercase leading-[1.4] ${
                    i === selected ? "text-black" : "text-[#787878]"
                  }`}
                  style={{ left: i * COL_W, width: COL_W }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator — draggable, and its thumb reports real position. */}
      <div
        ref={trackRef}
        onPointerDown={drag}
        className="h-[5px] w-[30px] cursor-grab overflow-hidden bg-[#eee] active:cursor-grabbing"
        role="scrollbar"
        aria-controls="progress-strip"
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full w-[8px] bg-black"
          style={{ transform: `translateX(${progress * 22}px)` }}
        />
      </div>
    </div>
  );
}
