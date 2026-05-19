"use client";
import { cn } from "../../lib/utils";

export const Meteors = ({
  number = 12,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const crystals = new Array(number).fill(true);
  return (
    <>
      {crystals.map((_, idx) => {
        const size = 4 + Math.random() * 10; // 4-14px crystal fragments
        const delay = Math.random() * 3;
        const duration = 4 + Math.random() * 6;
        const startX = Math.floor(Math.random() * 300 - 100);
        return (
          <span
            key={"crystal" + idx}
            className={cn(
              "animate-meteor-effect absolute rounded-sm rotate-[215deg]",
              "shadow-[0_0_6px_1px_rgba(240,160,40,0.4),0_0_12px_2px_rgba(240,160,40,0.15)]",
              className
            )}
            style={{
              top: Math.random() * 40 + "%",
              left: startX + "px",
              width: size + "px",
              height: size * 1.6 + "px",
              background: "linear-gradient(135deg, rgba(240,160,40,0.9) 0%, rgba(240,160,40,0.4) 50%, rgba(180,150,80,0.1) 100%)",
              animationDelay: delay + "s",
              animationDuration: duration + "s",
              clipPath: `polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)`,
            }}
          />
        );
      })}
    </>
  );
};
