import { motion } from "framer-motion";
import { FRIENDS, levelFromXp, type Goal } from "../data";
import { inrPlain } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";
import StatusBar from "../components/StatusBar";
import SysIcon from "../components/SysIcon";

/* Refracted-glass texture on the hero: thin vertical gradient stripes,
   brighter through the middle band, overlay-blended at low opacity. */
const STRIPE_W = 14.11;
const STRIPES = Array.from({ length: 40 }, (_, i) => {
  const left = i * STRIPE_W;
  const bright = left >= 156 && left < 397;
  return { left, alpha: bright ? 0.8 : 0.3 };
});

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
    <div className="relative h-full overflow-hidden bg-canvas">
      <div className="phone-scroll h-full overflow-y-auto pb-12">
        <StatusBar />

        <div className="flex flex-col gap-5 px-4 pt-4">
          {/* header */}
          <div className="flex items-center justify-between">
            <button
              aria-label="Profile"
              className="surface-card grid size-10 place-items-center rounded-full active:scale-95"
            >
              <SysIcon src="/icons/user-circle.svg" inset="9.38%" box={20} />
            </button>
            <h1 className="font-display text-[18px] font-semibold leading-[1.3]">Overview</h1>
            <button
              aria-label="Notifications"
              className="surface-card grid size-10 place-items-center rounded-full active:scale-95"
            >
              <SysIcon src="/icons/notification.svg" inset="13.54% 17.71% 12.5% 17.71%" box={20} />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {/* hero — total stashed on the refracted-glass green surface */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="relative flex flex-col gap-4 overflow-hidden rounded-[32px] border border-transparent p-4"
              style={{
                /* Gradient stroke from the Figma: a bright top edge that fades
                   down the sides and disappears at the bottom. Painted as a
                   border-box layer behind the padding-box fill. */
                background:
                  "linear-gradient(180deg,#5dba3b,#79b238) padding-box, linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.28) 45%, rgba(255,255,255,0.04)) border-box",
              }}
            >
              {/* texture */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-[148px] top-[147px] size-[190px]">
                  <img
                    src="/hero-glow.svg"
                    alt=""
                    className="absolute block max-w-none"
                    style={{ inset: "-34.66%", width: "169.32%", height: "169.32%" }}
                  />
                </div>
                {STRIPES.map((s, i) => (
                  <div
                    key={i}
                    className="absolute top-[calc(50%+2.24px)] h-[264px] -translate-y-1/2 opacity-[0.12] mix-blend-overlay"
                    style={{
                      left: s.left,
                      width: STRIPE_W,
                      background: `linear-gradient(to right, rgba(255,255,255,0), rgba(184,254,80,${s.alpha}) 81.25%, rgba(255,255,255,${s.alpha}))`,
                    }}
                  />
                ))}
              </div>

              <div className="relative flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-[14px] font-medium leading-[1.4] text-[#e0e0e0]">
                    Total stashed
                  </p>
                  <p className="font-display text-[32px] font-bold leading-[1.3] text-white tnum">
                    ₹{inrPlain(animatedTotal)}
                  </p>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-[14px] leading-[1.4]">
                    <span className="flex-1 font-medium text-[#e0e0e0]">
                      XP to level {level + 1}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-white tnum">₹{inrPlain(into)}</span>
                      <span className="font-medium text-[#e0e0e0] tnum">/ {inrPlain(toNext)}</span>
                    </span>
                  </div>
                  <div className="glass h-1.5 w-full overflow-hidden rounded-full">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundImage: "url(/hero-xp-fill.png)",
                        backgroundSize: "cover",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct * 100}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.15 }}
                    />
                  </div>
                </div>
              </div>

              {/* action bar — glass pills inside the hero */}
              <div className="relative flex items-center gap-3">
                <button
                  onClick={onNewQuest}
                  className="glass flex h-[42px] flex-1 items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white active:scale-[0.98]"
                >
                  <SysIcon src="/icons/plus-circle.svg" inset="9.38%" box={18} />
                  New quest
                </button>
                <button
                  onClick={onStashCash}
                  className="glass flex h-[42px] flex-1 items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white active:scale-[0.98]"
                >
                  <SysIcon src="/icons/note-round-white.svg" inset="19.45% 6.78%" box={18} />
                  Add money
                </button>
              </div>
            </motion.div>

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
                  <div
                    key={f.id}
                    className="surface-card flex items-center justify-between rounded-[24px] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-9 overflow-hidden rounded-full"
                        style={{ backgroundColor: f.avatarBg }}
                      >
                        <img src={f.avatar} alt="" className="size-full object-cover" />
                      </div>
                      <div className="flex flex-col text-[14px]">
                        <p className="font-medium leading-[1.24]">{f.name}</p>
                        <p className="leading-[1.4] text-ink-dim">
                          {f.goal}, {Math.round(f.progress * 100)}%
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNudge(f.name)}
                      className="flex h-9 w-[94px] items-center justify-center rounded-full border border-white/20 backdrop-blur-[12px] text-[14px] font-semibold text-lime active:scale-95"
                    >
                      Nudge 👋
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS home bar — pinned to the phone, not the scroll content */}
      <div className="faux-home-bar pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-2 pt-3">
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
      className="surface-card flex flex-col gap-6 rounded-[28px] p-4 text-left"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg border border-elev text-[22px]">
            {goal.emoji}
          </div>
          <div className="flex flex-col text-[14px]">
            <p className="font-medium leading-[1.24]">{goal.name}</p>
            <p className="leading-[1.4] text-ink-dim">{goal.streakWeeks} week streak</p>
          </div>
        </div>
        {goal.squad.length > 0 && (
          <div className="flex">
            {goal.squad.map((src, i) => (
              <div
                key={i}
                className="-mr-2 size-7 overflow-hidden rounded-full bg-[#e1e4ea] last:mr-0"
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
            <span className="font-semibold text-ink tnum">₹{inrPlain(goal.saved)}</span>
            <span className="font-medium text-ink-dim tnum">/ {inrPlain(goal.target)}</span>
          </p>
          <span className="font-medium text-lime tnum">{Math.round(p * 100)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
          <motion.div
            className="h-full rounded-full bg-gradient-to-b from-lime to-[#6e9830]"
            initial={{ width: 0 }}
            animate={{ width: `${p * 100}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.2 + index * 0.06 }}
          />
        </div>
      </div>
    </motion.button>
  );
}
