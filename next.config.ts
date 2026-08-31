import type { NextConfig } from "next";
import path from "node:path";
import { assertVercelWebNextEnv } from "./src/lib/vercelBuildEnv";
import { getSecurityHeaders } from "./src/lib/securityHeaders";

assertVercelWebNextEnv();

/** Allow same-origin `/api` + `/uploads` proxy when env points at loopback or is unset (phone-on-LAN dev). */
function shouldUseLocalApiRewrites(): boolean {
  const raw = (process.env.NEXT_PUBLIC_API_ORIGIN || "").trim();
  if (!raw) return true;
  try {
    const u = new URL(raw.includes("://") ? raw : `http://${raw}`);
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Remote API: allow `next/image` for `/uploads` served from `NEXT_PUBLIC_API_ORIGIN`. */
function apiOriginImagePattern(): { protocol: "http" | "https"; hostname: string } | null {
  const raw = (process.env.NEXT_PUBLIC_API_ORIGIN || "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return null;
    const protocol = u.protocol === "https:" ? "https" : "http";
    return { protocol, hostname: u.hostname };
  } catch {
    return null;
  }
}

const apiHostPattern = apiOriginImagePattern();

function r2PublicImagePattern(): { protocol: "https"; hostname: string } | null {
  const raw = (process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (u.protocol !== "https:") return null;
    return { protocol: "https", hostname: u.hostname };
  } catch {
    return null;
  }
}

const r2HostPattern = r2PublicImagePattern();

const nextConfig: NextConfig = {
  images: {
    // Editorial assets are photo-heavy. Prefer AVIF where supported and use a
    // lower, explicitly allow-listed quality for responsive card/hero images.
    formats: ["image/avif", "image/webp"],
    qualities: [65, 75],
    minimumCacheTTL: 86_400,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      ...(apiHostPattern ? [apiHostPattern] : []),
      ...(r2HostPattern ? [r2HostPattern] : []),
    ],
  },
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "react-router-dom": "./src/lib/routerShim.tsx",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-router-dom": path.resolve(__dirname, "src/lib/routerShim.tsx"),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: getSecurityHeaders(),
      },
    ];
  },
  async rewrites() {
    // Remote-only `NEXT_PUBLIC_API_ORIGIN` (e.g. https://api.example.com): browser hits API directly; no proxy.
    if (!shouldUseLocalApiRewrites()) return [];
    return [
      { source: "/api/:path*", destination: "http://127.0.0.1:5050/api/:path*" },
      { source: "/uploads/:path*", destination: "http://127.0.0.1:5050/uploads/:path*" },
    ];
  },
};

export default nextConfig;
