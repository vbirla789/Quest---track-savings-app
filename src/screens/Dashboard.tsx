import { motion } from "framer-motion";
import { FRIENDS, levelFromXp, type Goal } from "../data";
import { inr, inrPlain } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";
import StatusBar from "../components/StatusBar";

export default function Dashboard({
  goals,
  onOpenGoal,
  onNudge,
}: {
  goals: Goal[];
  onOpenGoal: (id: string) => void;
  onNudge: (name: string) => void;
}) {
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const weeklyRate = goals.reduce((s, g) => s + g.weeklyAutoSave, 0);
  const skipTotal = goals
    .flatMap((g) => g.contributions)
    .filter((c) => c.source === "skip" && c.daysAgo <= 6)
    .reduce((s, c) => s + c.amount, 0);
  const skipCount = goals
    .flatMap((g) => g.contributions)
    .filter((c) => c.source === "skip" && c.daysAgo <= 6).length;

  const { level, into, toNext, pct } = levelFromXp(totalSaved);
  const animatedTotal = useCountUp(totalSaved);
  const topStreak = Math.max(...goals.map((g) => g.streakWeeks));

  return (
    <div className="phone-scroll h-full overflow-y-auto pb-28">
      <StatusBar />

      {/* header */}
      <div className="flex items-center justify-between px-5 pt-3">
        <div>
          <p className="text-[13px] text-ink-dim">Good evening, Vishal</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-xp/15 px-2.5 py-1 font-display text-[13px] font-bold text-xp">
              LVL {level} · Saver
            </span>
            <span className="flex items-center gap-1 rounded-full bg-swiggy/15 px-2.5 py-1 text-[13px] font-semibold text-swiggy">
              🔥 {topStreak} wk
            </span>
          </div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-full bg-white/5 text-lg ring-1 ring-white/10">
          🧑‍🚀
        </div>
      </div>

      {/* hero — the financial big picture */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="mx-4 mt-4 overflow-hidden rounded-[28px] p-5"
        style={{
          background:
            "linear-gradient(160deg, rgba(108,92,231,0.35), rgba(20,232,160,0.12) 60%, rgba(255,122,47,0.18))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        <p className="text-[13px] font-medium text-ink-dim">Total stashed</p>
        <p className="mt-1 font-display text-[46px] font-bold leading-none tnum">
          <span className="text-ink-dim">₹</span>
          {inrPlain(animatedTotal)}
        </p>

        {/* XP bar to next level */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold">
            <span className="text-xp">XP to Level {level + 1}</span>
            <span className="text-ink-dim tnum">
              {inrPlain(into)} / {inrPlain(toNext)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-black/30">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#B8FF3C,#14E8A0)" }}
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.15 }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[13px]">
          <span className="rounded-full bg-black/25 px-2.5 py-1 font-semibold text-ink">
            +{inr(weeklyRate)}/wk
          </span>
          <span className="text-ink-dim">auto-stashing · you're on a roll</span>
        </div>
      </motion.div>

      {/* Swiggy-native insight: skipping orders funds the dream */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileTap={{ scale: 0.98 }}
        className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl border border-swiggy/25 bg-swiggy/10 p-3.5 text-left"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-swiggy/20 text-xl">
          🍜
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-ink">
            You skipped {skipCount} Swiggy orders this week
          </p>
          <p className="text-[12.5px] text-ink-dim">
            Cooking in stashed <b className="text-swiggy">{inr(skipTotal)}</b> toward your goals
          </p>
        </div>
        <span className="text-ink-faint">›</span>
      </motion.button>

      {/* goal buckets */}
      <div className="mt-6 flex items-center justify-between px-5">
        <h2 className="font-display text-[17px] font-bold">Your quests</h2>
        <span className="text-[13px] font-medium text-ink-faint">{goals.length} active</span>
      </div>

      <div className="mt-3 flex flex-col gap-3 px-4">
        {goals.map((g, i) => (
          <GoalCard key={g.id} goal={g} index={i} onOpen={() => onOpenGoal(g.id)} />
        ))}
      </div>

      {/* social loop */}
      <div className="mt-7 px-5">
        <h2 className="font-display text-[17px] font-bold">Saving squad</h2>
        <p className="mt-0.5 text-[13px] text-ink-dim">Nudge a friend to keep the streak alive</p>
      </div>
      <div className="mt-3 flex flex-col gap-2.5 px-4">
        {FRIENDS.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-lg">
              {f.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">{f.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${f.progress * 100}%`, background: f.color }}
                  />
                </div>
                <span className="text-[11.5px] text-ink-faint">{f.goal}</span>
              </div>
            </div>
            <button
              onClick={() => onNudge(f.name)}
              className="rounded-full bg-xp px-3 py-1.5 text-[12.5px] font-bold text-black active:scale-95"
            >
              Nudge 👋
            </button>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

function GoalCard({
  goal,
  index,
  onOpen,
}: {
  goal: Goal;
  index: number;
  onOpen: () => void;
}) {
  const p = Math.min(1, goal.saved / goal.target);
  const nearlyDone = p >= 0.9;

  return (
    <motion.button
      onClick={onOpen}
      layoutId={`goal-${goal.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 18, delay: index * 0.06 }}
      whileTap={{ scale: 0.975 }}
      className="relative overflow-hidden rounded-[24px] p-4 text-left"
      style={{
        background: `linear-gradient(140deg, ${goal.gradient[0]}, ${goal.gradient[1]})`,
        boxShadow: `0 16px 40px -18px ${goal.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-black/20 text-2xl backdrop-blur-sm">
            {goal.emoji}
          </div>
          <div>
            <p className="font-display text-[17px] font-bold text-white drop-shadow">
              {goal.name}
            </p>
            <p className="text-[12.5px] font-medium text-white/80">
              🔥 {goal.streakWeeks} wk streak · {goal.deadline}
            </p>
          </div>
        </div>
        {nearlyDone && (
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
            Almost there!
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <p className="font-display text-[22px] font-bold text-white tnum drop-shadow">
          {inr(goal.saved)}
          <span className="text-[14px] font-medium text-white/70"> / {inr(goal.target)}</span>
        </p>
        <span className="font-display text-[20px] font-bold text-white tnum">
          {Math.round(p * 100)}%
        </span>
      </div>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/25">
        <motion.div
          className="h-full rounded-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${p * 100}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.2 + index * 0.06 }}
        />
      </div>

      {goal.squad.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-2">
            {goal.squad.map((a, i) => (
              <span
                key={i}
                className="grid h-6 w-6 place-items-center rounded-full bg-black/30 text-[12px] ring-2 ring-white/20"
              >
                {a}
              </span>
            ))}
          </div>
          <span className="text-[12px] font-medium text-white/85">saving with you</span>
        </div>
      )}
    </motion.button>
  );
}

function BottomNav() {
  const items = [
    { icon: "🏠", label: "Home", active: true },
    { icon: "🎯", label: "Quests", active: false },
    { icon: "👥", label: "Squad", active: false },
    { icon: "📊", label: "Stats", active: false },
  ];
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
      <div className="pointer-events-auto mx-4 mb-3 flex items-center justify-around rounded-[26px] border border-white/10 bg-black/50 px-2 py-2.5 backdrop-blur-xl">
        {items.map((it) => (
          <button
            key={it.label}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10.5px] font-semibold ${
              it.active ? "text-ink" : "text-ink-faint"
            }`}
          >
            <span className="text-[19px]">{it.icon}</span>
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
