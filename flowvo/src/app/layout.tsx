import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { PWARegister } from "@/components/pwa/PWARegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Settlevo — Lead to Cash Automation",
  description: "Automate your lead capture, quoting, job management, invoicing, and review requests.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Settlevo",
  },
  icons: {
    icon: [
      { url: "/settlevo-icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/settlevo-icon.svg",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/settlevo-icon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0D5C4E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Inline script that runs BEFORE React hydrates to prevent a flash of the
 * wrong theme (FOUT) and immediately captures the PWA install prompt.
 */
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('flowvo-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}

  // Capture PWA install event from millisecond zero so it is never missed
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    window.__settlevoDeferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('settlevo:pwa-installable'));
  });
})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flash theme script — must be first, before any CSS is applied */}
        <Script
          id="flowvo-theme-anti-flash"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
