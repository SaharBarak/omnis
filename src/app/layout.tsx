import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Barlow, Rubik, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { PostHogAnalytics } from "@/lib/analytics/posthog-provider";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B0D16",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pleiad.io'),
  // NOTE: no `alternates.canonical` here — a canonical set in the root layout
  // is inherited by every page that doesn't override it, which would point
  // all sub-pages at the homepage. Each public page declares its own.
  title: {
    default: "Pleiad - The Living Map of Your People | 6 Wisdom Systems",
    template: "%s | Pleiad"
  },
  description: "Map everyone in your life across six wisdom systems: Astrology, Dreamspell, Tzolkin, Human Design, and Hebrew Gematria — integrated. Free readings, compatibility, and a persistent relationship map.",
  keywords: [
    "dreamspell",
    "dreamspell calculator",
    "galactic signature calculator",
    "what is my kin",
    "human design",
    "free human design chart",
    "astrology",
    "natal chart",
    "gematria",
    "kabbalah",
    "tree of life",
    "tzolkin",
    "mayan calendar",
    "kin",
    "bodygraph",
    "hebrew numerology",
    "spiritual guidance"
  ],
  authors: [{ name: "Pleiad" }],
  creator: "Pleiad",
  publisher: "Pleiad",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Pleiad",
    title: "Pleiad - The Living Map of Your People",
    description: "Everyone in your life, read through six wisdom systems at once — Astrology, Dreamspell, Tzolkin, Human Design, Gematria — and remembered forever.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pleiad - The Living Map of Your People",
      },
    ],
  },
  // Card type only: X/Twitter falls back to each page's og:title/og:description,
  // so we don't pin a stale site-wide twitter title onto every sub-page.
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for analytics */}
        <link rel="dns-prefetch" href="https://static.cloudflareinsights.com" />
      </head>
      <body
        className={`${barlow.variable} ${rubik.variable} ${ibmPlexMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        {children}
        <PostHogAnalytics />
        <GoogleAnalytics gaId="G-KY20RW9LY7" />
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CF_BEACON_TOKEN}"}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
