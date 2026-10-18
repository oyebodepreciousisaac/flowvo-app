"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SettlevoLogo } from "@/components/brand/SettlevoLogo";
import { checkPasswordStrength } from "@/lib/password";

// ─── Password Strength Meter ──────────────────────────────────────────────────

function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label, rules } = checkPasswordStrength(password);

  if (password.length === 0) return null;

  const barColour = [
    "",
    "bg-red-500",       // 1 — weak
    "bg-orange-400",    // 2 — fair
    "bg-yellow-400",    // 3 — strong
    "bg-green-500",     // 4 — very strong
  ][score];

  const labelColour = [
    "",
    "text-red-600",
    "text-orange-500",
    "text-yellow-600",
    "text-green-600",
  ][score];

  return (
    <div className="flex flex-col gap-2 mt-1">
      {/* Segmented strength bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map((seg) => (
            <div
              key={seg}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                score >= seg ? barColour : "bg-[var(--color-border)]"
              }`}
            />
          ))}
        </div>
        <span className={`text-[11px] font-semibold capitalize w-20 text-right ${labelColour}`}>
          {label}
        </span>
      </div>

      {/* Rule checklist */}
      <ul className="flex flex-col gap-1">
        {rules.map((rule) => (
          <li key={rule.label} className="flex items-center gap-1.5">
            {rule.met ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
            )}
            <span
              className={`text-[11px] ${
                rule.met ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    // Basic client-side pre-flight (full validation happens server-side)
    const fieldErrors: Record<string, string> = {};
    if (!businessName.trim()) fieldErrors.businessName = "Business name is required";
    if (!email.trim()) fieldErrors.email = "Email is required";

    const { score } = checkPasswordStrength(password);
    if (score < 4) {
      fieldErrors.password = "Password does not meet the requirements below";
    }
    if (password !== confirmPassword) {
      fieldErrors.confirmPassword = "Passwords do not match";
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.details as Record<string, string[]>)) {
            mapped[k] = (v as string[])[0];
          }
          setErrors(mapped);
        } else {
          setServerError(data.error || "Registration failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setServerError("Unable to connect. Check your internet connection.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <SettlevoLogo variant="icon" size={48} className="drop-shadow-sm" />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Create your account</h1>
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            Start automating your lead-to-cash workflow
          </p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 flex flex-col gap-5">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              id="businessName"
              label="Business name"
              type="text"
              name="businessName"
              autoComplete="organization"
              required
              placeholder="Dave's Plumbing"
              value={businessName}
              error={errors.businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
            <Input
              id="email"
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              error={errors.email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password field with strength meter below */}
            <div className="flex flex-col gap-0">
              <Input
                id="password"
                label="Password"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                placeholder="Min. 8 characters"
                value={password}
                error={errors.password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordStrengthMeter password={password} />
            </div>

            <Input
              id="confirmPassword"
              label="Confirm password"
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
              <div className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[var(--color-error)] border-opacity-30 px-3 py-2.5">
                <p className="text-sm text-[var(--color-error)] font-medium">{serverError}</p>
              </div>
            )}

            <Button type="submit" isLoading={loading} className="w-full mt-1 h-12">
              Create account
            </Button>
          </form>

          <div className="border-t border-[var(--color-border)] pt-4 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--color-primary)] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
