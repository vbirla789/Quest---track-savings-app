import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Goal } from "../data";
import { inrPlain } from "../lib/format";
import { PACE_LABEL, dailyTotals, overallPace, paceOf, timeLabel, type Pace } from "../lib/pace";
import { useCountUp } from "../lib/useCountUp";
import StatusBar from "../components/StatusBar";

/* ----------------------------------------------------------------------------
 * Overview — Figma node 12044:26792.
 *
 * A different visual system to the rest of the app: light canvas, Geist Mono for
 * every label and control, IBM Plex Serif for money and headings, and radii of
 * 2–4px instead of the dark screens' 20–24px. Kept self-contained so the dark
 * screens are untouched.
 * --------------------------------------------------------------------------*/

/** Strong stop, bar start, and card wash for each pace state. */
const PACE_STYLE: Record<Pace, { text: string; from: string; to: string; wash: string }> = {
  ahead: { text: "#00c86a", from: "#5ee7b7", to: "#00c86a", wash: "#edfcf7" },
  on: { text: "#0a59ff", from: "#b8cbf4", to: "#0a59ff", wash: "#edf2fd" },
  behind: { text: "#f9ca4d", from: "#f7eaca", to: "#f9ca4d", wash: "#fdf9ef" },
};

const LABEL = "font-mono text-[14px] font-medium leading-[1.4]";
const MUTED = "font-mono text-[12px] font-medium leading-[1.4] text-[#a3a3a3]";

