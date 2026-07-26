/**
 * iOS status bar, rebuilt 1:1 from the Figma header: centred notch, 17px
 * SF-style time on the left, and the exported signal/wifi/battery glyphs on
 * the right. 47px tall.
 *
 * Hidden on real phones (see `.faux-status` in index.css) — the device already
 * draws a status bar, so ours would just be a duplicate.
 */
export default function StatusBar() {
  return (
    <div className="faux-status relative h-[47px] w-full overflow-hidden">
      {/* notch */}
      <div className="absolute left-1/2 top-[-2px] h-[32px] w-[164px] -translate-x-1/2">
        <img src="/icons/status-notch.svg" alt="" className="block size-full" />
      </div>
      {/* time */}
      <p className="absolute left-[27px] top-[15px] w-[54px] text-center text-[17px] font-semibold leading-[22px] tracking-[-0.408px] text-white tnum">
        9:41
      </p>
      {/* signal · wifi · battery */}
      <div className="absolute right-[26.6px] top-[19px] h-[13px] w-[77.4px]">
        <img src="/icons/status-right.svg" alt="" className="block size-full" />
      </div>
    </div>
  );
}
