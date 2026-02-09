import {
  Header,
  Hero,
  SocialProof,
  Features,
  Demo,
  HowItWorks,
  Testimonials,
  Pricing,
  FAQ,
  CTA,
  Footer,
} from '@/components/landing'
import Script from 'next/script'

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Omnis",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web",
  "description": "Discover your cosmic blueprint with Omnis. Explore Dreamspell Kin, Human Design Bodygraph, Astrology Charts, and Hebrew Gematria.",
  "url": "https://omnis.app",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free daily readings and personal analysis"
  },
  "featureList": [
    "Dreamspell Galactic Signature",
    "Human Design Bodygraph",
    "Astrology Natal Chart",
    "Hebrew Gematria Analysis",
    "Relationship Compatibility",
    "Daily Cosmic Readings"
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
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <Demo />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
