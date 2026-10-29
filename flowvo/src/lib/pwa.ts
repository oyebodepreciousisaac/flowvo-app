/**
 * Native PWA Installation Utilities
 * Directly triggers the native OS app installation prompt (WebAPK on Android/Samsung,
 * native window install on Desktop Chrome/Edge).
 */

export function isPwaInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export async function triggerNativeInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (typeof window === "undefined") return "unavailable";

  const promptEvent = window.__settlevoDeferredInstallPrompt;
  if (!promptEvent) {
    return "unavailable";
  }

  try {
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      window.__settlevoDeferredInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("settlevo:pwa-installed"));
      return "accepted";
    }
    return "dismissed";
  } catch (err) {
    console.warn("[Settlevo PWA] Install error:", err);
    return "unavailable";
  }
}
