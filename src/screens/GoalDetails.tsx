import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Goal } from "../data";
import { inrPlain } from "../lib/format";
import {
  PACE_CARD,
  milestones,
  paceOf,
  savedBreakdown,
  CYCLE_NOUN,
  cycleGrid,
  streakLength,
  streakPeriods,
  targetDateLabel,
} from "../lib/pace";
import AvatarStack from "../components/AvatarStack";
import MilestoneBadge from "../components/MilestoneBadge";
import StatusBar from "../components/StatusBar";
import SysIcon from "../components/SysIcon";

/* ----------------------------------------------------------------------------
 * Goal detail — Figma node 36:348 (unBox benchmarking).
 *
 * Reads state → journey → rhythm → source, top to bottom: where you are, the
 * milestones between here and done, the months you kept it up, and how the money
 * arrived. The per-transaction ledger is gone; the counts in the breakdown are
 * the way into it.
 * --------------------------------------------------------------------------*/

const MONO = "font-mono text-[14px] font-medium leading-[1.4]";
const MUTED = "font-mono text-[12px] font-medium leading-[1.4] text-[#a3a3a3]";
const H2 = "font-serif text-[20px] font-medium leading-[1.3]";

/** The streak check, and so the width of one cell in the grid. */
const CHECK = 24;

/**
 * The streak tint: a band from the first check that landed in the row to the
 * last, sitting 2px inside each of them.
 *
 * It needs a left offset, not just a width. Anchoring it at the row's left edge
 * works for the design's own rows, which both start on a hit — but a goal whose
 * only contribution is today would have painted the band across four days that
 * never landed to reach the one that did.
 *
 * Kept as a calc rather than a percentage because the cells are a fixed 24px
 * with the leftover distributed between them, so no percentage of the row lands
 * on a check's edge. On the design's 319px row this gives a 73.75px pitch and a
 * full row of 315, both exactly node 51:45448.
 */
function railStyle(row: { hit: boolean }[]): { left: number | string; width: number | string } {
  const first = row.findIndex((m) => m.hit);
  if (first < 0) return { left: 0, width: 0 };
  let last = first;
  row.forEach((m, i) => {
    if (m.hit) last = i;
  });
  const span = CHECK - 4;
  if (row.length < 2) return { left: 2, width: span };
  const pitch = `((100% - ${CHECK * row.length}px) / ${row.length - 1} + ${CHECK}px)`;
  return {
    left: `calc(${first} * ${pitch} + 2px)`,
    width: `calc(${last - first} * ${pitch} + ${span}px)`,
  };
}

