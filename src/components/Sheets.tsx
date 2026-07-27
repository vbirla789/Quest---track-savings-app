import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ContributionSource, Goal } from "../data";
import { CATEGORIES } from "../lib/categories";
import { inrPlain } from "../lib/format";
import { DateWheel, Keyboard } from "./Keyboard";
import MaskIcon from "./MaskIcon";

/* ----------------------------------------------------------------------------
 * Bottom sheets for the dashboard's two primary actions.
 *
 * Both ask ONE question per step so the user never faces a wall of fields:
 *   New quest → goal name → target amount → target date
 *   Add money → which quest → how much
 * The shell (scrim, grabber, panel, single CTA) is shared; only the question
 * block swaps, sliding sideways as you advance.
 * --------------------------------------------------------------------------*/

/* The overlay and the sheet animate as separate layers off one parent state,
   so the scrim fades on its own clock while the panel slides — rather than the
   whole stack fading and sliding at once, which read as a jump.
 *
 * Both directions use the iOS drawer curve (a strong ease-out). An ease-in on
 * an exit stalls at the exact moment the eye is on it, which is what made the
 * previous close read as a stutter. A tween on this curve also beats a spring
 * here: the sheet travels the full screen height, and spring overshoot on a
 * surface pinned to the bottom edge shows up as a wobble. */
const EASE_DRAWER = [0.32, 0.72, 0, 1] as [number, number, number, number];

const OVERLAY_V = {
  hidden: { opacity: 0, transition: { duration: 0.25, ease: EASE_DRAWER } },
  visible: { opacity: 1, transition: { duration: 0.35, ease: EASE_DRAWER } },
};

const SHEET_V = {
  hidden: { y: "100%", transition: { duration: 0.3, ease: EASE_DRAWER } },
  visible: { y: 0, transition: { duration: 0.4, ease: EASE_DRAWER } },
};

const FIELD =
  "w-full rounded-[16px] bg-elev p-4 text-[14px] font-medium leading-[1.4] text-white caret-lime outline-none placeholder:font-normal placeholder:text-ink-dim";

/**
 * Sheet text field.
 *
 * `inputMode="none"` suppresses the phone's on-screen keyboard — ours is the
 * touch input surface — but the field stays a real editable input, so a laptop
 * keyboard types into it normally and the caret is visible. It focuses itself
 * once the sheet has settled, with preventScroll so the browser doesn't yank
 * the field into view mid-animation.
 */
function Field({
  value,
  onChange,
  placeholder,
  numeric = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus({ preventScroll: true }), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <input
      ref={ref}
      inputMode="none"
      value={value}
      onChange={(e) =>
        onChange(numeric ? e.target.value.replace(/\D/g, "").slice(0, 9) : e.target.value)
      }
      placeholder={placeholder}
      className={numeric ? `${FIELD} tnum` : FIELD}
    />
  );
}

