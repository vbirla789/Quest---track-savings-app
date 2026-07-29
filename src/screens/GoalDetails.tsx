import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Goal } from "../data";
import { inrPlain } from "../lib/format";
import {
  PACE_CARD,
  PACE_LABEL,
  milestones,
  paceOf,
  savedBreakdown,
  streakLength,
  streakMonths,
  targetDateLabel,
} from "../lib/pace";
import MilestoneBadge from "../components/MilestoneBadge";
import StatusBar from "../components/StatusBar";

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

export default function GoalDetails({
  goal,
  onBack,
  onStashMoney,
  onNudgeSquad,
  onAddFriends,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onBack: () => void;
  onStashMoney: () => void;
  onNudgeSquad: () => void;
  onAddFriends: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
  const pace = paceOf(goal);
  const tone = PACE_CARD[pace];
  const marks = milestones(goal);
  const months = streakMonths(goal);
  const streak = streakLength(goal);
  const groups = savedBreakdown(goal);
  const shared = goal.squad.length > 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="dot-paper relative h-full overflow-hidden text-black">
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
              <img src="/icons/lt-more.svg" alt="" className="size-5" />
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

        <div className="flex flex-col items-center gap-10 px-5">
          <div className="flex w-full flex-col items-center gap-8">
            {/* hero */}
            <div
              className="relative flex w-full flex-col items-start gap-10 rounded-[4px] border border-[#dbdbdb] p-4"
              style={{
                backgroundImage: `linear-gradient(99deg, #ffffff 2.5%, ${tone.wash} 104%)`,
              }}
            >
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

              <div className="relative flex w-full flex-col gap-3">
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
                  <p className="uppercase" style={{ color: tone.text }}>
                    {PACE_LABEL[pace]}
                  </p>
                  <p className="tnum">{targetDateLabel(goal)}</p>
                </div>

                {/* callout rides the fill's end, clamped so it can't hang off
                    either edge of the card */}
                <motion.div
                  className="pointer-events-none absolute bottom-[40px] flex flex-col items-center"
                  style={{ width: 48 }}
                  initial={{ left: 0 }}
                  animate={{ left: `calc(${Math.min(92, Math.max(0, pct - 7))}%)` }}
                  transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                >
                  <span
                    className="w-12 rounded-[3px] bg-white py-1 text-center font-mono text-[12px] font-medium uppercase leading-[1.4] text-black"
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

            {/* actions */}
            <div className="flex w-full items-center gap-3">
              {/* Shared goals nudge, solo goals invite. "Nudge friends" wrapped
                  to two lines and broke the row's height, and a plus icon reads
                  as "add" — wrong verb once the squad exists. */}
              <button
                onClick={shared ? onNudgeSquad : onAddFriends}
                className="flex h-10 flex-1 items-center justify-center gap-2 overflow-hidden rounded-[2px] border border-[#c7c8c8] bg-white px-5 active:scale-[0.99]"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
              >
                {!shared && <img src="/icons/lt-add.svg" alt="" className="size-[18px]" />}
                <span className={`${MONO} whitespace-nowrap uppercase`}>
                  {shared ? "Nudge" : "Add friends"}
                </span>
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
            <div className="relative flex w-full items-start gap-8 pb-2.5 pt-3">
              <div className="absolute left-1/2 top-[24px] h-1 w-[275px] -translate-x-1/2 overflow-hidden rounded-full bg-[#ececec]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(to right, #5ee7b7, #00c86a)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${railPct}%` }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                />
              </div>
              {marks.map((m) => (
                <div key={m.level} className="relative flex flex-1 flex-col items-center gap-3">
                  <MilestoneBadge level={m.level} earned={m.earned} />
                  <p
                    className={`${MONO} uppercase tnum ${m.earned ? "" : "text-[#bdbdbd]"}`}
                  >
                    ₹{inrPlain(m.amount)}
                  </p>
                </div>
              ))}
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
                <img src="/icons/lt-flash.svg" alt="" className="size-4" />
                <p className="font-mono text-[12px] font-medium uppercase leading-[1.4]">
                  {streak} month streak
                </p>
              </div>
              <div className="flex w-full flex-col items-start gap-5">
                {[months.slice(0, 6), months.slice(6)].map((row, r) => (
                  <div key={r} className="flex w-full flex-col items-start gap-4">
                    <div className="flex w-full items-start justify-between px-1 font-mono text-[12px] font-medium uppercase leading-[1.4] text-[#b6b6b6]">
                      {row.map((m, i) => (
                        <p key={i}>{m.label}</p>
                      ))}
                    </div>
                    <div className="relative flex w-full items-center justify-between">
                      {/* the tint runs only as far as the months that landed */}
                      <span
                        className="absolute left-0.5 top-0.5 h-5 rounded-[22px] bg-[#ecf1fd]"
                        style={{
                          width: `calc(${(row.filter((m) => m.hit).length / row.length) * 100}% - 4px)`,
                        }}
                      />
                      {row.map((m, i) => (
                        <img
                          key={i}
                          src={m.hit ? "/icons/lt-check-filled.svg" : "/icons/lt-check.svg"}
                          alt=""
                          className="relative size-6"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* how the money arrived */}
          <div className="flex w-full flex-col items-start gap-6">
            <h2 className={H2}>How you have saved it</h2>
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
                      <p className="font-serif text-[16px] font-semibold leading-[1.3] tnum">
                        ₹{inrPlain(g.amount)}
                      </p>
                      <p className={`${MUTED} tnum`}>{g.share.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="faux-home-bar pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-3">
        <div className="h-[5px] w-[124px] rounded-lg bg-black" />
      </div>
    </div>
  );
}