export default function Dashboard({
  goals,
  onOpenGoal,
  onNudge,
  onNewQuest,
  onStashCash,
}: {
  goals: Goal[];
  onOpenGoal: (id: string) => void;
  onNudge: (name: string) => void;
  onNewQuest: () => void;
  onStashCash: () => void;
}) {
  const [tab, setTab] = useState<"total" | "progress">("total");

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const animatedTotal = useCountUp(totalSaved);
  const health = overallPace(goals);

  const days = dailyTotals(goals);
  const windowTotal = days.reduce((s, d) => s + d, 0);
  const dayAvg = windowTotal / Math.max(1, days.length);

  return (
    <div className="relative h-full overflow-hidden bg-white text-black">
      {/* pb clears the home indicator, which floats over this scroller */}
      <div className="phone-scroll safe-top h-full overflow-y-auto pb-20">
        <StatusBar theme="light" />

        {/* header — two 40px circle buttons, nothing between them */}
        <div className="flex items-center justify-between px-5 py-3">
          <IconButton src="/icons/lt-profile.svg" label="Profile" />
          <IconButton src="/icons/lt-eye.svg" label="Hide balances" />
        </div>

        <div className="flex flex-col items-center gap-8 px-5 pt-4">
          <div className="flex w-full flex-col items-center gap-8">
            {/* switch */}
            <div
              className="flex h-10 w-[264px] items-center rounded-full bg-[#f9f9fb] p-1"
              style={{ boxShadow: "inset 0 1px 4px 0 rgba(36,36,36,0.04)" }}
            >
              <Segment active={tab === "total"} onClick={() => setTab("total")}>
                Total savings
              </Segment>
              <Segment active={tab === "progress"} onClick={() => setTab("progress")}>
                Progress
              </Segment>
            </div>

            {/* readout + hero. Both swap with the tab, so each tab is a
                complete thought rather than a graph under an unrelated total. */}
            <div className="flex w-full flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center gap-1 whitespace-nowrap">
                  <p className={`${LABEL} uppercase text-[#a3a3a3]`}>
                    {tab === "total" ? "Total saved" : "Last 14 days"}
                  </p>
                  <p className="font-serif text-[40px] font-semibold leading-[1.3] tnum">
                    ₹{inrPlain(tab === "total" ? animatedTotal : windowTotal)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <PaceDot pace={health} />
                  <p className={LABEL} style={{ color: PACE_STYLE[health].text }}>
                    {PACE_LABEL[health]}
                  </p>
                </div>
              </div>

              {/* the hero art and the chart share a fixed box, so switching
                  tabs can't shift everything below it */}
              <div className="relative h-[184px] w-[173px]">
                {/* No `mode="wait"` — both branches are absolutely positioned in
                    this box, so they cross-fade in place. Serialising them
                    doubled the switch latency and, if you tapped the segments
                    quickly, left AnimatePresence settled on the wrong child. */}
                <AnimatePresence initial={false}>
                  {tab === "total" ? (
                    <motion.div
                      key="coin"
                      className="absolute inset-0 overflow-hidden"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <img
                        src="/coin.png"
                        alt=""
                        className="absolute left-[-8.84%] top-[-3.12%] h-[99.05%] w-[113.92%] max-w-none"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="bars"
                      className="absolute inset-0 flex items-end gap-[3px]"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                    >
                      {days.map((amount, i) => {
                        const max = Math.max(...days, 1);
                        // above the window's daily average is lit, below is a
                        // stub — a day you saved nothing still leaves a mark
                        const lit = amount > dayAvg;
                        return (
                          <motion.span
                            key={i}
                            className="flex-1 rounded-[1px]"
                            style={{
                              background: lit
                                ? "linear-gradient(to top, #5ee7b7, #00c86a)"
                                : "#f0f0f0",
                            }}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(3, (amount / max) * 100)}%` }}
                            transition={{ duration: 0.4, delay: i * 0.03, ease: [0.23, 1, 0.32, 1] }}
                          />
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* actions — 2px radius, mono uppercase labels */}
            <div className="flex w-full items-center gap-3">
              <button
                onClick={onNewQuest}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[2px] border border-[#c7c8c8] bg-white px-5 active:scale-[0.99]"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
              >
                <img src="/icons/lt-add.svg" alt="" className="size-[18px]" />
                <span className={`${LABEL} uppercase`}>New goal</span>
              </button>
              <button
                onClick={onStashCash}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[2px] border border-[#8f8f8f] bg-black px-5 active:scale-[0.99]"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
              >
                <img src="/icons/lt-moneys.svg" alt="" className="size-[18px] -scale-x-100" />
                <span className={`${LABEL} uppercase text-white`}>Add money</span>
              </button>
            </div>
          </div>

          {/* goals */}
          <div className="flex w-full flex-col items-start gap-4">
            <h2 className="font-serif text-[20px] font-medium leading-[1.3]">Goals list</h2>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onOpen={() => onOpenGoal(goal.id)}
                onNudge={() => onNudge("your squad")}
              />
            ))}
          </div>
        </div>
      </div>

      {/* home bar — dark indicator on the light canvas */}
      <div className="faux-home-bar pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-3">
        <div className="h-[5px] w-[124px] rounded-lg bg-black" />
      </div>
    </div>
  );
}

function IconButton({ src, label }: { src: string; label: string }) {
  return (
    <button
      aria-label={label}
      className="grid size-10 place-items-center rounded-full border border-[#ebebeb] bg-white active:scale-95"
      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.04))" }}
    >
      <img src={src} alt="" className="size-5" />
    </button>
  );
}

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-8 flex-1 rounded-full px-2.5 font-mono text-[12px] leading-[18px] transition-colors ${
        active ? "border border-white bg-white font-semibold text-black" : "font-medium text-[#a3a3a3]"
      }`}
      style={active ? { filter: "drop-shadow(0 1px 3px rgba(34,34,34,0.06))" } : undefined}
    >
      {children}
    </button>
  );
}

/** Blue-dot-in-a-halo from the Figma, recoloured per pace state so the dot and
    the words can never disagree. */
function PaceDot({ pace }: { pace: Pace }) {
  const color = PACE_STYLE[pace].text;
  return (
    <span className="grid size-4 place-items-center">
      <span
        className="flex rounded-full p-[2px]"
        style={{ background: `color-mix(in srgb, ${color} 30%, transparent)` }}
      >
        <span
          className="size-2 rounded-full border-[1.289px] border-black"
          style={{ background: color, boxShadow: "inset 0 2.578px 0 0 rgba(255,255,255,0.35)" }}
        />
      </span>
    </span>
  );
}

function GoalCard({
  goal,
  onOpen,
  onNudge,
}: {
  goal: Goal;
  onOpen: () => void;
  onNudge: () => void;
}) {
  const pace = paceOf(goal);
  const style = PACE_STYLE[pace];
  const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));

  return (
    /* role=button rather than a real <button>: the Nudge control lives inside
       the card, and a button inside a button is invalid HTML. */
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex w-full cursor-pointer flex-col justify-center gap-6 rounded-[4px] border border-[#e6e7e7] px-3 pb-4 pt-3 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
      style={{ backgroundImage: `linear-gradient(108deg, #ffffff 2.5%, ${style.wash} 104%)` }}
    >
      <div className="flex w-full items-center justify-between whitespace-nowrap">
        <p className={LABEL}>{goal.name}</p>
        <p className={MUTED}>{timeLabel(goal)}</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full items-center justify-between whitespace-nowrap">
          <p className="font-serif text-[16px] font-semibold leading-[1.3] tnum">
            ₹{inrPlain(goal.saved)} / ₹{inrPlain(goal.target)}
          </p>
          <p className={LABEL} style={{ color: style.text }}>
            {pct}%
          </p>
        </div>
        <div className="h-[6px] w-full overflow-hidden rounded-[1px] bg-[#f0f0f0]">
          <motion.div
            className="h-full rounded-[1px]"
            style={{ background: `linear-gradient(to right, ${style.from}, ${style.to})` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
      </div>

      {/* social only where the goal is actually shared */}
      {goal.squad.length > 0 && (
        <div className="flex w-full flex-col gap-4">
          <div className="h-px w-full bg-[#e6e7e7]" />
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-start">
                {goal.squad.map((src, i) => (
                  <div
                    key={i}
                    className="-mr-3 size-8 overflow-hidden rounded-full bg-[#e1e4ea] last:mr-0"
                  >
                    <img src={src} alt="" className="size-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <p className={LABEL}>
                  {goal.squad.length} {goal.squad.length === 1 ? "friend" : "friends"}
                </p>
                <p className={MUTED}>saving with you</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNudge();
              }}
              className="h-[29px] w-[74px] rounded-[2px] border border-[#8f8f8f] bg-black font-mono text-[12px] font-medium uppercase leading-[1.4] text-white active:scale-95"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
            >
              Nudge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
