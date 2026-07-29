import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Cycle, Goal } from "../data";
import { inrPlain } from "../lib/format";
import { DateWheel, Keyboard } from "./Keyboard";
import MaskIcon from "./MaskIcon";

/* ----------------------------------------------------------------------------
 * Bottom sheets for the dashboard's two primary actions.
 *
 * Both ask ONE question per step so the user never faces a wall of fields:
 *   New quest → quest name → target amount → target date → cycle
 *   Add money → which quest → how much
 * The shell (scrim, grabber, panel, single CTA) is shared; only the question
 * block swaps, sliding sideways as you advance. No supporting copy under the
 * question — the label and the field carry it.
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

/* Light system, same tokens as Overview: #f9f9fb fills, #e6e7e7 hairlines, 2px
   on controls and 4px on surfaces. Blue is selection, black is action — so a
   chosen chip never looks like the button that commits. */
const FIELD_BASE =
  "w-full rounded-[4px] border border-[#e6e7e7] bg-[#f9f9fb] p-4 caret-black outline-none placeholder:text-[#a3a3a3]";
const FIELD = `${FIELD_BASE} font-mono text-[14px] font-medium leading-[1.4] text-black`;
/* Money is set in the serif everywhere else in this system, so it is here too. */
const FIELD_MONEY = `${FIELD_BASE} font-serif text-[16px] font-semibold leading-[1.3] text-black tnum`;
const RING = "shadow-[0_0_0_1.5px_#0a59ff]";

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
      className={numeric ? FIELD_MONEY : FIELD}
    />
  );
}

