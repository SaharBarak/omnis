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
import { JsonLd, SITE_URL, organizationSchema } from '@/lib/seo/json-ld'
import { faqs } from '@/lib/data/faqs'

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Omnis",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web",
  "description": "Professional chart viewer for five wisdom systems. Human Design bodygraph, Dreamspell oracle, astrology natal chart, Tzolkin day sign, and Kabbalah — calculated from your birth data and displayed in one interface.",
  "url": SITE_URL,
  "offers": [
    {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free plan — 1 profile, Dreamspell calculations, daily kin"
    },
    {
      "@type": "Offer",
      "price": "9",
      "priceCurrency": "USD",
      "description": "Complete plan — 10 profiles, all 6 systems, AI interpretations, PDF exports"
    },
    {
      "@type": "Offer",
      "price": "29",
      "priceCurrency": "USD",
      "description": "Practitioner plan — unlimited profiles, group analysis, advanced relationship tools"
    }
  ],
  "featureList": [
    "Human Design Bodygraph",
    "Dreamspell Galactic Signature",
    "Astrology Natal Chart",
    "Tzolkin Sacred Calendar",
    "Kabbalah & Hebrew Teachings",
    "AI Chart Companion",
    "Interactive Relationship Board"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "127"
  }
}

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Omnis",
  "url": SITE_URL,
  "description": "Unified chart viewer for Dreamspell, Human Design, Astrology, Tzolkin, and Kabbalah.",
  "publisher": { "@id": `${SITE_URL}/#organization` },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${SITE_URL}/calculate?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
}

const orgSchema = {
  "@context": "https://schema.org",
  ...organizationSchema,
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={webAppSchema} id="json-ld-webapp" />
      <JsonLd data={webSiteSchema} id="json-ld-website" />
      <JsonLd data={orgSchema} id="json-ld-org" />
      <JsonLd data={faqSchema} id="json-ld-faq" />

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
