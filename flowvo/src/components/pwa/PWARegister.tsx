"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __settlevoDeferredInstallPrompt?: any;
  }
}

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[Settlevo PWA] New version ready.");
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn("[Settlevo PWA] ServiceWorker registration failed: ", err);
        });
    };

    // Run registration immediately if page is already loaded, otherwise on load
    if (document.readyState === "complete" || document.readyState === "interactive") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
    }

    // Capture beforeinstallprompt event whenever it arrives
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__settlevoDeferredInstallPrompt = e;
      window.dispatchEvent(new CustomEvent("settlevo:pwa-installable"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      window.__settlevoDeferredInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("settlevo:pwa-installed"));
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}
