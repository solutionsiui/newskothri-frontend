import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import {
  getMetadataBase,
  localizedDefaultDescription,
  localizedSiteName,
} from "../lib/seo/metadataHelpers";
import type { UiLang } from "../i18n/siteCopy";
import GoogleAnalytics from "../components/GoogleAnalytics";
import AppChrome from "./AppChrome";
import AppProviders from "./AppProviders";
import { mukta } from "../lib/fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const lang: UiLang = jar.get("kn-lang")?.value === "en" ? "en" : "hi";
  const name = localizedSiteName(lang);
  const description = localizedDefaultDescription(lang);

  return {
    metadataBase: getMetadataBase(),
    applicationName: name,
    icons: {
      icon: [{ url: "/brand-logo.png", type: "image/png" }],
      apple: [{ url: "/brand-logo.png", type: "image/png" }],
    },
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description,
    openGraph: {
      type: "website",
      siteName: name,
      title: name,
      description,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFCFA" },
    { media: "(prefers-color-scheme: dark)", color: "#14110F" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const initialLang = jar.get("kn-lang")?.value === "en" ? "en" : "hi";
  const initialDark = jar.get("kn-dark")?.value === "1";

  return (
  <html
    lang={initialLang === "en" ? "en" : "hi"}
    className={mukta.variable}
    suppressHydrationWarning
    style={{ colorScheme: initialDark ? "dark" : "light" }}
    data-scroll-behavior="smooth"
  >
    <head>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9323779736575532"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    </head>
    <body suppressHydrationWarning>
      <GoogleAnalytics />
      <AppProviders initialLang={initialLang}>
        <AppChrome initialDark={initialDark}>{children}</AppChrome>
      </AppProviders>
    </body>
  </html>
);
}