function SheetShell({
  step,
  label,
  helper,
  cta,
  ctaDisabled,
  onCta,
  onClose,
  children,
  accessory,
}: {
  step: number;
  label: string;
  helper: string;
  cta: string;
  ctaDisabled?: boolean;
  onCta: () => void;
  onClose: () => void;
  children: ReactNode;
  /** faux keyboard / date wheel docked under the panel */
  accessory?: ReactNode;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-50"
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* overlay */}
      {/* touch-none so dragging the scrim doesn't scroll the screen behind it */}
      <motion.div
        variants={OVERLAY_V}
        className="absolute inset-0 touch-none bg-black/80"
        onClick={onClose}
      />
      {/* sheet, riding above it. Promoted to its own layer so sliding never
          repaints the docked keyboard's ~30 keys. */}
      <motion.div
        variants={SHEET_V}
        className="absolute inset-x-0 bottom-0 flex max-h-full flex-col"
        style={{ willChange: "transform" }}
      >
        <div className="flex shrink-0 justify-center py-3">
          <div className="h-1 w-9 rounded-sm bg-white/64" />
        </div>
        <motion.div
          /* gap-6 is a floor, not the spacing: justify-between spreads the
             question and the CTA apart, and the gap guarantees they still
             breathe if the panel is squeezed on a short screen. */
          className="flex min-h-0 flex-col justify-between gap-6 overflow-hidden rounded-t-[24px] bg-[#202125] py-4"
          /* real height, so justify-between has room to work — flex-1 here
             would collapse to content in an auto-height sheet. min-h-0 still
             lets it shrink when the sheet is capped to a short viewport. */
          animate={{ height: accessory ? 290 : 350 }}
          initial={false}
          transition={{ duration: 0.25, ease: EASE_DRAWER }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              className="flex flex-col gap-3 px-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              /* the outgoing step stays mounted while it animates out — lock it
                 so a fast tap can't type into the question you just answered */
              exit={{ opacity: 0, x: -20, pointerEvents: "none" }}
              transition={{ duration: 0.2, ease: EASE_DRAWER }}
            >
              <p className="text-[18px] font-medium leading-[1.4] text-white">{label}</p>
              {children}
              <p className="text-[14px] leading-[1.4] text-ink-dim">{helper}</p>
            </motion.div>
          </AnimatePresence>

          <div className="shrink-0 px-4">
            <button
              disabled={ctaDisabled}
              onClick={onCta}
              className="h-12 w-full rounded-full bg-lime text-[16px] font-semibold text-black transition-opacity active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
            >
              {cta}
            </button>
          </div>
        </motion.div>
        <div className="shrink-0">{accessory}</div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------- New quest ------------------------------- */

/** Pick an icon from the goal's name so we don't need to ask a fourth question. */
const EMOJI_HINTS: [RegExp, string][] = [
  [/trip|travel|vacation|holiday|goa|ladakh|europe/i, "🏖️"],
  [/iphone|phone|pixel|samsung/i, "📱"],
  [/macbook|laptop|pc|desktop/i, "💻"],
  [/bike|scooter|cycle|ride/i, "🛵"],
  [/car/i, "🚗"],
  [/game|ps5|xbox|console/i, "🎮"],
  [/rainy|emergency|safety/i, "🛟"],
  [/camera|lens/i, "📷"],
  [/headphone|airpod|earbud/i, "🎧"],
  [/wedding|shaadi/i, "💍"],
  [/course|college|fees|study/i, "🎓"],
];

function guessEmoji(name: string) {
  for (const [re, emoji] of EMOJI_HINTS) if (re.test(name)) return emoji;
  return "🎯";
}

function sixMonthsOut() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function NewQuestSheet({
  initial,
  onClose,
  onSubmit,
}: {
  /** present when editing an existing quest — the same wizard, prefilled */
  initial?: { name: string; target: number; targetDate?: string };
  onClose: () => void;
  onSubmit: (input: { name: string; emoji: string; target: number; targetDate: string }) => void;
}) {
  const isEdit = !!initial;
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.target) : "");
  // seed the wheel six months out so the field reads as filled, like the design
  const [date, setDate] = useState(initial?.targetDate || sixMonthsOut());

  const target = Number(amount) || 0;

  const steps = [
    {
      label: "Quest name",
      helper: "You can always change this later",
      cta: "Continue",
      valid: name.trim().length > 0,
      field: (
        <Field value={name} onChange={setName} placeholder="eg. Ladakh ride" />
      ),
      accessory: (
        <Keyboard
          variant="qwerty"
          onKey={(ch) => setName((n) => n + ch)}
          onBackspace={() => setName((n) => n.slice(0, -1))}
          onDone={() => name.trim() && setStep(1)}
        />
      ),
    },
    {
      label: "Target amount",
      helper: "You can always change this later",
      cta: "Continue",
      valid: target > 0,
      field: (
        <Field
          value={amount ? `₹${inrPlain(target)}` : ""}
          onChange={setAmount}
          placeholder="₹50,000"
          numeric
        />
      ),
      accessory: (
        <Keyboard
          variant="numeric"
          onKey={(ch) => setAmount((a) => (a + ch).replace(/^0+/, "").slice(0, 9))}
          onBackspace={() => setAmount((a) => a.slice(0, -1))}
        />
      ),
    },
    {
      label: "Target date",
      helper: "Stay on track by adding a target date",
      cta: isEdit ? "Save changes" : "Start quest",
      valid: date !== "",
      field: (
        <input
          readOnly
          value={date ? new Date(date).toLocaleDateString("en-GB") : ""}
          placeholder="DD/MM/YYYY"
          className={`${FIELD} tnum`}
        />
      ),
      accessory: <DateWheel value={date} onChange={setDate} />,
    },
  ];

  const current = steps[step];

  function advance() {
    if (!current.valid) return;
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    onSubmit({ name: name.trim(), emoji: guessEmoji(name), target, targetDate: date });
  }

  return (
    <SheetShell
      step={step}
      label={current.label}
      helper={current.helper}
      cta={current.cta}
      ctaDisabled={!current.valid}
      onCta={advance}
      onClose={onClose}
      accessory={current.accessory}
    >
      {current.field}
    </SheetShell>
  );
}

/* ------------------------------- Add money ------------------------------- */

const AMOUNT_CHIPS = [500, 1000, 2500];

