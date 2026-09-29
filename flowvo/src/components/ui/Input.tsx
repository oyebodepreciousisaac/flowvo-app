"use client";

import React, { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = "",
  id,
  type,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || props.name || generatedId;

  // Password visibility toggle — only active when type="password"
  const isPasswordField = type === "password";
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = isPasswordField ? (showPassword ? "text" : "password") : type;

  const baseInputClass = `w-full rounded-[var(--radius-md)] border px-3.5 py-2 text-sm text-[var(--color-text)] bg-[var(--color-surface)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)] disabled:opacity-50 disabled:bg-[var(--color-surface-muted)] transition-colors h-10 ${
    error
      ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]"
      : "border-[var(--color-border)]"
  }`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}

      {isPasswordField ? (
        /* Password wrapper — relative so the toggle button can sit inside the right edge */
        <div className="relative">
          <input
            id={inputId}
            type={resolvedType}
            className={`${baseInputClass} pr-10 ${className}`}
            {...props}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      ) : (
        <input
          id={inputId}
          type={type}
          className={`${baseInputClass} ${className}`}
          {...props}
        />
      )}

      {error ? (
        <p className="text-xs text-[var(--color-error)] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      ) : null}
    </div>
  );
}
