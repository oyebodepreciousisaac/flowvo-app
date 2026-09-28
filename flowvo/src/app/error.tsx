"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or telemetry
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[var(--color-error-bg)] text-[var(--color-error)] flex items-center justify-center text-xl font-bold mx-auto mb-4">
          !
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          An unexpected error occurred. Our team has been notified. You can try refreshing the action or returning to your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors shadow-sm"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-[var(--color-text)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
