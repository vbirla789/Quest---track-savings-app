import { motion } from "framer-motion";
import type { Goal } from "../data";
import { inr } from "../lib/format";
import Confetti from "../components/Confetti";

/**
 * The 100%-complete moment. A lime bloom, a spring-scaled badge, staggered
 * copy reveals, a confetti burst and a rising level bar — the standard bank
 * "transfer complete" turned into a video-game level-up.
 */
export default function LevelUp({
  goal,
  newLevel,
  onClose,
}: {
  goal: Goal;
  newLevel: number;
  onClose: () => void;
}) {
  const spring = { type: "spring" as const, stiffness: 200, damping: 16 };

  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-canvas px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* radial lime bloom */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(184,254,80,0.5), rgba(184,254,80,0.14) 40%, #000 75%)",
        }}
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* rotating rays */}
      <motion.div
        className="absolute left-1/2 top-[42%] z-0 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "repeating-conic-gradient(from 0deg, rgba(184,254,80,0.45) 0deg 6deg, transparent 6deg 14deg)",
          maskImage: "radial-gradient(circle, black 0%, transparent 62%)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 62%)",
        }}
        initial={{ rotate: 0, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 360, scale: 1, opacity: 0.2 }}
        transition={{ rotate: { duration: 22, repeat: Infinity, ease: "linear" }, scale: { duration: 0.7 } }}
      />

      <Confetti />

      {/* foreground — kept above the absolute bloom/rays so text stays visible
          even after framer-motion settles element transforms back to none */}
      <div className="relative z-10 flex w-full flex-col items-center">
        {/* badge */}
        <motion.div
          className="relative grid h-40 w-40 place-items-center rounded-[44px] bg-lime"
          style={{ boxShadow: "0 20px 60px rgba(184,254,80,0.25)" }}
          initial={{ scale: 0, rotate: -30, y: 20 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ ...spring, delay: 0.15 }}
        >
          <motion.span
            className="text-[76px]"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.25, 1] }}
            transition={{ delay: 0.35, duration: 0.5, times: [0, 0.6, 1] }}
          >
            {goal.emoji}
          </motion.span>
          <motion.div
            className="absolute -bottom-3 rounded-full bg-black px-3 py-1 text-[13px] font-bold text-lime"
            initial={{ scale: 0, y: 6 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ ...spring, delay: 0.5 }}
          >
            LEVEL {newLevel}
          </motion.div>
        </motion.div>

        <motion.p
          className="mt-8 text-[13px] font-bold uppercase tracking-[0.3em] text-lime"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          Quest complete
        </motion.p>
        <motion.h1
          className="mt-2 text-center font-display text-[36px] font-bold leading-[1.1] text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring, delay: 0.55 }}
        >
          {goal.name}
          <br />
          unlocked!
        </motion.h1>
        <motion.p
          className="mt-3 text-center text-[15px] font-medium text-ink-dim tnum"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          You stashed <b className="font-semibold text-white">{inr(goal.target)}</b> ·{" "}
          {goal.streakWeeks}-week streak 🔥
        </motion.p>

        {/* level bar snapping up */}
        <motion.div
          className="mt-6 w-full max-w-[280px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="mb-1.5 flex justify-between text-[12px] font-semibold text-ink-dim">
            <span>LVL {newLevel - 1}</span>
            <span>LVL {newLevel}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-track">
            <motion.div
              className="h-full rounded-full bg-lime"
              initial={{ width: "18%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="mt-9 flex w-full max-w-[300px] flex-col gap-2.5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <button className="h-12 w-full rounded-full bg-lime text-[16px] font-semibold text-black active:scale-[0.98]">
            Share the win 🎉
          </button>
          <button
            onClick={onClose}
            className="h-12 w-full rounded-full bg-elev text-[16px] font-semibold text-lime active:scale-[0.98]"
          >
            Start a new quest
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
