import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { JsonLd, SITE_URL, organizationSchema, buildBreadcrumbs } from '@/lib/seo/json-ld'
import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs'

export const metadata: Metadata = {
  title: 'About OmnisX - Unifying Ancient Wisdom Systems for Modern Seekers',
  description: 'Learn about OmnisX and our mission to make Dreamspell, Tzolkin, Long Count, Human Design, Astrology, and Kabbalah accessible, accurate, and interconnected. Privacy-first, open approach.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About OmnisX - Unifying Ancient Wisdom Systems for Modern Seekers',
    description: 'Our mission: making six ancient wisdom systems accessible, accurate, and interconnected.',
    url: '/about',
  },
}

const aboutOrgSchema = {
  "@context": "https://schema.org",
  ...organizationSchema,
  "description": "OmnisX unifies six ancient wisdom systems — Dreamspell, Tzolkin, Long Count, Human Design, Astrology, and Kabbalah — into one accessible platform for modern seekers.",
  "foundingDate": "2024",
  "knowsAbout": ["Dreamspell", "Human Design", "Astrology", "Kabbalah", "Gematria", "Tzolkin", "Mayan Calendar"],
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'About', url: `${SITE_URL}/about` },
])

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <JsonLd data={aboutOrgSchema} id="json-ld-organization" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <PageBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="earth-badge inline-flex mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Our Story</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading text-foreground mb-4">About OmnisX</h1>
            <p className="text-lg text-muted-foreground">
              Unifying ancient wisdom systems for modern seekers
            </p>
          </div>

          {/* Mission */}
          <section className="earth-card bg-card p-8 mb-6">
            <h2 className="text-2xl font-heading text-primary mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              OmnisX is built on the belief that multiple symbolic systems can illuminate different facets of who we are. Rather than seeing Dreamspell, Human Design, Astrology, and Gematria as competing frameworks, we recognize them as complementary lenses—each offering unique insights into the cosmic blueprint that makes you, you.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our mission is to make these profound systems accessible, accurate, and interconnected, helping you navigate life with greater self-awareness and cosmic alignment.
            </p>
          </section>

          {/* Systems */}
          <section className="earth-card bg-card p-8 mb-6">
            <h2 className="text-2xl font-heading text-primary mb-6">The Systems We Work With</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-heading mb-2">Dreamspell</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A modern interpretation of the Mayan calendar, created by José Argüelles. As he taught: &ldquo;Time is not money. Time is Art.&rdquo; The 260-day Tzolkin cycle reveals your galactic signature—a combination of one of 20 Solar Seals and 13 Galactic Tones that describes your cosmic purpose.
                </p>
              </div>
              <div className="earth-divider" />
              <div>
                <h3 className="text-lg font-heading mb-2">Human Design</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A synthesis of the I Ching, Kabbalah, Chakra system, Astrology, and Quantum Physics. Ra Uru Hu, who received the system, emphasized: &ldquo;I am not the guru. I am a mechanic.&rdquo; Your Bodygraph reveals your Type, Strategy, Authority, and the unique way you&apos;re designed to operate in the world.
                </p>
              </div>
              <div className="earth-divider" />
              <div>
                <h3 className="text-lg font-heading mb-2">Astrology</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The ancient study of planetary positions and their influence on human life. Your natal chart maps the sky at the moment of your birth, revealing personality traits, life themes, and potential paths.
                </p>
              </div>
              <div className="earth-divider" />
              <div>
                <h3 className="text-lg font-heading mb-2">Gematria</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The Hebrew system of numerology that assigns numerical values to letters and words. The Kabbalistic tradition teaches that Hebrew letters are vehicles of creation. By calculating the gematria of your Hebrew name, we uncover hidden meanings and connections in the language of numbers.
                </p>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="earth-card bg-card p-8 mb-8">
            <h2 className="text-2xl font-heading text-primary mb-6">Our Values</h2>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                </span>
                <span><strong className="text-foreground">Accuracy</strong> — We use verified algorithms and authoritative sources for all calculations.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                </span>
                <span><strong className="text-foreground">Accessibility</strong> — Complex systems should be understandable, not gatekept.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                </span>
                <span><strong className="text-foreground">Integration</strong> — We seek the connections between systems, not divisions.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                </span>
                <span><strong className="text-foreground">Privacy</strong> — Your birth data and insights remain yours. We never sell personal information.</span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="text-center">
            <p className="text-muted-foreground mb-6">
              Ready to explore your cosmic blueprint?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/calculate"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Calculate Your Kin
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 font-medium hover:bg-muted/50 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
