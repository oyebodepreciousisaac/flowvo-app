"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SettlevoLogo } from "@/components/brand/SettlevoLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Unable to connect. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <SettlevoLogo variant="icon" size={48} className="drop-shadow-sm" />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Reset your password</h1>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
          {submitted ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center mx-auto text-2xl">
                ✉️
              </div>
              <p className="text-sm text-[var(--color-text)] font-medium">
                If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link within a few minutes.
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">Check your spam folder if it doesn&apos;t arrive.</p>
              <Link href="/login" className="text-sm text-[var(--color-primary)] font-semibold hover:underline mt-2">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
              <Input
                id="email"
                label="Email address"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && (
                <div className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] px-3 py-2.5">
                  <p className="text-sm text-[var(--color-error)] font-medium">{error}</p>
                </div>
              )}
              <Button type="submit" isLoading={loading} className="w-full h-12 mt-1">
                Send reset link
              </Button>
              <div className="text-center pt-1">
                <Link href="/login" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
