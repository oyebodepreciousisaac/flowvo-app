import React, { useId } from "react";

export interface SettlevoLogoProps {
  /**
   * "icon" - Just the geometric S-checkmark mark (default)
   * "full" - The mark + "Settlevo" wordmark
   * "wordmark" - Only the "Settlevo" wordmark
   */
  variant?: "icon" | "full" | "wordmark";
  /** Pixel height / width for the icon, or scale factor */
  size?: number;
  /** Custom className for the wrapper */
  className?: string;
  /** Whether to show the "Lead-to-Cash Automation" subtitle under the wordmark */
  showSubtitle?: boolean;
  /** Color theme override ("light" = dark text, "dark" = white text, "auto" = uses current text color) */
  theme?: "light" | "dark" | "auto";
}

/**
 * Settlevo Brand Identity Vector Logo
 * Represents financial settlement, forward operational velocity, and trust.
 */
export function SettlevoLogo({
  variant = "icon",
  size = 32,
  className = "",
  showSubtitle = false,
  theme = "auto",
}: SettlevoLogoProps) {
  const id = useId().replace(/:/g, "");
  const gradPrimary = `settlevo-grad-primary-${id}`;
  const gradAccent = `settlevo-grad-accent-${id}`;
  const gradDark = `settlevo-grad-dark-${id}`;

  const textColorClass =
    theme === "light"
      ? "text-neutral-900"
      : theme === "dark"
      ? "text-white"
      : "text-[var(--color-text)]";

  const subtitleColorClass =
    theme === "light"
      ? "text-neutral-500"
      : theme === "dark"
      ? "text-neutral-400"
      : "text-[var(--color-text-muted)]";

  // Vector Logomark SVG (40x40 viewBox)
  const renderIcon = (iconSize: number) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 select-none"
      aria-label="Settlevo Icon"
    >
      <defs>
        {/* Deep emerald-teal gradient for body */}
        <linearGradient
          id={gradPrimary}
          x1="6"
          y1="6"
          x2="42"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1E7A6A" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0D5C4E" />
        </linearGradient>

        {/* Vibrant mint-cyan gradient for dynamic settlement checkmark */}
        <linearGradient
          id={gradAccent}
          x1="16"
          y1="24"
          x2="42"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>

        {/* Deep shadow facet for geometric depth */}
        <linearGradient
          id={gradDark}
          x1="12"
          y1="34"
          x2="32"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#083830" />
          <stop offset="100%" stopColor="#0F4840" />
        </linearGradient>
      </defs>

      {/* Hexagonal / Shield Geometric Base Frame */}
      <path
        d="M24 4L41.32 14V34L24 44L6.68 34V14L24 4Z"
        fill="url(#settlevo-bg-pattern)"
        opacity="0.05"
      />

      {/* Top S-Curve Upper Crest */}
      <path
        d="M24 6L38 14.08V20.5L24 12.42L14 18.2V13.8L24 6Z"
        fill={`url(#${gradPrimary})`}
      />

      {/* Upper Right Return Fold */}
      <path
        d="M38 14.08L24 22.17L20 19.86L34 11.77L38 14.08Z"
        fill="#2DD4BF"
        opacity="0.85"
      />

      {/* Prominent Center Settlement Checkmark Wing */}
      <path
        d="M19 23.5L24 29L40 13L42 16.5L24 34.5L15 24.5L19 23.5Z"
        fill={`url(#${gradAccent})`}
      />

      {/* Lower Foundation Loop — Anchored Base */}
      <path
        d="M15 24.5L24 34.5L10 41.5L6.68 34V26L15 24.5Z"
        fill={`url(#${gradDark})`}
      />

      {/* Lower S-Loop Sweeping Return */}
      <path
        d="M10 41.5L24 34.5L34 39.5L24 43.5L10 41.5Z"
        fill={`url(#${gradPrimary})`}
      />
    </svg>
  );

  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderIcon(size)}
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span
          className={`font-bold tracking-tight text-xl leading-none ${textColorClass}`}
          style={{ letterSpacing: "-0.035em" }}
        >
          Settlevo
        </span>
        {showSubtitle && (
          <span
            className={`text-[10px] uppercase font-semibold tracking-wider mt-1 ${subtitleColorClass}`}
          >
            Lead-to-Cash Automation
          </span>
        )}
      </div>
    );
  }

  // variant === "full"
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderIcon(size)}
      <div className="flex flex-col min-w-0">
        <span
          className={`font-bold tracking-tight text-xl leading-none ${textColorClass}`}
          style={{ letterSpacing: "-0.035em" }}
        >
          Settlevo
        </span>
        {showSubtitle && (
          <span
            className={`text-[10px] uppercase font-semibold tracking-wider mt-0.5 ${subtitleColorClass}`}
          >
            Lead-to-Cash
          </span>
        )}
      </div>
    </div>
  );
}

export default SettlevoLogo;
