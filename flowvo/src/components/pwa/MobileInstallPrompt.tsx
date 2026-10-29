"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share2, Smartphone } from "lucide-react";

export function MobileInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Already running as an installed app!
    }

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem("settlevo-pwa-dismissed");
    if (dismissedAt) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        return;
      }
    }

    // Detect mobile device (iOS or Android)
    const ua = window.navigator.userAgent.toLowerCase();
    const isMobileDevice = /iphone|ipad|ipod|android|mobile/.test(ua);
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;

    setIsIos(isIosDevice);

    if (isMobileDevice) {
      // Delay prompt appearance so it doesn't interfere with initial page load
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    // Android / Chromium
    if (window.__settlevoDeferredInstallPrompt) {
      window.__settlevoDeferredInstallPrompt.prompt();
      const choice = await window.__settlevoDeferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowPrompt(false);
      }
    } else {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    try {
      localStorage.setItem("settlevo-pwa-dismissed", Date.now().toString());
    } catch {}
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Floating Mobile Banner - Placed right above the bottom tab bar (bottom-16) */}
      <div className="md:hidden fixed bottom-[68px] left-3 right-3 z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 shadow-xl flex items-center justify-between gap-3 text-[var(--color-text)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#0D5C4E] flex items-center justify-center shrink-0 shadow-2xs">
              <img src="/settlevo-icon.svg" alt="Settlevo Icon" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs leading-tight truncate">Install Settlevo App</span>
              <span className="text-[11px] text-[var(--color-text-muted)] truncate">
                1-tap mobile access & offline mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Bottom Sheet (if tapped on iPhone) */}
      {showIosGuide && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] rounded-t-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-bold text-sm text-[var(--color-text)]">Add to Home Screen</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--color-text)]">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--color-surface-muted)]">
                <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <p>
                  Tap the <Share2 className="w-3.5 h-3.5 inline mx-1 text-[var(--color-primary)]" /> <strong>Share</strong> button at the bottom of Safari.
                </p>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--color-surface-muted)]">
                <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <p>
                  Scroll down and select <strong>Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--color-surface-muted)]">
                <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  3
                </span>
                <p>
                  Tap <strong>Add</strong> in the top right to complete installation.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-[var(--color-primary)] text-white font-semibold text-xs rounded-xl"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
