import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GOALS, levelFromXp, type Contribution, type Goal } from "./data";
import PhoneFrame from "./components/PhoneFrame";
import { NewQuestSheet, StashSheet } from "./components/Sheets";
import Dashboard from "./screens/Dashboard";
import GoalDetails from "./screens/GoalDetails";
import LevelUp from "./screens/LevelUp";

type View = "dashboard" | "details";
type SheetKind = "quest" | "edit" | "stash" | null;

/* Shrink the phone to fit small desktop windows while keeping it 1:1 on a
   roomy screen. Outer phone box ≈ 400×854 + a little breathing room. */
function usePhoneScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const compute = () =>
      setScale(Math.min(1, window.innerWidth / 412, window.innerHeight / 878));
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return scale;
}

/* On a real phone we ditch the mockup and run edge-to-edge. */
function useIsPhone() {
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isPhone;
}

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

    // Record the stash in the ledger, newest first, so it lands at the top of
    // "Recent stashes" rather than being invisible.
    const entry: Contribution = {
      id: `${id}-${Date.now()}`,
      source: "boost",
      label: "Manual boost",
      amount,
      daysAgo: 0,
    };
    const updated = goals.map((g) =>
      g.id === id
        ? { ...g, saved: newSaved, contributions: [entry, ...g.contributions] }
        : g,
    );
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

  function createQuest({
    name,
    emoji,
    target,
    targetDate,
  }: {
    name: string;
    emoji: string;
    target: number;
    targetDate: string;
  }) {
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${goals.length}`;
    // The target date sets the pace: split the goal across the weeks remaining
    // so the "Savings/wk" stat and finish projection mean something from day one.
    const weeksLeft = Math.max(
      1,
      Math.ceil((new Date(targetDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)),
    );
    setGoals([
      {
        id,
        name,
        emoji,
        target,
        saved: 0,
        weeklyAutoSave: Math.ceil(target / weeksLeft / 50) * 50,
        streakWeeks: 0,
        deadline: new Date(targetDate).toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        }),
        squad: [],
        contributions: [],
      },
      ...goals, // newest quest sits at the top of the stack
    ]);
    setSheet(null);
    setToast(`Quest started — ${emoji} ${name}`);
    setTimeout(() => setToast(null), 2200);
  }

  function saveQuest({
    name,
    emoji,
    target,
    targetDate,
  }: {
    name: string;
    emoji: string;
    target: number;
    targetDate: string;
  }) {
    setGoals(
      goals.map((g) =>
        g.id === selectedId
          ? {
              ...g,
              name,
              // keep a hand-picked icon unless the name changed the guess
              emoji: g.name === name ? g.emoji : emoji,
              target,
              targetDate,
              deadline: new Date(targetDate).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              }),
            }
          : g,
      ),
    );
    setSheet(null);
    setToast("Quest updated ✅");
    setTimeout(() => setToast(null), 2200);
  }

  function deleteQuest() {
    const gone = goals.find((g) => g.id === selectedId);
    setGoals(goals.filter((g) => g.id !== selectedId));
    setView("dashboard");
    setSelectedId(null);
    setToast(`Deleted ${gone?.name ?? "quest"}`);
    setTimeout(() => setToast(null), 2200);
  }

  function stashCash(goalId: string, amount: number) {
    setSheet(null);
    addToGoal(goalId, amount);
    const g = goals.find((x) => x.id === goalId);
    const completes = g && g.saved + amount >= g.target;
    if (!completes) {
      setToast(`Stashed ₹${amount.toLocaleString("en-IN")} to ${g?.name ?? "quest"} ⚡`);
      setTimeout(() => setToast(null), 2200);
    }
  }

  function closeCelebration() {
    setCelebration(null);
    setView("dashboard");
    setSelectedId(null);
  }

  const scale = usePhoneScale();
  const isPhone = useIsPhone();

  const screens = (
    <>
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
                onEdit={() => setSheet("edit")}
                onDelete={deleteQuest}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* bottom sheets for the two dashboard CTAs */}
        <AnimatePresence>
          {sheet === "quest" && (
            <NewQuestSheet onClose={() => setSheet(null)} onSubmit={createQuest} />
          )}
          {sheet === "edit" && selected && (
            <NewQuestSheet
              initial={{
                name: selected.name,
                target: selected.target,
                targetDate: selected.targetDate,
              }}
              onClose={() => setSheet(null)}
              onSubmit={saveQuest}
            />
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
    </>
  );

  // real phone → edge-to-edge, no mockup
  if (isPhone) return <PhoneFrame bare>{screens}</PhoneFrame>;

  return (
    <div className="flex h-svh w-full items-center justify-center overflow-hidden">
      <div style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}>
        <PhoneFrame>{screens}</PhoneFrame>
      </div>
    </div>
  );
}
