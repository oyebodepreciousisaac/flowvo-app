import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = "", id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id || props.name || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-[var(--radius-md)] border px-3.5 py-2 text-sm text-[var(--color-text)] bg-[var(--color-surface)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)] disabled:opacity-50 disabled:bg-[var(--color-surface-muted)] transition-colors h-10 ${
          error ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]" : "border-[var(--color-border)]"
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[var(--color-error)] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      ) : null}
    </div>
  );
}
