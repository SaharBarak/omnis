import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Learn Astrology - The Cosmic Language | Omnis',
  description: 'Discover astrology: zodiac signs, planets, houses, and aspects. Free educational guide to reading your natal chart.',
  keywords: 'astrology, zodiac, natal chart, planets, houses, aspects, horoscope, sun sign, moon sign, rising sign',
}

const signs = [
  { name: 'Aries', symbol: '♈', element: 'Fire', modality: 'Cardinal', dates: 'Mar 21 - Apr 19' },
  { name: 'Taurus', symbol: '♉', element: 'Earth', modality: 'Fixed', dates: 'Apr 20 - May 20' },
  { name: 'Gemini', symbol: '♊', element: 'Air', modality: 'Mutable', dates: 'May 21 - Jun 20' },
  { name: 'Cancer', symbol: '♋', element: 'Water', modality: 'Cardinal', dates: 'Jun 21 - Jul 22' },
  { name: 'Leo', symbol: '♌', element: 'Fire', modality: 'Fixed', dates: 'Jul 23 - Aug 22' },
  { name: 'Virgo', symbol: '♍', element: 'Earth', modality: 'Mutable', dates: 'Aug 23 - Sep 22' },
  { name: 'Libra', symbol: '♎', element: 'Air', modality: 'Cardinal', dates: 'Sep 23 - Oct 22' },
  { name: 'Scorpio', symbol: '♏', element: 'Water', modality: 'Fixed', dates: 'Oct 23 - Nov 21' },
  { name: 'Sagittarius', symbol: '♐', element: 'Fire', modality: 'Mutable', dates: 'Nov 22 - Dec 21' },
  { name: 'Capricorn', symbol: '♑', element: 'Earth', modality: 'Cardinal', dates: 'Dec 22 - Jan 19' },
  { name: 'Aquarius', symbol: '♒', element: 'Air', modality: 'Fixed', dates: 'Jan 20 - Feb 18' },
  { name: 'Pisces', symbol: '♓', element: 'Water', modality: 'Mutable', dates: 'Feb 19 - Mar 20' },
]

const planets = [
  { name: 'Sun', symbol: '☉', meaning: 'Core identity, ego, life purpose', type: 'Luminary' },
  { name: 'Moon', symbol: '☽', meaning: 'Emotions, instincts, inner self', type: 'Luminary' },
  { name: 'Mercury', symbol: '☿', meaning: 'Communication, thinking, learning', type: 'Personal' },
  { name: 'Venus', symbol: '♀', meaning: 'Love, beauty, values, pleasure', type: 'Personal' },
  { name: 'Mars', symbol: '♂', meaning: 'Action, desire, energy, aggression', type: 'Personal' },
  { name: 'Jupiter', symbol: '♃', meaning: 'Expansion, luck, philosophy, growth', type: 'Social' },
  { name: 'Saturn', symbol: '♄', meaning: 'Structure, discipline, karma, limits', type: 'Social' },
  { name: 'Uranus', symbol: '♅', meaning: 'Innovation, rebellion, awakening', type: 'Transpersonal' },
  { name: 'Neptune', symbol: '♆', meaning: 'Dreams, illusion, spirituality', type: 'Transpersonal' },
  { name: 'Pluto', symbol: '♇', meaning: 'Transformation, power, rebirth', type: 'Transpersonal' },
]

const houses = [
  { number: 1, name: 'Self', themes: 'Identity, appearance, first impressions' },
  { number: 2, name: 'Possessions', themes: 'Money, values, material security' },
  { number: 3, name: 'Communication', themes: 'Siblings, short trips, learning' },
  { number: 4, name: 'Home', themes: 'Family, roots, emotional foundation' },
  { number: 5, name: 'Creativity', themes: 'Romance, children, self-expression' },
  { number: 6, name: 'Service', themes: 'Health, work, daily routines' },
  { number: 7, name: 'Partnership', themes: 'Marriage, contracts, open enemies' },
  { number: 8, name: 'Transformation', themes: 'Death, rebirth, shared resources' },
  { number: 9, name: 'Philosophy', themes: 'Higher learning, travel, beliefs' },
  { number: 10, name: 'Career', themes: 'Public image, status, achievements' },
  { number: 11, name: 'Community', themes: 'Friends, groups, hopes, dreams' },
  { number: 12, name: 'Unconscious', themes: 'Hidden enemies, karma, spirituality' },
]