export default function GoalDetails({
  goal,
  onBack,
  onStashMoney,
  onNudgeSquad,
  onAddFriends,
  onCelebrate,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onBack: () => void;
  onStashMoney: () => void;
  onNudgeSquad: () => void;
  onAddFriends: () => void;
  onCelebrate: (level: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
  const pace = paceOf(goal);
  const tone = PACE_CARD[pace];
  const marks = milestones(goal);
  const periods = streakPeriods(goal);
  const { perRow } = cycleGrid(goal.cycle);
  const streak = streakLength(goal);
  const groups = savedBreakdown(goal);
  const shared = goal.squad.length > 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* The callout has to stay inside the card, which means clamping it in pixels —
     a percentage left can't know how wide 48px of tooltip is. Measured on mount
     and on resize; the bar's width only changes with the viewport. */
  const barRef = useRef<HTMLDivElement>(null);
  const [barW, setBarW] = useState(0);

  useEffect(() => {
    const measure = () => setBarW(barRef.current?.offsetWidth ?? 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const CALLOUT_W = 48;
  const EDGE = 4;
  const calloutLeft = Math.min(
    Math.max(EDGE, (pct / 100) * barW - CALLOUT_W / 2),
    Math.max(EDGE, barW - CALLOUT_W - EDGE),
  );

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  /* The rail runs green only as far as you've actually got. The design draws it
     green through the locked node, which reads as "done" for a milestone you
     haven't reached. */
  const lastEarned = marks.reduce((acc, m, i) => (m.earned ? i : acc), -1);
  const railPct = lastEarned < 0 ? 0 : (lastEarned / (marks.length - 1)) * 100;

  /* Solid #feffff, not the dot paper: this sheet rises over the dashboard, and a
     shared texture would blur the boundary between the two surfaces. */
  return (
    <div className="relative h-full overflow-hidden bg-[#feffff] text-black">
      <div className="phone-scroll safe-top h-full overflow-y-auto pb-20">
        <StatusBar theme="light" />

        {/* header */}
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="grid size-10 place-items-center rounded-full border border-[#ebebeb] bg-white active:scale-95"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.04))" }}
          >
            <img src="/icons/lt-arrow-down.svg" alt="" className="size-5" />
          </button>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="More options"
              className="grid size-10 place-items-center rounded-full border border-[#ebebeb] bg-white active:scale-95"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.04))" }}
            >
              {/* 24px box with the glyph at the design's inset, not a 20px img:
                  the export is the bare 15x3 dots, so scaling the whole file to
                  20px squashed them into a tight cluster. */}
              <SysIcon src="/icons/lt-more.svg" inset="43.75% 18.75%" box={24} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute right-0 top-[46px] z-50 w-[168px] overflow-hidden rounded-[4px] border border-[#e6e7e7] bg-white p-1"
                  style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))" }}
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className={`${MONO} w-full rounded-[2px] px-3 py-2.5 text-left uppercase active:bg-[#f9f9fb]`}
                  >
                    Edit goal
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className={`${MONO} w-full rounded-[2px] px-3 py-2.5 text-left uppercase text-[#f01600] active:bg-[#f9f9fb]`}
                  >
                    Delete goal
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* pt-4 on top of the header's own 12px bottom padding = the 28px the
            design puts between the header and the card. */}
        <div className="flex flex-col items-center gap-10 px-5 pt-4">
          <div className="flex w-full flex-col items-center gap-8">
            {/* hero */}
            <div
              className="relative flex w-full flex-col items-start gap-6 rounded-[4px] border border-[#dbdbdb] p-4"
              style={{
                backgroundImage: `linear-gradient(99deg, #ffffff 2.5%, ${tone.wash} 104%)`,
              }}
            >
              {/* Title + bar keep their own 40px rhythm; the squad block below
                  sits 24px off it, per node 39:47617. */}
              <div className="flex w-full flex-col items-start gap-10">
              <div className="flex w-full flex-col items-center gap-4">
                <div className="flex w-full items-center justify-center gap-[15px]">
                  <span className="h-0 flex-1 border-t border-dotted border-[#d8d8d8]" />
                  <p className={MONO}>{goal.name}</p>
                  <span className="h-0 flex-1 border-t border-dotted border-[#d8d8d8]" />
                </div>
                <div className="flex flex-col items-center gap-2 whitespace-nowrap">
                  <p className="font-serif text-[38px] font-semibold leading-[1.3] tnum">
                    ₹{inrPlain(goal.saved)}
                  </p>
                  <p className={`${MONO} uppercase text-[#a3a3a3] tnum`}>
                    of ₹{inrPlain(goal.target)}
                  </p>
                </div>
              </div>

              <div ref={barRef} className="relative flex w-full flex-col gap-3">
                <div className="h-[6px] w-full bg-[#efefef]">
                  <motion.div
                    className="h-full"
                    style={{ background: `linear-gradient(to right, ${tone.from}, ${tone.to})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
                <div className={`${MONO} flex w-full items-start justify-between`}>
                  {/* Binary wording, as the design frames it — the graded
                      three-state copy stays on Overview where the status
                      component defines it. Colour follows the bar rather than the
                      wording, so an on-pace goal isn't green text over a blue
                      bar. */}
                  <p className="uppercase" style={{ color: tone.text }}>
                    {pace === "behind" ? "Off track" : "On track"}
                  </p>
                  <p className="tnum">{targetDateLabel(goal)}</p>
                </div>

                {/* callout rides the fill's end, clamped so it can't hang off
                    either edge of the card */}
                {/* bar top (32px up from the row's bottom) + the 8px gap the
                    design specifies between tooltip and bar */}
                <motion.div
                  className="pointer-events-none absolute bottom-[46px] flex flex-col items-center"
                  style={{ width: CALLOUT_W }}
                  initial={{ left: EDGE }}
                  animate={{ left: calloutLeft }}
                  transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                >
                  {/* -3px so the pill sits over the caret: drawn flush they
                      leave a visible seam where the two shadows meet. */}
                  <span
                    className="-mb-[3px] w-12 rounded-[3px] bg-white py-1 text-center font-mono text-[12px] font-medium uppercase leading-[1.4] text-black"
                    style={{
                      filter:
                        "drop-shadow(0 2px 0 rgba(0,0,0,0.25)) drop-shadow(0 1px 2px rgba(0,0,0,0.12))",
                    }}
                  >
                    {pct}%
                  </span>
                  <img
                    src="/icons/chart-caret.svg"
                    alt=""
                    className="h-[6px] w-[14px] rotate-180"
                  />
                </motion.div>
              </div>
              </div>

              {/* Squad lives inside the hero on a shared goal, with its own
                  nudge — so the action bar below can stay "add friends". */}
              {shared && (
                <div className="flex w-full flex-col items-start gap-4">
                  <span className="h-0 w-full border-t border-dotted border-[#d8d8d8]" />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AvatarStack squad={goal.squad} />
                      <div className="flex flex-col whitespace-nowrap">
                        <p className={MONO}>
                          {goal.squad.length} {goal.squad.length === 1 ? "friend" : "friends"}
                        </p>
                        <p className={MUTED}>saving with you</p>
                      </div>
                    </div>
                    <button
                      onClick={onNudgeSquad}
                      className="w-[74px] shrink-0 rounded-[2px] border border-[#c7c8c8] bg-white py-1.5 font-mono text-[12px] font-medium uppercase leading-[1.4] text-black active:scale-95"
                      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))" }}
                    >
                      Nudge
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* actions */}
            <div className="flex w-full items-center gap-3">
              <button
                onClick={onAddFriends}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[2px] border border-[#c7c8c8] bg-white px-5 active:scale-[0.99]"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
              >
                <img src="/icons/lt-add.svg" alt="" className="size-[18px]" />
                <span className={`${MONO} whitespace-nowrap uppercase`}>Add friends</span>
              </button>
              <button
                onClick={onStashMoney}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[2px] border border-[#8f8f8f] bg-black px-5 active:scale-[0.99]"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
              >
                <img src="/icons/lt-moneys.svg" alt="" className="size-[18px] -scale-x-100" />
                <span className={`${MONO} uppercase text-white`}>Add money</span>
              </button>
            </div>
          </div>

          {/* milestones */}
          <div className="flex w-full flex-col items-start gap-6">
            <h2 className={H2}>Milestones</h2>
            <div className="flex w-full pb-2.5 pt-3">
            <div className="relative flex w-full items-start gap-8">
              {/* BADGE_H / 2 - rail/2 — measured off the badge row, not the
                  padded wrapper, which is what had it riding high. */}
              <div className="absolute left-1/2 top-[26px] h-1 w-[275px] -translate-x-1/2 overflow-hidden rounded-full bg-[#ececec]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(to right, #5ee7b7, #00c86a)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${railPct}%` }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                />
              </div>
              {/* Earned milestones replay their completion screen; locked ones
                  aren't buttons at all, so there's nothing to press and nothing
                  to explain. */}
              {marks.map((m) =>
                m.earned ? (
                  <button
                    key={m.level}
                    onClick={() => onCelebrate(m.level)}
                    aria-label={`Level ${m.level} reached — ₹${inrPlain(m.amount)}`}
                    className="relative flex flex-1 flex-col items-center gap-3 active:scale-95"
                  >
                    <MilestoneBadge level={m.level} earned />
                    <p className={`${MONO} uppercase tnum`}>₹{inrPlain(m.amount)}</p>
                  </button>
                ) : (
                  <div key={m.level} className="relative flex flex-1 flex-col items-center gap-3">
                    <MilestoneBadge level={m.level} earned={false} />
                    <p className={`${MONO} uppercase tnum text-[#bdbdbd]`}>
                      ₹{inrPlain(m.amount)}
                    </p>
                  </div>
                ),
              )}
            </div>
            </div>
          </div>

          {/* streak */}
          <div className="flex w-full flex-col items-start gap-6">
            <h2 className={H2}>Streak</h2>
            <div className="flex w-full flex-col items-start gap-6">
              <div
                className="flex items-center justify-center gap-1.5 rounded-[50px] border border-[#ebebeb] bg-white px-3 py-1.5"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.04))" }}
              >
                {/* The bolt exports as a bare 9x14 glyph, so a 16px square img
                    stretched it wide. Boxed at the design's inset instead. */}
                <SysIcon src="/icons/lt-flash.svg" inset="5.21% 21.87%" box={16} />
                <p className="font-mono text-[12px] font-medium uppercase leading-[1.4]">
                  {streak} {CYCLE_NOUN[goal.cycle]} streak
                </p>
              </div>
              {/* px-2 insets the grid 8px each side of the section, which is
                  what sets the pitch: five 24px cells across the remaining
                  width. Rows are 20px apart, label to checks is 12. */}
              <div className="flex w-full flex-col items-start gap-5 px-2">
                {[periods.slice(0, perRow), periods.slice(perRow)].map((row, r) => (
                  <div key={r} className="flex w-full flex-col items-start gap-3">
                    <div className="flex w-full items-start justify-between px-1 font-mono text-[12px] font-medium uppercase leading-[1.4] text-[#b6b6b6]">
                      {row.map((m, i) => (
                        <p key={i}>{m.label}</p>
                      ))}
                    </div>
                    <div className="relative flex w-full items-center justify-between">
                      {/* The tint spans the checks that landed, 2px inside each
                          end — exactly the 315 of 319 the design has on a full
                          row. */}
                      <span
                        className="absolute top-0.5 h-5 rounded-[22px] bg-[#ecf1fd]"
                        style={railStyle(row)}
                      />
                      {row.map((m, i) => (
                        /* The check exports as a bare 19.5px glyph, so it needs
                           the 24px box and the design's 9.38% inset — a plain
                           24px img would scale the circle up to fill it. */
                        <SysIcon
                          key={i}
                          src={m.hit ? "/icons/lt-check-filled.svg" : "/icons/lt-check.svg"}
                          inset="9.38%"
                          box={24}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How the money arrived. Hidden outright until some has: the section
              is nothing but a breakdown of contributions, so on a goal with none
              it was a heading over empty space. */}
          {groups.length > 0 && (
          <div className="flex w-full flex-col items-start gap-6">
            <h2 className={H2}>Savings breakdown</h2>
            <div className="flex w-full flex-col items-start gap-4">
              {groups.map((g, i) => (
                <div key={g.label} className="flex w-full flex-col gap-4">
                  {i > 0 && (
                    <span className="h-0 w-full border-t border-dotted border-[#d8d8d8]" />
                  )}
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid size-6 place-items-center rounded-full border border-[#ebebeb] bg-white">
                        <span
                          className="flex rounded-full p-[2px]"
                          style={{ background: g.halo }}
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{
                              background: g.colour,
                              boxShadow: "inset 0 2.578px 0 0 rgba(255,255,255,0.35)",
                            }}
                          />
                        </span>
                      </span>
                      <div className="flex flex-col gap-1.5 whitespace-nowrap">
                        <p className={MONO}>{g.label}</p>
                        <p className={MUTED}>
                          {g.count} transaction{g.count === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 whitespace-nowrap">
                      <p className="font-serif text-[14px] font-semibold leading-[1.3] tnum">
                        ₹{inrPlain(g.amount)}
                      </p>
                      <p className={`${MUTED} tnum`}>{g.share.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      <div className="faux-home-bar pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-3">
        <div className="h-[5px] w-[124px] rounded-lg bg-black" />
      </div>
    </div>
  );
}
