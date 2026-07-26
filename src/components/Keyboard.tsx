import { useEffect, useRef, useState } from "react";

/* ----------------------------------------------------------------------------
 * Faux iOS input accessories, built from the Figma keyboard frame.
 *
 * A desktop browser never raises a software keyboard, and on a phone we
 * suppress the native one (inputMode="none") so the flow always looks the
 * same. These are real controls — clicking them edits the field.
 * --------------------------------------------------------------------------*/

/* Key metrics straight from the Figma: 42px tall, 8px radius, #595959 glyphs
   on near-white caps, sat on an #e6e9ed deck. */
const KEY =
  "grid place-items-center rounded-[8px] bg-white text-[#595959] shadow-[0_1px_0_rgba(0,0,0,0.25)] active:bg-[#d2d5db] select-none";
const MOD =
  "grid place-items-center rounded-[8px] bg-[#adb3bd] text-[#111] shadow-[0_1px_0_rgba(0,0,0,0.25)] active:bg-[#9aa1ac] select-none";

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
  // iOS opens a fresh field shifted; the Figma frame shows the lowercase deck,
  // so start unshifted and let the user toggle.
  const [shift, setShift] = useState(false);

  if (variant === "numeric") {
    return (
      <div className="w-full select-none rounded-t-[25px] bg-[#e6e9ed] px-2 pb-4 pt-3">
        <div className="grid grid-cols-3 gap-1.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
            <button key={n} onClick={() => onKey(n)} className={`${KEY} h-[42px] text-[23px]`}>
              {n}
            </button>
          ))}
          <button onClick={() => onKey("000")} className={`${MOD} h-[42px] text-[19px]`}>
            000
          </button>
          <button onClick={() => onKey("0")} className={`${KEY} h-[42px] text-[23px]`}>
            0
          </button>
          <button onClick={onBackspace} className={`${MOD} h-[42px] text-[19px]`} aria-label="Delete">
            ⌫
          </button>
        </div>
        {onDone && (
          <button
            onClick={onDone}
            className="mt-1.5 h-[42px] w-full rounded-[8px] bg-[#0088ff] text-[17px] text-white active:bg-[#0072d6]"
          >
            {doneLabel}
          </button>
        )}
      </div>
    );
  }

  const cap = (ch: string) => (shift ? ch.toUpperCase() : ch);

  return (
    <div className="w-full select-none rounded-t-[25px] bg-[#e6e9ed] pb-[9px] pt-[11px]">
      <div className="flex flex-col gap-[10px] px-2">
        {/* row 1 */}
        <div className="flex gap-[6px]">
          {ROWS[0].split("").map((ch) => (
            <button
              key={ch}
              onClick={() => {
                onKey(cap(ch));
                setShift(false);
              }}
              className={`${KEY} h-[42px] flex-1 text-[23px]`}
            >
              {cap(ch)}
            </button>
          ))}
        </div>
        {/* row 2 */}
        <div className="flex gap-[6px] px-[19px]">
          {ROWS[1].split("").map((ch) => (
            <button
              key={ch}
              onClick={() => {
                onKey(cap(ch));
                setShift(false);
              }}
              className={`${KEY} h-[42px] flex-1 text-[23px]`}
            >
              {cap(ch)}
            </button>
          ))}
        </div>
        {/* row 3 — shift · keys · delete */}
        <div className="flex items-center gap-[13px]">
          <button
            onClick={() => setShift((s) => !s)}
            className={`${shift ? KEY : MOD} h-[42px] w-[42px] text-[18px]`}
            aria-label="Shift"
          >
            ⇧
          </button>
          <div className="flex flex-1 gap-[6px]">
            {ROWS[2].split("").map((ch) => (
              <button
                key={ch}
                onClick={() => {
                  onKey(cap(ch));
                  setShift(false);
                }}
                className={`${KEY} h-[42px] flex-1 text-[23px]`}
              >
                {cap(ch)}
              </button>
            ))}
          </div>
          <button onClick={onBackspace} className={`${MOD} h-[42px] w-[42px] text-[18px]`} aria-label="Delete">
            ⌫
          </button>
        </div>
        {/* row 4 — ABC · space · return */}
        <div className="flex gap-[6px]">
          <button className={`${MOD} h-[42px] w-[85px] text-[17px]`}>ABC</button>
          <button onClick={() => onKey(" ")} className={`${KEY} h-[42px] flex-1`} aria-label="Space" />
          <button
            onClick={onDone}
            className="grid h-[42px] w-[86px] place-items-center rounded-[8px] bg-[#0088ff] text-[17px] text-white active:bg-[#0072d6]"
          >
            {doneLabel}
          </button>
        </div>
      </div>
      {/* emoji · mic strip */}
      <div className="flex items-start justify-between pb-[14px] pl-[34px] pr-[36px] pt-[25px]">
        <img src="/icons/kb-emoji.svg" alt="" className="block size-[25px]" />
        <img src="/icons/kb-mic.svg" alt="" className="block h-[26px] w-[18px]" />
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
