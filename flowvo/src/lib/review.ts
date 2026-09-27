/**
 * Helper utilities for Google Review URL validation and review automation
 */

const GOOGLE_REVIEW_PATTERNS = [
  /g\.page\//i,
  /maps\.google\.com\//i,
  /maps\.app\.goo\.gl\//i,
  /google\.com\/maps/i,
];

export function isValidGoogleReviewUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return false;
  }
  return GOOGLE_REVIEW_PATTERNS.some((pattern) => pattern.test(trimmed));
}
