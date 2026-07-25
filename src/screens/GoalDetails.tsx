import { motion } from "framer-motion";
import { SOURCE_META, weeksToGoal, type Goal } from "../data";
import { inr } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";
import ProgressRing from "../components/ProgressRing";
import StatusBar from "../components/StatusBar";

const MILESTONES = [0.25, 0.5, 0.75, 1];

export default function GoalDetails({
  goal,
  onBack,
  onAdd,
}: {
  goal: Goal;
  onBack: () => void;
  onAdd: (amount: number) => void;
}) {
  const p = Math.min(1, goal.saved / goal.target);
  const animatedSaved = useCountUp(goal.saved);
  const weeksLeft = weeksToGoal(goal);
  const remaining = Math.max(0, goal.target - goal.saved);

  const quickAdds = [
    { label: "🍜 Skip an order", amount: 320 },
    { label: "🪙 Round-ups", amount: 180 },
    { label: "⚡ Boost ₹2,500", amount: 2500 },
  ];

  return (
    <div className="phone-scroll h-full overflow-y-auto pb-40">
      {/* colored header */}
      <div
        className="relative pb-6"
        style={{
          background: `linear-gradient(160deg, ${goal.gradient[0]}, ${goal.gradient[1]})`,
        }}
      >
        <StatusBar dark />
        <div className="flex items-center justify-between px-5 pt-2">
          <button
            onClick={onBack}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/20 text-white backdrop-blur-sm active:scale-95"
          >
            ‹
          </button>
          <span className="font-display text-[15px] font-bold text-white">{goal.name}</span>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-black/20 text-white backdrop-blur-sm">
            ⋯
          </button>
        </div>

        <div className="mt-2 flex flex-col items-center">
          <ProgressRing value={p} size={188} stroke={13} from="rgba(255,255,255,0.95)" to="rgba(255,255,255,0.75)">
            <span className="text-[30px]">{goal.emoji}</span>
            <span className="mt-1 font-display text-[30px] font-bold leading-none text-white tnum">
              {Math.round(p * 100)}%
            </span>
            <span className="mt-1 text-[12px] font-medium text-white/85 tnum">
              {inr(animatedSaved)}
            </span>
          </ProgressRing>
          <p className="mt-3 text-[13px] font-medium text-white/90 tnum">
            {inr(remaining)} to go · target {inr(goal.target)}
          </p>
        </div>
      </div>

      {/* stat trio */}
      <div className="-mt-4 grid grid-cols-3 gap-2 px-4">
        <Stat label="Streak" value={`${goal.streakWeeks} wk`} icon="🔥" />
        <Stat label="Saving" value={`${inr(goal.weeklyAutoSave)}/wk`} icon="📈" />
        <Stat
          label="Finish"
          value={weeksLeft === Infinity ? "—" : `~${weeksLeft} wk`}
          icon="🏁"
        />
      </div>

      {/* quest path — milestones as a level map */}
      <div className="mt-6 px-5">
        <h2 className="font-display text-[16px] font-bold">Quest path</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-dim">Clear checkpoints to unlock the finish</p>
      </div>
      <div className="relative mt-4 px-8">
        {/* track */}
        <div className="absolute bottom-3 left-[42px] top-3 w-1 rounded-full bg-white/10" />
        <motion.div
          className="absolute left-[42px] w-1 rounded-full"
          style={{ background: `linear-gradient(${goal.gradient[1]}, ${goal.gradient[0]})`, bottom: 12 }}
          initial={{ height: 0 }}
          animate={{ height: `calc(${p * 100}% - 24px)` }}
          transition={{ type: "spring", stiffness: 70, damping: 18, delay: 0.2 }}
        />
        <div className="flex flex-col-reverse gap-5">
          {MILESTONES.map((m) => {
            const reached = p >= m;
            const isFinish = m === 1;
            return (
              <div key={m} className="relative flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className={`z-10 grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold ${
                    reached ? "text-black" : "text-ink-faint"
                  }`}
                  style={{
                    background: reached
                      ? `linear-gradient(135deg, ${goal.gradient[0]}, ${goal.gradient[1]})`
                      : "rgba(255,255,255,0.08)",
                    boxShadow: reached ? `0 0 14px ${goal.glow}` : "none",
                  }}
                >
                  {reached ? (isFinish ? "★" : "✓") : "○"}
                </motion.div>
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className={`text-[14px] font-semibold ${reached ? "text-ink" : "text-ink-faint"}`}>
                      {isFinish ? "Goal complete" : `${Math.round(m * 100)}% checkpoint`}
                    </p>
                    <p className="text-[12px] text-ink-faint tnum">{inr(goal.target * m)}</p>
                  </div>
                  {reached && !isFinish && (
                    <span className="text-[11px] font-bold text-xp">CLEARED</span>
                  )}
                  {isFinish && !reached && (
                    <span className="text-[11px] font-bold text-ink-faint">LOCKED 🔒</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* squad on this goal */}
      {goal.squad.length > 0 && (
        <div className="mx-4 mt-6 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
          <div className="flex -space-x-2">
            {goal.squad.map((a, i) => (
              <span
                key={i}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/8 text-[15px] ring-2 ring-canvas"
              >
                {a}
              </span>
            ))}
          </div>
          <p className="flex-1 text-[13px] text-ink-dim">
            <b className="text-ink">{goal.squad.length} friends</b> chasing this with you
          </p>
          <button className="rounded-full bg-white/8 px-3 py-1.5 text-[12px] font-semibold text-ink active:scale-95">
            Challenge
          </button>
        </div>
      )}

      {/* contribution history — the "how much are you saving" ledger */}
      <div className="mt-6 px-5">
        <h2 className="font-display text-[16px] font-bold">Recent stashes</h2>
      </div>
      <div className="mt-3 flex flex-col gap-2 px-4">
        {goal.contributions.map((c) => {
          const meta = SOURCE_META[c.source];
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3">
              <div
                className="grid h-9 w-9 place-items-center rounded-xl text-[16px]"
                style={{ background: `${meta.tint}22` }}
              >
                {meta.icon}
              </div>
              <div className="flex-1">
                <p className="text-[13.5px] font-medium text-ink">{c.label}</p>
                <p className="text-[11.5px] text-ink-faint">
                  {c.daysAgo === 0 ? "Today" : `${c.daysAgo}d ago`}
                </p>
              </div>
              <span className="font-display text-[15px] font-bold text-xp tnum">
                +{inr(c.amount)}
              </span>
            </div>
          );
        })}
      </div>

      {/* sticky stash actions */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
        <div className="pointer-events-auto mx-3 mb-3 rounded-[28px] border border-white/10 bg-black/60 p-3 backdrop-blur-xl">
          <div className="flex gap-2">
            {quickAdds.map((q) => (
              <button
                key={q.label}
                onClick={() => onAdd(q.amount)}
                className="flex-1 rounded-2xl bg-white/8 px-2 py-2.5 text-[12px] font-semibold text-ink active:scale-95"
              >
                {q.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => onAdd(remaining)}
            className="mt-2 w-full rounded-2xl py-3.5 font-display text-[15px] font-bold text-black active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${goal.gradient[0]}, ${goal.gradient[1]})` }}
          >
            {remaining > 0 ? `Stash ${inr(remaining)} & finish 🏁` : "Goal complete 🎉"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-center">
      <div className="text-[17px]">{icon}</div>
      <p className="mt-0.5 font-display text-[14px] font-bold text-ink tnum">{value}</p>
      <p className="text-[11px] text-ink-faint">{label}</p>
    </div>
  );
}
