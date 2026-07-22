import { Metadata } from 'next'

import {
  CARD,
  DocCta,
  DocH3,
  DocHero,
  DocInfoBox,
  DocProse,
  DocPullQuote,
  DocSection,
  DocShell,
  DocStats,
  QuickAnswer,
} from '@/app/learn/_components/doc-shell'
import { SYSTEM_FLAVORS } from '@/lib/design/system-flavors'
import { gematriaDocs } from '@/lib/docs/content'
import { JsonLd, SITE_URL, buildBreadcrumbs } from '@/lib/seo/json-ld'

export const revalidate = 3600

const FLAVOR = SYSTEM_FLAVORS.gematria
const ACCENT = FLAVOR.accent
const ACCENT_SOFT = FLAVOR.accentSoft

export const metadata: Metadata = {
  title: 'Kabbalah Tree of Life & Gematria: Complete Hebrew Mysticism Guide',
  description: 'Complete guide to Kabbalah: the Tree of Life, 10 Sefirot, Gematria calculation methods, 22 Hebrew letters, the Four Worlds, and integration with Human Design and Astrology.',
  keywords: 'kabbalah, tree of life, sefirot, gematria, hebrew letters, ein sof, four worlds, what is kabbalah, what is the tree of life, what is gematria, jewish mysticism, hebrew numerology',
  alternates: {
    canonical: '/learn/gematria',
  },
  openGraph: {
    title: 'Kabbalah Tree of Life & Gematria: Complete Hebrew Mysticism Guide',
    description: 'Learn Kabbalah: Tree of Life, 10 Sefirot, Gematria, and the 22 Hebrew Letters. Free comprehensive guide.',
    url: '/learn/gematria',
  },
}

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Kabbalah Tree of Life & Gematria: Complete Hebrew Mysticism Guide",
  "description": "Complete guide to Kabbalah: the Tree of Life, 10 Sefirot, Gematria calculation methods, 22 Hebrew letters, the Four Worlds.",
  "author": { "@id": `${SITE_URL}/#organization` },
  "publisher": { "@id": `${SITE_URL}/#organization` },
  "datePublished": "2024-06-01",
  "dateModified": "2025-01-15",
  "keywords": ["kabbalah", "tree of life", "sefirot", "gematria", "hebrew letters", "jewish mysticism"],
  "mainEntityOfPage": `${SITE_URL}/learn/gematria`,
}

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Kabbalah & Gematria: Complete Hebrew Mysticism Guide",
  "description": "Learn Kabbalah: Tree of Life, 10 Sefirot, Gematria methods, 22 Hebrew Letters, and the Four Worlds.",
  "provider": { "@id": `${SITE_URL}/#organization` },
  "isAccessibleForFree": true,
  "url": `${SITE_URL}/learn/gematria`,
}

const breadcrumbSchema = buildBreadcrumbs([
  { name: 'Home', url: SITE_URL },
  { name: 'Learn', url: `${SITE_URL}/learn` },
  { name: 'Kabbalah & Gematria', url: `${SITE_URL}/learn/gematria` },
])

