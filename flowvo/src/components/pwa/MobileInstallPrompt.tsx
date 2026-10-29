"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share2, Smartphone, MoreVertical, Menu } from "lucide-react";

type MobileDevice = "samsung" | "android" | "ios" | "unknown";

export function MobileInstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [deviceType, setDeviceType] = useState<MobileDevice>("unknown");
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [canPromptNatively, setCanPromptNatively] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Already running as an installed app
    }

    // Detect browser & device environment accurately
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isSamsungBrowser = /samsungbrowser/.test(ua);
    const isAndroidDevice = /android/.test(ua);

    let detected: MobileDevice = "unknown";
    if (isIosDevice) {
      detected = "ios";
    } else if (isSamsungBrowser) {
      detected = "samsung";
    } else if (isAndroidDevice) {
      detected = "android";
    }
    setDeviceType(detected);

    if (window.__settlevoDeferredInstallPrompt) {
      setCanPromptNatively(true);
    }

    const handleInstallable = () => {
      setCanPromptNatively(true);
    };
    window.addEventListener("settlevo:pwa-installable", handleInstallable);

    // Listen to manual install trigger from the mobile header
    const handleTriggerInstall = () => {
      triggerInstallFlow(detected);
    };
    window.addEventListener("settlevo:trigger-mobile-install", handleTriggerInstall);

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem("settlevo-pwa-dismissed");
    if (dismissedAt) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        return () => {
          window.removeEventListener("settlevo:pwa-installable", handleInstallable);
          window.removeEventListener("settlevo:trigger-mobile-install", handleTriggerInstall);
        };
      }
    }

    // Only show banner on mobile devices
    if (isIosDevice || isSamsungBrowser || isAndroidDevice) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("settlevo:pwa-installable", handleInstallable);
        window.removeEventListener("settlevo:trigger-mobile-install", handleTriggerInstall);
      };
    }

    return () => {
      window.removeEventListener("settlevo:pwa-installable", handleInstallable);
      window.removeEventListener("settlevo:trigger-mobile-install", handleTriggerInstall);
    };
  }, []);

  const triggerInstallFlow = async (overrideDevice?: MobileDevice) => {
    // 1. If native Android / Samsung / Chromium prompt is available, launch it directly!
    if (window.__settlevoDeferredInstallPrompt) {
      try {
        window.__settlevoDeferredInstallPrompt.prompt();
        const choice = await window.__settlevoDeferredInstallPrompt.userChoice;
        if (choice.outcome === "accepted") {
          window.__settlevoDeferredInstallPrompt = null;
          setShowBanner(false);
          setShowManualGuide(false);
        }
        return;
      } catch (err) {
        console.warn("[Settlevo PWA] Native prompt error:", err);
      }
    }

    // 2. If native prompt is not available, open the exact platform-specific guide
    const currentDevice = overrideDevice || deviceType;
    if (currentDevice !== "unknown") {
      setShowManualGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowManualGuide(false);
    try {
      localStorage.setItem("settlevo-pwa-dismissed", Date.now().toString());
    } catch {}
  };

  return (
    <>
      {/* Floating Mobile Banner - Placed right above the bottom tab bar (bottom-[68px]) */}
      {showBanner && (
        <div className="md:hidden fixed bottom-[68px] left-3 right-3 z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 shadow-xl flex items-center justify-between gap-3 text-[var(--color-text)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#0D5C4E] flex items-center justify-center shrink-0 shadow-2xs">
                <img src="/settlevo-icon.svg" alt="Settlevo Icon" className="w-6 h-6 object-contain" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs leading-tight truncate">Install Settlevo App</span>
                <span className="text-[11px] text-[var(--color-text-muted)] truncate">
                  {deviceType === "samsung"
                    ? "Native Android access on your Samsung"
                    : deviceType === "ios"
                    ? "Add to home screen on iPhone"
                    : "1-tap mobile access & offline mode"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => triggerInstallFlow()}
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
      )}

      {/* Platform-Specific Manual Guidance Sheet (Only shown if native prompt wasn't supported) */}
      {showManualGuide && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] rounded-t-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-250 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-bold text-sm text-[var(--color-text)]">
                  {deviceType === "samsung"
                    ? "Install on Samsung Internet"
                    : deviceType === "android"
                    ? "Install on Android (Chrome)"
                    : "Add to Home Screen (iOS)"}
                </h3>
              </div>
              <button
                onClick={() => setShowManualGuide(false)}
                className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Samsung Internet Specific Steps */}
            {deviceType === "samsung" && (
              <div className="space-y-3 text-xs text-[var(--color-text)]">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="font-semibold mb-0.5">Tap the Menu Button (☰)</p>
                    <p className="text-[var(--color-text-muted)]">
                      Tap the <Menu className="w-3.5 h-3.5 inline mx-1 text-[var(--color-primary)]" /> <strong>three horizontal lines</strong> at the bottom right corner of Samsung Internet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="font-semibold mb-0.5">Tap &quot;+ Add page to&quot;</p>
                    <p className="text-[var(--color-text-muted)]">
                      In the popup menu, tap <strong>+ Add page to</strong> (or look for the <strong>Install</strong> icon).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="font-semibold mb-0.5">Select &quot;Home screen&quot; or &quot;App screen&quot;</p>
                    <p className="text-[var(--color-text-muted)]">
                      Tap <strong>Home screen</strong> or <strong>App screen</strong> to install Settlevo as an app on your Samsung phone.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Android Chrome Specific Steps */}
            {deviceType === "android" && (
              <div className="space-y-3 text-xs text-[var(--color-text)]">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="font-semibold mb-0.5">Tap the Three Dots (⋮)</p>
                    <p className="text-[var(--color-text-muted)]">
                      Tap the <MoreVertical className="w-3.5 h-3.5 inline mx-1 text-[var(--color-primary)]" /> <strong>three dots</strong> in the top-right corner of Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="font-semibold mb-0.5">Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;</p>
                    <p className="text-[var(--color-text-muted)]">
                      Select <strong>Install app</strong> (or <strong>Add to Home screen</strong>) from the menu list.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="font-semibold mb-0.5">Tap &quot;Install&quot;</p>
                    <p className="text-[var(--color-text-muted)]">
                      Confirm by tapping <strong>Install</strong>. Settlevo will appear on your phone alongside your other apps.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* iOS Safari Specific Steps */}
            {deviceType === "ios" && (
              <div className="space-y-3 text-xs text-[var(--color-text)]">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="font-semibold mb-0.5">Tap the Share Button</p>
                    <p className="text-[var(--color-text-muted)]">
                      Tap the <Share2 className="w-3.5 h-3.5 inline mx-1 text-[var(--color-primary)]" /> <strong>Share</strong> icon at the bottom of Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="font-semibold mb-0.5">Tap &quot;Add to Home Screen&quot;</p>
                    <p className="text-[var(--color-text-muted)]">
                      Scroll down in the share sheet and select <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="font-semibold mb-0.5">Tap &quot;Add&quot;</p>
                    <p className="text-[var(--color-text-muted)]">
                      Tap <strong>Add</strong> in the top-right corner to finish.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowManualGuide(false)}
              className="w-full py-2.5 bg-[var(--color-primary)] text-white font-semibold text-xs rounded-xl cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
