"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface EmblemProps {
  className?: string;
  /** Override the gradient with a solid fill color (e.g. for monochrome uses) */
  fill?: string;
}

/**
 * Friday emblem — the F icon mark, transparent background, fire→gold→cream gradient.
 * Based on the official emblem.svg with the dark background stripped out.
 */
export function Emblem({ className, fill }: EmblemProps) {
  const uid = useId().replace(/:/g, "");
  const clipId = `emblem-clip-${uid}`;
  const gradId = `emblem-grad-${uid}`;

  return (
    <svg
      viewBox="0 0 401.07 392.67"
      className={cn("shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      aria-label="Friday emblem"
    >
      <defs>
        {/* Logo shape used as clip path */}
        <clipPath id={clipId}>
          <path d="M354.04,57.34H46.54v278h73v-103h54c27.06,0,49-21.94,49-49v-23h-103v-31h234.5V57.34ZM149.54,335.34v-73h36.5c36.5,0,66.5-30,66.5-66v-36h102v72h-66c-36,0-66,30-15.5,66.5v36.5h-123.5Z" />
        </clipPath>

        {/* Brand gradient: fire → gold → cream */}
        {!fill && (
          <linearGradient
            id={gradId}
            x1="46.54"
            y1="196.34"
            x2="354.54"
            y2="196.34"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset=".11" stopColor="#e55a3a" />
            <stop offset=".30" stopColor="#e87236" />
            <stop offset=".63" stopColor="#f0a830" />
            <stop offset=".82" stopColor="#f7d49a" />
            <stop offset="1"   stopColor="#ffffff" />
          </linearGradient>
        )}
      </defs>

      {/* Gradient rect clipped to the logo shape — no background */}
      <g clipPath={`url(#${clipId})`}>
        <rect
          fill={fill ?? `url(#${gradId})`}
          x="46.54"
          y="57.34"
          width="308"
          height="278"
        />
      </g>
    </svg>
  );
}
