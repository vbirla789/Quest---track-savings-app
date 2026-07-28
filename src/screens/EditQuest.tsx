import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Goal } from "../data";
import { inrPlain } from "../lib/format";
import { DateWheel, Keyboard } from "../components/Keyboard";
import StatusBar from "../components/StatusBar";
import SysIcon from "../components/SysIcon";

/* ----------------------------------------------------------------------------
 * Editing a quest gets its own screen rather than the creation sheet.
 *
 * Creating is a funnel — one question at a time keeps it light. Editing is the
 * opposite job: you arrive wanting to change one specific thing, so every field
 * is on screen, prefilled, and directly reachable.
 *
 * Nothing is focused on arrival: the screen opens as a plain read-out of the
 * quest. The keyboard, keypad or date wheel only appears once you tap the field
 * it belongs to, so landing here doesn't feel like being handed a form.
 * --------------------------------------------------------------------------*/

type FieldKey = "name" | "amount" | "date";

const EASE_DRAWER = [0.32, 0.72, 0, 1] as [number, number, number, number];

const FIELD =
  "w-full rounded-[16px] bg-elev p-4 text-left text-[14px] font-medium leading-[1.4] text-white caret-lime outline-none transition-shadow placeholder:font-normal placeholder:text-ink-dim";
const ACTIVE_RING = "shadow-[0_0_0_1.5px_var(--color-lime)]";

