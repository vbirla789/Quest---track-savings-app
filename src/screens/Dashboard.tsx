import { motion } from "framer-motion";
import { FRIENDS, levelFromXp, type Goal } from "../data";
import { inr, inrPlain } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";
import StatusBar from "../components/StatusBar";

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
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const { level, into, toNext, pct } = levelFromXp(totalSaved);
  const animatedTotal = useCountUp(totalSaved);

  return (
    <div className="phone-scroll h-full overflow-y-auto bg-canvas pb-10">
      <StatusBar />

      <div className="flex flex-col gap-6 px-4 pt-4">
        {/* header */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[24px] font-semibold leading-[1.3]">Overview</h1>
          <div className="size-9 overflow-hidden rounded-full bg-[#e1e4ea]">
            <img src="/avatars/james.png" alt="" className="size-full object-cover" />
          </div>
        </div>

        {/* hero — total stashed on the lime surface */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="flex flex-col gap-4 rounded-[24px] bg-lime px-4 pb-5 pt-4"
        >
          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-medium leading-[1.4] text-lime-dim">Total stashed</p>
            <p className="font-display text-[32px] font-bold leading-[1.3] text-black tnum">
              ₹ {inrPlain(animatedTotal)}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[14px] leading-[1.4]">
              <span className="flex-1 font-medium text-lime-dim">XP to Level {level + 1}</span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-black tnum">₹ {inrPlain(into)}</span>
                <span className="font-medium text-lime-dim tnum">/ {inrPlain(toNext)}</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
              <motion.div
                className="h-full rounded-full bg-black"
                initial={{ width: 0 }}
                animate={{ width: `${pct * 100}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.15 }}
              />
            </div>
          </div>
        </motion.div>

        {/* action bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNewQuest}
            className="h-12 flex-1 rounded-full bg-elev text-[16px] font-semibold text-lime active:scale-[0.98]"
          >
            New quest
          </button>
          <button
            onClick={onStashCash}
            className="h-12 flex-1 rounded-full bg-elev text-[16px] font-semibold text-lime active:scale-[0.98]"
          >
            Stash cash
          </button>
        </div>

        {/* goal buckets */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[18px] font-medium leading-[1.4]">Your quests</h2>
          <div className="flex flex-col gap-4">
            {goals.map((g, i) => (
              <GoalCard key={g.id} goal={g} index={i} onOpen={() => onOpenGoal(g.id)} />
            ))}
          </div>
        </div>

        {/* social loop */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[18px] font-medium leading-[1.4]">Saving squad</h2>
          <div className="flex flex-col gap-4">
            {FRIENDS.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-[16px] bg-card p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="size-10 overflow-hidden rounded-full"
                    style={{ backgroundColor: f.avatarBg }}
                  >
                    <img src={f.avatar} alt="" className="size-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[16px] font-medium leading-[1.24]">{f.name}</p>
                    <p className="text-[14px] font-medium leading-[1.4] text-ink-dim">
                      {f.goal}, {Math.round(f.progress * 100)}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNudge(f.name)}
                  className="flex h-9 w-[102px] items-center justify-center rounded-full bg-elev text-[14px] font-semibold text-lime active:scale-95"
                >
                  Nudge 👋
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* iOS home bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-3">
        <div className="h-[5px] w-[124px] rounded-lg bg-white" />
      </div>
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

  return (
    <motion.button
      onClick={onOpen}
      layoutId={`goal-${goal.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 18, delay: index * 0.06 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col gap-6 rounded-[20px] bg-card p-4 text-left"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg border border-elev text-[22px]">
            {goal.emoji}
          </div>
          <div className="flex flex-col text-[14px] font-medium">
            <p className="leading-[1.24]">{goal.name}</p>
            <p className="leading-[1.4] text-ink-dim">{goal.streakWeeks} week streak</p>
          </div>
        </div>
        {goal.squad.length > 0 && (
          <div className="flex">
            {goal.squad.map((src, i) => (
              <div
                key={i}
                className="-mr-3 size-8 overflow-hidden rounded-full bg-[#e1e4ea] last:mr-0 ring-2 ring-card"
              >
                <img src={src} alt="" className="size-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between text-[14px] leading-[1.4]">
          <p className="flex items-center gap-1">
            <span className="font-semibold text-ink tnum">{inr(goal.saved)}</span>
            <span className="font-medium text-ink-dim tnum">/ {inrPlain(goal.target)}</span>
          </p>
          <span className="font-medium text-lime tnum">{Math.round(p * 100)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
          <motion.div
            className="h-full rounded-full bg-lime"
            initial={{ width: 0 }}
            animate={{ width: `${p * 100}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.2 + index * 0.06 }}
          />
        </div>
      </div>
    </motion.button>
  );
}
