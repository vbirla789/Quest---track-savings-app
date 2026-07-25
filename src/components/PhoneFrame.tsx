import type { ReactNode } from "react";

/** A lightweight iPhone-ish shell so the screens read as a real app. */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {/* soft ground glow */}
      <div
        className="absolute -inset-10 -z-10 rounded-[80px] blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(108,92,231,0.25), transparent 70%)" }}
      />
      <div className="relative h-[844px] w-[390px] rounded-[54px] bg-[#1a1a1f] p-[5px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)_inset]">
        <div className="relative h-full w-full overflow-hidden rounded-[49px] bg-canvas">
          {/* dynamic island */}
          <div className="pointer-events-none absolute left-1/2 top-2.5 z-50 h-[30px] w-[104px] -translate-x-1/2 rounded-full bg-black" />
          {children}
        </div>
      </div>
    </div>
  );
}
