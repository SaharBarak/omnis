import {
  Header,
  Hero,
  SystemsShowcase,
  Features,
  Testimonials,
  Pricing,
  FAQ,
  CTA,
  ScrollProgressBar,
  Footer,
} from '@/components/landing'
import Script from 'next/script'

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Omnis",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web",
  "description": "Professional chart viewer for five wisdom systems. Human Design bodygraph, Dreamspell oracle, astrology natal chart, Tzolkin day sign, and Hebrew gematria — calculated from your birth data and displayed in one interface.",
  "url": "https://omnis.app",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free chart calculation and AI-powered insights"
  },
  "featureList": [
    "Human Design Bodygraph",
    "Dreamspell Galactic Signature",
    "Astrology Natal Chart",
    "Tzolkin Sacred Calendar",
    "Hebrew Gematria Analysis",
    "AI Chart Companion",
    "Interactive Relationship Board"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "127"
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Scroll progress indicator — fixed at top */}
      <ScrollProgressBar />

      <Header />
      <main>
        <Hero />
        <SystemsShowcase />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