const gematriaFaqs = [
  {
    question: "What is the Tree of Life in Kabbalah?",
    answer: "The Tree of Life (Etz Chaim) is the central diagram of Kabbalah, a map of divine emanation showing how the Infinite unfolds into reality through 10 Sefirot (divine attributes) connected by 22 paths corresponding to the 22 Hebrew letters. It is organized along three pillars: Mercy (right), Severity (left), and Balance (center).",
  },
  {
    question: "What is Gematria?",
    answer: "Gematria is the practice of calculating the numerical value of Hebrew words and phrases to discover hidden connections. Each Hebrew letter has a numerical value (Aleph=1 through Tav=400). When two words share the same total value, Kabbalists understand them as spiritually equivalent. Common methods include Standard (Hechrachi), Reduced (Katan), Ordinal (Siduri), and AtBash cipher.",
  },
  {
    question: "What are the 22 Hebrew letters?",
    answer: "The 22 Hebrew letters are classified into three groups: 3 Mother letters (Aleph, Mem, Shin) representing Air, Water, and Fire; 7 Double letters (Bet, Gimel, Dalet, Kaf, Pe, Resh, Tav) corresponding to the 7 classical planets; and 12 Simple letters corresponding to the 12 zodiac signs. Each letter is both a sound, a number, and a creative force.",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": gematriaFaqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
}

/** Shared dark table classes for the correspondence tables. */
const TH = 'border-b border-white/10 px-4 py-3 text-left font-medium text-white'
const TD = 'px-4 py-3 text-white/70'

/** DocSection headings, in page order — feeds the DocShell table of contents. */
const TOC = [
  { id: 'gem-ein-sof', label: 'Ein Sof & The Process of Creation' },
  { id: 'gem-tree-of-life', label: 'The Tree of Life (Etz Chaim)' },
  { id: 'gem-four-worlds', label: 'The Four Worlds (Olamot)' },
  { id: 'gem-letters', label: 'The 22 Hebrew Letters: Vehicles of Creation' },
  { id: 'gem-methods', label: 'Gematria: The Science of Number' },
  { id: 'gem-numbers', label: 'Significant Numbers in Tradition' },
  { id: 'gem-practice', label: 'Practical Applications in Pleiad' },
  { id: 'gem-integration', label: 'Kabbalah & the Other Systems' },
  { id: 'gem-faq', label: 'Frequently Asked Questions' },
] as const

export default function GematriaDocsPage() {
  return (
    <DocShell section="gematria" toc={TOC}>
      <JsonLd data={articleSchema} id="json-ld-article" />
      <JsonLd data={courseSchema} id="json-ld-course" />
      <JsonLd data={breadcrumbSchema} id="json-ld-breadcrumbs" />
      <JsonLd data={faqSchema} id="json-ld-faq" />

      {/* Header */}
      <DocHero
        section="gematria"
        title="Kabbalah: The Received Wisdom"
        subtitle="A Living Tradition of Mystical Knowledge, Sacred Letters, and the Architecture of Creation"
      />

      <QuickAnswer
        question="What is Kabbalah?"
        answer="Kabbalah (Hebrew: 'to receive') is the mystical tradition of Judaism mapping the hidden structure of reality. Its central diagram, the Tree of Life, shows 10 Sefirot (divine attributes) connected by 22 paths, together forming the 32 Paths of Wisdom. Gematria, a key Kabbalistic practice, reveals hidden connections between words sharing the same numerical value. The Tree of Life is also the structural basis of the Human Design Bodygraph."
        accent={ACCENT}
        accentSoft={ACCENT_SOFT}
      />

      {/* Introduction */}
      <section className="mb-12">
        <p className="text-lg leading-relaxed text-white/70">
          Kabbalah (from the Hebrew root QBL, meaning &quot;to receive&quot;) is the mystical tradition of Judaism,
          a vast body of esoteric wisdom that maps the hidden structure of reality. Far more than a single
          technique, Kabbalah encompasses the Tree of Life (Etz Chaim), the sacred Hebrew alphabet, the
          science of Gematria, meditation practices, and a cosmology that describes how the Infinite
          manifests as the finite world we inhabit. Its teachings have influenced Western esotericism,
          Hermeticism, and modern systems including Human Design, which directly incorporates the
          Kabbalistic Tree into the Bodygraph.
        </p>
      </section>

      {/* Pull Quote */}
      <DocPullQuote
        quote="God looked into the Torah and created the world. Man looks into the Torah and sustains the world."
        author="Zohar"
        accent={ACCENT}
      />

      {/* Quick Stats */}
      <DocStats
        stats={[
          { value: '10', label: 'Sefirot' },
          { value: '22', label: 'Hebrew Letters' },
          { value: '32', label: 'Paths of Wisdom' },
          { value: '4', label: 'Worlds of Creation' },
        ]}
        accentSoft={ACCENT_SOFT}
      />

      {/* ============================================================ */}
      {/* Ein Sof & The Process of Creation */}
      {/* ============================================================ */}
      <DocSection id="gem-ein-sof" title="Ein Sof & The Process of Creation">
        <p className="mb-6 text-lg leading-relaxed text-white/70">
          Before the Tree, before the letters, before number itself, Kabbalah begins with a concept that
          strains the limits of language: <strong className="text-white">Ein Sof</strong> (literally &quot;without end&quot;).
          Ein Sof is the Infinite, the Absolute, the Godhead prior to any act of creation or self-limitation.
          Ein Sof is not a &quot;being&quot; in any category we can name. It transcends existence and non-existence alike.
        </p>

        <p className="mb-6 text-lg leading-relaxed text-white/70">
          The central question of Kabbalistic cosmology is: How does the Infinite become finite?
          How does the One become the many? The answer lies in a radical act of divine self-contraction
          called <strong className="text-white">Tzimtzum</strong>.
        </p>

        <div className="mb-8">
          <DocInfoBox title="The Tzimtzum: Divine Contraction" accent={ACCENT} accentSoft={ACCENT_SOFT}>
            <p className="mb-3">
              According to Rabbi Isaac Luria (the Ari, 16th century), Ein Sof withdrew its infinite
              light to create a &quot;vacant space&quot; (chalal), a womb of potential in which finite
              worlds could exist. Into this space, a single ray of divine light (kav) entered,
              forming the first vessel. This is the origin of all structure, all number, all form.
            </p>
            <p>
              The Tzimtzum is not a one-time historical event but an ongoing process. Every moment,
              the Infinite contracts to allow the finite to exist, and every act of spiritual practice
              is a participation in this cosmic dynamic.
            </p>
          </DocInfoBox>
        </div>

        <DocH3 id="gem-shevirat">Shevirat HaKelim: The Breaking of the Vessels</DocH3>
        <p className="mb-6 leading-relaxed text-white/70">
          After the Tzimtzum, divine light poured into primordial vessels (kelim). But the vessels
          of the lower seven Sefirot could not contain the intensity of the light and shattered,
          an event called <strong className="text-white">Shevirat HaKelim</strong> (Breaking of the Vessels).
          Sparks of divine light fell into the lowest realms, trapped within shells of materiality
          called <strong className="text-white">klipot</strong>.
        </p>

        <DocH3 id="gem-tikkun">Tikkun: Repair of the World</DocH3>
        <p className="mb-8 leading-relaxed text-white/70">
          The purpose of human existence, according to Lurianic Kabbalah, is <strong className="text-white">Tikkun</strong>,
          the repair and restoration of the broken vessels. Every conscious act of goodness, every
          prayer, every act of loving-kindness liberates trapped sparks and returns them to their
          source. Tikkun is not merely personal healing but cosmic restoration: humanity is
          partnered with the divine in completing creation.
        </p>

        <DocPullQuote
          quote="It is not incumbent upon you to complete the work, but neither are you free to desist from it."
          author="Pirkei Avot 2:16"
          accent={ACCENT}
        />
      </DocSection>

      {/* ============================================================ */}
      {/* Tree of Life (Etz Chaim) */}
      {/* ============================================================ */}
      <DocSection id="gem-tree-of-life" title="The Tree of Life (Etz Chaim)">
        <p className="mb-6 text-lg leading-relaxed text-white/70">
          The Tree of Life is the central diagram of Kabbalah, a map of divine emanation showing
          how the Infinite unfolds into manifest reality through ten Sefirot (divine attributes)
          connected by 22 paths (corresponding to the 22 Hebrew letters). Together these form the{' '}
          <strong className="text-white">32 Paths of Wisdom</strong> described in the Sefer Yetzirah.
        </p>

        <p className="mb-8 text-lg leading-relaxed text-white/70">
          The Tree is organized along three pillars: the <strong className="text-white">Pillar of Mercy</strong> (right,
          expansion), the <strong className="text-white">Pillar of Severity</strong> (left, restriction), and
          the <strong className="text-white">Pillar of Balance</strong> (center, harmony). Every aspect of
          existence can be mapped onto this structure, from cosmic forces to human psychology to
          the structure of the body.
        </p>

        <DocH3>The Three Pillars</DocH3>
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className={`${CARD} p-5`} style={{ borderTopWidth: '3px', borderTopColor: 'hsl(210, 60%, 55%)' }}>
            <h4 className="mb-2 font-display text-lg text-white">Pillar of Mercy</h4>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[hsl(210,60%,65%)]">Right Column</p>
            <p className="mb-3 text-sm leading-relaxed text-white/70">
              The expansive, giving force. Represents the masculine principle, active energy, and
              the outpouring of divine grace.
            </p>
            <div className="text-sm text-white/70">
              <strong className="text-white">Sefirot:</strong> Chokhmah, Chesed, Netzach
            </div>
          </div>
          <div className={`${CARD} p-5`} style={{ borderTopWidth: '3px', borderTopColor: 'hsl(270, 50%, 55%)' }}>
            <h4 className="mb-2 font-display text-lg text-white">Pillar of Balance</h4>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[hsl(270,50%,70%)]">Central Column</p>
            <p className="mb-3 text-sm leading-relaxed text-white/70">
              The harmonizing middle way. Integrates the tension between mercy and severity into
              wholeness and equilibrium.
            </p>
            <div className="text-sm text-white/70">
              <strong className="text-white">Sefirot:</strong> Keter, Tiferet, Yesod, Malkhut
            </div>
          </div>
          <div className={`${CARD} p-5`} style={{ borderTopWidth: '3px', borderTopColor: 'hsl(0, 60%, 55%)' }}>
            <h4 className="mb-2 font-display text-lg text-white">Pillar of Severity</h4>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[hsl(0,60%,70%)]">Left Column</p>
            <p className="mb-3 text-sm leading-relaxed text-white/70">
              The restrictive, defining force. Represents the feminine principle, receptive energy,
              and the power of judgment and discernment.
            </p>
            <div className="text-sm text-white/70">
              <strong className="text-white">Sefirot:</strong> Binah, Gevurah, Hod
            </div>
          </div>
        </div>

        <DocH3>The Ten Sefirot</DocH3>
        <p className="mb-6 leading-relaxed text-white/70">
          The Sefirot are not separate gods or independent forces but facets of the One, like
          colors in a prism of white light. Each Sefirah represents a stage in the process by which
          the unknowable Ein Sof becomes the world we experience. The Sefirot also map to the human
          body, the soul, the planets, and the days of creation.
        </p>

        <div className="mb-8 space-y-4">
          {/* Keter */}
          <div className={`${CARD} p-5`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(0, 0%, 90%)' }}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-display text-sm text-ground">1</div>
              <span className="font-display text-lg text-white">Keter</span>
              <span className="text-sm text-white/50">(Crown)</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/70">
              The first emanation, closest to Ein Sof. Keter is divine will, the initial impulse of
              creation before it takes form. It is above comprehension, the point where the Infinite
              touches the finite. In the human being, Keter corresponds to the superconscious, the
              part of the soul (Yechidah) that is always united with God.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span><strong className="text-white/80">Body:</strong> Crown of head</span>
              <span><strong className="text-white/80">Soul:</strong> Yechidah (Oneness)</span>
              <span><strong className="text-white/80">Color:</strong> White brilliance</span>
              <span><strong className="text-white/80">Name of God:</strong> Ehyeh Asher Ehyeh</span>
            </div>
          </div>

          {/* Chokhmah */}
          <div className={`${CARD} p-5`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(210, 70%, 55%)' }}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 font-display text-sm text-blue-400">2</div>
              <span className="font-display text-lg text-white">Chokhmah</span>
              <span className="text-sm text-white/50">(Wisdom)</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/70">
              The first flash of insight, the lightning bolt of an idea before it is analyzed or articulated.
              Chokhmah is the primal father principle, pure creative force, the seminal point from which
              all thought unfolds. It contains everything in potential but nothing yet in detail.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span><strong className="text-white/80">Body:</strong> Right brain</span>
              <span><strong className="text-white/80">Soul:</strong> Chayah (Living essence)</span>
              <span><strong className="text-white/80">Planet:</strong> The Zodiac wheel</span>
              <span><strong className="text-white/80">Pillar:</strong> Mercy (Right)</span>
            </div>
          </div>

          {/* Binah */}
          <div className={`${CARD} p-5`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(0, 60%, 40%)' }}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 font-display text-sm text-red-400">3</div>
              <span className="font-display text-lg text-white">Binah</span>
              <span className="text-sm text-white/50">(Understanding)</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/70">
              The mother principle that receives the seed of Chokhmah and gestates it into fully formed thought.
              Binah is analytical intelligence, the capacity to examine, distinguish, and give structure
              to raw intuition. Where Chokhmah says &quot;Aha!&quot;, Binah asks &quot;What does this mean?&quot;
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span><strong className="text-white/80">Body:</strong> Left brain</span>
              <span><strong className="text-white/80">Soul:</strong> Neshamah (Breath of God)</span>
              <span><strong className="text-white/80">Planet:</strong> Saturn</span>
              <span><strong className="text-white/80">Pillar:</strong> Severity (Left)</span>
            </div>
          </div>

          {/* Da'at (non-Sefirah) */}
          <div className="mb-2 rounded-2xl border border-dashed border-white/20 bg-white/5 p-5">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-white/30 font-display text-xs text-white/50">&mdash;</div>
              <span className="font-display text-lg text-white/70">Da&apos;at</span>
              <span className="text-sm text-white/50">(Knowledge), the hidden, non-Sefirah</span>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              Da&apos;at is the point where Chokhmah and Binah unite, the &quot;Abyss&quot; that separates the
              supernal triad from the lower seven. It is not counted among the ten Sefirot but
              occupies the space where Keter reflects downward. Da&apos;at represents integrated knowledge,
              the internalization of wisdom and understanding into lived experience. In Human Design,
              this position is significant in the Bodygraph&apos;s Kabbalistic overlay.
            </p>
          </div>

          {/* Chesed */}
          <div className={`${CARD} p-5`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(210, 70%, 55%)' }}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 font-display text-sm text-blue-400">4</div>
              <span className="font-display text-lg text-white">Chesed</span>
              <span className="text-sm text-white/50">(Loving-kindness)</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/70">
              The first Sefirah below the Abyss. Chesed is boundless love, generosity, and benevolence,
              the desire to give without limit. It represents the expansive arm of God, the patriarch
              Abraham, and the first day of creation. Without Gevurah to contain it, Chesed would
              overflow all boundaries.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span><strong className="text-white/80">Body:</strong> Right arm</span>
              <span><strong className="text-white/80">Planet:</strong> Jupiter</span>
              <span><strong className="text-white/80">Day:</strong> Sunday</span>
              <span><strong className="text-white/80">Patriarch:</strong> Abraham</span>
            </div>
          </div>

          {/* Gevurah */}
          <div className={`${CARD} p-5`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(0, 60%, 55%)' }}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 font-display text-sm text-red-400">5</div>
              <span className="font-display text-lg text-white">Gevurah</span>
              <span className="text-sm text-white/50">(Strength / Judgment)</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/70">
              The power of restraint, discipline, and discernment. Gevurah sets boundaries on Chesed&apos;s
              limitless giving, like a gardener pruning a tree so it can grow stronger. It represents
              divine justice, the awe of God, and the courage to say &quot;no&quot; when necessary. Isaac,
              who submitted to binding, embodies this quality.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span><strong className="text-white/80">Body:</strong> Left arm</span>
              <span><strong className="text-white/80">Planet:</strong> Mars</span>
              <span><strong className="text-white/80">Day:</strong> Monday</span>
              <span><strong className="text-white/80">Patriarch:</strong> Isaac</span>
            </div>
          </div>

          {/* Tiferet */}
          <div className={`${CARD} p-5`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(45, 80%, 50%)' }}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/10 font-display text-sm text-yellow-400">6</div>
              <span className="font-display text-lg text-white">Tiferet</span>
              <span className="text-sm text-white/50">(Beauty / Harmony)</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/70">
              The heart of the Tree. Tiferet balances Chesed and Gevurah, love and judgment, into
              compassion, the quality of beauty that emerges when opposites are harmonized. It is
              the center of the central pillar, connected to more paths than any other Sefirah. In
              the human being, Tiferet is the heart, the seat of the authentic self. Jacob, who
              wrestled with the angel and was renamed Israel, embodies this integration.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span><strong className="text-white/80">Body:</strong> Heart / Torso</span>
              <span><strong className="text-white/80">Planet:</strong> Sun</span>
              <span><strong className="text-white/80">Day:</strong> Tuesday</span>
              <span><strong className="text-white/80">Patriarch:</strong> Jacob</span>
            </div>
          </div>

          {/* Netzach */}
          <div className={`${CARD} p-5`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(150, 50%, 45%)' }}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 font-display text-sm text-green-400">7</div>
              <span className="font-display text-lg text-white">Netzach</span>
              <span className="text-sm text-white/50">(Victory / Endurance)</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/70">
              The force of persistence, desire, and creative initiative. Netzach is the drive that
              keeps going when logic says to stop, faith translated into endurance. It governs
              emotions, art, and the natural world. Moses, who persisted for 40 years in the
              wilderness, embodies this quality.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span><strong className="text-white/80">Body:</strong> Right leg / kidney</span>
              <span><strong className="text-white/80">Planet:</strong> Venus</span>
              <span><strong className="text-white/80">Day:</strong> Wednesday</span>
              <span><strong className="text-white/80">Patriarch:</strong> Moses</span>
            </div>
          </div>

          {/* Hod */}
          <div className={`${CARD} p-5`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(30, 70%, 50%)' }}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 font-display text-sm text-orange-400">8</div>
              <span className="font-display text-lg text-white">Hod</span>
              <span className="text-sm text-white/50">(Splendor / Humility)</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/70">
              The complementary partner to Netzach. Where Netzach is emotional and instinctive,
              Hod is intellectual and analytical. It represents humility before truth, the discipline
              of prayer, and the acknowledgment that the intellect alone cannot grasp the whole.
              Aaron, the articulate priest, embodies Hod.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span><strong className="text-white/80">Body:</strong> Left leg / kidney</span>
              <span><strong className="text-white/80">Planet:</strong> Mercury</span>
              <span><strong className="text-white/80">Day:</strong> Thursday</span>
              <span><strong className="text-white/80">Patriarch:</strong> Aaron</span>
            </div>
          </div>

          {/* Yesod */}
          <div className={`${CARD} p-5`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(270, 50%, 55%)' }}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10 font-display text-sm text-purple-400">9</div>
              <span className="font-display text-lg text-white">Yesod</span>
              <span className="text-sm text-white/50">(Foundation)</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/70">
              The channel through which all the upper Sefirot pour their energy into Malkhut. Yesod
              is the foundation of the manifest world, the interface between the spiritual and physical.
              It governs connection, bonding, sexuality, and the capacity to transmit. Joseph, the
              dreamer who connected heaven and earth through his visions, embodies Yesod.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span><strong className="text-white/80">Body:</strong> Reproductive organs</span>
              <span><strong className="text-white/80">Planet:</strong> Moon</span>
              <span><strong className="text-white/80">Day:</strong> Friday</span>
              <span><strong className="text-white/80">Patriarch:</strong> Joseph</span>
            </div>
          </div>

          {/* Malkhut */}
          <div className={`${CARD} p-5`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(200, 15%, 35%)' }}>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 font-display text-sm text-white">10</div>
              <span className="font-display text-lg text-white">Malkhut</span>
              <span className="text-sm text-white/50">(Kingdom / Sovereignty)</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/70">
              The final Sefirah, the manifest world, physical reality, the kingdom of God made
              tangible. Malkhut has no light of its own; it receives and reflects all the Sefirot
              above it, like the moon reflecting the sun. It is where the spiritual journey begins
              for those ascending the Tree, and where divine energy completes its descent. David,
              the earthly king, embodies Malkhut. Shabbat, the seventh day of rest, corresponds to it.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span><strong className="text-white/80">Body:</strong> Feet / mouth</span>
              <span><strong className="text-white/80">Planet:</strong> Earth</span>
              <span><strong className="text-white/80">Day:</strong> Shabbat</span>
              <span><strong className="text-white/80">Patriarch:</strong> David</span>
            </div>
          </div>
        </div>

        <DocInfoBox title="The Sefirot in Human Design" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <p className="leading-relaxed">
            The Human Design Bodygraph directly incorporates the Kabbalistic Tree of Life. The nine
            Centers of the Bodygraph map onto the Sefirot, with channels corresponding to paths on
            the Tree. When Ra Uru Hu received the Human Design system, the Tree was one of the four
            ancient systems synthesized into the Bodygraph, alongside the I Ching, the Hindu chakra
            system, and Western astrology. Understanding the Sefirot deepens your understanding of
            the Centers in your chart.
          </p>
        </DocInfoBox>
      </DocSection>

      {/* ============================================================ */}
      {/* The Four Worlds */}
      {/* ============================================================ */}
      <DocSection id="gem-four-worlds" title="The Four Worlds (Olamot)">
        <p className="mb-6 text-lg leading-relaxed text-white/70">
          Kabbalah teaches that reality exists on four levels or &quot;worlds&quot;, each a complete Tree of Life
          at a different density of manifestation. The Four Worlds describe the stages by which divine
          thought becomes physical reality, and they also map to four levels of the human soul, four
          letters of the divine name YHVH, and four elements.
        </p>

        <div className="mb-8 space-y-4">
          <div className={`${CARD} p-6`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(0, 0%, 88%)' }}>
            <div className="mb-3 flex items-center gap-3">
              <span className="font-serif text-3xl text-white">י</span>
              <div>
                <h4 className="font-display text-lg text-white">Atzilut (Emanation)</h4>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">The World of Nearness</span>
              </div>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/70">
              The highest world, closest to Ein Sof. Pure divine emanation where the Sefirot exist
              in their most refined form. There is no separation between Creator and creation here.
              Atzilut is the realm of archetypal ideas, the world of divine will before it takes any
              form. It corresponds to the soul-level of <strong className="text-white">Chayah</strong> (living essence)
              and the element of <strong className="text-white">Fire</strong>.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-white/50">
              <span><strong className="text-white/80">Letter of YHVH:</strong> Yod (י)</span>
              <span><strong className="text-white/80">Element:</strong> Fire</span>
              <span><strong className="text-white/80">Soul Level:</strong> Chayah</span>
              <span><strong className="text-white/80">Sefirah:</strong> Chokhmah</span>
            </div>
          </div>

          <div className={`${CARD} p-6`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(210, 60%, 55%)' }}>
            <div className="mb-3 flex items-center gap-3">
              <span className="font-serif text-3xl text-white">ה</span>
              <div>
                <h4 className="font-display text-lg text-white">Beriah (Creation)</h4>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">The World of Thrones</span>
              </div>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/70">
              The world of intellectual creation, where the archetypes of Atzilut first take on
              distinct conceptual form. The great archangels operate at this level. Beriah is
              where &quot;something from nothing&quot; (yesh me&apos;ayin) occurs, the first moment an idea
              becomes a thing. It corresponds to the soul-level of <strong className="text-white">Neshamah</strong> (divine breath)
              and the element of <strong className="text-white">Water</strong>.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-white/50">
              <span><strong className="text-white/80">Letter of YHVH:</strong> He (ה)</span>
              <span><strong className="text-white/80">Element:</strong> Water</span>
              <span><strong className="text-white/80">Soul Level:</strong> Neshamah</span>
              <span><strong className="text-white/80">Sefirah:</strong> Binah</span>
            </div>
          </div>

          <div className={`${CARD} p-6`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(150, 50%, 45%)' }}>
            <div className="mb-3 flex items-center gap-3">
              <span className="font-serif text-3xl text-white">ו</span>
              <div>
                <h4 className="font-display text-lg text-white">Yetzirah (Formation)</h4>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">The World of Angels</span>
              </div>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/70">
              The world of emotional and formative energies, where the concepts of Beriah take on
              shape and pattern. Angels and spiritual forces operate here. Yetzirah is the realm
              of feeling, imagination, and the astral plane. The Sefer Yetzirah (Book of Formation)
              primarily describes this world&apos;s mechanisms. It corresponds to the soul-level
              of <strong className="text-white">Ruach</strong> (spirit) and the element of <strong className="text-white">Air</strong>.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-white/50">
              <span><strong className="text-white/80">Letter of YHVH:</strong> Vav (ו)</span>
              <span><strong className="text-white/80">Element:</strong> Air</span>
              <span><strong className="text-white/80">Soul Level:</strong> Ruach</span>
              <span><strong className="text-white/80">Sefirot:</strong> Chesed through Yesod</span>
            </div>
          </div>

          <div className={`${CARD} p-6`} style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(30, 50%, 45%)' }}>
            <div className="mb-3 flex items-center gap-3">
              <span className="font-serif text-3xl text-white">ה</span>
              <div>
                <h4 className="font-display text-lg text-white">Assiah (Action)</h4>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">The World of Making</span>
              </div>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/70">
              The physical world of action, matter, and manifest reality. This is where we live,
              where spiritual forces become tangible events and objects. Assiah is not &quot;lower&quot; in a
              pejorative sense: it is the purpose of creation, the place where Tikkun happens,
              where the divine plan is actualized through human deeds. It corresponds to the
              soul-level of <strong className="text-white">Nefesh</strong> (animal soul) and the element
              of <strong className="text-white">Earth</strong>.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-white/50">
              <span><strong className="text-white/80">Letter of YHVH:</strong> He (ה) final</span>
              <span><strong className="text-white/80">Element:</strong> Earth</span>
              <span><strong className="text-white/80">Soul Level:</strong> Nefesh</span>
              <span><strong className="text-white/80">Sefirah:</strong> Malkhut</span>
            </div>
          </div>
        </div>

        <DocPullQuote
          quote="As above, so below; as below, so above. The wonders of the One are found in each world."
          author="Hermetic-Kabbalistic principle"
          accent={ACCENT}
        />
      </DocSection>

      {/* ============================================================ */}
      {/* 22 Hebrew Letters */}
      {/* ============================================================ */}
      <DocSection id="gem-letters" title="The 22 Hebrew Letters: Vehicles of Creation">
        <DocProse className="mb-6" content={gematriaDocs.hebrewAlphabet.introduction} />

        <p className="mb-8 leading-relaxed text-white/70">
          The Sefer Yetzirah classifies the 22 letters into three categories based on their
          elemental and astrological correspondences. These categories reflect the structure of
          creation itself: the three primordial elements, the seven celestial bodies visible to
          the ancient eye, and the twelve constellations of the zodiac.
        </p>

        {/* Three Mothers */}
        <DocH3>Three Mother Letters (Imot)</DocH3>
        <p className="mb-4 text-sm leading-relaxed text-white/70">
          The three mothers represent the primordial elements from which all of physical creation
          emerges. They correspond to the three horizontal paths on the Tree of Life, bridging the
          pillars of Mercy and Severity.
        </p>
        <div className="mb-10 grid gap-3 sm:grid-cols-3">
          <div className={`${CARD} p-5 text-center`}>
            <span className="mb-2 block font-serif text-4xl text-white">א</span>
            <div className="mb-1 font-display text-white">Aleph</div>
            <div className="mb-2 text-sm text-white/50">Value: 1</div>
            <div className="mb-2 inline-block rounded bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">Air</div>
            <p className="text-xs leading-relaxed text-white/50">
              The silent letter. Divine breath, the mediator between fire and water. Represents unity and the origin of sound.
            </p>
          </div>
          <div className={`${CARD} p-5 text-center`}>
            <span className="mb-2 block font-serif text-4xl text-white">מ</span>
            <div className="mb-1 font-display text-white">Mem</div>
            <div className="mb-2 text-sm text-white/50">Value: 40</div>
            <div className="mb-2 inline-block rounded bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">Water</div>
            <p className="text-xs leading-relaxed text-white/50">
              The revealed and hidden. Transformation (40 days of flood, 40 years in desert). The womb of creation.
            </p>
          </div>
          <div className={`${CARD} p-5 text-center`}>
            <span className="mb-2 block font-serif text-4xl text-white">ש</span>
            <div className="mb-1 font-display text-white">Shin</div>
            <div className="mb-2 text-sm text-white/50">Value: 300</div>
            <div className="mb-2 inline-block rounded bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">Fire</div>
            <p className="text-xs leading-relaxed text-white/50">
              Three flames of the trinity. Divine fire, transformation, the Holy Spirit. Shin has three prongs representing three pillars.
            </p>
          </div>
        </div>

        {/* Seven Doubles */}
        <DocH3>Seven Double Letters (Kefulot)</DocH3>
        <p className="mb-4 text-sm leading-relaxed text-white/70">
          The seven doubles each have two pronunciations (hard and soft), representing duality,
          the positive and negative expression of each planetary force. They correspond to the
          seven classical planets, the seven days of creation, and the seven vertical paths on the Tree.
        </p>
        <div className={`${CARD} mb-10 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="bg-white/5">
                  <th className={TH}>Letter</th>
                  <th className={TH}>Name</th>
                  <th className={TH}>Value</th>
                  <th className={TH}>Planet</th>
                  <th className={TH}>Positive</th>
                  <th className={TH}>Negative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr><td className={`${TD} font-serif text-2xl text-white`}>ב</td><td className={TD}>Bet</td><td className={TD}>2</td><td className={TD}>Saturn</td><td className={TD}>Wisdom</td><td className={TD}>Foolishness</td></tr>
                <tr><td className={`${TD} font-serif text-2xl text-white`}>ג</td><td className={TD}>Gimel</td><td className={TD}>3</td><td className={TD}>Jupiter</td><td className={TD}>Wealth</td><td className={TD}>Poverty</td></tr>
                <tr><td className={`${TD} font-serif text-2xl text-white`}>ד</td><td className={TD}>Dalet</td><td className={TD}>4</td><td className={TD}>Mars</td><td className={TD}>Fertility</td><td className={TD}>Desolation</td></tr>
                <tr><td className={`${TD} font-serif text-2xl text-white`}>כ</td><td className={TD}>Kaf</td><td className={TD}>20</td><td className={TD}>Sun</td><td className={TD}>Life</td><td className={TD}>Death</td></tr>
                <tr><td className={`${TD} font-serif text-2xl text-white`}>פ</td><td className={TD}>Pe</td><td className={TD}>80</td><td className={TD}>Venus</td><td className={TD}>Power</td><td className={TD}>Servitude</td></tr>
                <tr><td className={`${TD} font-serif text-2xl text-white`}>ר</td><td className={TD}>Resh</td><td className={TD}>200</td><td className={TD}>Mercury</td><td className={TD}>Peace</td><td className={TD}>War</td></tr>
                <tr><td className={`${TD} font-serif text-2xl text-white`}>ת</td><td className={TD}>Tav</td><td className={TD}>400</td><td className={TD}>Moon</td><td className={TD}>Grace</td><td className={TD}>Ugliness</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Twelve Simples */}
        <DocH3>Twelve Simple Letters (Peshutot)</DocH3>
        <p className="mb-4 text-sm leading-relaxed text-white/70">
          The twelve simple letters correspond to the twelve zodiac signs, twelve months, and
          twelve diagonal paths on the Tree of Life. Each governs a fundamental human experience or sense.
        </p>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { letter: 'ה', name: 'He', value: 5, sign: 'Aries', sense: 'Sight' },
            { letter: 'ו', name: 'Vav', value: 6, sign: 'Taurus', sense: 'Hearing' },
            { letter: 'ז', name: 'Zayin', value: 7, sign: 'Gemini', sense: 'Smell' },
            { letter: 'ח', name: 'Chet', value: 8, sign: 'Cancer', sense: 'Speech' },
            { letter: 'ט', name: 'Tet', value: 9, sign: 'Leo', sense: 'Taste' },
            { letter: 'י', name: 'Yod', value: 10, sign: 'Virgo', sense: 'Action' },
            { letter: 'ל', name: 'Lamed', value: 30, sign: 'Libra', sense: 'Coition' },
            { letter: 'נ', name: 'Nun', value: 50, sign: 'Scorpio', sense: 'Motion' },
            { letter: 'ס', name: 'Samekh', value: 60, sign: 'Sagittarius', sense: 'Anger' },
            { letter: 'ע', name: 'Ayin', value: 70, sign: 'Capricorn', sense: 'Mirth' },
            { letter: 'צ', name: 'Tsade', value: 90, sign: 'Aquarius', sense: 'Thought' },
            { letter: 'ק', name: 'Qof', value: 100, sign: 'Pisces', sense: 'Sleep' },
          ].map((item) => (
            <div key={item.name} className={`${CARD} p-4`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-serif text-3xl text-white">{item.letter}</span>
                <span className="font-display text-lg" style={{ color: ACCENT_SOFT }}>{item.value}</span>
              </div>
              <div className="text-sm font-medium text-white">{item.name}</div>
              <div className="text-xs text-white/50">{item.sign}</div>
              <div className="mt-1 text-xs" style={{ color: ACCENT_SOFT }}>Sense: {item.sense}</div>
            </div>
          ))}
        </div>

        {/* Final Forms */}
        <DocH3>Final Letter Forms (Sofit)</DocH3>
        <p className="mb-4 text-sm text-white/70">
          Five letters change shape when they appear at the end of a word. In the Mispar Gadol
          system, these final forms carry higher values (500-900), extending the numerical
          range of the alphabet. Mystically, the final forms represent the hidden, transcendent
          dimension of each letter.
        </p>
        <div className="flex flex-wrap gap-3">
          {gematriaDocs.hebrewAlphabet.finalForms.map((item) => (
            <div
              key={item.name}
              className="rounded-lg border px-4 py-3"
              style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}33` }}
            >
              <span className="mr-3 font-serif text-2xl text-white">{item.letter}</span>
              <span className="text-sm text-white/70">{item.name}</span>
              <span className="ml-2 text-sm" style={{ color: ACCENT_SOFT }}>= {item.value}</span>
            </div>
          ))}
        </div>
      </DocSection>

      {/* ============================================================ */}
      {/* Gematria Calculation Methods */}
      {/* ============================================================ */}
      <DocSection id="gem-methods" title="Gematria: The Science of Number">
        <p className="mb-6 text-lg leading-relaxed text-white/70">
          Gematria (from the Greek <em>geometria</em>, or possibly from the Hebrew <em>gimatria</em>)
          is the practice of calculating the numerical value of Hebrew words and phrases to discover
          hidden connections. When two words share the same numerical value, Kabbalists understand
          them as spiritually equivalent, different expressions of the same underlying reality.
        </p>

        <p className="mb-8 leading-relaxed text-white/70">
          There are numerous methods of gematria, each offering a different lens. The most important
          are detailed below, along with worked examples.
        </p>

        <div className="mb-8 space-y-6">
          {/* Standard */}
          <div className={`${CARD} p-6`}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm"
                style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT_SOFT }}
              >
                1
              </span>
              <h4 className="font-display text-lg text-white">Mispar Hechrachi (Standard Value)</h4>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              The most common and fundamental method. Each letter carries its standard value:
              Aleph=1 through Tav=400. Final letters retain their standard values (e.g., final Mem = 40, not 600).
            </p>
            <div className="mb-3 rounded-lg bg-surface-2 p-4 font-mono text-sm text-white/60">
              <div className="mb-2"><strong className="text-white">Example: שָׁלוֹם (Shalom, &quot;Peace&quot;)</strong></div>
              <div>Shin(300) + Lamed(30) + Vav(6) + Mem(40) = <strong className="text-white">376</strong></div>
            </div>
            <div className="rounded-lg bg-surface-2 p-4 font-mono text-sm text-white/60">
              <div className="mb-2"><strong className="text-white">Example: אֱמֶת (Emet, &quot;Truth&quot;)</strong></div>
              <div>Aleph(1) + Mem(40) + Tav(400) = <strong className="text-white">441</strong></div>
              <div className="mt-1 text-xs text-white/40">Note: 441 = 21 x 21, a perfect square of the value of the divine name Ehyeh (אהיה = 21)</div>
            </div>
          </div>

          {/* Gadol */}
          <div className={`${CARD} p-6`}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm"
                style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT_SOFT }}
              >
                2
              </span>
              <h4 className="font-display text-lg text-white">Mispar Gadol (Full / Great Value)</h4>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              Identical to standard except that the five final letter forms receive extended values:
              Kaf Sofit=500, Mem Sofit=600, Nun Sofit=700, Pe Sofit=800, Tsade Sofit=900.
              This reveals connections invisible to the standard method.
            </p>
            <div className="rounded-lg bg-surface-2 p-4 font-mono text-sm text-white/60">
              <div className="mb-2"><strong className="text-white">Example: שָׁלוֹם (Shalom) with final Mem</strong></div>
              <div>Shin(300) + Lamed(30) + Vav(6) + Mem Sofit(600) = <strong className="text-white">936</strong></div>
            </div>
          </div>

          {/* Katan */}
          <div className={`${CARD} p-6`}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm"
                style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT_SOFT }}
              >
                3
              </span>
              <h4 className="font-display text-lg text-white">Mispar Katan (Reduced / Small Value)</h4>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              Each letter is reduced to its single-digit root by removing zeros. So Yod (10) becomes 1,
              Kaf (20) becomes 2, Shin (300) becomes 3. This method reveals the essential, archetypal
              vibration of a word.
            </p>
            <div className="mb-3 rounded-lg bg-surface-2 p-4 font-mono text-sm text-white/60">
              <div className="mb-2"><strong className="text-white">Example: שָׁלוֹם (Shalom)</strong></div>
              <div>Shin(3) + Lamed(3) + Vav(6) + Mem(4) = <strong className="text-white">16</strong> &rarr; 1+6 = <strong className="text-white">7</strong></div>
            </div>
            <div className="text-xs" style={{ color: ACCENT_SOFT }}>Seven is the number of completion, the Sabbath: peace leads to wholeness.</div>
          </div>

          {/* Siduri */}
          <div className={`${CARD} p-6`}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm"
                style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT_SOFT }}
              >
                4
              </span>
              <h4 className="font-display text-lg text-white">Mispar Siduri (Ordinal Value)</h4>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              Each letter is valued by its position in the alphabet: Aleph=1, Bet=2, ... Tav=22.
              This creates a simpler, more uniform scale that can reveal sequential and positional
              relationships between words.
            </p>
            <div className="rounded-lg bg-surface-2 p-4 font-mono text-sm text-white/60">
              <div className="mb-2"><strong className="text-white">Example: חַי (Chai, &quot;Life&quot;)</strong></div>
              <div>Chet(8th letter) + Yod(10th letter) = <strong className="text-white">18</strong></div>
              <div className="mt-1 text-xs text-white/40">The same as the standard value, since both letters are in the first decade</div>
            </div>
          </div>

          {/* AtBash */}
          <div className={`${CARD} p-6`}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm"
                style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT_SOFT }}
              >
                5
              </span>
              <h4 className="font-display text-lg text-white">AtBash Cipher</h4>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              A substitution cipher where the first letter (Aleph) swaps with the last (Tav),
              the second (Bet) with the second-to-last (Shin), and so on. This creates a mirror
              transformation, revealing the &quot;hidden face&quot; of a word. AtBash is used extensively
              in the Book of Jeremiah and in Kabbalistic meditation.
            </p>
            <div className="rounded-lg bg-surface-2 p-4 font-mono text-sm text-white/60">
              <div className="mb-2"><strong className="text-white">Key pairs:</strong></div>
              <div>א&harr;ת &nbsp; ב&harr;ש &nbsp; ג&harr;ר &nbsp; ד&harr;ק &nbsp; ה&harr;צ &nbsp; ו&harr;פ &nbsp; ז&harr;ע &nbsp; ח&harr;ס &nbsp; ט&harr;נ &nbsp; י&harr;מ &nbsp; כ&harr;ל</div>
            </div>
          </div>

          {/* Kolel */}
          <div className={`${CARD} p-6`}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm"
                style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT_SOFT }}
              >
                6
              </span>
              <h4 className="font-display text-lg text-white">Mispar Kolel (Integral Value)</h4>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              The standard gematria value plus the number of letters in the word (or plus one for the
              word as a whole). This accounts for the &quot;body&quot; of the word itself as a discrete entity.
              It is often used to explain near-misses between words that differ by a small amount.
            </p>
            <div className="rounded-lg bg-surface-2 p-4 font-mono text-sm text-white/60">
              <div className="mb-2"><strong className="text-white">Example: שָׁלוֹם (Shalom)</strong></div>
              <div>Standard (376) + 4 letters = <strong className="text-white">380</strong></div>
            </div>
          </div>
        </div>

        <DocInfoBox title="Why So Many Methods?" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <p className="leading-relaxed">
            Each method of gematria is like a different frequency on a radio dial. It tunes into
            different layers of meaning within the same text. A word&apos;s standard value reveals its overt
            connections; its reduced value reveals its essential archetype; its ordinal value reveals
            its position in the cosmic order; and its AtBash reveals its shadow or complement.
            Serious gematria study uses multiple methods in parallel.
          </p>
        </DocInfoBox>
      </DocSection>

      {/* ============================================================ */}
      {/* Significant Numbers */}
      {/* ============================================================ */}
      <DocSection id="gem-numbers" title="Significant Numbers in Tradition">
        <p className="mb-8 text-lg leading-relaxed text-white/70">
          Certain numbers carry profound significance in the Kabbalistic tradition, appearing
          repeatedly across scripture, cosmology, and mystical practice. Understanding these
          numbers provides a foundation for interpreting gematria results.
        </p>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {gematriaDocs.significantNumbers.numbers.map((item) => (
            <div
              key={item.value}
              className={`${CARD} p-5`}
              style={{ borderLeftWidth: '4px', borderLeftColor: `${ACCENT}99` }}
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="font-display text-2xl" style={{ color: ACCENT_SOFT }}>{item.value}</span>
                <span className="font-serif text-xl text-white">{item.hebrew}</span>
                <span className="text-sm text-white/50">{item.meaning}</span>
              </div>
              <p className="text-sm leading-relaxed text-white/70">{item.significance}</p>
            </div>
          ))}
        </div>

        <DocInfoBox title="The Number 137: Where Kabbalah Meets Physics" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <p className="leading-relaxed">
            The word Kabbalah (קבלה) has a standard gematria value of 137. Remarkably, 1/137 is
            the fine-structure constant in physics, a dimensionless number that governs the
            strength of electromagnetic interactions between light and matter. Physicist Wolfgang
            Pauli was obsessed with this number, calling it &quot;one of the greatest mysteries of
            physics.&quot; Richard Feynman called it &quot;one of the greatest damn mysteries of physics:
            a magic number that comes to us with no understanding.&quot; The convergence of mystical
            and scientific significance at 137 has fascinated scholars of both domains.
          </p>
        </DocInfoBox>
      </DocSection>

      {/* ============================================================ */}
      {/* Practical Applications */}
      {/* ============================================================ */}
      <DocSection id="gem-practice" title="Practical Applications in Pleiad">
        <p className="mb-8 text-lg leading-relaxed text-white/70">
          Pleiad integrates Kabbalistic wisdom and gematria analysis into your personal profile,
          connecting these ancient tools with your other system readings. Here is how the
          calculations work in practice.
        </p>

        <DocH3>Name Analysis</DocH3>
        <p className="mb-6 leading-relaxed text-white/70">
          Your Hebrew name is your spiritual identifier, a numerical signature that connects
          you to cosmic patterns. Pleiad calculates your name across multiple gematria methods
          simultaneously, revealing layers of meaning.
        </p>

        <div className={`${CARD} mb-8 p-6`}>
          <h4 className="mb-4 font-display text-lg text-white">How to Calculate Your Name</h4>
          <div className="space-y-4">
            {gematriaDocs.practicalApplication.steps.map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium"
                  style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT_SOFT }}
                >
                  {item.step}
                </div>
                <span className="pt-1 text-sm text-white/70">{item.instruction}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${CARD} mb-8 p-5`}>
          <h4 className="mb-3 font-medium text-white">Worked Example: דָּוִד (David)</h4>
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-lg bg-surface-2 p-3 font-mono">
              <div><strong className="text-white">Standard:</strong> Dalet(4) + Vav(6) + Dalet(4) = <strong className="text-white">14</strong></div>
              <div><strong className="text-white">Ordinal:</strong> Dalet(4th) + Vav(6th) + Dalet(4th) = <strong className="text-white">14</strong></div>
              <div><strong className="text-white">Reduced:</strong> 4 + 6 + 4 = 14 &rarr; 1+4 = <strong className="text-white">5</strong></div>
            </div>
            <p className="leading-relaxed">
              David&apos;s name equals <strong className="text-white">14</strong>, the same as
              יד (<em>yad</em>, &quot;hand&quot;) and the same as אהב (<em>ahav</em>, &quot;loved&quot;).
              The digital root <strong className="text-white">5</strong> corresponds to the letter He (ה),
              representing divine breath, revelation, and the window through which God&apos;s presence enters
              the world. David was both &quot;the hand of God&quot; on earth and &quot;the beloved&quot;, both meanings
              encoded in his name&apos;s number.
            </p>
          </div>
        </div>

        <DocH3>Date Analysis</DocH3>
        <p className="mb-6 leading-relaxed text-white/70">
          Hebrew dates can also be calculated using gematria. Since Hebrew uses letters for
          numbers, every date is also a word, and that word has meaning. In traditional
          practice, spans of time carry their own signatures: weeks are linked to the Sefirot,
          months to their Hebrew letters. In Pleiad, the calendar side of your chart is carried
          by the time systems (Dreamspell, the Tzolkin, and the Long Count) while
          gematria does what it does best: reading the names.
        </p>

        <DocH3>Word Connection Discovery</DocH3>
        <p className="mb-8 leading-relaxed text-white/70">
          One of the most powerful features of gematria is discovering that two seemingly unrelated
          words share the same numerical value. Pleiad keeps a curated table of significant gematria
          values, so when your name&apos;s total lands on a notable number (a divine name, a
          foundational concept), the reading flags the connection. And because every person you
          chart is saved to your map, Pleiad can also compare names directly, surfacing matching
          values between you and the people in your life. These are not mere coincidences to the
          Kabbalist: they are threads in the tapestry of hidden meaning that connects all of
          reality.
        </p>

        <DocInfoBox title="Hebrew Name Tip" accent={ACCENT} accentSoft={ACCENT_SOFT}>
          <p className="leading-relaxed">
            If you have a Hebrew name, enter it in your Pleiad profile to see its gematria value and
            discover words and phrases that share your number. If you don&apos;t have a Hebrew name,
            you can transliterate your English name into Hebrew letters, though the connections
            may be less traditional. Consult a knowledgeable source for accurate transliteration:
            vowel choices in Hebrew significantly affect meaning.
          </p>
        </DocInfoBox>
      </DocSection>

      {/* ============================================================ */}
      {/* Integration with Other Systems */}
      {/* ============================================================ */}
      <DocSection id="gem-integration" title="Kabbalah & the Other Systems">
        <p className="mb-6 text-lg leading-relaxed text-white/70">
          Kabbalah does not exist in isolation. Its Tree of Life has been adopted and adapted by
          virtually every Western esoteric tradition, and its influence runs through several of the
          systems Pleiad brings together. Understanding these connections reveals a deeper unity
          beneath the surface diversity.
        </p>

        <DocH3>Kabbalah &amp; Human Design</DocH3>
        <p className="mb-6 leading-relaxed text-white/70">
          The connection between Kabbalah and Human Design is not metaphorical: it is structural.
          The Human Design Bodygraph is built on four ancient systems, and the <strong className="text-white">Kabbalistic Tree
          of Life is one of them</strong>. The nine Centers of the Bodygraph correspond to the Sefirot, and
          the channels between them correspond to the 22 paths on the Tree.
        </p>

        <div className={`${CARD} mb-8 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="bg-white/5">
                  <th className={TH}>Sefirah</th>
                  <th className={TH}>Human Design Center</th>
                  <th className={TH}>Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr><td className={TD}>Keter (Crown)</td><td className={TD}>Head Center</td><td className={TD}>Inspiration, mental pressure</td></tr>
                <tr><td className={TD}>Chokhmah &amp; Binah</td><td className={TD}>Ajna Center</td><td className={TD}>Conceptualization, processing</td></tr>
                <tr><td className={TD}>Da&apos;at (Knowledge)</td><td className={TD}>Throat Center</td><td className={TD}>Communication, manifestation</td></tr>
                <tr><td className={TD}>Chesed &amp; Gevurah</td><td className={TD}>G Center</td><td className={TD}>Identity, direction, love</td></tr>
                <tr><td className={TD}>Tiferet</td><td className={TD}>Heart/Ego Center</td><td className={TD}>Willpower, self-worth</td></tr>
                <tr><td className={TD}>Netzach &amp; Hod</td><td className={TD}>Solar Plexus / Spleen</td><td className={TD}>Emotions, intuition, health</td></tr>
                <tr><td className={TD}>Yesod</td><td className={TD}>Sacral Center</td><td className={TD}>Life force, sexuality, work energy</td></tr>
                <tr><td className={TD}>Malkhut</td><td className={TD}>Root Center</td><td className={TD}>Adrenaline, drive, grounding</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="mb-8 leading-relaxed text-white/70">
          When you study your defined and undefined Centers in Human Design, you are also studying
          your relationship to the Sefirot. A defined Sacral, for instance, means you have
          consistent access to the energy of Yesod, the foundation, the capacity to connect and
          transmit life force. An undefined Head Center means you are permeable to the inspirational
          pressure of Keter, the crown, divine will seeking to express through you.
        </p>

        <DocH3>Kabbalah &amp; Astrology</DocH3>
        <p className="mb-6 leading-relaxed text-white/70">
          The relationship between Kabbalah and astrology is ancient. The Sefer Yetzirah explicitly
          assigns the seven classical planets to the seven double letters and the twelve zodiac signs
          to the twelve simple letters. The Sefirot also have planetary correspondences.
        </p>

        <div className={`${CARD} mb-8 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="bg-white/5">
                  <th className={TH}>Sefirah</th>
                  <th className={TH}>Planet</th>
                  <th className={TH}>Astrological Theme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr><td className={TD}>Binah</td><td className={TD}>Saturn</td><td className={TD}>Structure, limits, karma, time</td></tr>
                <tr><td className={TD}>Chesed</td><td className={TD}>Jupiter</td><td className={TD}>Expansion, abundance, faith</td></tr>
                <tr><td className={TD}>Gevurah</td><td className={TD}>Mars</td><td className={TD}>Will, action, conflict, courage</td></tr>
                <tr><td className={TD}>Tiferet</td><td className={TD}>Sun</td><td className={TD}>Core self, vitality, consciousness</td></tr>
                <tr><td className={TD}>Netzach</td><td className={TD}>Venus</td><td className={TD}>Love, beauty, desire, art</td></tr>
                <tr><td className={TD}>Hod</td><td className={TD}>Mercury</td><td className={TD}>Mind, communication, analysis</td></tr>
                <tr><td className={TD}>Yesod</td><td className={TD}>Moon</td><td className={TD}>Emotions, cycles, the unconscious</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="mb-8 leading-relaxed text-white/70">
          This means that when you examine your natal chart&apos;s planetary placements, you are also
          seeing which Sefirot are activated in your life. A strong Jupiter placement activates
          Chesed (lovingkindness and expansion); a prominent Saturn activates Binah (understanding
          and structure). The astrological houses can be mapped onto the Tree as well, creating a
          rich multi-layered reading.
        </p>

        <DocH3>Kabbalah &amp; Dreamspell</DocH3>
        <p className="mb-8 leading-relaxed text-white/70">
          While the Dreamspell system draws primarily from Mesoamerican traditions, several structural
          parallels with Kabbalah are worth noting. The 13 Galactic Tones can be mapped to the 10 Sefirot
          plus the 3 veils of Ein Sof (Ein, Ein Sof, Ein Sof Or). The 20 Solar Seals, combined with
          the 13 Tones to create 260 Kin, mirror the Kabbalistic principle that divine light (the Sefirot)
          expresses through vessels (letters/seals) to create the full spectrum of reality. Both systems
          understand the universe as an interplay of number and archetype, of quantity and quality united
          in a sacred mathematics.
        </p>

        <DocPullQuote
          quote="Know what is above you: an eye that sees, an ear that hears, and all your deeds are recorded in a book."
          author="Pirkei Avot 2:1"
          accent={ACCENT}
        />
      </DocSection>

      {/* FAQ */}
      <DocSection id="gem-faq" title="Frequently Asked Questions">
        <div className="space-y-4">
          {gematriaFaqs.map((faq, i) => (
            <div key={i} className={`${CARD} p-5`}>
              <h4 className="mb-2 font-display text-lg text-white">{faq.question}</h4>
              <p className="text-sm leading-relaxed text-white/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* CTA */}
      <DocCta
        title="Explore Your Hebrew Name"
        body="Enter your Hebrew name in your profile to discover its gematria values, Sefirah correspondences, and connections to ancient wisdom."
        primary={{ href: '/login', label: 'Create a free account' }}
        secondary={{ href: '/learn/human-design', label: 'Explore Human Design' }}
      />
    </DocShell>
  )
}
