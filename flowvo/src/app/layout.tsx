import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Settlevo — Lead to Cash Automation",
  description: "Automate your lead capture, quoting, job management, invoicing, and review requests.",
  icons: {
    icon: "/settlevo-icon.svg",
    shortcut: "/settlevo-icon.svg",
    apple: "/settlevo-icon.svg",
  },
};

/**
 * Inline script that runs BEFORE React hydrates to prevent a flash of the
 * wrong theme (FOUT). Reads localStorage and sets data-theme on <html>
 * immediately so the first paint already has the correct colours.
 */
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('flowvo-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
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
      </head>
      <body>{children}</body>
    </html>
  );
}
