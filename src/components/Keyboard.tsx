import { useEffect, useRef, useState } from "react";

/* ----------------------------------------------------------------------------
 * Faux iOS input accessories.
 *
 * A desktop browser never raises a software keyboard, so the sheet flow reads
 * as half a screen. These mirror the keyboard / date picker from the Figma so
 * the prototype demos the same way on a laptop as it would on a phone — and
 * they're real controls, so clicking them actually edits the field.
 * --------------------------------------------------------------------------*/

const KEY = "grid place-items-center rounded-[6px] bg-[#fdfdfd] text-[#1c1c1e] shadow-[0_1px_0_rgba(0,0,0,0.28)] active:bg-[#d3d6dc] select-none";
const MOD = "grid place-items-center rounded-[6px] bg-[#adb3bd] text-[#1c1c1e] shadow-[0_1px_0_rgba(0,0,0,0.28)] active:bg-[#9aa1ac] select-none";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export function Keyboard({
  variant = "qwerty",
  onKey,
  onBackspace,
  onDone,
  doneLabel = "return",
}: {
  variant?: "qwerty" | "numeric";
  onKey: (ch: string) => void;
  onBackspace: () => void;
  onDone?: () => void;
  doneLabel?: string;
}) {
  const [shift, setShift] = useState(true);

  if (variant === "numeric") {
    return (
      <div className="w-full select-none bg-[#d1d4db] px-1.5 pb-6 pt-2.5">
        <div className="grid grid-cols-3 gap-1.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
            <button key={n} onClick={() => onKey(n)} className={`${KEY} h-[42px] text-[22px]`}>
              {n}
            </button>
          ))}
          <button
            onClick={() => onKey("000")}
            className={`${MOD} h-[42px] text-[18px] font-medium`}
          >
            000
          </button>
          <button onClick={() => onKey("0")} className={`${KEY} h-[42px] text-[22px]`}>
            0
          </button>
          <button onClick={onBackspace} className={`${MOD} h-[42px] text-[18px]`} aria-label="Delete">
            ⌫
          </button>
        </div>
        {onDone && (
          <button
            onClick={onDone}
            className="mt-1.5 h-[42px] w-full rounded-[6px] bg-[#0088ff] text-[17px] font-medium text-white active:bg-[#0072d6]"
          >
            {doneLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full select-none bg-[#d1d4db] px-1.5 pb-6 pt-2.5">
      {ROWS.map((row, i) => (
        <div
          key={row}
          className={`mb-1.5 flex gap-1.5 ${i === 1 ? "px-4" : ""} ${i === 2 ? "items-center" : ""}`}
        >
          {i === 2 && (
            <button
              onClick={() => setShift((s) => !s)}
              className={`${MOD} h-[42px] w-[42px] text-[16px] ${shift ? "bg-white" : ""}`}
              aria-label="Shift"
            >
              ⇧
            </button>
          )}
          {row.split("").map((ch) => (
            <button
              key={ch}
              onClick={() => {
                onKey(shift ? ch.toUpperCase() : ch);
                setShift(false);
              }}
              className={`${KEY} h-[42px] flex-1 text-[22px]`}
            >
              {shift ? ch.toUpperCase() : ch}
            </button>
          ))}
          {i === 2 && (
            <button
              onClick={onBackspace}
              className={`${MOD} h-[42px] w-[42px] text-[18px]`}
              aria-label="Delete"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-1.5">
        <button className={`${MOD} h-[42px] w-[80px] text-[15px]`}>123</button>
        <button onClick={() => onKey(" ")} className={`${KEY} h-[42px] flex-1 text-[14px]`}>
          space
        </button>
        <button
          onClick={onDone}
          className="grid h-[42px] w-[80px] place-items-center rounded-[6px] bg-[#0088ff] text-[15px] font-medium text-white active:bg-[#0072d6]"
        >
          {doneLabel}
        </button>
      </div>
    </div>
  );
}

/* --------------------------- Date wheel picker --------------------------- */

const ITEM_H = 36;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function Column({
  items,
  index,
  onChange,
  width,
}: {
  items: string[];
  index: number;
  onChange: (i: number) => void;
  width: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // keep the wheel parked on the selected row when it changes from outside
  useEffect(() => {
    const el = ref.current;
    if (el && Math.round(el.scrollTop / ITEM_H) !== index) {
      el.scrollTop = index * ITEM_H;
    }
  }, [index]);

  return (
    <div
      ref={ref}
      className="phone-scroll snap-y snap-mandatory overflow-y-auto"
      style={{ width, height: ITEM_H * 5 }}
      onScroll={() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          const el = ref.current;
          if (!el) return;
          const next = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)));
          if (next !== index) onChange(next);
        }, 90);
      }}
    >
      <div style={{ height: ITEM_H * 2 }} />
      {items.map((it, i) => (
        <div
          key={it + i}
          className={`flex snap-center items-center justify-center text-[19px] transition-colors ${
            i === index ? "font-medium text-ink" : "text-ink-dim"
          }`}
          style={{ height: ITEM_H }}
        >
          {it}
        </div>
      ))}
      <div style={{ height: ITEM_H * 2 }} />
    </div>
  );
}

/** iOS-style day / month / year wheel. `value` is an ISO yyyy-mm-dd string. */
export function DateWheel({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const base = value ? new Date(value) : new Date();
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => String(thisYear + i));

  const day = base.getDate() - 1;
  const month = base.getMonth();
  const year = Math.max(0, base.getFullYear() - thisYear);

  const daysInMonth = new Date(Number(years[year]), month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));

  const emit = (d: number, m: number, y: number) => {
    const yr = Number(years[y]);
    const maxDay = new Date(yr, m + 1, 0).getDate();
    const dd = Math.min(d + 1, maxDay);
    onChange(`${yr}-${String(m + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`);
  };

  return (
    <div className="relative w-full bg-[#202125] pb-6 pt-2">
      {/* selection band */}
      <div
        className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-[10px] bg-white/8"
        style={{ height: ITEM_H, marginTop: -10 }}
      />
      <div className="flex justify-center gap-2">
        <Column items={days} index={day} width="72px" onChange={(i) => emit(i, month, year)} />
        <Column items={MONTHS} index={month} width="88px" onChange={(i) => emit(day, i, year)} />
        <Column items={years} index={year} width="88px" onChange={(i) => emit(day, month, i)} />
      </div>
    </div>
  );
}
