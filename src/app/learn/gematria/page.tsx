import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Learn Gematria - Hebrew Letter Numerology | Omnis',
  description: 'Discover Gematria: Hebrew letter numerology revealing hidden meanings in names and words. Free educational guide.',
  keywords: 'gematria, hebrew numerology, kabbalah, hebrew letters, mispar, numerology, jewish mysticism',
}

const hebrewLetters = [
  { letter: 'א', name: 'Aleph', value: 1, meaning: 'Ox, strength, leadership' },
  { letter: 'ב', name: 'Bet', value: 2, meaning: 'House, dwelling, family' },
  { letter: 'ג', name: 'Gimel', value: 3, meaning: 'Camel, journey, reward' },
  { letter: 'ד', name: 'Dalet', value: 4, meaning: 'Door, pathway, poverty' },
  { letter: 'ה', name: 'He', value: 5, meaning: 'Window, revelation, breath' },
  { letter: 'ו', name: 'Vav', value: 6, meaning: 'Hook, connection, add' },
  { letter: 'ז', name: 'Zayin', value: 7, meaning: 'Sword, cut, weapon' },
  { letter: 'ח', name: 'Chet', value: 8, meaning: 'Fence, private, life' },
  { letter: 'ט', name: 'Tet', value: 9, meaning: 'Serpent, surround, good' },
  { letter: 'י', name: 'Yod', value: 10, meaning: 'Hand, work, worship' },
  { letter: 'כ', name: 'Kaf', value: 20, meaning: 'Palm, open, bless' },
  { letter: 'ל', name: 'Lamed', value: 30, meaning: 'Staff, teach, learn' },
  { letter: 'מ', name: 'Mem', value: 40, meaning: 'Water, chaos, mighty' },
  { letter: 'נ', name: 'Nun', value: 50, meaning: 'Fish, activity, life' },
  { letter: 'ס', name: 'Samekh', value: 60, meaning: 'Support, prop, trust' },
  { letter: 'ע', name: 'Ayin', value: 70, meaning: 'Eye, see, experience' },
  { letter: 'פ', name: 'Pe', value: 80, meaning: 'Mouth, word, speak' },
  { letter: 'צ', name: 'Tsade', value: 90, meaning: 'Fish hook, desire, need' },
  { letter: 'ק', name: 'Qof', value: 100, meaning: 'Back of head, last, least' },
  { letter: 'ר', name: 'Resh', value: 200, meaning: 'Head, first, top' },
  { letter: 'ש', name: 'Shin', value: 300, meaning: 'Tooth, sharp, press' },
  { letter: 'ת', name: 'Tav', value: 400, meaning: 'Cross, mark, sign' },
]

const methods = [
  {
    name: 'Standard (Mispar Hechrachi)',
    description: 'The basic method. Each letter has its standard value (1-400).',
    example: 'שלום = 300 + 30 + 6 + 40 = 376',
  },
  {
    name: 'Full (Mispar Gadol)',
    description: 'Final letters (ך,ם,ן,ף,ץ) have values 500-900 instead of their regular forms.',
    example: 'Final Mem (ם) = 600 instead of 40',
  },
  {
    name: 'Small (Mispar Katan)',
    description: 'Reduce each letter to single digit (10→1, 200→2). Quicker pattern recognition.',
    example: 'שלום = 3 + 3 + 6 + 4 = 16 → 1 + 6 = 7',
  },
  {
    name: 'Ordinal (Mispar Siduri)',
    description: 'Letters valued by position in alphabet (1-22).',
    example: 'א=1, ב=2... ת=22',
  },
  {
    name: 'AtBash',
    description: 'Cipher substituting first letter with last, second with second-to-last.',
    example: 'א↔ת, ב↔ש, ג↔ר, etc.',
  },
]

