import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#B8FE50", "#FFFFFF", "#8FDD2E", "#E1E4EA", "#B8FE50", "#6BBF1F"];

/** A one-shot confetti burst that rains from the top of the container. */
export default function Confetti({ count = 90 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
        delay: Math.random() * 0.5,
        duration: 1.8 + Math.random() * 1.6,
        rotate: Math.random() * 720 - 360,
        drift: Math.random() * 80 - 40,
        round: Math.random() > 0.5,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute top-[-8%]"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.round ? b.size : b.size * 0.5,
            background: b.color,
            borderRadius: b.round ? "50%" : 2,
          }}
          initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: 900,
            x: b.drift,
            opacity: [0, 1, 1, 0],
            rotate: b.rotate,
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            ease: [0.2, 0.6, 0.4, 1],
          }}
        />
      ))}
    </div>
  );
}
