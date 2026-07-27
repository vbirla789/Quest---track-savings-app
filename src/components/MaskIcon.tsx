/**
 * Renders a library icon as a CSS mask so it takes its colour from
 * `currentColor`.
 *
 * The exported SVGs are hard-filled #1D2539 (the library's colour for light
 * surfaces), which is invisible on this UI. Masking means one committed file
 * serves every context — white on an unselected chip, lime when selected or in
 * the ledger — instead of a recoloured copy per state.
 *
 * Geometry matches SysIcon: a fixed box with the glyph placed at the inset the
 * design uses, so proportions stay faithful.
 */
export default function MaskIcon({
  src,
  inset,
  box = 24,
  className = "",
}: {
  src: string;
  inset: string;
  box?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative block shrink-0 ${className}`}
      style={{ width: box, height: box }}
    >
      <span
        className="absolute bg-current"
        style={{
          inset,
          maskImage: `url(${src})`,
          WebkitMaskImage: `url(${src})`,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
    </span>
  );
}
