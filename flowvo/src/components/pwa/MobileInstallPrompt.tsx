"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share2, Smartphone, Monitor, MoreVertical, Menu, CheckCircle2 } from "lucide-react";
import { isPwaInstalled } from "@/lib/pwa";

type DeviceType = "samsung" | "android" | "ios" | "desktop";

export function MobileInstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("android");
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already running in standalone PWA mode
    const installed = isPwaInstalled();
    setAlreadyInstalled(installed);

    // Detect browser & device environment accurately
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isSamsungBrowser = /samsungbrowser/.test(ua);
    const isAndroidDevice = /android/.test(ua);

    let detected: DeviceType = "desktop";
    if (isIosDevice) {
      detected = "ios";
    } else if (isSamsungBrowser) {
      detected = "samsung";
    } else if (isAndroidDevice) {
      detected = "android";
    }
    setDeviceType(detected);

    // Always listen for manual install trigger from sidebar / header buttons
    const handleTriggerInstall = () => {
      triggerInstallFlow(detected);
    };
    window.addEventListener("settlevo:trigger-mobile-install", handleTriggerInstall);

    // Check if already installed; if so, skip automatic floating banner
    if (installed) {
      return () => {
        window.removeEventListener("settlevo:trigger-mobile-install", handleTriggerInstall);
      };
    }

    // Check dismissal only for the auto-showing floating banner
    let canShowBanner = isIosDevice || isSamsungBrowser || isAndroidDevice;
    try {
      const dismissedAt = localStorage.getItem("settlevo-pwa-dismissed");
      if (dismissedAt) {
        const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) {
          canShowBanner = false;
        }
      }
    } catch {}

    if (canShowBanner) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("settlevo:trigger-mobile-install", handleTriggerInstall);
      };
    }

    return () => {
      window.removeEventListener("settlevo:trigger-mobile-install", handleTriggerInstall);
    };
  }, []);

  const triggerInstallFlow = async (overrideDevice?: DeviceType) => {
    const currentDevice = overrideDevice || deviceType;

    // If already installed, show confirmation state
    if (isPwaInstalled()) {
      setAlreadyInstalled(true);
      setShowManualGuide(true);
      return;
    }

    // 1. If native Android / Samsung / Chromium prompt is available, launch it directly!
    if (window.__settlevoDeferredInstallPrompt) {
      try {
        window.__settlevoDeferredInstallPrompt.prompt();
        const choice = await window.__settlevoDeferredInstallPrompt.userChoice;
        if (choice.outcome === "accepted") {
          window.__settlevoDeferredInstallPrompt = null;
          setShowBanner(false);
          setShowManualGuide(false);
          setAlreadyInstalled(true);
        }
        return;
      } catch (err) {
        console.warn("[Settlevo PWA] Native prompt error:", err);
      }
    }

    // 2. If native prompt is not available, open the exact platform-specific guide modal
    setShowManualGuide(true);
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    try {
      localStorage.setItem("settlevo-pwa-dismissed", Date.now().toString());
    } catch {}
  };

  return (
    <>
      {/* Floating Mobile Banner - Placed right above the bottom tab bar (bottom-[68px]) */}
      {showBanner && !alreadyInstalled && (
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
                onClick={handleDismissBanner}
                className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg transition-colors cursor-pointer"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform-Specific Manual Guidance Modal (Appears whenever user clicks Install or needs guidance) */}
      {showManualGuide && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 p-0 md:p-4">
          <div className="bg-[var(--color-surface)] border-t md:border border-[var(--color-border)] rounded-t-2xl md:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom md:zoom-in-95 duration-250 w-full max-w-md max-h-[90vh] overflow-y-auto text-[var(--color-text)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {deviceType === "desktop" ? (
                  <Monitor className="w-5 h-5 text-[var(--color-primary)]" />
                ) : (
                  <Smartphone className="w-5 h-5 text-[var(--color-primary)]" />
                )}
                <h3 className="font-bold text-sm text-[var(--color-text)]">
                  {alreadyInstalled
                    ? "Settlevo App Installed"
                    : deviceType === "samsung"
                    ? "Install on Samsung Internet"
                    : deviceType === "android"
                    ? "Install on Android (Chrome)"
                    : deviceType === "ios"
                    ? "Add to Home Screen (iOS)"
                    : "Install on Desktop (Chrome / Edge)"}
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

            {/* Already installed state */}
            {alreadyInstalled ? (
              <div className="p-4 rounded-xl bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/20 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[var(--color-primary)] mx-auto" />
                <p className="font-bold text-sm text-[var(--color-primary)]">
                  Settlevo is already installed!
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  You are already running Settlevo in standalone app mode. You can find it on your home screen or apps list.
                </p>
              </div>
            ) : (
              <>
                {/* Samsung Internet Specific Steps */}
                {deviceType === "samsung" && (
                  <div className="space-y-3 text-xs text-[var(--color-text)]">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      To install Settlevo directly to your phone without typing URLs:
                    </p>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                      <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <p className="font-semibold mb-0.5">Tap the Menu Button (☰)</p>
                        <p className="text-[var(--color-text-muted)]">
                          Tap the <Menu className="w-3.5 h-3.5 inline mx-1 text-[var(--color-primary)]" /> <strong>three horizontal lines</strong> at the bottom-right corner of Samsung Internet.
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
                          In the popup menu, tap <strong>+ Add page to</strong> (or look for the <strong>Install</strong> icon in the address bar).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                      <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <p className="font-semibold mb-0.5">Select &quot;App screen&quot; or &quot;Home screen&quot;</p>
                        <p className="text-[var(--color-text-muted)]">
                          Tap <strong>App screen</strong> (or <strong>Home screen</strong>) to install Settlevo as an app on your Samsung phone.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Android Chrome Specific Steps */}
                {deviceType === "android" && (
                  <div className="space-y-3 text-xs text-[var(--color-text)]">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      To install Settlevo as a native Android WebAPK:
                    </p>
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
                        <p className="font-semibold mb-0.5">Tap &quot;Install app&quot;</p>
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
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      To install Settlevo on your iPhone or iPad:
                    </p>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                      <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <p className="font-semibold mb-0.5">Tap the Share Button</p>
                        <p className="text-[var(--color-text-muted)]">
                          Tap the <Share2 className="w-3.5 h-3.5 inline mx-1 text-[var(--color-primary)]" /> <strong>Share</strong> icon at the bottom bar of Safari.
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

                {/* Desktop Specific Steps */}
                {deviceType === "desktop" && (
                  <div className="space-y-3 text-xs text-[var(--color-text)]">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      To install Settlevo as a standalone desktop application on Windows or Mac:
                    </p>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                      <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <p className="font-semibold mb-0.5">Check Address Bar</p>
                        <p className="text-[var(--color-text-muted)]">
                          Look for the <strong>Install</strong> icon (<Download className="w-3.5 h-3.5 inline mx-1 text-[var(--color-primary)]" /> or computer display icon) on the right side of your browser address bar.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                      <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <p className="font-semibold mb-0.5">Or Browser Menu (⋮)</p>
                        <p className="text-[var(--color-text-muted)]">
                          Click the three dots in Chrome or Edge, then select <strong>Install Settlevo...</strong> or <strong>Save and share &rarr; Install Settlevo</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setShowManualGuide(false)}
              className="w-full py-2.5 bg-[var(--color-primary)] text-white font-semibold text-xs rounded-xl cursor-pointer hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
