"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type ThemePreference = "light" | "dark";

function applyTheme(pref: ThemePreference) {
  document.documentElement.setAttribute("data-theme", pref);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>("light");

  // Read stored preference on first mount
  useEffect(() => {
    const stored = localStorage.getItem("flowvo-theme") as ThemePreference | null;
    // Default: follow OS if no stored preference
    const initial: ThemePreference =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggle() {
    const next: ThemePreference = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("flowvo-theme", next);
    applyTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
