import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Barlow, Rubik, IBM_Plex_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4A8B7F",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://omnis.app'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "Omnis - Your Cosmic Blueprint | Dreamspell, Human Design & More",
    template: "%s | Omnis"
  },
  description: "Discover your cosmic blueprint with Omnis. Explore Dreamspell Kin, Human Design Bodygraph, Astrology Charts, and Hebrew Gematria. Free daily readings and personal analysis.",
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
  authors: [{ name: "Omnis" }],
  creator: "Omnis",
  publisher: "Omnis",
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
    url: "https://omnis.app",
    siteName: "Omnis",
    title: "Omnis - Your Cosmic Blueprint",
    description: "Discover your cosmic blueprint with Dreamspell, Human Design, Astrology, and Gematria. Free daily readings.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Omnis - Your Cosmic Blueprint",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Omnis - Your Cosmic Blueprint",
    description: "Discover your cosmic blueprint with Dreamspell, Human Design, Astrology, and Gematria.",
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
        className={`${barlow.variable} ${rubik.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        {children}
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
