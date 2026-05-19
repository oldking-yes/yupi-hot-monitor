"use client";
import { cn } from "../../lib/utils";

export const Spotlight = ({
  className,
  fill = "#f0a028",
}: {
  className?: string;
  fill?: string;
}) => {
  return (
    <svg
      className={cn(
        "animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <defs>
        <filter
          id="spotlight-crystal-a"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="120" result="blur-a" />
        </filter>
        <filter
          id="spotlight-crystal-b"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="60" result="blur-b" />
        </filter>
      </defs>
      {/* Core beam — sharp crystal focus */}
      <ellipse
        cx="1924.71"
        cy="273.501"
        rx="1924.71"
        ry="273.501"
        transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
        fill={fill}
        fillOpacity="0.08"
        filter="url(#spotlight-crystal-b)"
      />
      {/* Wide glow — ambient amber light */}
      <ellipse
        cx="1924.71"
        cy="273.501"
        rx="1924.71"
        ry="273.501"
        transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
        fill={fill}
        fillOpacity="0.15"
        filter="url(#spotlight-crystal-a)"
      />
      {/* Hot core — intense crystal center */}
      <ellipse
        cx="1924.71"
        cy="273.501"
        rx="1200"
        ry="160"
        transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3100 2100)"
        fill="#ffe0a0"
        fillOpacity="0.06"
        filter="url(#spotlight-crystal-b)"
      />
    </svg>
  );
};
