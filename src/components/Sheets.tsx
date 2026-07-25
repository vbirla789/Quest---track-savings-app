import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import type { Goal } from "../data";
import { inr, inrPlain } from "../lib/format";

/* ----------------------------------------------------------------------------
 * Bottom sheets for the dashboard's two primary actions.
 * - NewQuestSheet  → name + emoji + target → creates a goal
 * - StashSheet     → pick a quest + amount → adds a contribution
 * Both slide up inside the phone with a dimmed backdrop.
 * --------------------------------------------------------------------------*/

const SPRING = { type: "spring" as const, stiffness: 320, damping: 30 };

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        className="relative rounded-t-[24px] bg-card px-4 pb-8 pt-3"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={SPRING}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-elev" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full bg-elev text-[13px] text-ink-dim active:scale-95"
          >
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------- New quest ------------------------------- */

const EMOJIS = ["🏖️", "📱", "🛵", "🎮", "✈️", "💻", "🎧", "🛟"];
const TARGET_CHIPS = [10000, 25000, 50000, 100000];

export function NewQuestSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, emoji: string, target: number) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [target, setTarget] = useState<number | null>(null);
  const valid = name.trim().length > 0 && target !== null && target > 0;

  return (
    <Sheet title="New quest" onClose={onClose}>
      <label className="mb-2 block text-[13px] font-medium text-ink-dim">Pick an icon</label>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`grid size-11 shrink-0 place-items-center rounded-xl border text-[22px] transition-colors ${
              emoji === e ? "border-lime bg-lime/10" : "border-elev bg-transparent"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <label className="mb-2 block text-[13px] font-medium text-ink-dim">What are you saving for?</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Ladakh ride"
        className="mb-4 h-12 w-full rounded-xl bg-elev px-4 text-[15px] font-medium text-ink placeholder:text-ink-dim outline-none focus:ring-2 focus:ring-lime/60"
      />

      <label className="mb-2 block text-[13px] font-medium text-ink-dim">Target</label>
      <div className="mb-6 flex gap-2">
        {TARGET_CHIPS.map((t) => (
          <button
            key={t}
            onClick={() => setTarget(t)}
            className={`h-10 flex-1 rounded-full text-[13px] font-semibold tnum transition-colors ${
              target === t ? "bg-lime text-black" : "bg-elev text-ink"
            }`}
          >
            {t >= 100000 ? "₹ 1L" : `₹ ${inrPlain(t / 1000)}k`}
          </button>
        ))}
      </div>

      <button
        disabled={!valid}
        onClick={() => valid && onCreate(name.trim(), emoji, target!)}
        className="h-12 w-full rounded-full bg-lime text-[16px] font-semibold text-black transition-opacity active:scale-[0.98] disabled:opacity-40"
      >
        Start quest
      </button>
    </Sheet>
  );
}

/* ------------------------------- Stash cash ------------------------------ */

const AMOUNT_CHIPS = [500, 1000, 2500];

export function StashSheet({
  goals,
  onClose,
  onStash,
}: {
  goals: Goal[];
  onClose: () => void;
  onStash: (goalId: string, amount: number) => void;
}) {
  const active = goals.filter((g) => g.saved < g.target);
  const [goalId, setGoalId] = useState(active[0]?.id ?? "");
  const [amount, setAmount] = useState<number>(AMOUNT_CHIPS[0]);

  return (
    <Sheet title="Stash cash" onClose={onClose}>
      <label className="mb-2 block text-[13px] font-medium text-ink-dim">Into which quest?</label>
      <div className="mb-4 flex flex-col gap-2">
        {active.map((g) => {
          const p = Math.round((g.saved / g.target) * 100);
          const selected = goalId === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setGoalId(g.id)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                selected ? "border-lime bg-lime/10" : "border-elev bg-transparent"
              }`}
            >
              <span className="text-[20px]">{g.emoji}</span>
              <span className="flex-1 text-[14px] font-medium">{g.name}</span>
              <span className="text-[13px] font-medium text-ink-dim tnum">{p}%</span>
            </button>
          );
        })}
      </div>

      <label className="mb-2 block text-[13px] font-medium text-ink-dim">How much?</label>
      <div className="mb-6 flex gap-2">
        {AMOUNT_CHIPS.map((a) => (
          <button
            key={a}
            onClick={() => setAmount(a)}
            className={`h-10 flex-1 rounded-full text-[13px] font-semibold tnum transition-colors ${
              amount === a ? "bg-lime text-black" : "bg-elev text-ink"
            }`}
          >
            ₹ {inrPlain(a)}
          </button>
        ))}
      </div>

      <button
        disabled={!goalId}
        onClick={() => goalId && onStash(goalId, amount)}
        className="h-12 w-full rounded-full bg-lime text-[16px] font-semibold text-black transition-opacity active:scale-[0.98] disabled:opacity-40"
      >
        Stash {inr(amount)}
      </button>
    </Sheet>
  );
}