const notableNumbers = [
  { number: 18, hebrew: 'חי', meaning: 'Life', description: 'Chet (8) + Yod (10) = 18. Symbol of life and good fortune.' },
  { number: 26, hebrew: 'יהוה', meaning: 'YHVH', description: 'The Tetragrammaton, the ineffable name of God.' },
  { number: 72, hebrew: 'חסד', meaning: 'Chesed', description: 'Loving-kindness. Also the 72 names of God.' },
  { number: 137, hebrew: 'קבלה', meaning: 'Kabbalah', description: 'Reception, tradition. Also the fine-structure constant!' },
  { number: 358, hebrew: 'משיח', meaning: 'Mashiach', description: 'Messiah. Same value as נחש (serpent).' },
  { number: 541, hebrew: 'ישראל', meaning: 'Israel', description: 'One who wrestles with God.' },
]

export default function GematriaLearnPage() {
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
              <span className="text-gold-gradient">Gematria</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The ancient Jewish practice of assigning numeric values to letters,
              revealing hidden connections between words and concepts.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">22</div>
              <div className="text-sm text-muted-foreground">Hebrew Letters</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">5</div>
              <div className="text-sm text-muted-foreground">Final Forms</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">7+</div>
              <div className="text-sm text-muted-foreground">Methods</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="kin-number text-3xl">∞</div>
              <div className="text-sm text-muted-foreground">Connections</div>
            </div>
          </div>

          {/* What is Gematria */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">What is Gematria?</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Gematria is an alphanumeric code of assigning numerical values to Hebrew letters, words, and phrases.
                It&apos;s one of the primary tools of Kabbalistic interpretation, revealing hidden connections
                and deeper meanings in sacred texts.
              </p>
              <p>
                When two words share the same numerical value, they are considered to have a deep connection —
                a hidden relationship that reveals spiritual truths. This is called &quot;gematria equivalence.&quot;
              </p>
              <p>
                Beyond mystical applications, gematria is used to understand one&apos;s Hebrew name,
                find connections between concepts, and explore the mathematical beauty of Hebrew texts.
              </p>
            </div>
          </section>

          {/* Hebrew Letters */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">The 22 Hebrew Letters</h2>
            <p className="text-muted-foreground mb-6">
              Each letter carries a numeric value and symbolic meaning.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {hebrewLetters.map((item) => (
                <div key={item.name} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-bold">{item.letter}</span>
                    <span className="kin-number text-lg">{item.value}</span>
                  </div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.meaning}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Calculation Methods */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Calculation Methods</h2>
            <p className="text-muted-foreground mb-6">
              Different methods reveal different aspects of a word&apos;s meaning.
            </p>

            <div className="space-y-4">
              {methods.map((method) => (
                <div key={method.name} className="p-4 rounded-lg bg-white/5">
                  <h3 className="font-semibold text-accent mb-2">{method.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                  <div className="text-sm bg-black/20 p-2 rounded font-mono">{method.example}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Notable Numbers */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Notable Numbers</h2>
            <p className="text-muted-foreground mb-6">
              Certain numbers carry special significance in Jewish tradition.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {notableNumbers.map((item) => (
                <div key={item.number} className="p-4 rounded-lg border border-accent/30 bg-accent/5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="kin-number text-2xl">{item.number}</span>
                    <span className="text-xl">{item.hebrew}</span>
                    <span className="text-sm text-accent">{item.meaning}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Digital Root */}
          <section className="glass rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Digital Root</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                The digital root reduces any number to a single digit by summing its digits repeatedly.
                This reveals the essential &quot;vibration&quot; of a number.
              </p>
              <div className="bg-black/20 p-4 rounded-lg font-mono text-sm">
                <p>Example: 358 (Mashiach)</p>
                <p>3 + 5 + 8 = 16</p>
                <p>1 + 6 = 7</p>
                <p>Digital root: 7 (completion, spiritual perfection)</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Calculate the gematria of your Hebrew name.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href="/login">Calculate Your Name</Link>
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
