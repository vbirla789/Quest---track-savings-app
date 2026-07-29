import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Goal } from "../data";
import { inrPlain } from "../lib/format";
import {
  PACE_CARD,
  PACE_LABEL,
  PACE_PILL,
  monthlyTotals,
  overallPace,
  paceOf,
  timeLabel,
  type Pace,
} from "../lib/pace";
import { useCountUp } from "../lib/useCountUp";
import Avatar from "../components/Avatar";
import MonthlyChart from "../components/MonthlyChart";
import StatusBar from "../components/StatusBar";

/* ----------------------------------------------------------------------------
 * Overview — Figma node 12044:26792.
 *
 * A different visual system to the rest of the app: light canvas, Geist Mono for
 * every label and control, IBM Plex Serif for money and headings, and radii of
 * 2–4px instead of the dark screens' 20–24px. Kept self-contained so the dark
 * screens are untouched.
 * --------------------------------------------------------------------------*/

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
  const [hidden, setHidden] = useState(false);

  /* The header pill is the hero total, promoted once the hero scrolls away — so
     the number is never off screen. Driven by an observer on the readout itself
     rather than a scroll-offset threshold, which would need re-tuning every
     time anything above it changes height. */
  const readoutRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [showPill, setShowPill] = useState(false);

  useEffect(() => {
    const el = readoutRef.current;
    const scroller = el?.closest<HTMLElement>(".phone-scroll");
    if (!el || !scroller) return;

    /* Rect math on scroll rather than an IntersectionObserver. The observer
       needs its top inset by the header height anyway — "hidden behind the
       header" is what should trigger the pill, not "past the viewport edge" —
       and comparing the two rects says that directly. It also measures the
       header live, which matters because the faux status bar is hidden on
       phones and the header is shorter there. */
    let frame = 0;
    const measure = () => {
      frame = 0;
      const headerH = headerRef.current?.offsetHeight ?? 0;
      const bottom = el.getBoundingClientRect().bottom - scroller.getBoundingClientRect().top;
      setShowPill(bottom <= headerH);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [tab, hidden]);

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const animatedTotal = useCountUp(totalSaved);
  const health = overallPace(goals);

  /* One masking rule across the screen: rupee figures go, shapes and percentages
     stay. Hiding a balance is about not publishing absolute amounts — blanking
     the bars as well would leave nothing to look at. */
  const months = monthlyTotals(goals);
  /* Tapping a bar retargets the readout above it, so the big number always
     names what you're pointing at. Defaults to the most recent column. */
  const [monthIdx, setMonthIdx] = useState(months.length - 1);
  const picked = months[Math.min(monthIdx, months.length - 1)];
  const isRecent = picked?.recent ?? true;

  return (
    <div className="dot-paper relative h-full overflow-hidden text-black">
      {/* pb clears the home indicator, which floats over this scroller */}
      <div className="phone-scroll safe-top h-full overflow-y-auto pb-20">
        {/* Header sticks with the status bar, not on its own: on desktop the
            faux status bar would otherwise slide out from under it. */}
        <div ref={headerRef} className="dot-paper sticky top-0 z-30">
          <StatusBar theme="light" />
          <div className="flex items-center justify-between px-5 py-3">
            <IconButton src="/icons/lt-profile.svg" label="Profile" />

            <AnimatePresence>
              {showPill && (
                <motion.div
                  className="flex h-10 items-center rounded-full border border-[#ebebeb] bg-white px-3"
                  style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.04))" }}
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                >
                  <span className={`${LABEL} uppercase whitespace-nowrap tnum`}>
                    {hidden ? "₹ ••••••" : `₹${inrPlain(totalSaved)}`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <IconButton
              src={hidden ? "/icons/lt-eye-slash.svg" : "/icons/lt-eye.svg"}
              label={hidden ? "Show balances" : "Hide balances"}
              onClick={() => setHidden((h) => !h)}
            />
          </div>
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
              <div ref={readoutRef} className="flex flex-col items-center gap-2">
                <div className="flex w-[192px] flex-col items-center gap-1 whitespace-nowrap">
                  <p className={`${LABEL} uppercase text-[#a3a3a3]`}>
                    {tab === "total"
                      ? "Total saved"
                      : isRecent
                        ? "Saved last 14 days"
                        : `Saved in ${picked.label}`}
                  </p>
                  {hidden ? (
                    /* ₹ stays, the digits become dots — the currency still reads
                       as money without publishing the amount */
                    <div className="flex h-[52px] w-full items-center justify-between">
                      <span className="font-serif text-[40px] font-semibold leading-[1.3]">₹</span>
                      <div className="flex h-[52px] items-center justify-center gap-3">
                        {Array.from({ length: 6 }, (_, i) => (
                          <span key={i} className="size-4 rounded-full bg-[#212121]" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="font-serif text-[40px] font-semibold leading-[1.3] tnum">
                      ₹{inrPlain(tab === "total" ? animatedTotal : picked.amount)}
                    </p>
                  )}
                </div>
                {/* Status line is on the savings tab only — the Progress frame
                    drops it, the chart is making the same point there. */}
                {tab === "total" && (
                  <div className="flex items-center gap-1.5">
                    <PaceDot pace={health} />
                    <p className={LABEL} style={{ color: PACE_PILL[health].text }}>
                      {PACE_LABEL[health]}
                    </p>
                  </div>
                )}
              </div>

              {/* Both tabs' visuals live in one fixed-height box so switching
                  can't shift the CTAs and goals below. The chart needs the full
                  column width, the coin is 173px wide and centred. */}
              <div className="relative h-[236px] w-full">
                {/* No `mode="wait"` — both branches are absolutely positioned in
                    this box, so they cross-fade in place. Serialising them
                    doubled the switch latency and, if you tapped the segments
                    quickly, left AnimatePresence settled on the wrong child. */}
                <AnimatePresence initial={false}>
                  {tab === "total" ? (
                    <motion.div
                      key="piggy"
                      /* 273x236 frame from node 50:11525, centred. The piggy is
                         220x220 at (27, 8) with its own crop, and the ground
                         shadow is a separate 128x19 ellipse — keeping them apart
                         means the shadow stays put while the piggy animates. */
                      className="absolute left-1/2 top-1/2 h-[236px] w-[273px] -translate-x-1/2 -translate-y-1/2"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div
                        className="absolute h-[19px] w-[128px] -translate-x-1/2"
                        style={{ left: "calc(50% + 6.5px)", top: 196 }}
                      >
                        <div className="absolute" style={{ inset: "-105.26% -15.63%" }}>
                          <img
                            src="/piggy-shadow.svg"
                            alt=""
                            className="block size-full max-w-none"
                          />
                        </div>
                      </div>
                      <div
                        className="absolute overflow-hidden"
                        style={{ left: 27, top: 8, width: 220, height: 220 }}
                      >
                        <img
                          src="/piggy.png"
                          alt=""
                          className="absolute max-w-none"
                          style={{
                            left: "-14.48%",
                            top: "-13.48%",
                            width: "128.96%",
                            height: "123.91%",
                          }}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="chart"
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <MonthlyChart
                        buckets={months}
                        selected={Math.min(monthIdx, months.length - 1)}
                        onSelect={setMonthIdx}
                        hidden={hidden}
                      />
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
                hidden={hidden}
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

function IconButton({
  src,
  label,
  onClick,
}: {
  src: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid size-10 shrink-0 place-items-center rounded-full border border-[#ebebeb] bg-white active:scale-95"
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

/** Dot-in-a-halo from the Financial health component. Dot, halo and label all
    come off one entry, so the colour and the words can never disagree. */
function PaceDot({ pace }: { pace: Pace }) {
  const { dot, halo } = PACE_PILL[pace];
  return (
    <span className="grid size-4 place-items-center">
      <span className="flex rounded-full p-[2px]" style={{ background: halo }}>
        {/* No ring: the export carries a black 1.29px stroke, which on an 8px
            dot eats most of the colour. */}
        <span
          className="size-2 rounded-full"
          style={{ background: dot, boxShadow: "inset 0 2.578px 0 0 rgba(255,255,255,0.35)" }}
        />
      </span>
    </span>
  );
}

function GoalCard({
  goal,
  hidden,
  onOpen,
  onNudge,
}: {
  goal: Goal;
  hidden: boolean;
  onOpen: () => void;
  onNudge: () => void;
}) {
  const pace = paceOf(goal);
  const style = PACE_CARD[pace];
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
          {hidden ? (
            /* One currency symbol and six dots for the pair — the design drops
               the slash and the second ₹, which read as two hidden numbers when
               there is only one thing being withheld. */
            <div className="flex items-center gap-3">
              <span className="font-serif text-[16px] font-semibold leading-[1.3]">₹</span>
              <span className="flex items-center gap-1.5">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="size-1.5 rounded-full bg-[#212121]" />
                ))}
              </span>
            </div>
          ) : (
            <p className="font-serif text-[16px] font-semibold leading-[1.3] tnum">
              ₹{inrPlain(goal.saved)} / ₹{inrPlain(goal.target)}
            </p>
          )}
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
          <div className="w-full border-t border-dotted border-[#d8d8d8]" />
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-start">
                {goal.squad.map((m) => (
                  <Avatar key={m.name} member={m} size={32} className="-mr-3 last:mr-0" />
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
              /* Secondary: nudging is a side errand next to adding money, and a
                 filled button on every shared card competed with the row's real
                 primary. Same treatment as the detail hero's nudge. */
              className="h-[29px] w-[74px] rounded-[2px] border border-[#c7c8c8] bg-white font-mono text-[12px] font-medium uppercase leading-[1.4] text-black active:scale-95"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))" }}
            >
              Nudge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
