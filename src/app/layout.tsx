import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0f",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://omnis.app'),
  title: {
    default: "Omnis - Your Cosmic Blueprint | Dreamspell, Human Design & More",
    template: "%s | Omnis"
  },
  description: "Discover your cosmic blueprint with Omnis. Explore Dreamspell Kin, Human Design Bodygraph, Astrology Charts, and Hebrew Gematria. Free daily readings and personal analysis.",
  keywords: [
    "dreamspell",
    "human design",
    "astrology",
    "gematria",
    "galactic signature",
    "kin",
    "bodygraph",
    "natal chart",
    "hebrew numerology",
    "cosmic blueprint",
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
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
      </head>
      <body
        className={`${plusJakarta.variable} ${dmSans.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
