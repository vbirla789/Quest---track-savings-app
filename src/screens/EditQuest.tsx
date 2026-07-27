import { useState } from "react";
import type { Goal } from "../data";
import { inrPlain } from "../lib/format";
import { DateWheel } from "../components/Keyboard";
import StatusBar from "../components/StatusBar";
import SysIcon from "../components/SysIcon";

/* ----------------------------------------------------------------------------
 * Editing a quest gets its own screen rather than the creation sheet.
 *
 * Creating is a funnel — one question at a time keeps it light. Editing is the
 * opposite job: you arrive wanting to change one specific thing, so every field
 * is on screen, prefilled, and directly reachable. Walking three sheet steps to
 * fix a typo in the name is the wrong shape.
 * --------------------------------------------------------------------------*/

const FIELD =
  "w-full rounded-[16px] bg-elev p-4 text-[14px] font-medium leading-[1.4] text-white caret-lime outline-none placeholder:font-normal placeholder:text-ink-dim";

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

  const target = Number(amount) || 0;
  // enabled whenever the form is valid, not only when dirty — a greyed-out
  // primary CTA the moment you land on an edit screen reads as broken
  const valid = name.trim().length > 0 && target > 0 && date !== "";

  return (
    <div className="relative h-full overflow-hidden bg-canvas">
      <div className="phone-scroll safe-top h-full overflow-y-auto pb-32">
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
            <label className="flex flex-col gap-2">
              <span className="text-[14px] text-ink-dim">Quest name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="eg. Ladakh ride"
                className={FIELD}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[14px] text-ink-dim">Target amount</span>
              <input
                inputMode="numeric"
                value={amount ? `₹${inrPlain(target)}` : ""}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="₹50,000"
                className={`${FIELD} tnum`}
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-[14px] text-ink-dim">Target date</span>
              <input
                readOnly
                value={date ? new Date(date).toLocaleDateString("en-GB") : ""}
                placeholder="DD/MM/YYYY"
                className={`${FIELD} tnum`}
              />
              <div className="surface-card overflow-hidden rounded-[20px]">
                <DateWheel value={date} onChange={setDate} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* sticky save over a bottom fade, matching the details screen */}
      <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-0 z-40 bg-gradient-to-b from-transparent to-black to-60% px-4 pb-4 pt-3 sm:pb-8">
        <button
          disabled={!valid}
          onClick={() => valid && onSave({ name: name.trim(), target, targetDate: date })}
          className="pointer-events-auto h-12 w-full rounded-full bg-lime text-[16px] font-semibold text-black transition-opacity active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
        >
          Save changes
        </button>
        <div className="faux-home-bar absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-3">
          <div className="h-[5px] w-[124px] rounded-lg bg-white" />
        </div>
      </div>
    </div>
  );
}
