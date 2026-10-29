import { describe, it, expect } from "vitest";
import { generateQrSvg } from "@/lib/qr";

describe("PWA QR Code Generator", () => {
  it("generates a valid SVG string with positive dimensions", () => {
    const svg = generateQrSvg("https://settlevo.app/dashboard", 220);
    expect(svg).toContain("<svg");
    expect(svg).toContain('viewBox="0 0 220 220"');
    expect(svg).toContain("<rect");
    expect(svg).toContain("</svg>");
  });

  it("handles different URL lengths without throwing", () => {
    const svgShort = generateQrSvg("http://localhost:3000", 180);
    const svgLong = generateQrSvg("https://settlevo.app/enquiry/artisan-decor-premium-specialist-lagos", 260);
    expect(svgShort).toBeDefined();
    expect(svgLong).toBeDefined();
  });
});
