/**
 * Shared password validation schema.
 * Used in both the register and change-password API routes.
 *
 * Rules (NIST SP 800-63B + OWASP ASVS v4):
 *  - Min 8 chars
 *  - Max 128 chars  (prevents bcrypt DoS)
 *  - At least one uppercase letter
 *  - At least one lowercase letter
 *  - At least one digit
 *  - At least one special character
 */

import { z } from "zod";

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/(?=.*[A-Z])/, "Must include at least one uppercase letter (A–Z)")
  .regex(/(?=.*[a-z])/, "Must include at least one lowercase letter (a–z)")
  .regex(/(?=.*\d)/, "Must include at least one number (0–9)")
  .regex(
    /(?=.*[!@#$%^&*()\-_=+{};:',.<>?/\\[\]|~`])/,
    "Must include at least one special character (!@#$%^&*...)"
  );

/**
 * Live password strength checker — runs client-side only.
 * Returns a score 0–4 and a list of rule results for the strength meter UI.
 */
export type PasswordRuleResult = {
  label: string;
  met: boolean;
};

export function checkPasswordStrength(password: string): {
  score: number; // 0 = empty, 1 = weak, 2 = fair, 3 = strong, 4 = very strong
  label: "empty" | "weak" | "fair" | "strong" | "very strong";
  rules: PasswordRuleResult[];
} {
  const rules: PasswordRuleResult[] = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter (A–Z)", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter (a–z)", met: /[a-z]/.test(password) },
    { label: "Number (0–9)", met: /\d/.test(password) },
    { label: "Special character (!@#$...)", met: /[!@#$%^&*()\-_=+{};:',.<>?/\\[\]|~`]/.test(password) },
  ];

  const metCount = rules.filter((r) => r.met).length;

  if (password.length === 0) return { score: 0, label: "empty", rules };
  if (metCount <= 2) return { score: 1, label: "weak", rules };
  if (metCount === 3) return { score: 2, label: "fair", rules };
  if (metCount === 4) return { score: 3, label: "strong", rules };
  return { score: 4, label: "very strong", rules };
}
