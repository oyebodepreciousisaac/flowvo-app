import type { NextConfig } from "next";

// ─── Security HTTP Response Headers ───────────────────────────────────────────
// Applied to every route. Provides defence-in-depth against:
//  - Clickjacking          → X-Frame-Options: DENY
//  - MIME sniffing attacks → X-Content-Type-Options: nosniff
//  - Reflected XSS         → X-XSS-Protection: 1; mode=block (legacy browsers)
//  - Info leakage          → Referrer-Policy: strict-origin-when-cross-origin
//  - Feature abuse         → Permissions-Policy (camera, mic, geolocation off)
//  - Downgrade attacks     → Strict-Transport-Security (HSTS, 2yr, preload)
//  - XSS / injection       → Content-Security-Policy
//
// CSP notes:
//  - 'unsafe-inline' in script-src is required by Next.js dev mode and its
//    inline script injection. Remove it in a future hardening pass once a
//    nonce-based CSP is implemented.
//  - challenges.cloudflare.com is whitelisted for the Turnstile CAPTCHA widget.
// ─────────────────────────────────────────────────────────────────────────────

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://js.stripe.com https://js.paystack.co`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://checkout.paystack.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.paystack.co https://api.stripe.com",
      "worker-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
