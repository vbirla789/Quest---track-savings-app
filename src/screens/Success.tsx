import { motion } from "framer-motion";
import type { Goal } from "../data";
import { inrPlain } from "../lib/format";
import { PACE_LABEL, PACE_PILL, paceOf } from "../lib/pace";
import MilestoneBadge from "../components/MilestoneBadge";
import StatusBar from "../components/StatusBar";

/* ----------------------------------------------------------------------------
 * Completion screen — Figma section 42:498.
 *
 * One layout, two readings. Reaching a milestone shows what you've saved; the
 * final milestone is the goal itself, so that one names the goal instead. The
 * badge's own glow, scaled up, is the ray burst behind it — there's no separate
 * decoration layer.
 * --------------------------------------------------------------------------*/

const MONO = "font-mono text-[14px] font-medium leading-[1.4]";
const EASE_OUT = [0.23, 1, 0.32, 1] as [number, number, number, number];

export default function Success({
  goal,
  level,
  isGoalComplete,
  onShare,
  onDashboard,
}: {
  goal: Goal;
  level: number;
  isGoalComplete: boolean;
  onShare: () => void;
  onDashboard: () => void;
}) {
  const pace = paceOf(goal);
  const pill = PACE_PILL[pace];

  return (
    <motion.div
      className="absolute inset-0 z-[60] overflow-hidden bg-[#feffff] text-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
    >
      <div className="phone-scroll safe-top h-full overflow-y-auto">
        <StatusBar theme="light" />

        <div className="flex flex-col items-center px-5 py-10">
          <div className="flex w-full flex-col items-center gap-14">
            <div className="flex w-full flex-col items-center gap-8">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
              >
                <MilestoneBadge level={level} earned width={139} />
              </motion.div>

              <motion.div
                className="flex w-full flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.3, ease: EASE_OUT }}
              >
                <div className="flex w-full flex-col items-center gap-1">
                  <p className={`${MONO} uppercase text-[#a3a3a3]`}>Total saved</p>
                  {/* Sparkle rules flank the headline and take the leftover width,
                      so they grow and shrink with whatever it says. */}
                  <div className="flex w-full items-center justify-center gap-2">
                    <img
                      src="/icons/lt-sparkle.svg"
                      alt=""
                      className="h-[15px] min-w-0 flex-1 rotate-180"
                    />
                    {isGoalComplete ? (
                      <p className="w-[224px] shrink-0 text-center font-serif text-[35px] font-semibold leading-[1.3]">
                        {goal.name} unlocked
                      </p>
                    ) : (
                      <p className="shrink-0 whitespace-nowrap font-serif text-[35px] font-semibold leading-[1.3] tnum">
                        ₹{inrPlain(goal.saved)}
                      </p>
                    )}
                    <img src="/icons/lt-sparkle.svg" alt="" className="h-[15px] min-w-0 flex-1" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="grid size-4 place-items-center">
                    <span className="flex rounded-full p-[2px]" style={{ background: pill.halo }}>
                      <span
                        className="size-2 rounded-full"
                        style={{
                          background: pill.dot,
                          boxShadow: "inset 0 2.578px 0 0 rgba(255,255,255,0.35)",
                        }}
                      />
                    </span>
                  </span>
                  <p className={MONO} style={{ color: pill.text }}>
                    {PACE_LABEL[pace]}
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="flex w-full flex-col items-start justify-center gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3, ease: EASE_OUT }}
            >
              <button
                onClick={onShare}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[2px] border border-[#8f8f8f] bg-black px-5 active:scale-[0.99]"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
              >
                <img src="/icons/lt-share.svg" alt="" className="size-5" />
                <span className={`${MONO} uppercase text-white`}>Share the win</span>
              </button>
              <button
                onClick={onDashboard}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[2px] border border-[#c7c8c8] bg-white px-5 active:scale-[0.99]"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
              >
                <img src="/icons/lt-redo.svg" alt="" className="size-5" />
                <span className={`${MONO} uppercase`}>Go to dashboard</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
