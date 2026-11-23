// Baseline security headers on every response. frame-ancestors / X-Frame-Options: no other site may frame the app
// (clickjacking). HSTS is ignored by browsers over plain http (local development), so it is safe to send always;
// no includeSubDomains, so it can't affect other hosts.
export const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\")" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

/**
 * Headers from this config OVERRIDE same-named headers set by a route, and for the same key the LAST matching rule
 * wins. So the routes that need stricter values get them here too, after the global rule:
 * - sign-in redirects carry a one-time code in the URL → never send it on as a referrer;
 * - the report download must stay sandboxed if it is ever shown inline.
 */
export const securityRules = [
  { source: "/:path*", headers: securityHeaders },
  { source: "/auth/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
  { source: "/api/v1/auth/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
  { source: "/api/reports/:id/download", headers: [{ key: "Content-Security-Policy", value: "sandbox; frame-ancestors 'none'" }] },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return securityRules;
  },
};
export default nextConfig;
