/** Faux iOS status bar. */
export default function StatusBar({ dark = false }: { dark?: boolean }) {
  const c = dark ? "text-black" : "text-ink";
  return (
    <div className={`flex items-center justify-between px-7 pt-3.5 text-[14px] font-semibold ${c}`}>
      <span className="tnum">9:41</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px]">▂▄▆</span>
        <span className="text-[12px]">📶</span>
        <span className="text-[12px]">🔋</span>
      </div>
    </div>
  );
}
