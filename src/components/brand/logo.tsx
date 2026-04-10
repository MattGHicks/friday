"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Override the gradient with a solid fill (e.g. for monochrome/print use) */
  fill?: string;
}

/**
 * Friday full wordmark — "FRIDAY" logotype, transparent background,
 * fire→gold→cream gradient. Based on official logo-full.svg.
 */
export function Logo({ className, fill }: LogoProps) {
  const uid = useId().replace(/:/g, "");
  const clipId = `logo-clip-${uid}`;
  const gradId = `logo-grad-${uid}`;

  return (
    <svg
      viewBox="0 0 1282.27 392.67"
      className={cn("shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      aria-label="Friday"
    >
      <defs>
        {/* Full wordmark shape as clip path */}
        <clipPath id={clipId}>
          <path d="M370.57,55.48H63.07v278h73v-103h54c27.06,0,49-21.94,49-49v-23h-103v-31h234.5V55.48ZM166.07,333.48v-73h36.5c36.5,0,66.5-30,66.5-66v-36h102v72h-66c-36,0-66,30-15.5,66.5v36.5h-123.5ZM635.35,158.48c13.92,0,27.18,2.22,39.42,6.94h0c12.08,4.61,22.54,11.16,31.14,19.61,8.56,8.13,15.03,17.51,19.48,27.96,4.51,10.46,6.68,21.5,6.68,32.99v1.09c-.14,11.2-2.3,21.98-6.65,32.22l-.02.04-.02.04c-4.48,10.4-11.01,19.75-19.61,27.88h0c-8.57,8.25-18.95,14.68-30.89,19.24h0s-.06.02-.09.03c-.01,0-.02.01-.03.01h0c-12.25,4.73-25.5,6.95-39.42,6.95h-139.28v-175h139.28ZM561.63,277.96h73.72c7.21,0,12.28-1.46,16.15-3.69,4.62-2.66,8.11-6.11,10.62-10.69l.03-.06.03-.06c2.78-4.97,4.32-10.69,4.32-17.47s-1.45-12.14-4.07-17l-.26-.47-.07-.12-.06-.12c-2.44-4.52-5.72-7.79-9.91-10.22l-.41-.23-.12-.07-.12-.07c-3.75-2.16-8.63-3.6-15.48-3.68h-.67s-73.72,0-73.72,0v63.95ZM466.07,333.48h-65v-175h65v175ZM961.07,333.48h-66.69v-39.82h-102.62v39.82h-66.69v-87.5c0-11.85,2.68-23.21,8.19-33.9,5.35-10.53,12.85-19.87,22.47-27.88,9.57-8.1,20.7-14.43,33.24-18.91l.11-.04c12.93-4.54,26.61-6.78,40.84-6.78h131.15v175ZM829.92,214.01c-7.08,0-13.25,1.43-18.94,4.26l-.24.12c-5.87,2.83-10.47,6.59-14.03,11.52-1.77,2.56-3.08,5.29-3.91,8.23h101.58v-24.12h-64.46ZM1053.69,216.12c0,2.36.64,4.33,1.9,6.21,1.31,1.82,2.94,3.18,5.12,4.27,2.26,1.06,4.62,1.59,7.45,1.59h88.29v-69.69h66.62v118.42c-.27,10.84-4.52,20.84-12.26,29.59h0l-.03.03s-.01.01-.02.02h0c-7.61,8.63-17.7,15.17-29.53,19.85-12.2,4.82-25.4,7.09-39.25,7.09h-154.91v-55.53h48.19c-2.36-.89-4.69-1.87-6.97-2.96l-1.18-.57-.07-.04-.07-.04c-11.48-5.81-20.88-13.52-27.99-22.98l-.68-.92-.04-.06-.04-.06c-7.47-10.44-11.14-21.97-11.14-34.21v-57.63h66.62v57.63Z" />
        </clipPath>

        {/* Brand gradient: fire → gold → cream */}
        {!fill && (
          <linearGradient
            id={gradId}
            x1="63.07"
            y1="194.48"
            x2="1223.07"
            y2="194.48"
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

      {/* Gradient rect clipped to the wordmark shape — no background */}
      <g clipPath={`url(#${clipId})`}>
        <rect
          fill={fill ?? `url(#${gradId})`}
          x="63.07"
          y="55.48"
          width="1160"
          height="278"
        />
      </g>
    </svg>
  );
}
