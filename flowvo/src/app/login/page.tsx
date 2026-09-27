"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Inner component that reads searchParams — must be wrapped in Suspense
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
    } catch {
      setError("Unable to connect. Check your internet connection.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 flex flex-col gap-5">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
        <div className="flex flex-col gap-1.5">
          <Input
            id="password"
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link
            href="/forgot-password"
            className="text-xs text-[var(--color-primary)] hover:underline self-end font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[var(--color-error)] border-opacity-30 px-3 py-2.5">
            <p className="text-sm text-[var(--color-error)] font-medium">{error}</p>
          </div>
        )}

        <Button type="submit" isLoading={loading} className="w-full mt-1 h-12">
          Sign in
        </Button>
      </form>

      <div className="border-t border-[var(--color-border)] pt-4 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {"Don't have an account? "}
          <Link href="/register" className="text-[var(--color-primary)] font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-2xl shadow-sm">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Flowvo</h1>
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            Sign in to your business account
          </p>
        </div>

        {/* Suspense boundary required by Next.js for useSearchParams() */}
        <Suspense fallback={
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
            Loading…
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
