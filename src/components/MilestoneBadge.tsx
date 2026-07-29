/* ----------------------------------------------------------------------------
 * The hexagon milestone badge — Figma node 36:396 (timeline) / 41:115705 (hero).
 *
 * Six stacked vector layers per state, in the order the design paints them: a
 * glow, the body, the bevel, then the level text, then two highlight passes on
 * top. The text really does sit under the gloss — that's what gives the number
 * its sheen rather than looking pasted on.
 *
 * Every offset is expressed against the 50px reference box and multiplied, so the
 * timeline's 50px badge and the success screen's 139px badge are one component.
 * At the larger size the glow layer reads as the ray burst behind it.
 * --------------------------------------------------------------------------*/

const REF_W = 50;
const REF_H = 56;

export default function MilestoneBadge({
  level,
  earned,
  width = REF_W,
}: {
  level: number;
  earned: boolean;
  width?: number;
}) {
  const k = width / REF_W;
  const v = earned ? "on" : "off";
  const px = (n: number) => n * k;

  return (
    <div className="relative shrink-0" style={{ width, height: REF_H * k }}>
      {/* Glow bleeds well outside the box — this is the ray burst on the success
          screen. Offsets are the -25.44%/-22.71% insets Figma applies to a
          134.68x150.85 frame, resolved against the 50px reference. */}
      <img
        src="/icons/hex-glow.svg"
        alt=""
        className="absolute block max-w-none"
        style={{ left: px(-11.48), top: px(-11.38), width: px(72.95), height: px(78.76) }}
      />
      <img
        src={`/icons/hex-${v}-1.svg`}
        alt=""
        className="absolute block max-w-none"
        style={{ left: px(0.83), top: px(0.92), width: px(48.35), height: px(54.15) }}
      />
      <img
        src={`/icons/hex-${v}-2.svg`}
        alt=""
        className="absolute block max-w-none"
        style={{ left: px(0.83), top: px(1.09), width: px(48.35), height: px(53.83) }}
      />

      <div
        className={`absolute flex flex-col items-center text-center ${earned ? "" : "opacity-80"}`}
        style={{ left: px(16.01), top: px(12), width: px(18.2), height: px(31.1) }}
      >
        <span
          className="font-mono font-bold text-white"
          style={{ fontSize: px(7), lineHeight: `${px(8.4)}px`, letterSpacing: px(-0.047) }}
        >
          Level
        </span>
        <span
          className="bg-gradient-to-b from-white from-[64.9%] to-[#b2b2b2] to-[77.3%] bg-clip-text font-semibold text-transparent"
          style={{
            fontSize: px(20.26),
            lineHeight: 1.1,
            letterSpacing: px(0.72),
            textShadow: `0 ${px(1.447)}px ${px(0.362)}px rgba(0,0,0,0.12)`,
          }}
        >
          {level}
        </span>
      </div>

      <img
        src={`/icons/hex-${v}-3.svg`}
        alt=""
        className="absolute inset-0 block max-w-none"
        style={{ width, height: REF_H * k }}
      />
      <img
        src={`/icons/hex-${v}-4.svg`}
        alt=""
        className="absolute block max-w-none"
        style={{ left: px(-1.45), top: px(-0.72), width: px(52.9), height: px(58.9) }}
      />
      <img
        src={`/icons/hex-${v}-5.svg`}
        alt=""
        className="absolute block max-w-none"
        style={{ left: px(-0.12), top: px(-0.23), width: px(50.24), height: px(35.5) }}
      />
    </div>
  );
}
