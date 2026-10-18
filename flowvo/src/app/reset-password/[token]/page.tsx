"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SettlevoLogo } from "@/components/brand/SettlevoLogo";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const fieldErrors: Record<string, string> = {};
    if (password.length < 8) fieldErrors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) fieldErrors.confirmPassword = "Passwords do not match";
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Reset failed. Please request a new link.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setServerError("Unable to connect. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <SettlevoLogo variant="icon" size={48} className="drop-shadow-sm" />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Set a new password</h1>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
          {success ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center mx-auto text-2xl">✓</div>
              <p className="text-sm text-[var(--color-text)] font-medium">Password changed successfully. Redirecting you to sign in…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input
                id="password"
                label="New password"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                placeholder="Min. 8 characters"
                value={password}
                error={errors.password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                id="confirmPassword"
                label="Confirm new password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                placeholder="Repeat your password"
                value={confirmPassword}
                error={errors.confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {serverError && (
                <div className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] px-3 py-2.5">
                  <p className="text-sm text-[var(--color-error)] font-medium">{serverError}</p>
                  <Link href="/forgot-password" className="text-xs text-[var(--color-primary)] hover:underline mt-1 block">
                    Request a new link →
                  </Link>
                </div>
              )}
              <Button type="submit" isLoading={loading} className="w-full h-12 mt-1">
                Save new password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
