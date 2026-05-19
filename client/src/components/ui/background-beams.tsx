"use client";
import { cn } from "../../lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]",
        className
      )}
    >
      {/* Geological noise texture layer */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }}
      />
      {/* Warm amber-gold radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(240,160,40,0.08),transparent)]" />
      {/* Hexagonal grid pattern */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="hex-grid"
            width="48"
            height="83.138"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M24 0 L48 13.856 L48 41.569 L24 55.425 L0 41.569 L0 13.856 Z M24 27.713 L48 41.569 L48 69.282 L24 83.138 L0 69.282 L0 41.569 Z"
              fill="none"
              stroke="rgba(180,150,80,0.06)"
              strokeWidth="0.5"
            />
            <circle cx="24" cy="13.856" r="0.8" fill="rgba(240,160,40,0.12)" />
            <circle cx="24" cy="69.282" r="0.6" fill="rgba(180,150,80,0.08)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-grid)" />
      </svg>
    </div>
  );
};
