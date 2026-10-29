"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, X, Copy, Check, QrCode, Monitor, Share2, PlusSquare, ArrowRight } from "lucide-react";
import { generateQrSvg } from "@/lib/qr";

interface InstallMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallMobileModal({ isOpen, onClose }: InstallMobileModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"qr" | "ios" | "android">("qr");
  const [installUrl, setInstallUrl] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [canInstallDesktop, setCanInstallDesktop] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/dashboard`;
      setInstallUrl(url);
      setQrSvg(generateQrSvg(url, 200));

      if (window.__settlevoDeferredInstallPrompt) {
        setCanInstallDesktop(true);
      }

      const handleInstallable = () => setCanInstallDesktop(true);
      window.addEventListener("settlevo:pwa-installable", handleInstallable);
      return () => window.removeEventListener("settlevo:pwa-installable", handleInstallable);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDesktopInstall = async () => {
    if (window.__settlevoDeferredInstallPrompt) {
      window.__settlevoDeferredInstallPrompt.prompt();
      const choice = await window.__settlevoDeferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setCanInstallDesktop(false);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-[var(--color-text)] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pwa-install-title" className="font-bold text-base leading-tight">
                Install Settlevo on Your Phone
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Instant 1-tap field access — no App Store required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[var(--color-border)] px-6 pt-3 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab("qr")}
            className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "qr"
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <QrCode className="w-4 h-4" />
            Scan QR Code
          </button>
          <button
            onClick={() => setActiveTab("ios")}
            className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ios"
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Share2 className="w-4 h-4" />
            iPhone (iOS)
          </button>
          <button
            onClick={() => setActiveTab("android")}
            className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "android"
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <PlusSquare className="w-4 h-4" />
            Android
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center">
          {activeTab === "qr" && (
            <div className="flex flex-col items-center text-center w-full">
              {/* QR Code Container */}
              <div className="p-3 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm mb-4">
                {qrSvg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                    className="w-[200px] h-[200px] flex items-center justify-center"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text)] mb-1">
                <span>1. Open your phone camera</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                <span>2. Scan QR</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                <span>3. Tap Add to Home Screen</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mb-4">
                Opens the mobile web application immediately on your phone with full offline caching.
              </p>

              {/* Direct Link Copy */}
              <div className="w-full flex items-center gap-2 p-1.5 pl-3 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-xs">
                <span className="truncate text-[var(--color-text-secondary)] font-mono flex-1 text-left">
                  {installUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "ios" && (
            <div className="w-full space-y-4 text-left">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-[var(--color-text)] mb-0.5">Open in Safari</p>
                  <p className="text-[var(--color-text-muted)]">
                    Scan the QR code or open <span className="font-mono">{installUrl || "flowvo.app"}</span> in Safari on your iPhone.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-[var(--color-text)] mb-0.5">Tap the Share Icon</p>
                  <p className="text-[var(--color-text-muted)]">
                    At the bottom of Safari, tap the Share icon (square with an arrow pointing up).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-[var(--color-text)] mb-0.5">Tap "Add to Home Screen"</p>
                  <p className="text-[var(--color-text-muted)]">
                    Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top right.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "android" && (
            <div className="w-full space-y-4 text-left">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-[var(--color-text)] mb-0.5">Open in Chrome</p>
                  <p className="text-[var(--color-text-muted)]">
                    Scan the QR code or navigate to <span className="font-mono">{installUrl || "flowvo.app"}</span> on your Android phone.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-[var(--color-text)] mb-0.5">Tap "Install" Prompt</p>
                  <p className="text-[var(--color-text-muted)]">
                    Chrome will display an "Install Settlevo" banner at the bottom. Tap <strong>Install</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-[var(--color-text)] mb-0.5">Or Use Menu (⋮)</p>
                  <p className="text-[var(--color-text-muted)]">
                    Tap the 3 vertical dots menu in the top right of Chrome and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Install Prompt (if available on Chrome/Edge) */}
          {canInstallDesktop && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] w-full flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <Monitor className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Also available as a desktop app on this PC.</span>
              </div>
              <button
                onClick={handleDesktopInstall}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors cursor-pointer"
              >
                Install on Desktop
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