/* Categories live in one shared module so the chips here and the ledger rows on
   the details screen can't drift apart. */

export function StashSheet({
  goals,
  defaultGoalId,
  onClose,
  onStash,
}: {
  goals: Goal[];
  defaultGoalId?: string;
  onClose: () => void;
  onStash: (
    goalId: string,
    amount: number,
    category: { label: string; source: ContributionSource; categoryId: string },
  ) => void;
}) {
  const active = goals.filter((g) => g.saved < g.target);
  const presetId =
    defaultGoalId && active.some((g) => g.id === defaultGoalId) ? defaultGoalId : "";

  // Opening from a goal's own screen already answers "which quest?" — skip it.
  const [step, setStep] = useState(presetId ? 1 : 0);
  const [goalId, setGoalId] = useState(presetId || active[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const value = Number(amount) || 0;
  const goal = active.find((g) => g.id === goalId);
  const isOther = category === "others";
  const picked = CATEGORIES.find((c) => c.id === category);
  const categoryLabel = isOther ? customCategory.trim() : (picked?.label ?? "");

  const steps = [
    {
      label: "Add to which quest?",
      helper: "Pick where this money should go",
      cta: "Continue",
      valid: goalId !== "",
      accessory: undefined,
      field: (
        <div className="flex max-h-[168px] flex-col gap-2 overflow-y-auto phone-scroll">
          {active.map((g) => {
            const p = Math.round((g.saved / g.target) * 100);
            const selected = goalId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setGoalId(g.id)}
                className={`flex items-center gap-3 rounded-[16px] border p-3 text-left transition-colors ${
                  selected ? "border-lime bg-lime/10" : "border-transparent bg-elev"
                }`}
              >
                <span className="text-[20px]">{g.emoji}</span>
                <span className="flex-1 text-[14px] font-medium">{g.name}</span>
                <span className="text-[13px] font-medium text-ink-dim tnum">{p}%</span>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      label: "How much?",
      helper: goal ? `Adding to ${goal.name}` : "Enter an amount to stash",
      cta: "Continue",
      valid: value > 0,
      accessory: (
        <Keyboard
          variant="numeric"
          onKey={(ch) => setAmount((a) => (a + ch).replace(/^0+/, "").slice(0, 9))}
          onBackspace={() => setAmount((a) => a.slice(0, -1))}
        />
      ),
      field: (
        <div className="flex flex-col gap-3">
          <Field
            value={amount ? `₹${inrPlain(value)}` : ""}
            onChange={setAmount}
            placeholder="₹2,500"
            numeric
          />
          <div className="flex gap-2">
            {AMOUNT_CHIPS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className={`h-9 flex-1 rounded-full text-[13px] font-semibold tnum transition-colors ${
                  value === a ? "bg-lime text-black" : "bg-elev text-ink"
                }`}
              >
                ₹{inrPlain(a)}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Category",
      helper: "How did you save this money?",
      cta: value > 0 ? `Add ₹${inrPlain(value)}` : "Add money",
      valid: categoryLabel !== "",
      // only the free-text "Others" name needs a keyboard
      accessory: isOther ? (
        <Keyboard
          variant="qwerty"
          onKey={(ch) => setCustomCategory((n) => n + ch)}
          onBackspace={() => setCustomCategory((n) => n.slice(0, -1))}
          doneLabel="done"
          onDone={() => undefined}
        />
      ) : undefined,
      field: (
        <div className="phone-scroll flex max-h-[184px] flex-col gap-3 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => {
              const selected = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`flex h-10 items-center justify-center gap-2 rounded-full border text-[14px] font-medium transition-colors ${
                    selected
                      ? "border-lime bg-lime/15 text-lime"
                      : "border-transparent bg-elev text-ink"
                  }`}
                >
                  <MaskIcon src={c.icon} inset={c.inset} box={20} />
                  {c.label}
                </button>
              );
            })}
          </div>
          {isOther && (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] text-ink-dim">Name this category</p>
              <Field
                value={customCategory}
                onChange={setCustomCategory}
                placeholder="e.g. Doctor, Gift…"
              />
            </div>
          )}
        </div>
      ),
    },
  ];

  const current = steps[step];

  function advance() {
    if (!current.valid) return;
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    onStash(goalId, value, {
      label: categoryLabel,
      source: picked?.source ?? "boost",
      categoryId: category,
    });
  }

  return (
    <SheetShell
      step={step}
      label={current.label}
      helper={current.helper}
      cta={current.cta}
      ctaDisabled={!current.valid}
      onCta={advance}
      onClose={onClose}
      accessory={current.accessory}
    >
      {current.field}
    </SheetShell>
  );
}
