import type { SquadMember } from "../data";
import Avatar from "./Avatar";

/* ----------------------------------------------------------------------------
 * The overlapped squad row, capped so it can't grow with the squad.
 *
 * It used to render one avatar per member, which is fine at three and breaks at
 * eight: the stack pushed the "saving with you" text under it and shoved the
 * nudge button out through the side of the card. The row is now always at most
 * three circles — the first two members, then a count of everyone else.
 *
 * Three faces still fit, so a squad of three shows all three rather than two and
 * a "+1" that costs the same width as the face it replaces.
 * --------------------------------------------------------------------------*/

const MAX = 3;

export default function AvatarStack({
  squad,
  size = 32,
}: {
  squad: SquadMember[];
  size?: number;
}) {
  const overflow = squad.length > MAX ? squad.length - (MAX - 1) : 0;
  const shown = overflow ? squad.slice(0, MAX - 1) : squad;

  return (
    /* shrink-0 so the flex parent takes the width out of the text beside it
       rather than out of the circles, which would squash them into ovals. */
    <div className="flex shrink-0 items-start">
      {shown.map((m) => (
        <Avatar key={m.name} member={m} size={size} className="-mr-3 last:mr-0" />
      ))}
      {overflow > 0 && (
        <span
          /* Same footprint as an Avatar, and the same -mr-3 overlap, so the
             count reads as the last circle in the stack rather than a separate
             element sitting next to it. */
          className="-mr-3 grid shrink-0 place-items-center rounded-full bg-[#e1e4ea] font-mono font-medium text-black/70 last:mr-0"
          style={{ width: size, height: size, fontSize: size * 0.34 }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
