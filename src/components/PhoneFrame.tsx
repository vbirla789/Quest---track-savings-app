import type { ReactNode } from "react";

/**
 * A lightweight iPhone-ish shell so the screens read as a real app on desktop.
 * On an actual phone we drop the bezel entirely (`bare`) and let the UI fill
 * the viewport, so the prototype feels like the installed app rather than a
 * picture of one.
 */
export default function PhoneFrame({
  children,
  bare = false,
}: {
  children: ReactNode;
  bare?: boolean;
}) {
  if (bare) {
    return (
      <div className="relative h-svh w-full overflow-hidden bg-canvas">{children}</div>
    );
  }

  return (
    <div className="relative">
      {/* soft ground glow */}
      <div
        className="absolute -inset-10 -z-10 rounded-[80px] blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(184,254,80,0.12), transparent 70%)" }}
      />
      <div className="relative h-[844px] w-[390px] rounded-[54px] bg-[#1a1a1f] p-[5px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)_inset]">
        {/* the notch now ships with StatusBar, so the frame stays clean */}
        <div className="relative h-full w-full overflow-hidden rounded-[49px] bg-canvas">
          {children}
        </div>
      </div>
    </div>
  );
}
