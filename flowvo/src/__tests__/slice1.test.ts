import { describe, it, expect } from "vitest";
import { generateSlug } from "@/lib/auth";

describe("generateSlug", () => {
  it("converts business name to lowercase hyphenated slug", () => {
    const slug = generateSlug("Dave's Plumbing");
    // slug starts with daves-plumbing- and ends with a 4-char suffix
    expect(slug).toMatch(/^daves-plumbing-[a-z0-9]{4}$/);
  });

  it("handles special characters", () => {
    const slug = generateSlug("ABC & Co!");
    expect(slug).toMatch(/^abc-co-[a-z0-9]{4}$/);
  });

  it("uses fallback for empty name", () => {
    const slug = generateSlug("!@#$");
    expect(slug).toMatch(/^business-[a-z0-9]{4}$/);
  });
});

describe("email module", () => {
  it("exports sendEmail function", async () => {
    const { sendEmail } = await import("@/lib/email");
    expect(typeof sendEmail).toBe("function");
  });

  it("simulates send in test environment", async () => {
    const { sendEmail } = await import("@/lib/email");
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });
    expect(result.success).toBe(true);
  });
});
