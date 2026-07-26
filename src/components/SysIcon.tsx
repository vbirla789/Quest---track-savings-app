/* System icons exported from the Figma library (committed under public/icons).
   Each SVG is cropped to its glyph, so it renders inside a fixed box at the
   exact inset the design uses to keep proportions faithful. */
export default function SysIcon({
  src,
  inset,
  box = 24,
}: {
  src: string;
  inset: string;
  box?: number;
}) {
  return (
    <div className="relative shrink-0" style={{ width: box, height: box }}>
      <div className="absolute" style={{ inset }}>
        <img src={src} alt="" className="block size-full" />
      </div>
    </div>
  );
}
