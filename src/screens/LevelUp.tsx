import { motion } from "framer-motion";
import type { Goal } from "../data";
import { inrPlain } from "../lib/format";
import Confetti from "../components/Confetti";
import MaskIcon from "../components/MaskIcon";

/**
 * The 100%-complete moment: a lime bloom behind a star-glare burst, the level
 * hexagon springing in, then copy, the level bar filling to the next number and
 * finally the two exits. Everything below the badge is staggered so the eye is
 * led down the screen rather than handed the whole card at once.
 */
export default function LevelUp({
  goal,
  newLevel,
  onClose,
  onStartNewQuest,
}: {
  goal: Goal;
  newLevel: number;
  onClose: () => void;
  onStartNewQuest?: () => void;
}) {
  const spring = { type: "spring" as const, stiffness: 200, damping: 16 };
  // how long the saving took, expressed in the design's unit
  const days = goal.streakWeeks * 7;

  return (
    <motion.div
      className="absolute inset-0 z-[60] overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Lime bloom falling from the top edge. The ellipse is the design's own
          "Grains" radial: its centre sits above the frame, so the screen only
          catches the tail of the falloff — which is why it stays a haze rather
          than a flood. */}
      <motion.div
        className="absolute left-1/2 top-[-1.3%] z-0 h-[51.7%] w-[101%] -translate-x-1/2 opacity-80"
        style={{
          background:
            "radial-gradient(75.5% 116.6% at 50% -23.9%, rgba(184,254,80,1) 0%, rgba(184,254,80,0) 100%)",
        }}
        initial={{ opacity: 0, scaleY: 0.7 }}
        animate={{ opacity: 0.8, scaleY: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* star glare — slowly breathing so the still frame never feels frozen */}
      <motion.img
        src="/level-glare.svg"
        alt=""
        className="absolute left-1/2 top-[-5.2%] z-0 w-[140%] -translate-x-1/2"
        initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
        animate={{ opacity: 1, scale: [1, 1.04, 1], rotate: 0 }}
        transition={{
          opacity: { duration: 0.6 },
          rotate: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      <Confetti />

      {/* level hexagon — 152×155 at 18.6% down in the 375×812 design */}
      <motion.div
        className="absolute left-[calc(50%+8.84px)] top-[18.63%] z-10 h-[19.06%] w-[152px] -translate-x-1/2"
        initial={{ scale: 0, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
      >
        {/* the export carries its own glow, so it bleeds past the badge box */}
        <div className="absolute inset-[-20.31%_-13.28%_-20.31%_-18.93%]">
          <img src="/level-hex.svg" alt="" className="block size-full max-w-none" />
        </div>
        <div className="absolute left-[46.69px] top-[37.75px] flex w-[50px] flex-col items-center text-center">
          <span className="text-[16.82px] font-bold leading-[23px] tracking-[-0.13px] text-white">
            Level
          </span>
          <motion.span
            className="bg-gradient-to-b from-white to-[#b2b2b2] bg-clip-text text-[56px] font-semibold leading-[1.1] tracking-[2px] text-transparent tnum"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...spring, delay: 0.32 }}
          >
            {newLevel}
          </motion.span>
        </div>
      </motion.div>

      {/* content block sits 165/812 off the bottom in the design */}
      <div className="safe-bottom absolute bottom-[20.32%] left-1/2 z-10 flex w-[343px] max-w-[calc(100%-32px)] -translate-x-1/2 flex-col items-center gap-8">
        {/* level bar */}
        <motion.div
          className="flex w-full flex-col justify-center gap-2.5 px-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="flex items-center gap-2 text-[14px] font-medium leading-[1.4] text-[#e0e0e0]">
            <p className="min-w-0 flex-1">level {newLevel - 1}</p>
            <p className="shrink-0 whitespace-nowrap">level {newLevel}</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/20 bg-white/20 backdrop-blur-[12px]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-b from-[#b8fe50] to-[#6e9830]"
              initial={{ width: "18%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.75, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>

        <div className="flex w-full flex-col gap-8">
          <div className="flex w-full flex-col items-center gap-6">
            <div className="flex w-full flex-col items-center justify-center gap-2">
              <motion.div
                className="flex w-full items-center justify-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <img src="/sparkle.svg" alt="" className="h-[15px] w-[40px] rotate-180" />
                <p className="whitespace-nowrap text-[14px] font-medium uppercase leading-[1.4] text-lime">
                  Quest complete
                </p>
                <img src="/sparkle.svg" alt="" className="h-[15px] w-[40px]" />
              </motion.div>
              <motion.h1
                className="text-center text-[28px] font-semibold leading-[1.3] text-white"
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring, delay: 0.45 }}
              >
                {goal.name} unlocked
              </motion.h1>
            </div>
            <motion.div
              className="flex items-center justify-center gap-3 text-[14px] font-medium leading-[1.24] text-ink-dim"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="whitespace-nowrap tnum">You stashed ₹{inrPlain(goal.target)}</p>
              <span className="size-1 shrink-0 rounded-full bg-ink-dim" />
              <p className="whitespace-nowrap tnum">{days > 0 ? `In ${days} days` : "Today"}</p>
            </motion.div>
          </div>

          {/* exits — new quest is the primary, sharing is the optional flex */}
          <motion.div
            className="flex w-full flex-col gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
          >
            <button
              onClick={onStartNewQuest ?? onClose}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-lime px-5 text-[16px] font-semibold leading-6 text-black active:scale-[0.98]"
            >
              <MaskIcon src="/icons/plus-circle.svg" inset="9.38%" box={20} />
              Start a new quest
            </button>
            <button
              onClick={onClose}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border border-white/20 bg-white/10 px-5 text-[16px] font-semibold leading-6 text-lime backdrop-blur-[12px] active:scale-[0.98]"
            >
              <MaskIcon src="/icons/upload.svg" inset="15.27% 14.97% 14.97% 14.98%" box={20} />
              Share the win
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
