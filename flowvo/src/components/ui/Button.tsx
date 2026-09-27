import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "default" | "sm" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "default",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  let variantStyles = "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] shadow-sm";

  if (variant === "secondary") {
    variantStyles = "bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] active:bg-[var(--color-border)]";
  } else if (variant === "danger") {
    variantStyles = "bg-[var(--color-error)] text-white hover:bg-red-700 active:bg-red-800 shadow-sm";
  } else if (variant === "ghost") {
    variantStyles = "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]";
  }

  let sizeStyles = "h-10 px-4 text-sm font-semibold sm:h-10 h-12";
  if (size === "sm") {
    sizeStyles = "h-8 px-3 text-xs font-medium";
  } else if (size === "lg") {
    sizeStyles = "h-12 px-6 text-base font-semibold";
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-[var(--radius-md)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
