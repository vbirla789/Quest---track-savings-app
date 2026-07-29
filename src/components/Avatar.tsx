import type { SquadMember } from "../data";

/* A contact's photo, or their initials on a stable tint when there isn't one —
   the same fallback iOS uses in its own contact lists. */
const TINTS = ["#c0d5ff", "#e1e4ea", "#c0eaff", "#ffd9c7", "#d9f2d0", "#f0d7ff"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Hashed, not random, so a contact keeps the same colour across renders. */
function tintFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return TINTS[h % TINTS.length];
}

export default function Avatar({
  member,
  size = 32,
  className = "",
}: {
  member: SquadMember;
  size?: number;
  className?: string;
}) {
  if (member.avatar) {
    return (
      <span
        className={`block shrink-0 overflow-hidden rounded-full bg-[#e1e4ea] ${className}`}
        style={{ width: size, height: size }}
      >
        <img src={member.avatar} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-mono font-medium text-black/70 ${className}`}
      style={{ width: size, height: size, background: tintFor(member.name), fontSize: size * 0.34 }}
    >
      {initials(member.name)}
    </span>
  );
}
