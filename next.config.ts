import type { NextConfig } from "next";

function getSafeHostname(rawUrl: string | undefined, fallback: string): string {
  try {
    return new URL(rawUrl || fallback).hostname;
  } catch {
    return new URL(fallback).hostname;
  }
}

const supabaseHost = getSafeHostname(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://heslqxyonklerdcxjohf.supabase.co"
);
const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
const livekitHost = livekitUrl ? getSafeHostname(livekitUrl, "https://cloud.livekit.io") : "";
const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${supabaseHost}`,
  "font-src 'self' data:",
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.livekit.cloud wss://*.livekit.cloud${livekitHost ? ` https://${livekitHost} wss://${livekitHost}` : ""}`,
  `media-src 'self' blob: https://${supabaseHost}`,
  `frame-src 'self' https://${supabaseHost}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    // Suppress "outside of current Git repository" warning on Windows
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
