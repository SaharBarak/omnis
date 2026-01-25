import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'About Omnis - Your Cosmic Blueprint',
  description: 'Learn about Omnis and our mission to help you discover your cosmic blueprint through Dreamspell, Human Design, Astrology, and Gematria.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="text-accent text-3xl">*</span>
            <h1 className="text-4xl font-bold mt-4 mb-4">About Omnis</h1>
            <p className="text-lg text-muted-foreground">
              Unifying ancient wisdom systems for modern seekers
            </p>
          </div>

          {/* Mission */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-accent mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Omnis is built on the belief that multiple symbolic systems can illuminate different facets of who we are. Rather than seeing Dreamspell, Human Design, Astrology, and Gematria as competing frameworks, we recognize them as complementary lenses—each offering unique insights into the cosmic blueprint that makes you, you.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our mission is to make these profound systems accessible, accurate, and interconnected, helping you navigate life with greater self-awareness and cosmic alignment.
            </p>
          </section>

          {/* Systems */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-accent mb-4">The Systems We Work With</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Dreamspell</h3>
                <p className="text-muted-foreground">
                  A modern interpretation of the Mayan calendar, created by José Argüelles. The 260-day Tzolkin cycle reveals your galactic signature—a combination of one of 20 Solar Seals and 13 Galactic Tones that describes your cosmic purpose.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Human Design</h3>
                <p className="text-muted-foreground">
                  A synthesis of the I Ching, Kabbalah, Chakra system, Astrology, and Quantum Physics. Your Bodygraph reveals your Type, Strategy, Authority, and the unique way you're designed to operate in the world.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Astrology</h3>
                <p className="text-muted-foreground">
                  The ancient study of planetary positions and their influence on human life. Your natal chart maps the sky at the moment of your birth, revealing personality traits, life themes, and potential paths.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Gematria</h3>
                <p className="text-muted-foreground">
                  The Hebrew system of numerology that assigns numerical values to letters and words. By calculating the gematria of your Hebrew name, we uncover hidden meanings and connections in the language of numbers.
                </p>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-accent mb-4">Our Values</h2>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✦</span>
                <span><strong className="text-foreground">Accuracy</strong> — We use verified algorithms and authoritative sources for all calculations.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✦</span>
                <span><strong className="text-foreground">Accessibility</strong> — Complex systems should be understandable, not gatekept.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✦</span>
                <span><strong className="text-foreground">Integration</strong> — We seek the connections between systems, not divisions.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✦</span>
                <span><strong className="text-foreground">Privacy</strong> — Your birth data and insights remain yours. We never sell personal information.</span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="text-center">
            <p className="text-muted-foreground mb-6">
              Ready to explore your cosmic blueprint?
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/calculate"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-medium text-background hover:bg-accent/90 transition-colors"
              >
                Calculate Your Kin
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-accent/10 transition-colors"
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
