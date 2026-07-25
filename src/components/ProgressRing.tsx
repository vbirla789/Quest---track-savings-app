import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Animated conic-free SVG ring. Progress springs to `value` (0..1). */
export default function ProgressRing({
  value,
  size = 200,
  stroke = 14,
  from,
  to,
  children,
  glow,
}: {
  value: number;
  size?: number;
  stroke?: number;
  from: string;
  to: string;
  glow?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gid = `ring-${from}-${to}`.replace(/[^a-z0-9]/gi, "");

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, value)) }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          style={glow ? { filter: `drop-shadow(0 0 10px ${glow})` } : undefined}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
