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
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    email: string;
    name?: string | null;
    business?: {
      name: string;
      slug: string;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col md:flex-row text-[var(--color-text)]">
      {/* Desktop Sidebar (240px wide) */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] min-h-screen sticky top-0 h-screen justify-between p-4">
        <div className="flex flex-col gap-6">
          {/* Brand header */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              F
            </div>
            <div className="flex flex-col">
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
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
              F
            </div>
            <span className="font-bold text-base text-[var(--color-text)]">Flowvo</span>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)] font-medium truncate max-w-[180px]">
            {user?.business?.name}
          </span>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-[var(--container-max)] w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar (Height: 60px) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around px-2 z-30">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] gap-1 ${
              pathname === "/dashboard" ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)]"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link
            href="/leads"
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] gap-1 ${
              pathname === "/leads" ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)]"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Leads</span>
          </Link>
          <Link
            href="/jobs"
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] gap-1 ${
              pathname === "/jobs" ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)]"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px]">Jobs</span>
          </Link>
          <Link
            href="/invoices"
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] gap-1 ${
              pathname === "/invoices" ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)]"
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px]">Invoices</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] gap-1 text-[var(--color-text-muted)]"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </nav>

        {/* Mobile "More" Drawer / Modal */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-[var(--color-overlay)]">
            <div className="bg-[var(--color-surface)] rounded-t-[var(--radius-lg)] p-5 flex flex-col gap-4 shadow-[var(--shadow-modal)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <span className="font-semibold text-sm">More Options</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1">
                  <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/quotes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 text-sm font-medium text-[var(--color-text)]"
                >
                  <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span>Quotes</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 text-sm font-medium text-[var(--color-text)]"
                >
                  <Settings className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span>Settings</span>
                </Link>
                <form action="/api/auth/logout" method="POST" className="pt-2 border-t border-[var(--color-border)]">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 py-2 text-sm font-medium text-[var(--color-error)]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
