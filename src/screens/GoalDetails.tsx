import { SOURCE_META, weeksToGoal, type Goal } from "../data";
import { inr } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";
import ProgressRing from "../components/ProgressRing";
import StatusBar from "../components/StatusBar";

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
    <div className="phone-scroll h-full overflow-y-auto bg-canvas pb-44">
      <StatusBar />

      {/* header */}
      <div className="flex items-center justify-between px-4 pt-2">
        <button
          onClick={onBack}
          className="grid size-9 place-items-center rounded-full bg-elev text-ink active:scale-95"
        >
          ‹
        </button>
        <span className="text-[16px] font-semibold">{goal.name}</span>
        <button className="grid size-9 place-items-center rounded-full bg-elev text-ink">⋯</button>
      </div>

      {/* progress ring */}
      <div className="mt-4 flex flex-col items-center">
        <ProgressRing value={p} size={188} stroke={12} from="#b8fe50" to="#b8fe50" track="#404040">
          <span className="text-[30px]">{goal.emoji}</span>
          <span className="mt-1 font-display text-[30px] font-bold leading-none tnum">
            {Math.round(p * 100)}%
          </span>
          <span className="mt-1 text-[13px] font-medium text-ink-dim tnum">{inr(animatedSaved)}</span>
        </ProgressRing>
        <p className="mt-3 text-[14px] font-medium text-ink-dim tnum">
          {inr(remaining)} to go · target {inr(goal.target)}
        </p>
      </div>

      {/* stat trio */}
      <div className="mt-5 grid grid-cols-3 gap-3 px-4">
        <Stat label="Streak" value={`${goal.streakWeeks} wk`} icon="🔥" />
        <Stat label="Saving" value={`${inr(goal.weeklyAutoSave)}/wk`} icon="📈" />
        <Stat label="Finish" value={weeksLeft === Infinity ? "—" : `~${weeksLeft} wk`} icon="🏁" />
      </div>

      {/* squad on this goal */}
      {goal.squad.length > 0 && (
        <div className="mx-4 mt-7 flex items-center justify-between rounded-[16px] bg-card p-4">
          <div className="flex items-center gap-3">
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
            <p className="text-[14px] font-medium text-ink-dim">
              <b className="font-semibold text-ink">{goal.squad.length} friends</b> saving with you
            </p>
          </div>
          <button className="flex h-9 items-center justify-center rounded-full bg-elev px-5 text-[14px] font-semibold text-lime active:scale-95">
            Challenge
          </button>
        </div>
      )}

      {/* contribution history — the "how much are you saving" ledger */}
      <div className="mt-7 px-4">
        <h2 className="text-[18px] font-medium leading-[1.4]">Recent stashes</h2>
      </div>
      <div className="mt-3 flex flex-col gap-3 px-4">
        {goal.contributions.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-[16px] bg-card p-4">
            <div className="grid size-9 place-items-center rounded-lg border border-elev text-[16px]">
              {SOURCE_META[c.source].icon}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-ink">{c.label}</p>
              <p className="text-[13px] font-medium text-ink-dim">
                {c.daysAgo === 0 ? "Today" : `${c.daysAgo}d ago`}
              </p>
            </div>
            <span className="text-[15px] font-semibold text-lime tnum">+{inr(c.amount)}</span>
          </div>
        ))}
      </div>

      {/* sticky stash actions */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
        <div className="pointer-events-auto mx-3 mb-3 rounded-[24px] bg-card/90 p-3 backdrop-blur-xl">
          <div className="flex gap-2">
            {quickAdds.map((q) => (
              <button
                key={q.label}
                onClick={() => onAdd(q.amount)}
                className="h-10 flex-1 rounded-full bg-elev px-2 text-[12px] font-semibold text-lime active:scale-95"
              >
                {q.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => onAdd(remaining)}
            className="mt-2 h-12 w-full rounded-full bg-lime text-[16px] font-semibold text-black active:scale-[0.98]"
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
    <div className="flex flex-col items-center rounded-[16px] bg-card p-3">
      <div className="text-[17px]">{icon}</div>
      <p className="mt-0.5 text-[14px] font-semibold text-ink tnum">{value}</p>
      <p className="text-[12px] font-medium text-ink-dim">{label}</p>
    </div>
  );
}
