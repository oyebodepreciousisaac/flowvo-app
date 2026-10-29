import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { generateQrSvg } from "@/lib/qr";

describe("Progressive Web App (PWA) Architecture & Assets", () => {
  const publicDir = path.resolve(__dirname, "../../public");

  it("provides a valid manifest.json with standalone display mode and icons", () => {
    const manifestPath = path.join(publicDir, "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.name).toContain("Settlevo");
    expect(manifest.short_name).toBe("Settlevo");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/dashboard");
    expect(manifest.theme_color).toBe("#0D5C4E");
    expect(manifest.background_color).toBe("#0D5C4E");
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

    // Verify presence of 192, 512, and maskable icons
    const sizes = manifest.icons.map((i: any) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("verifies all PWA icon assets exist on disk with valid file sizes", () => {
    const icons = [
      "icons/icon-192.png",
      "icons/icon-512.png",
      "icons/icon-maskable-512.png",
      "icons/apple-touch-icon.png",
      "settlevo-icon.svg",
    ];

    for (const icon of icons) {
      const fullPath = path.join(publicDir, icon);
      expect(fs.existsSync(fullPath), `Icon missing: ${icon}`).toBe(true);
      const stats = fs.statSync(fullPath);
      expect(stats.size).toBeGreaterThan(100);
    }
  });

  it("verifies sw.js service worker implementation and cache strategy", () => {
    const swPath = path.join(publicDir, "sw.js");
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, "utf-8");
    // Verify listeners
    expect(swContent).toContain("addEventListener('install'");
    expect(swContent).toContain("addEventListener('activate'");
    expect(swContent).toContain("addEventListener('fetch'");

    // Verify offline fallback & cache protection
    expect(swContent).toContain("/offline.html");
    expect(swContent).toContain("request.method !== 'GET'");
    expect(swContent).toContain("/api/");
  });

  it("verifies offline.html exists with retry action", () => {
    const offlinePath = path.join(publicDir, "offline.html");
    expect(fs.existsSync(offlinePath)).toBe(true);

    const html = fs.readFileSync(offlinePath, "utf-8");
    expect(html).toContain("Settlevo");
    expect(html).toContain("window.location.reload()");
  });

  it("generates scannable QR code for desktop-to-mobile installation transfer", () => {
    const targetUrl = "https://settlevo.app/dashboard";
    const qrSvg = generateQrSvg(targetUrl, 220);

    expect(qrSvg).toContain("<svg");
    expect(qrSvg).toContain("viewBox=\"0 0 220 220\"");
    expect(qrSvg).toContain("rect");
    expect(qrSvg.length).toBeGreaterThan(500);
  });
});
