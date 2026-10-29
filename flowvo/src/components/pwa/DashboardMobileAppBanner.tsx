"use client";

import React, { useState } from "react";
import { Smartphone, QrCode, ArrowRight, X } from "lucide-react";
import { InstallMobileModal } from "./InstallMobileModal";

export function DashboardMobileAppBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div className="hidden lg:flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[var(--color-primary-subtle)] via-[var(--color-surface)] to-[var(--color-surface)] border border-[var(--color-border)] shadow-2xs mb-6 text-[var(--color-text)]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#0D5C4E] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Smartphone className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm leading-tight text-[var(--color-text)]">
                Take Settlevo Into the Field
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white">
                Mobile PWA
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Install directly onto your iPhone or Android device. Review scopes, dispatch quotes, and collect instant payments on site.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer shadow-xs"
          >
            <QrCode className="w-4 h-4" />
            <span>Install on Mobile</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <InstallMobileModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

