import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { GOALS, levelFromXp, type Goal } from "./data";
import PhoneFrame from "./components/PhoneFrame";
import Dashboard from "./screens/Dashboard";
import GoalDetails from "./screens/GoalDetails";
import LevelUp from "./screens/LevelUp";

type View = "dashboard" | "details";

export default function App() {
  const [goals, setGoals] = useState<Goal[]>(GOALS);
  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ goal: Goal; level: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected = goals.find((g) => g.id === selectedId) ?? null;

  function openGoal(id: string) {
    setSelectedId(id);
    setView("details");
  }

  function addToGoal(id: string, amount: number) {
    if (amount <= 0) return;
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    const wasComplete = goal.saved >= goal.target;
    const newSaved = Math.min(goal.target, goal.saved + amount);
    const nowComplete = newSaved >= goal.target;

    const updated = goals.map((g) => (g.id === id ? { ...g, saved: newSaved } : g));
    setGoals(updated);

    if (nowComplete && !wasComplete) {
      const newTotal = updated.reduce((s, g) => s + g.saved, 0);
      const crossedLevel = levelFromXp(newTotal).level;
      const goalForCard = updated.find((g) => g.id === id)!;
      // let the ring/bar animate a beat before the takeover
      setTimeout(() => setCelebration({ goal: goalForCard, level: crossedLevel }), 550);
    }
  }

  function nudge(name: string) {
    setToast(`Nudged ${name} 👋 keep saving!`);
    setTimeout(() => setToast(null), 2200);
  }

  function closeCelebration() {
    setCelebration(null);
    setView("dashboard");
    setSelectedId(null);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 py-10">
      <header className="text-center">
        <h1 className="font-display text-[26px] font-bold text-ink">
          Quest <span className="text-ink-faint">·</span>{" "}
          <span className="text-xp">save like a game</span>
        </h1>
        <p className="mt-1 text-[13px] text-ink-dim">
          Gen Z savings concept · tap a quest → stash → hit 100% to level up
        </p>
      </header>

      <PhoneFrame>
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              className="h-full"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <Dashboard goals={goals} onOpenGoal={openGoal} onNudge={nudge} />
            </motion.div>
          )}

          {view === "details" && selected && (
            <motion.div
              key="details"
              className="h-full"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <GoalDetails
                goal={selected}
                onBack={() => setView("dashboard")}
                onAdd={(amt) => addToGoal(selected.id, amt)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* nudge toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className="absolute inset-x-0 top-16 z-[70] mx-auto w-fit rounded-full bg-xp px-4 py-2 text-[13px] font-bold text-black"
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* level-up takeover */}
        <AnimatePresence>
          {celebration && (
            <LevelUp
              goal={celebration.goal}
              newLevel={celebration.level}
              onClose={closeCelebration}
            />
          )}
        </AnimatePresence>
      </PhoneFrame>

      <p className="max-w-[390px] text-center text-[12px] leading-relaxed text-ink-faint">
        Prototype for the Swiggy design take-home. Try{" "}
        <b className="text-ink-dim">Rainy Day Fund</b> (95% there) and tap{" "}
        <b className="text-ink-dim">Stash &amp; finish</b> to trigger the level-up.
      </p>
    </div>
  );
}
