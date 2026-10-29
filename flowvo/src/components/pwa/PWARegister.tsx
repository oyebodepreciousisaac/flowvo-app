"use client";

import { useEffect } from "react";

// Extend Window interface to hold the deferred install prompt
declare global {
  interface Window {
    __settlevoDeferredInstallPrompt?: any;
  }
}

export function PWARegister() {
  useEffect(() => {
    // Register Service Worker in production or supporting browsers
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Check for updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // New content is available
                    console.log("[Settlevo PWA] New version available.");
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn("[Settlevo PWA] ServiceWorker registration failed: ", err);
          });
      });

      // Capture beforeinstallprompt event for custom install triggers
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        window.__settlevoDeferredInstallPrompt = e;
        window.dispatchEvent(new CustomEvent("settlevo:pwa-installable"));
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      window.addEventListener("appinstalled", () => {
        window.__settlevoDeferredInstallPrompt = null;
        window.dispatchEvent(new CustomEvent("settlevo:pwa-installed"));
        console.log("[Settlevo PWA] Application installed successfully");
      });

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  return null;
}
