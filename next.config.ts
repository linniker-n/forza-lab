import type { NextConfig } from "next"

const securityHeaders = [
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig: NextConfig = {
  output: "export",

  // Security headers (aplicados em produção via Cloudflare Pages Headers)
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.imagin.studio",          pathname: "/**" },
      { protocol: "https", hostname: "static.wikia.nocookie.net",  pathname: "/**" },
    ],
  },
}

export default nextConfig