export default function EditQuest({
  goal,
  onCancel,
  onSave,
}: {
  goal: Goal;
  onCancel: () => void;
  onSave: (input: { name: string; target: number; targetDate: string }) => void;
}) {
  const [name, setName] = useState(goal.name);
  const [amount, setAmount] = useState(String(goal.target));
  const [date, setDate] = useState(goal.targetDate ?? "");
  const [active, setActive] = useState<FieldKey | null>(null);

  const target = Number(amount) || 0;
  // enabled whenever the form is valid, not only when dirty — a greyed-out
  // primary CTA the moment you land on an edit screen reads as broken
  const valid = name.trim().length > 0 && target > 0 && date !== "";

  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<FieldKey, HTMLDivElement | null>>({
    name: null,
    amount: null,
    date: null,
  });

  /* Open a field: focus the real input (so the caret shows and a laptop
     keyboard types into it) and lift the row clear of the accessory. */
  function open(key: FieldKey) {
    setActive(key);
    if (key === "name") nameRef.current?.focus({ preventScroll: true });
    if (key === "amount") amountRef.current?.focus({ preventScroll: true });
  }

  /* The CTA and the accessory float over the scroll area, so the list has to
     reserve their combined height — otherwise "scroll into view" happily
     centres the field underneath the keyboard. Measured, not guessed: the three
     accessories are different heights. */
  const bottomRef = useRef<HTMLDivElement>(null);
  const [bottomPad, setBottomPad] = useState(120);

  useLayoutEffect(() => {
    setBottomPad((bottomRef.current?.offsetHeight ?? 100) + 16);
  }, [active]);

  /* Lift the open row clear of the bottom stack. scrollIntoView is no use here:
     it aligns against the scroll container, which has no idea the CTA and
     keyboard are floating over its lower third — so a field near the bottom
     "centres" straight behind them. Scroll only as far as it takes. */
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      const sc = scrollRef.current;
      const row = rowRefs.current[active];
      if (!sc || !row) return;
      const visibleBottom = sc.clientHeight - (bottomRef.current?.offsetHeight ?? 0) - 16;
      const rowTop = row.offsetTop - sc.scrollTop;
      const rowBottom = rowTop + row.offsetHeight;
      const delta = rowBottom > visibleBottom ? rowBottom - visibleBottom : Math.min(0, rowTop - 16);
      if (delta !== 0) sc.scrollTo({ top: sc.scrollTop + delta, behavior: "smooth" });
    }, 140);
    return () => clearTimeout(t);
  }, [active, bottomPad]);

  const accessory = !active ? null : active === "name" ? (
    <Keyboard
      variant="qwerty"
      onKey={(ch) => setName((n) => n + ch)}
      onBackspace={() => setName((n) => n.slice(0, -1))}
      onDone={() => setActive(null)}
      doneLabel="done"
    />
  ) : active === "amount" ? (
    <Keyboard
      variant="numeric"
      onKey={(ch) => setAmount((a) => (a + ch).replace(/^0+/, "").slice(0, 9))}
      onBackspace={() => setAmount((a) => a.slice(0, -1))}
    />
  ) : (
    <div className="w-full rounded-t-[25px] bg-card px-4 pb-6 pt-2">
      <DateWheel value={date} onChange={setDate} theme="dark" />
    </div>
  );

  return (
    <div className="relative h-full overflow-hidden bg-canvas">
      <div
        ref={scrollRef}
        className="phone-scroll safe-top h-full overflow-y-auto"
        // a tap on the bare background puts the accessory away, the way
        // tapping off a field dismisses the keyboard in a native app
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("[data-field]")) return;
          setActive(null);
        }}
        style={{ paddingBottom: bottomPad }}
      >
        <StatusBar />

        <div className="flex flex-col gap-6 px-4 pt-4">
          {/* header */}
          <div className="flex w-full items-center justify-between">
            <button
              onClick={onCancel}
              aria-label="Back"
              className="surface-card grid size-10 place-items-center rounded-full active:scale-95"
            >
              <SysIcon src="/icons/chevron-left.svg" inset="21.88% 38.54% 21.88% 30.21%" box={20} />
            </button>
            <span className="text-[18px] font-semibold leading-[1.3]">Edit quest</span>
            {/* keeps the title optically centred against the back button */}
            <span className="size-10" />
          </div>

          <div className="flex flex-col gap-5">
            <Row label="Quest name" innerRef={(el) => (rowRefs.current.name = el)}>
              <input
                ref={nameRef}
                data-field
                inputMode="none"
                value={name}
                onFocus={() => setActive("name")}
                onPointerDown={() => open("name")}
                onChange={(e) => setName(e.target.value)}
                placeholder="eg. Ladakh ride"
                className={`${FIELD} ${active === "name" ? ACTIVE_RING : ""}`}
              />
            </Row>

            <Row label="Target amount" innerRef={(el) => (rowRefs.current.amount = el)}>
              <input
                ref={amountRef}
                data-field
                inputMode="none"
                value={amount ? `₹${inrPlain(target)}` : ""}
                onFocus={() => setActive("amount")}
                onPointerDown={() => open("amount")}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="₹50,000"
                className={`${FIELD} tnum ${active === "amount" ? ACTIVE_RING : ""}`}
              />
            </Row>

            <Row label="Target date" innerRef={(el) => (rowRefs.current.date = el)}>
              {/* a button, not an input: there is nothing to type here, the
                  wheel is the only way to change it */}
              <button
                data-field
                onPointerDown={() => open("date")}
                className={`${FIELD} tnum ${active === "date" ? ACTIVE_RING : ""} ${
                  date ? "" : "font-normal text-ink-dim"
                }`}
              >
                {date ? new Date(date).toLocaleDateString("en-GB") : "DD/MM/YYYY"}
              </button>
            </Row>
          </div>
        </div>
      </div>

      {/* Bottom stack: the CTA always sits above whatever input surface is up,
          so the change can be committed without dismissing the keyboard first. */}
      <div ref={bottomRef} className="absolute inset-x-0 bottom-0 z-40">
        <div
          className={`px-4 pt-3 ${
            active ? "bg-canvas pb-3" : "safe-bottom bg-gradient-to-b from-transparent to-black to-60% pb-4 sm:pb-8"
          }`}
        >
          <button
            disabled={!valid}
            onClick={() => valid && onSave({ name: name.trim(), target, targetDate: date })}
            className="h-12 w-full rounded-full bg-lime text-[16px] font-semibold text-black transition-opacity active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
          >
            Save changes
          </button>
          {!active && (
            <div className="faux-home-bar absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-3">
              <div className="h-[5px] w-[124px] rounded-lg bg-white" />
            </div>
          )}
        </div>

        <AnimatePresence>
          {active && (
            <motion.div
              key="accessory"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.32, ease: EASE_DRAWER }}
            >
              {accessory}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({
  label,
  innerRef,
  children,
}: {
  label: string;
  innerRef: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div ref={innerRef} className="flex flex-col gap-2">
      <span className="text-[14px] text-ink-dim">{label}</span>
      {children}
    </div>
  );
}
