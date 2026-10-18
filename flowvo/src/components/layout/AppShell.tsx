"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Receipt,
  Settings,
  LogOut,
  X,
  MoreHorizontal,
} from "lucide-react";
import { LiveSyncProvider } from "@/components/live/LiveSyncProvider";
import { LiveStatusBadge } from "@/components/live/LiveStatusBadge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    email: string;
    name?: string | null;
    business?: {
      name: string;
      slug: string;
      logoUrl?: string | null;
    } | null;
  } | null;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();

  return (
    <LiveSyncProvider>
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col md:flex-row text-[var(--color-text)]">
        {/* Desktop Sidebar (240px wide) */}
        <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] min-h-screen sticky top-0 h-screen justify-between p-4">
          <div className="flex flex-col gap-6">
            {/* Brand header */}
            <div className="flex items-center gap-2.5 px-2 py-1">
              {user?.business?.logoUrl ? (
                <div className="w-8 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-center overflow-hidden shrink-0 p-0.5 shadow-2xs">
                  <img
                    src={user.business.logoUrl}
                    alt={user.business.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                  F
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-lg leading-tight tracking-tight text-[var(--color-text)]">
                  Flowvo
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[150px]">
                  {user?.business?.name || "Business"}
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-semibold"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile & logout */}
          <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-2">
            <div className="px-2 py-1">
              <p className="text-xs font-semibold text-[var(--color-text)] truncate">
                {user?.email || "Owner"}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                {user?.business?.name || "Solo Operator"}
              </p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between px-3 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-20 shadow-sm">
            <Link href="/dashboard" className="flex items-center gap-2 min-w-0 pr-2">
              {user?.business?.logoUrl ? (
                <div className="w-7 h-7 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-center overflow-hidden shrink-0 p-0.5 shadow-2xs">
                  <img
                    src={user.business.logoUrl}
                    alt={user.business.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-md bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                  F
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-[var(--color-text)] leading-tight">Flowvo</span>
                <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[90px] xs:max-w-[120px]">
                  {user?.business?.name || "Business"}
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <LiveStatusBadge />
              <NotificationBell />
              <ThemeToggle />
              <Link
                href="/settings"
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  pathname === "/settings"
                    ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                }`}
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </header>

          {/* Desktop Top Header Bar with Live Indicator & Notifications */}
          <header className="hidden md:flex items-center justify-between px-8 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Workspace
              </span>
              <span className="text-xs text-[var(--color-border-strong)]">/</span>
              <span className="text-xs font-semibold text-[var(--color-text)]">
                {user?.business?.name || "Flowvo Business"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
              <LiveStatusBadge />
            </div>
          </header>

          {/* Page Content Container */}
          <main className="flex-1 p-4 md:p-8 max-w-[var(--container-max)] w-full mx-auto">
            {children}
          </main>

          {/* Mobile Bottom Tab Bar (Height: 60px) - Direct 5-Stage Access */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around px-1 z-30 shadow-lg">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors ${
                pathname === "/dashboard" ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[10px]">Home</span>
            </Link>
            <Link
              href="/leads"
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors ${
                pathname?.startsWith("/leads") ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px]">Leads</span>
            </Link>
            <Link
              href="/quotes"
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors ${
                pathname?.startsWith("/quotes") ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-[10px]">Quotes</span>
            </Link>
            <Link
              href="/jobs"
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors ${
                pathname?.startsWith("/jobs") ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="text-[10px]">Jobs</span>
            </Link>
            <Link
              href="/invoices"
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors ${
                pathname?.startsWith("/invoices") ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span className="text-[10px]">Invoices</span>
            </Link>
          </nav>
        </div>
      </div>
    </LiveSyncProvider>
  );
}
