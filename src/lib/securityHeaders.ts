function hostFromEnvUrl(raw: string | undefined): string | null {  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return u.hostname;
  } catch {
    return null;
  }
}

function buildContentSecurityPolicy(): string {
  const apiHost = hostFromEnvUrl(process.env.NEXT_PUBLIC_API_ORIGIN);
  const r2Host =
    hostFromEnvUrl(process.env.NEXT_PUBLIC_R2_PUBLIC_URL) ||
    hostFromEnvUrl(process.env.R2_PUBLIC_URL);

  const connectSrc = [
    "'self'",
    apiHost ? `https://${apiHost}` : null,
    apiHost ? `http://${apiHost}` : null,
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://accounts.google.com",
    "https://pagead2.googlesyndication.com",
    "https://*.googlesyndication.com",
    "https://*.google.com",
    "https://*.doubleclick.net",
    "https://ep1.adtrafficquality.google",
    "https://ep2.adtrafficquality.google",
    "https://*.adtrafficquality.google",
  ].filter(Boolean);

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://i.ytimg.com",
    "https://picsum.photos",
    "https://*.r2.dev",
    r2Host ? `https://${r2Host}` : null,
    apiHost ? `https://${apiHost}` : null,
    apiHost ? `http://${apiHost}` : null,
    "https://*.googlesyndication.com",
    "https://*.doubleclick.net",
    "https://*.google.com",
    "https://*.gstatic.com",
  ].filter(Boolean);

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://accounts.google.com",
    "https://pagead2.googlesyndication.com",
    "https://*.googlesyndication.com",
    "https://*.doubleclick.net",
    "https://*.google.com",
    "https://*.adtrafficquality.google",
  ];
  if (process.env.NODE_ENV !== "production") {
    scriptSrc.push("'unsafe-eval'");
  }

  const frameSrc = [
    "https://accounts.google.com",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
    "https://*.googlesyndication.com",
    "https://*.doubleclick.net",
    "https://*.google.com",
    "https://ep1.adtrafficquality.google",
    "https://ep2.adtrafficquality.google",
    "https://*.adtrafficquality.google",
  ];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    `img-src ${imgSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `frame-src ${frameSrc.join(" ")}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ];

  return directives.join("; ");
}

export type SecurityHeader = { key: string; value: string };

export function getSecurityHeaders(): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  ];

  /* CSP is production-only; Turbopack / webpack HMR needs eval() + blob: + inline scripts in dev. */
  if (process.env.NODE_ENV !== "production") {
    const cspIdx = headers.findIndex((h) => h.key === "Content-Security-Policy");
    if (cspIdx !== -1) headers.splice(cspIdx, 1);
  }

  if (process.env.NODE_ENV === "production") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
