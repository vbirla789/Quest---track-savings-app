import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  GOALS,
  type Contribution,
  type Cycle,
  type Goal,
  type SquadMember,
} from "./data";
import PhoneFrame from "./components/PhoneFrame";
import ContactPicker from "./components/ContactPicker";
import { NewQuestSheet, StashSheet } from "./components/Sheets";
import { parseLocalDate } from "./lib/dates";
import { milestones } from "./lib/pace";
import Dashboard from "./screens/Dashboard";
import EditQuest from "./screens/EditQuest";
import GoalDetails from "./screens/GoalDetails";
import Success from "./screens/Success";

type View = "dashboard" | "details" | "edit";

/* iOS drawer curve — the same one the bottom sheets ride, so a screen presenting
   itself and a sheet presenting itself feel like one gesture vocabulary. */
const SHEET_EASE = [0.32, 0.72, 0, 1] as [number, number, number, number];
type SheetKind = "quest" | "stash" | "contacts" | null;

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
  /* Which milestone we're celebrating, if any. Held by goal id + level rather
     than a snapshot of the goal, so the screen keeps reading live figures. */
  /* `origin` is why the screen is up. Earning a milestone hands you onward to the
     dashboard; replaying an old one should put you back where you were, so the
     button has to say different things. */
  const [celebration, setCelebration] = useState<
    { goalId: string; level: number; origin: "earned" | "replay" } | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);

  const selected = goals.find((g) => g.id === selectedId) ?? null;
  const celebrated = celebration ? (goals.find((g) => g.id === celebration.goalId) ?? null) : null;

  function openGoal(id: string) {
    setSelectedId(id);
    setView("details");
  }

  function addToGoal(id: string, amount: number) {
    if (amount <= 0) return;
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    /* Not capped at the target. The full amount goes into the ledger either way,
       so clamping `saved` made the two disagree the moment a goal finished —
       the same drift the seed had. Progress already clamps its percentage at
       100, so overshooting reads fine and the money is still counted. */
    const newSaved = goal.saved + amount;

    // Recorded newest first so the streak grid and the breakdown both see it.
    // Money you add by hand is a top-up on whatever the cycle already puts in,
    // which is exactly what the breakdown's "Bonus add on" counts — so there is
    // nothing left for the stash flow to ask about.
    const entry: Contribution = {
      id: `${id}-${Date.now()}`,
      source: "boost",
      label: "Bonus add on",
      amount,
      daysAgo: 0,
    };
    const updated = goals.map((g) =>
      g.id === id
        ? { ...g, saved: newSaved, contributions: [entry, ...g.contributions] }
        : g,
    );
    setGoals(updated);

    /* Any milestone crossed by this stash earns the screen, not only the last
       one — and if a single deposit clears two, the higher one is the story. */
    const before = milestones(goal);
    const after = milestones({ ...goal, saved: newSaved });
    const crossed = after.reduce(
      (acc, m, i) => (m.earned && !before[i].earned ? m.level : acc),
      0,
    );
    if (crossed > 0) {
      // let the bar animate a beat before the takeover
      setTimeout(() => setCelebration({ goalId: id, level: crossed, origin: "earned" }), 620);
    }
  }

  function nudge(name: string) {
    setToast(`Nudged ${name}`);
    setTimeout(() => setToast(null), 2200);
  }

  function createQuest({
    name,
    target,
    targetDate,
    cycle,
  }: {
    name: string;
    target: number;
    targetDate: string;
    cycle: Cycle;
  }) {
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${goals.length}`;
    // The target date sets the pace: split the goal across the weeks remaining
    // so the "Savings/wk" stat and finish projection mean something from day one.
    const weeksLeft = Math.max(
      1,
      Math.ceil((parseLocalDate(targetDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)),
    );
    setGoals([
      {
        id,
        name,
        cycle,
        target,
        saved: 0,
        weeklyAutoSave: Math.ceil(target / weeksLeft / 50) * 50,
        streakWeeks: 0,
        /* The wizard asks for this and used to throw it away, which left every
           new goal reading "Ongoing" with no pace to be off. */
        targetDate,
        squad: [],
        contributions: [],
      },
      ...goals, // newest quest sits at the top of the stack
    ]);
    setSheet(null);
    setToast(`Goal started · ${name}`);
    setTimeout(() => setToast(null), 2200);
  }

  function saveQuest({
    name,
    target,
    targetDate,
  }: {
    name: string;
    target: number;
    targetDate: string;
  }) {
    setGoals(
      goals.map((g) =>
        g.id === selectedId
          ? {
              ...g,
              name,
              target,
              targetDate,
            }
          : g,
      ),
    );
    setView("details");
    setToast("Goal updated");
    setTimeout(() => setToast(null), 2200);
  }

  function deleteQuest() {
    const gone = goals.find((g) => g.id === selectedId);
    setGoals(goals.filter((g) => g.id !== selectedId));
    setView("dashboard");
    setSelectedId(null);
    setToast(`Deleted ${gone?.name ?? "goal"}`);
    setTimeout(() => setToast(null), 2200);
  }

  function stashCash(goalId: string, amount: number) {
    setSheet(null);
    addToGoal(goalId, amount);
    const g = goals.find((x) => x.id === goalId);
    const completes = g && g.saved + amount >= g.target;
    if (!completes) {
      setToast(`Added ₹${amount.toLocaleString("en-IN")} to ${g?.name ?? "goal"}`);
      setTimeout(() => setToast(null), 2200);
    }
  }

  function addFriends(picked: SquadMember[]) {
    setSheet(null);
    if (picked.length === 0) return;
    setGoals(
      goals.map((g) =>
        g.id === selectedId ? { ...g, squad: [...g.squad, ...picked] } : g,
      ),
    );
    const label =
      picked.length === 1 ? picked[0].name.split(/\s+/)[0] : `${picked.length} friends`;
    setToast(`Added ${label}`);
    setTimeout(() => setToast(null), 2200);
  }

  function closeCelebration(toDashboard: boolean) {
    setCelebration(null);
    if (toDashboard) {
      setView("dashboard");
      setSelectedId(null);
    }
  }

  const scale = usePhoneScale();
  const isPhone = useIsPhone();

  const screens = (
    <>
        {/* A card stack, not a swap. Layer order matters here: the dashboard's
            own sticky header is z-30, so a presented sheet has to sit above that
            or the header punches through and you get the dashboard's controls
            floating over the detail screen. Ladder: dashboard header 30, detail
            40, edit 45, bottom sheets 50, picker/level-up 60, toast 70. The dashboard is the root and stays mounted;
            detail rises over it and edit rises over detail, each dismissed by the
            chevron-down in its own header. That's what the down-chevron promises,
            and it's why these can't share an AnimatePresence with mode="wait" —
            that would unmount the layer underneath and there'd be nothing to
            slide over. */}
        <div className="h-full">
          <Dashboard
            goals={goals}
            onOpenGoal={openGoal}
            onNudge={nudge}
            onNewQuest={() => setSheet("quest")}
            onStashCash={() => setSheet("stash")}
          />
        </div>

        <AnimatePresence>
          {(view === "details" || view === "edit") && selected && (
            <motion.div
              key="details"
              className="absolute inset-0 z-40"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.42, ease: SHEET_EASE }}
            >
              <GoalDetails
                goal={selected}
                onBack={() => setView("dashboard")}
                onStashMoney={() => setSheet("stash")}
                onNudgeSquad={() => nudge("your squad")}
                onAddFriends={() => setSheet("contacts")}
                onCelebrate={(level) =>
                  setCelebration({ goalId: selected.id, level, origin: "replay" })
                }
                onEdit={() => setView("edit")}
                onDelete={deleteQuest}
              />
            </motion.div>
          )}

          {view === "edit" && selected && (
            <motion.div
              key="edit"
              className="absolute inset-0 z-[45]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.42, ease: SHEET_EASE }}
            >
              <EditQuest
                goal={selected}
                onCancel={() => setView("details")}
                onSave={saveQuest}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* bottom sheets for the two dashboard CTAs */}
        <AnimatePresence>
          {sheet === "quest" && (
            <NewQuestSheet key="quest" onClose={() => setSheet(null)} onSubmit={createQuest} />
          )}
          {sheet === "contacts" && selected && (
            <ContactPicker
              key="contacts"
              alreadyAdded={selected.squad}
              onClose={() => setSheet(null)}
              onAdd={addFriends}
            />
          )}
          {sheet === "stash" && (
            <StashSheet
              key="stash"
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
              /* Light system: the streak pill's shape and type, with a heavier
                 shadow so it reads as floating over content rather than sitting
                 in it. No emoji — mono at 12px has no room for them and the rest
                 of this system doesn't use any. */
              className="absolute inset-x-0 top-16 z-[70] mx-auto w-fit max-w-[85%] rounded-[50px] border border-[#ebebeb] bg-white px-4 py-2.5 text-center font-mono text-[12px] font-medium uppercase leading-[1.4] text-black"
              style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.10))" }}
              initial={{ opacity: 0, y: -14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* completion takeover */}
        <AnimatePresence>
          {celebrated && (
            <Success
              goal={celebrated}
              level={celebration!.level}
              isGoalComplete={celebration!.level === milestones(celebrated).length}
              origin={celebration!.origin}
              onShare={() => {
                closeCelebration(false);
                setToast("Shared");
                setTimeout(() => setToast(null), 2200);
              }}
              /* Replay came from the goal, so it goes back to the goal. Earning
                 one is the end of a task, so it hands you to the list. */
              onDismiss={() => closeCelebration(celebration!.origin === "earned")}
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
