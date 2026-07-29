import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CONTACTS, type SquadMember } from "../data";
import Avatar from "./Avatar";

/* ----------------------------------------------------------------------------
 * The phone's contact picker.
 *
 * Deliberately iOS chrome rather than this app's design system — same reasoning
 * as the faux keyboard. A system picker is the OS speaking, not the app, and
 * dressing it in our mono/serif type would make it read as ours. So: SF stack,
 * 17px rows, grouped background, blue tint, hairline separators inset past the
 * avatar.
 * --------------------------------------------------------------------------*/

const EASE_DRAWER = [0.32, 0.72, 0, 1] as [number, number, number, number];
const IOS = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" };
const BLUE = "#007aff";

export default function ContactPicker({
  alreadyAdded,
  onClose,
  onAdd,
}: {
  alreadyAdded: SquadMember[];
  onClose: () => void;
  onAdd: (picked: SquadMember[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const taken = useMemo(
    () => new Set(alreadyAdded.map((m) => m.name.split(/\s+/)[0].toLowerCase())),
    [alreadyAdded],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONTACTS.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [query]);

  const toggle = (name: string) =>
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));

  return (
    <motion.div className="absolute inset-0 z-[60]" initial="hidden" animate="visible" exit="hidden">
      <motion.div
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        transition={{ duration: 0.3, ease: EASE_DRAWER }}
        className="absolute inset-0 touch-none bg-black/25"
        onClick={onClose}
      />
      <motion.div
        variants={{ hidden: { y: "100%" }, visible: { y: 0 } }}
        transition={{ duration: 0.4, ease: EASE_DRAWER }}
        className="absolute inset-x-0 bottom-0 flex h-[88%] flex-col overflow-hidden rounded-t-[12px] bg-[#f2f2f7]"
        style={{ ...IOS, willChange: "transform" }}
      >
        {/* nav bar */}
        <div className="relative flex h-11 shrink-0 items-center justify-between border-b border-black/10 bg-[#f9f9f9] px-4">
          <button onClick={onClose} className="text-[17px]" style={{ color: BLUE }}>
            Cancel
          </button>
          <span className="text-[17px] font-semibold text-black">Contacts</span>
          <button
            disabled={picked.length === 0}
            onClick={() => onAdd(CONTACTS.filter((c) => picked.includes(c.name)))}
            className="text-[17px] font-semibold disabled:opacity-30"
            style={{ color: BLUE }}
          >
            Done
          </button>
        </div>

        {/* search */}
        <div className="shrink-0 px-4 pb-2 pt-3">
          <div className="flex h-9 items-center gap-1.5 rounded-[10px] bg-black/8 px-2">
            {/* Circle plus a stroke — SF Symbols' glyph is a private-use
                codepoint that renders as tofu off Apple platforms, and there's
                no exported asset for OS chrome. */}
            <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
              <circle cx="6.8" cy="6.8" r="4.6" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.6" />
              <line x1="10.4" y1="10.4" x2="14" y2="14" stroke="rgba(0,0,0,0.45)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[17px] text-black outline-none placeholder:text-black/45"
              style={IOS}
            />
          </div>
        </div>

        <div className="phone-scroll flex-1 overflow-y-auto">
          <div className="bg-white">
            {rows.map((c, i) => {
              const isPicked = picked.includes(c.name);
              const isTaken = taken.has(c.name.split(/\s+/)[0].toLowerCase());
              return (
                <button
                  key={c.name}
                  disabled={isTaken}
                  onClick={() => toggle(c.name)}
                  className="flex w-full items-center gap-3 px-4 text-left active:bg-black/5 disabled:opacity-40"
                >
                  <Avatar member={c} size={40} />
                  <span
                    className={`flex flex-1 items-center justify-between py-2.5 text-[17px] text-black ${
                      i < rows.length - 1 ? "border-b border-black/8" : ""
                    }`}
                  >
                    <span>{c.name}</span>
                    {isTaken ? (
                      <span className="pr-1 text-[13px] text-black/40">Added</span>
                    ) : (
                      /* iOS marks selection with a tick, not a checkbox */
                      <span
                        className="pr-1 text-[17px] font-semibold"
                        style={{ color: BLUE, opacity: isPicked ? 1 : 0 }}
                      >
                        ✓
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
            {rows.length === 0 && (
              <p className="px-4 py-8 text-center text-[15px] text-black/40">No contacts found</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