function SheetShell({
  step,
  label,
  cta,
  ctaDisabled,
  onCta,
  onClose,
  children,
  accessory,
  panelHeight,
}: {
  step: number;
  label: string;
  cta: string;
  ctaDisabled?: boolean;
  onCta: () => void;
  onClose: () => void;
  children: ReactNode;
  /** faux keyboard / date wheel docked under the panel */
  accessory?: ReactNode;
  /** overrides the default for a step that needs more room (e.g. an open menu) */
  panelHeight?: number;
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
        className="absolute inset-0 touch-none bg-black/40"
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
          <div className="h-1 w-9 rounded-sm bg-black/20" />
        </div>
        <motion.div
          /* gap-6 is now the spacing rather than a floor: the panel is sized by
             its content, so justify-between has nothing to distribute. A fixed
             290 left a dead white band between a single field and the CTA. */
          className="flex min-h-0 flex-col justify-between gap-6 overflow-hidden rounded-t-[4px] border-t border-[#e6e7e7] bg-white py-4"
          /* Auto, so a step is exactly as tall as it needs — and the quest picker
             grows on its own when its menu opens instead of needing a hardcoded
             open height. min-h-0 still lets it shrink on a short viewport. */
          animate={{ height: panelHeight ?? "auto" }}
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
              <p className="font-serif text-[18px] font-medium leading-[1.3] text-black">{label}</p>
              {children}
            </motion.div>
          </AnimatePresence>

          <div className="shrink-0 px-4">
            <button
              disabled={ctaDisabled}
              onClick={onCta}
              className="h-12 w-full rounded-[2px] border border-[#8f8f8f] bg-black font-mono text-[14px] font-medium uppercase text-white transition-opacity active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
            >
              {cta}
            </button>
          </div>
        </motion.div>
        {/* White behind the accessory: the keyboard deck has 25px rounded top
            corners, and with nothing behind them those corners showed the scrim
            as two dark notches. The sheet surface now runs on underneath, so the
            curve reveals the sheet. */}
        <div className="shrink-0 bg-white">{accessory}</div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------- New quest ------------------------------- */

const CYCLES: { id: Cycle; label: string; hint: string }[] = [
  { id: "daily", label: "Daily", hint: "Mon, Tue, Wed…" },
  { id: "weekly", label: "Weekly", hint: "Week 1, Week 2…" },
  { id: "monthly", label: "Monthly", hint: "Jan, Feb, Mar…" },
];

function sixMonthsOut() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* Creation only. Editing an existing goal is a full screen (EditQuest) — a
   wizard is right for a funnel, wrong for changing one prefilled field. */
export function NewQuestSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    target: number;
    targetDate: string;
    cycle: Cycle;
  }) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  // seed the wheel six months out so the field reads as filled, like the design
  const [date, setDate] = useState(sixMonthsOut());
  const [cycle, setCycle] = useState<Cycle | "">("");

  const target = Number(amount) || 0;

  const steps = [
    {
      label: "Goal name",
      cta: "Continue",
      valid: name.trim().length > 0,
      field: (
        <Field value={name} onChange={setName} placeholder="e.g. Ladakh ride" />
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
      cta: "Continue",
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
    {
      /* Last question, because it's the only one whose answer changes how the
         goal is *read* later — it sets the granularity of the streak grid. */
      label: "How often will you pay in?",
      cta: "Start goal",
      valid: cycle !== "",
      accessory: undefined,
      field: (
        <div className="flex flex-col gap-2">
          {CYCLES.map((c) => {
            const selected = cycle === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCycle(c.id)}
                className={`flex items-center justify-between rounded-[4px] border p-4 text-left transition-colors ${
                  selected
                    ? "border-[#0a59ff] bg-[#edf2fd]"
                    : "border-[#e6e7e7] bg-[#f9f9fb]"
                }`}
              >
                <span
                  className={`font-mono text-[14px] font-medium ${
                    selected ? "text-[#0a59ff]" : "text-black"
                  }`}
                >
                  {c.label}
                </span>
                <span className={`font-mono text-[12px] ${selected ? "text-[#0a59ff]" : "text-[#a3a3a3]"}`}>
                  {c.hint}
                </span>
              </button>
            );
          })}
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
    onSubmit({ name: name.trim(), target, targetDate: date, cycle: cycle as Cycle });
  }

  return (
    <SheetShell
      step={step}
      label={current.label}
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
  onStash: (goalId: string, amount: number) => void;
}) {
  const active = goals.filter((g) => g.saved < g.target);
  const presetId =
    defaultGoalId && active.some((g) => g.id === defaultGoalId) ? defaultGoalId : "";

  // Opening from a goal's own screen already answers "which quest?" — skip it.
  const [step, setStep] = useState(presetId ? 1 : 0);
  const [goalId, setGoalId] = useState(presetId || active[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const chosen = active.find((g) => g.id === goalId);

  const value = Number(amount) || 0;

  const steps = [
    {
      label: "Add to which goal?",
      cta: "Continue",
      valid: goalId !== "",
      accessory: undefined,
      field: (
        <div className="flex flex-col gap-2">
          {/* Reads as a field, behaves as a select: one line showing the current
              choice, and the options only when you ask for them. A bare list of
              every quest made the first step the busiest one. */}
          <button
            onClick={() => setPickerOpen((o) => !o)}
            className={`flex w-full items-center gap-3 rounded-[4px] border border-[#e6e7e7] bg-[#f9f9fb] p-4 text-left transition-shadow ${
              pickerOpen ? RING : ""
            }`}
          >
            {chosen ? (
              <span className="flex-1 font-mono text-[14px] font-medium text-black">{chosen.name}</span>
            ) : (
              <span className="flex-1 font-mono text-[14px] text-[#a3a3a3]">Select a goal</span>
            )}
            <MaskIcon
              src="/icons/chevron-left.svg"
              inset="21.88% 38.54% 21.88% 30.21%"
              box={20}
              className={`text-[#a3a3a3] transition-transform duration-200 ${
                pickerOpen ? "rotate-90" : "-rotate-90"
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {pickerOpen && (
              <motion.div
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: EASE_DRAWER }}
              >
                <div className="phone-scroll flex max-h-[164px] flex-col gap-1 overflow-y-auto rounded-[4px] border border-[#e6e7e7] bg-white p-1">
                  {active.map((g) => {
                    const p = Math.round((g.saved / g.target) * 100);
                    const selected = goalId === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => {
                          setGoalId(g.id);
                          setPickerOpen(false);
                        }}
                        className={`flex items-center gap-3 rounded-[2px] p-3 text-left transition-colors ${
                          selected ? "bg-[#edf2fd]" : "active:bg-[#f9f9fb]"
                        }`}
                      >
                        <span
                          className={`flex-1 font-mono text-[14px] font-medium ${
                            selected ? "text-[#0a59ff]" : "text-black"
                          }`}
                        >
                          {g.name}
                        </span>
                        <span className="font-mono text-[12px] font-medium text-[#a3a3a3] tnum">{p}%</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ),
    },
    {
      label: "How much?",
      /* Last step now, so it commits rather than continuing. */
      cta: value > 0 ? `Add ₹${inrPlain(value)}` : "Add money",
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
                className={`h-9 flex-1 rounded-[2px] border font-mono text-[13px] font-medium tnum transition-colors ${
                  value === a
                    ? "border-[#0a59ff] bg-[#edf2fd] text-[#0a59ff]"
                    : "border-[#e6e7e7] bg-white text-black"
                }`}
              >
                ₹{inrPlain(a)}
              </button>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];

  function advance() {
    if (!current.valid) return;
    if (step < steps.length - 1) {
      setPickerOpen(false);
      setStep(step + 1);
      return;
    }
    onStash(goalId, value);
  }

  return (
    <SheetShell
      step={step}
      label={current.label}
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
