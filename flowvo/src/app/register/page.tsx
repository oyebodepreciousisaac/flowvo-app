"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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

    // Basic client-side validation
    const fieldErrors: Record<string, string> = {};
    if (!businessName.trim()) fieldErrors.businessName = "Business name is required";
    if (!email.trim()) fieldErrors.email = "Email is required";
    if (password.length < 8) fieldErrors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) fieldErrors.confirmPassword = "Passwords do not match";
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
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-2xl shadow-sm">
            F
          </div>
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
