import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { GOALS, levelFromXp, type Goal } from "./data";
import PhoneFrame from "./components/PhoneFrame";
import { NewQuestSheet, StashSheet } from "./components/Sheets";
import Dashboard from "./screens/Dashboard";
import GoalDetails from "./screens/GoalDetails";
import LevelUp from "./screens/LevelUp";

type View = "dashboard" | "details";
type SheetKind = "quest" | "stash" | null;

export default function App() {
  const [goals, setGoals] = useState<Goal[]>(GOALS);
  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ goal: Goal; level: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);

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

  function createQuest(name: string, emoji: string, target: number) {
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${goals.length}`;
    setGoals([
      ...goals,
      {
        id,
        name,
        emoji,
        target,
        saved: 0,
        weeklyAutoSave: 1000,
        streakWeeks: 0,
        deadline: "—",
        squad: [],
        contributions: [],
      },
    ]);
    setSheet(null);
    setToast(`Quest started — ${emoji} ${name}`);
    setTimeout(() => setToast(null), 2200);
  }

  function stashCash(goalId: string, amount: number) {
    setSheet(null);
    addToGoal(goalId, amount);
    const g = goals.find((x) => x.id === goalId);
    const completes = g && g.saved + amount >= g.target;
    if (!completes) {
      setToast(`Stashed ₹ ${amount.toLocaleString("en-IN")} to ${g?.name ?? "quest"} ⚡`);
      setTimeout(() => setToast(null), 2200);
    }
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
          <span className="text-lime">save like a game</span>
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
              <Dashboard
                goals={goals}
                onOpenGoal={openGoal}
                onNudge={nudge}
                onNewQuest={() => setSheet("quest")}
                onStashCash={() => setSheet("stash")}
              />
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
                onStashMoney={() => setSheet("stash")}
                onNudgeSquad={() => nudge("your squad")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* bottom sheets for the two dashboard CTAs */}
        <AnimatePresence>
          {sheet === "quest" && (
            <NewQuestSheet onClose={() => setSheet(null)} onCreate={createQuest} />
          )}
          {sheet === "stash" && (
            <StashSheet
              goals={goals}
              defaultGoalId={view === "details" ? selectedId ?? undefined : undefined}
              onClose={() => setSheet(null)}
              onStash={stashCash}
            />
          )}
        </AnimatePresence>

        {/* nudge toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className="absolute inset-x-0 top-16 z-[70] mx-auto w-fit rounded-full bg-lime px-4 py-2 text-[13px] font-bold text-black"
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
        A Gen Z savings app concept. Open <b className="text-ink-dim">Rainy day fund</b> (95%
        there), tap <b className="text-ink-dim">Stash money</b> and add ₹2,500 to trigger the
        level-up.
      </p>
    </div>
  );
}
