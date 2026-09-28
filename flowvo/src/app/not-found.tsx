import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[var(--color-status-lost)] text-[var(--color-text-muted)] flex items-center justify-center text-xl font-bold mx-auto mb-4">
          404
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
          Page not found
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          The page you are looking for doesn&apos;t exist, has been moved, or you don&apos;t have access to it.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
