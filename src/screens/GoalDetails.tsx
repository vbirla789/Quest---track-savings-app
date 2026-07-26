import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { daysToGoal, type ContributionSource, type Goal } from "../data";
import { inrPlain } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";
import ProgressRing from "../components/ProgressRing";
import StatusBar from "../components/StatusBar";
import SysIcon from "../components/SysIcon";

const STASH_ICONS: Record<ContributionSource, { src: string; inset: string }> = {
  skip: { src: "/icons/forward-circle.svg", inset: "9.38%" },
  auto: { src: "/icons/calendar.svg", inset: "14.37% 10.55% 14.21% 10.94%" },
  roundup: { src: "/icons/note.svg", inset: "19.45% 6.78%" },
  boost: { src: "/icons/thunder.svg", inset: "12.5% 12.35% 12.35% 12.5%" },
};

function stashDate(daysAgo: number) {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  return `${d.getDate()} ${month}, ${d.getFullYear()}`;
}

export default function GoalDetails({
  goal,
  onBack,
  onStashMoney,
  onNudgeSquad,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onBack: () => void;
  onStashMoney: () => void;
  onNudgeSquad: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const p = Math.min(1, goal.saved / goal.target);
  const animatedSaved = useCountUp(goal.saved);
  const daysLeft = daysToGoal(goal);
  const remaining = Math.max(0, goal.target - goal.saved);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // dismiss the overflow menu on any outside tap
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <div className="relative h-full overflow-hidden bg-canvas">
      <div className="phone-scroll safe-top h-full overflow-y-auto pb-36">
        <StatusBar />

        <div className="flex flex-col items-center gap-6 px-4 pt-4">
        {/* header */}
        <div className="flex w-full items-center justify-between">
          <button
            onClick={onBack}
            aria-label="Back"
            className="surface-card grid size-10 place-items-center rounded-full active:scale-95"
          >
            <SysIcon src="/icons/chevron-left.svg" inset="21.88% 38.54% 21.88% 30.21%" box={20} />
          </button>
          <span className="text-[18px] font-semibold leading-[1.3]">{goal.name}</span>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="More options"
              className="surface-card grid size-10 place-items-center rounded-full active:scale-95"
            >
              <SysIcon src="/icons/three-dot.svg" inset="43.75% 18.75%" box={20} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="surface-card absolute right-0 top-[46px] z-50 w-[168px] overflow-hidden rounded-[16px] p-1"
                  initial={{ opacity: 0, scale: 0.94, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -6 }}
                  transition={{ type: "spring", stiffness: 340, damping: 26 }}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-[14px] font-medium text-ink active:bg-white/8"
                  >
                    <SysIcon src="/icons/edit.svg" inset="17.35% 13.54% 17.71% 17.71%" box={20} />
                    Edit quest
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-[14px] font-medium text-[#ff5a5a] active:bg-white/8"
                  >
                    <SysIcon src="/icons/bin-red.svg" inset="5.21% 13.54% 10.66% 13.54%" box={20} />
                    Delete quest
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ring, then everything below it — the old "₹x to go · target ₹y"
            line is gone: the stat cards now carry both numbers */}
        <div className="flex w-full flex-col items-center gap-8">
        <ProgressRing value={p} size={160} stroke={12} from="#b8fe50" to="#b8fe50" track="#404040">
          <span className="font-display text-[32px] font-semibold leading-[1.3] tracking-[2px] tnum">
            {Math.round(p * 100)}%
          </span>
          <span className="text-[14px] font-medium text-ink-dim tnum">
            ₹{inrPlain(animatedSaved)}
          </span>
        </ProgressRing>

        <div className="flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-5">
          {/* stat trio — icons are global, identical across every goal */}
          <div className="flex items-start gap-3">
            <Stat
              icon={
                <SysIcon src="/icons/rewind-check.svg" inset="5.21% 13.54% 9.38% 13.54%" />
              }
              value={`₹${inrPlain(remaining)}`}
              label="Still to go"
            />
            <Stat
              icon={<SysIcon src="/icons/note-outline.svg" inset="19.45% 6.78%" />}
              value={`₹${inrPlain(goal.target)}`}
              label="Target"
            />
            <Stat
              icon={
                <SysIcon
                  src="/icons/calendar-outline.svg"
                  inset="13.54% 10.75% 15.04% 10.78%"
                />
              }
              value={
                daysLeft === Infinity ? "—" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"}`
              }
              label="Time left"
            />
          </div>

          {/* squad on this goal */}
          {goal.squad.length > 0 && (
            <div className="surface-card flex items-center justify-between rounded-[24px] p-4">
              <div className="flex items-center gap-3">
                <div className="flex">
                  {goal.squad.map((src, i) => (
                    <div
                      key={i}
                      className="-mr-3 size-8 overflow-hidden rounded-full bg-[#e1e4ea] last:mr-0"
                    >
                      <img src={src} alt="" className="size-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col text-[14px]">
                  <p className="font-medium leading-[1.24] text-ink">
                    {goal.squad.length === 1 ? "1 friend" : `${goal.squad.length} friends`}
                  </p>
                  <p className="leading-[1.4] text-ink-dim">
                    {goal.squad.length === 1 ? "is saving with you" : "are saving with you"}
                  </p>
                </div>
              </div>
              <button
                onClick={onNudgeSquad}
                className="flex h-9 w-[94px] items-center justify-center rounded-full border border-white/20 backdrop-blur-[12px] text-[14px] font-semibold text-lime active:scale-95"
              >
                Nudge 👋
              </button>
            </div>
          )}
        </div>

        {/* contribution history — the "how much are you saving" ledger */}
        <div className="flex w-full flex-col gap-3">
          <h2 className="text-[18px] font-medium leading-[1.4]">Recent stashes</h2>
          <div className="flex flex-col gap-4">
            {goal.contributions.length === 0 && (
              <div className="surface-card flex flex-col items-center gap-1 rounded-[24px] px-4 py-7 text-center">
                <span className="text-[22px]">🪄</span>
                <p className="mt-1 text-[14px] font-medium text-ink">No stashes yet</p>
                <p className="text-[13px] leading-[1.4] text-ink-dim">
                  Add your first bit of money and watch this quest come alive.
                </p>
              </div>
            )}
            {goal.contributions.map((c) => (
              <div key={c.id} className="surface-card flex items-center justify-between rounded-[24px] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-lg border border-elev">
                    <SysIcon src={STASH_ICONS[c.source].src} inset={STASH_ICONS[c.source].inset} />
                  </div>
                  <div className="flex flex-col text-[14px]">
                    <p className="font-medium leading-[1.24] text-ink">{c.label}</p>
                    <p className="leading-[1.4] text-ink-dim">{stashDate(c.daysAgo)}</p>
                  </div>
                </div>
                <span className="text-[16px] font-medium text-lime tnum">
                  ₹{inrPlain(c.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
        </div>
        </div>
        </div>
      </div>

      {/* sticky footer — single primary CTA over a bottom fade */}
      {/* phone has no faux home bar, so the CTA sits 16px off the edge there */}
      <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-0 z-40 bg-gradient-to-b from-transparent to-black to-60% px-4 pb-4 pt-3 sm:pb-8">
        <button
          onClick={onStashMoney}
          className="pointer-events-auto flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime text-[16px] font-semibold text-black active:scale-[0.98]"
        >
          <SysIcon src="/icons/note-round-black.svg" inset="19.45% 6.78%" box={20} />
          Add money
        </button>
        <div className="faux-home-bar absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-3">
          <div className="h-[5px] w-[124px] rounded-lg bg-white" />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="surface-card flex flex-1 flex-col items-center gap-1.5 rounded-[24px] p-2">
      <div className="grid size-8 place-items-center rounded-lg p-1">{icon}</div>
      <div className="flex w-full flex-col gap-1 text-center text-[14px]">
        <p className="font-medium leading-[1.24] text-ink tnum">{value}</p>
        <p className="leading-[1.4] text-ink-dim">{label}</p>
      </div>
    </div>
  );
}
