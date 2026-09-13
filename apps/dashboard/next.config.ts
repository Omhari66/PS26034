import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes in dev.
        // In production, scope this to your real API domain.
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Allow JS execution (Next.js inline scripts + HMR)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Allow styles + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Allow fonts from Google
              "font-src 'self' https://fonts.gstatic.com data:",
              // Allow API calls to the backend (localhost dev + same-origin)
              "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:3000 ws://127.0.0.1:3000",
              // Allow images
              "img-src 'self' data: blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