const aspects = [
  { name: 'Conjunction', symbol: '☌', angle: '0°', nature: 'Blending', effect: 'Intensifies combined energies' },
  { name: 'Opposition', symbol: '☍', angle: '180°', nature: 'Challenging', effect: 'Creates tension and awareness' },
  { name: 'Square', symbol: '□', angle: '90°', nature: 'Challenging', effect: 'Friction that spurs action' },
  { name: 'Trine', symbol: '△', angle: '120°', nature: 'Harmonious', effect: 'Easy flow of energy' },
  { name: 'Sextile', symbol: '⚹', angle: '60°', nature: 'Harmonious', effect: 'Opportunities for growth' },
]

function getElementColor(element: string) {
  switch (element) {
    case 'Fire': return 'bg-red-500/20 border-red-500/30 text-red-400'
    case 'Earth': return 'bg-green-500/20 border-green-500/30 text-green-400'
    case 'Air': return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
    case 'Water': return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
    default: return 'bg-white/5 border-white/20'
  }
}

export default function AstrologyLearnPage() {
  return (
    <div className="min-h-screen bg-background dark">
      <Header />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Link href="/learn" className="text-sm text-muted-foreground hover:text-accent mb-4 inline-block">
              ← Back to Learn
            </Link>
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-gold-gradient">Astrology</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The ancient language of the cosmos. Understand the planetary influences
              at the moment of your birth and how they shape your life.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">12</div>
              <div className="text-sm text-muted-foreground">Zodiac Signs</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">10</div>
              <div className="text-sm text-muted-foreground">Planets</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">12</div>
              <div className="text-sm text-muted-foreground">Houses</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">5</div>
              <div className="text-sm text-muted-foreground">Major Aspects</div>
            </div>
          </div>

          {/* What is Astrology */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">What is Astrology?</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Astrology is an ancient system that maps the positions of celestial bodies
                at the time of your birth to understand personality, potential, and life patterns.
                Your natal chart is like a cosmic snapshot of the sky at your exact moment of birth.
              </p>
              <p>
                <strong className="text-foreground">The Big Three:</strong> Your Sun sign represents
                your core identity, Moon sign reveals your emotional nature, and Rising sign (Ascendant)
                shows how you present to the world.
              </p>
              <p>
                <strong className="text-foreground">Note:</strong> Accurate birth time is essential for
                calculating houses and the Rising sign. Without it, only planetary signs can be determined.
              </p>
            </div>
          </section>

          {/* Zodiac Signs */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">The 12 Zodiac Signs</h2>
            <p className="text-muted-foreground mb-6">
              Each sign has an element (Fire, Earth, Air, Water) and modality (Cardinal, Fixed, Mutable).
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {signs.map((sign) => (
                <div
                  key={sign.name}
                  className={`p-3 rounded-lg border ${getElementColor(sign.element)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{sign.symbol}</span>
                    <span className="font-medium">{sign.name}</span>
                  </div>
                  <div className="text-xs opacity-80">{sign.element} • {sign.modality}</div>
                  <div className="text-xs text-muted-foreground mt-1">{sign.dates}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Planets */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">The Planets</h2>
            <p className="text-muted-foreground mb-6">
              Each planet represents a different aspect of your psyche and life experience.
            </p>

            <div className="space-y-3">
              {planets.map((planet) => (
                <div
                  key={planet.name}
                  className="flex items-start gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="text-2xl w-8">{planet.symbol}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{planet.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">{planet.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{planet.meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Houses */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">The 12 Houses</h2>
            <p className="text-muted-foreground mb-6">
              Houses divide the chart into 12 life areas. Planets in a house influence that area of life.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {houses.map((house) => (
                <div key={house.number} className="p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                      {house.number}
                    </span>
                    <span className="font-medium">{house.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{house.themes}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Aspects */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Major Aspects</h2>
            <p className="text-muted-foreground mb-6">
              Aspects are angular relationships between planets that create harmony or tension.
            </p>

            <div className="space-y-3">
              {aspects.map((aspect) => (
                <div
                  key={aspect.name}
                  className={`p-4 rounded-lg ${
                    aspect.nature === 'Harmonious' ? 'bg-green-500/10 border border-green-500/30' :
                    aspect.nature === 'Challenging' ? 'bg-red-500/10 border border-red-500/30' :
                    'bg-yellow-500/10 border border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{aspect.symbol}</span>
                      <span className="font-medium">{aspect.name}</span>
                      <span className="text-sm text-muted-foreground">({aspect.angle})</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      aspect.nature === 'Harmonious' ? 'bg-green-500/20 text-green-400' :
                      aspect.nature === 'Challenging' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {aspect.nature}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{aspect.effect}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Ready to explore your natal chart?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href="/login">Get Your Chart</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/learn">Explore Other Systems</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
