/* ----------------------------------------------------------------------------
 * The hexagon milestone badge — Figma node 36:396 / 36:421.
 *
 * Six stacked vector layers per state, in the order the design paints them: a
 * glow, the body, the bevel, then the level text, then two highlight passes on
 * top. The text really does sit under the gloss — that's what gives the number
 * its sheen rather than looking pasted on.
 * --------------------------------------------------------------------------*/

const BOX = { width: 50, height: 56 };

export default function MilestoneBadge({
  level,
  earned,
}: {
  level: number;
  earned: boolean;
}) {
  const v = earned ? "on" : "off";
  return (
    <div className="relative shrink-0" style={BOX}>
      {/* glow bleeds outside the box */}
      <img
        src="/icons/hex-glow.svg"
        alt=""
        className="absolute block max-w-none"
        style={{ left: "-11.5%", top: "-19.5%", width: "72.7px", height: "78.7px" }}
      />
      <img
        src={`/icons/hex-${v}-1.svg`}
        alt=""
        className="absolute block"
        style={{ left: 0.83, top: 0.92, width: 48.35, height: 54.15 }}
      />
      <img
        src={`/icons/hex-${v}-2.svg`}
        alt=""
        className="absolute block"
        style={{ left: 0.83, top: 1.09, width: 48.35, height: 53.83 }}
      />

      <div
        className={`absolute flex flex-col items-center text-center ${earned ? "" : "opacity-80"}`}
        style={{ left: 16.01, top: 12, width: 18.2, height: 31.1 }}
      >
        <span className="font-mono text-[7px] font-bold leading-[8.4px] tracking-[-0.047px] text-white">
          Level
        </span>
        <span
          className="bg-gradient-to-b from-white from-[64.9%] to-[#b2b2b2] to-[77.3%] bg-clip-text text-[20.26px] font-semibold leading-[1.1] tracking-[0.72px] text-transparent"
          style={{ textShadow: "0 1.447px 0.362px rgba(0,0,0,0.12)" }}
        >
          {level}
        </span>
      </div>

      <img src={`/icons/hex-${v}-3.svg`} alt="" className="absolute inset-0 block size-full" />
      <img
        src={`/icons/hex-${v}-4.svg`}
        alt=""
        className="absolute block max-w-none"
        style={{ left: "-2.89%", top: "-1.29%", width: "105.8%", height: "105.2%" }}
      />
      <img
        src={`/icons/hex-${v}-5.svg`}
        alt=""
        className="absolute block max-w-none"
        style={{ left: "-0.24%", top: "-0.66%", width: "100.5%", height: "35.5px" }}
      />
    </div>
  );
}
