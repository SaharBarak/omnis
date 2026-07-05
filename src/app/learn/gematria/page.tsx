import { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'
import { DocLayout, DocHero, DocSection, DocNav, DocStats, DocInfoBox, DocPullQuote, QuickAnswer } from '@/components/docs'
import { gematriaDocs, docStructure } from '@/lib/docs/content'
import { JsonLd, SITE_URL, organizationSchema, buildBreadcrumbs } from '@/lib/seo/json-ld'

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
  "description": "Learn Kabbalah — Tree of Life, 10 Sefirot, Gematria methods, 22 Hebrew Letters, and the Four Worlds.",
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
    answer: "The Tree of Life (Etz Chaim) is the central diagram of Kabbalah — a map of divine emanation showing how the Infinite unfolds into reality through 10 Sefirot (divine attributes) connected by 22 paths corresponding to the 22 Hebrew letters. It is organized along three pillars: Mercy (right), Severity (left), and Balance (center).",
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

export default function GematriaDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <DocLayout
        sections={docStructure.sections}
        currentSection="gematria"
      >
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
          answer="Kabbalah (Hebrew: 'to receive') is the mystical tradition of Judaism mapping the hidden structure of reality. Its central diagram, the Tree of Life, shows 10 Sefirot (divine attributes) connected by 22 paths — together forming the 32 Paths of Wisdom. Gematria, a key Kabbalistic practice, reveals hidden connections between words sharing the same numerical value. The Tree of Life is also the structural basis of the Human Design Bodygraph."
        />

        {/* Introduction */}
        <section className="mb-12">
          <p className="doc-dropcap text-muted-foreground leading-relaxed text-lg">
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
        />

        {/* Quick Stats */}
        <DocStats
          stats={[
            { value: '10', label: 'Sefirot' },
            { value: '22', label: 'Hebrew Letters' },
            { value: '32', label: 'Paths of Wisdom' },
            { value: '4', label: 'Worlds of Creation' },
          ]}
        />

        {/* ============================================================ */}
        {/* Ein Sof & The Process of Creation */}
        {/* ============================================================ */}
        <DocSection id="gem-ein-sof" title="Ein Sof & The Process of Creation">
          <p className="text-muted-foreground leading-relaxed mb-6">
            Before the Tree, before the letters, before number itself, Kabbalah begins with a concept that
            strains the limits of language: <strong className="text-foreground">Ein Sof</strong> (literally &quot;without end&quot;).
            Ein Sof is the Infinite, the Absolute, the Godhead prior to any act of creation or self-limitation.
            Ein Sof is not a &quot;being&quot; in any category we can name &mdash; it transcends existence and non-existence alike.
          </p>

          <p className="text-muted-foreground leading-relaxed mb-6">
            The central question of Kabbalistic cosmology is: How does the Infinite become finite?
            How does the One become the many? The answer lies in a radical act of divine self-contraction
            called <strong className="text-foreground">Tzimtzum</strong>.
          </p>

          <div className="doc-infobox doc-infobox-primary mb-8">
            <div className="flex items-start gap-3 mb-3">
              <div className="font-medium text-foreground">The Tzimtzum: Divine Contraction</div>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="mb-3">
                According to Rabbi Isaac Luria (the Ari, 16th century), Ein Sof withdrew its infinite
                light to create a &quot;vacant space&quot; (chalal) &mdash; a womb of potential in which finite
                worlds could exist. Into this space, a single ray of divine light (kav) entered,
                forming the first vessel. This is the origin of all structure, all number, all form.
              </p>
              <p>
                The Tzimtzum is not a one-time historical event but an ongoing process. Every moment,
                the Infinite contracts to allow the finite to exist, and every act of spiritual practice
                is a participation in this cosmic dynamic.
              </p>
            </div>
          </div>

          <h3 id="gem-shevirat" className="doc-h3">Shevirat HaKelim: The Breaking of the Vessels</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            After the Tzimtzum, divine light poured into primordial vessels (kelim). But the vessels
            of the lower seven Sefirot could not contain the intensity of the light and shattered &mdash;
            an event called <strong className="text-foreground">Shevirat HaKelim</strong> (Breaking of the Vessels).
            Sparks of divine light fell into the lowest realms, trapped within shells of materiality
            called <strong className="text-foreground">klipot</strong>.
          </p>

          <h3 id="gem-tikkun" className="doc-h3">Tikkun: Repair of the World</h3>
          <p className="text-muted-foreground leading-relaxed mb-8">
            The purpose of human existence, according to Lurianic Kabbalah, is <strong className="text-foreground">Tikkun</strong> &mdash;
            the repair and restoration of the broken vessels. Every conscious act of goodness, every
            prayer, every act of loving-kindness liberates trapped sparks and returns them to their
            source. Tikkun is not merely personal healing but cosmic restoration &mdash; humanity is
            partnered with the divine in completing creation.
          </p>

          <DocPullQuote
            quote="It is not incumbent upon you to complete the work, but neither are you free to desist from it."
            author="Pirkei Avot 2:16"
          />
        </DocSection>

        {/* ============================================================ */}
        {/* Tree of Life (Etz Chaim) */}
        {/* ============================================================ */}
        <DocSection id="gem-tree-of-life" title="The Tree of Life (Etz Chaim)">
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Tree of Life is the central diagram of Kabbalah &mdash; a map of divine emanation showing
            how the Infinite unfolds into manifest reality through ten Sefirot (divine attributes)
            connected by 22 paths (corresponding to the 22 Hebrew letters). Together these form the
            <strong className="text-foreground"> 32 Paths of Wisdom</strong> described in the Sefer Yetzirah.
          </p>

          <p className="text-muted-foreground leading-relaxed mb-8">
            The Tree is organized along three pillars: the <strong className="text-foreground">Pillar of Mercy</strong> (right,
            expansion), the <strong className="text-foreground">Pillar of Severity</strong> (left, restriction), and
            the <strong className="text-foreground">Pillar of Balance</strong> (center, harmony). Every aspect of
            existence can be mapped onto this structure &mdash; from cosmic forces to human psychology to
            the structure of the body.
          </p>

          <h3 className="doc-h3">The Three Pillars</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <div className="doc-card p-5" style={{ borderTopWidth: '3px', borderTopColor: 'hsl(210, 60%, 55%)' }}>
              <h4 className="font-heading text-lg text-foreground mb-2">Pillar of Mercy</h4>
              <p className="text-xs text-[hsl(210,60%,55%)] mb-2 uppercase tracking-wider">Right Column</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The expansive, giving force. Represents the masculine principle, active energy, and
                the outpouring of divine grace.
              </p>
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Sefirot:</strong> Chokhmah, Chesed, Netzach
              </div>
            </div>
            <div className="doc-card p-5" style={{ borderTopWidth: '3px', borderTopColor: 'hsl(270, 50%, 55%)' }}>
              <h4 className="font-heading text-lg text-foreground mb-2">Pillar of Balance</h4>
              <p className="text-xs text-[hsl(270,50%,55%)] mb-2 uppercase tracking-wider">Central Column</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The harmonizing middle way. Integrates the tension between mercy and severity into
                wholeness and equilibrium.
              </p>
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Sefirot:</strong> Keter, Tiferet, Yesod, Malkhut
              </div>
            </div>
            <div className="doc-card p-5" style={{ borderTopWidth: '3px', borderTopColor: 'hsl(0, 60%, 55%)' }}>
              <h4 className="font-heading text-lg text-foreground mb-2">Pillar of Severity</h4>
              <p className="text-xs text-[hsl(0,60%,55%)] mb-2 uppercase tracking-wider">Left Column</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The restrictive, defining force. Represents the feminine principle, receptive energy,
                and the power of judgment and discernment.
              </p>
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Sefirot:</strong> Binah, Gevurah, Hod
              </div>
            </div>
          </div>

          <h3 className="doc-h3">The Ten Sefirot</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The Sefirot are not separate gods or independent forces but facets of the One &mdash; like
            colors in a prism of white light. Each Sefirah represents a stage in the process by which
            the unknowable Ein Sof becomes the world we experience. The Sefirot also map to the human
            body, the soul, the planets, and the days of creation.
          </p>

          <div className="space-y-4 mb-8">
            {/* Keter */}
            <div className="doc-card p-5" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(0, 0%, 90%)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-sm font-heading text-foreground">1</div>
                <span className="font-heading text-lg text-foreground">Keter</span>
                <span className="text-sm text-muted-foreground">(Crown)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The first emanation, closest to Ein Sof. Keter is divine will, the initial impulse of
                creation before it takes form. It is above comprehension &mdash; the point where the Infinite
                touches the finite. In the human being, Keter corresponds to the superconscious, the
                part of the soul (Yechidah) that is always united with God.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Body:</strong> Crown of head</span>
                <span><strong className="text-foreground">Soul:</strong> Yechidah (Oneness)</span>
                <span><strong className="text-foreground">Color:</strong> White brilliance</span>
                <span><strong className="text-foreground">Name of God:</strong> Ehyeh Asher Ehyeh</span>
              </div>
            </div>

            {/* Chokhmah */}
            <div className="doc-card p-5" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(210, 70%, 55%)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-heading text-blue-600 dark:text-blue-400">2</div>
                <span className="font-heading text-lg text-foreground">Chokhmah</span>
                <span className="text-sm text-muted-foreground">(Wisdom)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The first flash of insight &mdash; the lightning bolt of an idea before it is analyzed or articulated.
                Chokhmah is the primal father principle, pure creative force, the seminal point from which
                all thought unfolds. It contains everything in potential but nothing yet in detail.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Body:</strong> Right brain</span>
                <span><strong className="text-foreground">Soul:</strong> Chayah (Living essence)</span>
                <span><strong className="text-foreground">Planet:</strong> The Zodiac wheel</span>
                <span><strong className="text-foreground">Pillar:</strong> Mercy (Right)</span>
              </div>
            </div>

            {/* Binah */}
            <div className="doc-card p-5" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(0, 60%, 40%)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-sm font-heading text-red-600 dark:text-red-400">3</div>
                <span className="font-heading text-lg text-foreground">Binah</span>
                <span className="text-sm text-muted-foreground">(Understanding)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The mother principle that receives the seed of Chokhmah and gestates it into fully formed thought.
                Binah is analytical intelligence &mdash; the capacity to examine, distinguish, and give structure
                to raw intuition. Where Chokhmah says &quot;Aha!&quot;, Binah asks &quot;What does this mean?&quot;
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Body:</strong> Left brain</span>
                <span><strong className="text-foreground">Soul:</strong> Neshamah (Breath of God)</span>
                <span><strong className="text-foreground">Planet:</strong> Saturn</span>
                <span><strong className="text-foreground">Pillar:</strong> Severity (Left)</span>
              </div>
            </div>

            {/* Da'at (non-Sefirah) */}
            <div className="p-5 rounded-lg border border-dashed border-border bg-muted/20 mb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full border border-dashed border-muted-foreground flex items-center justify-center text-xs font-heading text-muted-foreground">&mdash;</div>
                <span className="font-heading text-lg text-muted-foreground">Da&apos;at</span>
                <span className="text-sm text-muted-foreground">(Knowledge) &mdash; the hidden, non-Sefirah</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Da&apos;at is the point where Chokhmah and Binah unite &mdash; the &quot;Abyss&quot; that separates the
                supernal triad from the lower seven. It is not counted among the ten Sefirot but
                occupies the space where Keter reflects downward. Da&apos;at represents integrated knowledge,
                the internalization of wisdom and understanding into lived experience. In Human Design,
                this position is significant in the Bodygraph&apos;s Kabbalistic overlay.
              </p>
            </div>

            {/* Chesed */}
            <div className="doc-card p-5" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(210, 70%, 55%)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-heading text-blue-600 dark:text-blue-400">4</div>
                <span className="font-heading text-lg text-foreground">Chesed</span>
                <span className="text-sm text-muted-foreground">(Loving-kindness)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The first Sefirah below the Abyss. Chesed is boundless love, generosity, and benevolence &mdash;
                the desire to give without limit. It represents the expansive arm of God, the patriarch
                Abraham, and the first day of creation. Without Gevurah to contain it, Chesed would
                overflow all boundaries.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Body:</strong> Right arm</span>
                <span><strong className="text-foreground">Planet:</strong> Jupiter</span>
                <span><strong className="text-foreground">Day:</strong> Sunday</span>
                <span><strong className="text-foreground">Patriarch:</strong> Abraham</span>
              </div>
            </div>

            {/* Gevurah */}
            <div className="doc-card p-5" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(0, 60%, 55%)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-sm font-heading text-red-600 dark:text-red-400">5</div>
                <span className="font-heading text-lg text-foreground">Gevurah</span>
                <span className="text-sm text-muted-foreground">(Strength / Judgment)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The power of restraint, discipline, and discernment. Gevurah sets boundaries on Chesed&apos;s
                limitless giving, like a gardener pruning a tree so it can grow stronger. It represents
                divine justice, the awe of God, and the courage to say &quot;no&quot; when necessary. Isaac,
                who submitted to binding, embodies this quality.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Body:</strong> Left arm</span>
                <span><strong className="text-foreground">Planet:</strong> Mars</span>
                <span><strong className="text-foreground">Day:</strong> Monday</span>
                <span><strong className="text-foreground">Patriarch:</strong> Isaac</span>
              </div>
            </div>

            {/* Tiferet */}
            <div className="doc-card p-5" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(45, 80%, 50%)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-sm font-heading text-yellow-600 dark:text-yellow-400">6</div>
                <span className="font-heading text-lg text-foreground">Tiferet</span>
                <span className="text-sm text-muted-foreground">(Beauty / Harmony)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The heart of the Tree. Tiferet balances Chesed and Gevurah, love and judgment, into
                compassion &mdash; the quality of beauty that emerges when opposites are harmonized. It is
                the center of the central pillar, connected to more paths than any other Sefirah. In
                the human being, Tiferet is the heart, the seat of the authentic self. Jacob, who
                wrestled with the angel and was renamed Israel, embodies this integration.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Body:</strong> Heart / Torso</span>
                <span><strong className="text-foreground">Planet:</strong> Sun</span>
                <span><strong className="text-foreground">Day:</strong> Tuesday</span>
                <span><strong className="text-foreground">Patriarch:</strong> Jacob</span>
              </div>
            </div>

            {/* Netzach */}
            <div className="doc-card p-5" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(150, 50%, 45%)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-sm font-heading text-green-600 dark:text-green-400">7</div>
                <span className="font-heading text-lg text-foreground">Netzach</span>
                <span className="text-sm text-muted-foreground">(Victory / Endurance)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The force of persistence, desire, and creative initiative. Netzach is the drive that
                keeps going when logic says to stop &mdash; faith translated into endurance. It governs
                emotions, art, and the natural world. Moses, who persisted for 40 years in the
                wilderness, embodies this quality.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Body:</strong> Right leg / kidney</span>
                <span><strong className="text-foreground">Planet:</strong> Venus</span>
                <span><strong className="text-foreground">Day:</strong> Wednesday</span>
                <span><strong className="text-foreground">Patriarch:</strong> Moses</span>
              </div>
            </div>

            {/* Hod */}
            <div className="doc-card p-5" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(30, 70%, 50%)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-sm font-heading text-orange-600 dark:text-orange-400">8</div>
                <span className="font-heading text-lg text-foreground">Hod</span>
                <span className="text-sm text-muted-foreground">(Splendor / Humility)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The complementary partner to Netzach. Where Netzach is emotional and instinctive,
                Hod is intellectual and analytical. It represents humility before truth, the discipline
                of prayer, and the acknowledgment that the intellect alone cannot grasp the whole.
                Aaron, the articulate priest, embodies Hod.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Body:</strong> Left leg / kidney</span>
                <span><strong className="text-foreground">Planet:</strong> Mercury</span>
                <span><strong className="text-foreground">Day:</strong> Thursday</span>
                <span><strong className="text-foreground">Patriarch:</strong> Aaron</span>
              </div>
            </div>

            {/* Yesod */}
            <div className="doc-card p-5" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(270, 50%, 55%)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-sm font-heading text-purple-600 dark:text-purple-400">9</div>
                <span className="font-heading text-lg text-foreground">Yesod</span>
                <span className="text-sm text-muted-foreground">(Foundation)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The channel through which all the upper Sefirot pour their energy into Malkhut. Yesod
                is the foundation of the manifest world &mdash; the interface between the spiritual and physical.
                It governs connection, bonding, sexuality, and the capacity to transmit. Joseph, the
                dreamer who connected heaven and earth through his visions, embodies Yesod.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Body:</strong> Reproductive organs</span>
                <span><strong className="text-foreground">Planet:</strong> Moon</span>
                <span><strong className="text-foreground">Day:</strong> Friday</span>
                <span><strong className="text-foreground">Patriarch:</strong> Joseph</span>
              </div>
            </div>

            {/* Malkhut */}
            <div className="doc-card p-5" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(200, 15%, 35%)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-heading text-foreground">10</div>
                <span className="font-heading text-lg text-foreground">Malkhut</span>
                <span className="text-sm text-muted-foreground">(Kingdom / Sovereignty)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The final Sefirah &mdash; the manifest world, physical reality, the kingdom of God made
                tangible. Malkhut has no light of its own; it receives and reflects all the Sefirot
                above it, like the moon reflecting the sun. It is where the spiritual journey begins
                for those ascending the Tree, and where divine energy completes its descent. David,
                the earthly king, embodies Malkhut. Shabbat, the seventh day of rest, corresponds to it.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Body:</strong> Feet / mouth</span>
                <span><strong className="text-foreground">Planet:</strong> Earth</span>
                <span><strong className="text-foreground">Day:</strong> Shabbat</span>
                <span><strong className="text-foreground">Patriarch:</strong> David</span>
              </div>
            </div>
          </div>

          <DocInfoBox variant="accent" title="The Sefirot in Human Design">
            <p className="leading-relaxed">
              The Human Design Bodygraph directly incorporates the Kabbalistic Tree of Life. The nine
              Centers of the Bodygraph map onto the Sefirot, with channels corresponding to paths on
              the Tree. When Ra Uru Hu received the Human Design system, the Tree was one of the four
              ancient systems synthesized into the Bodygraph &mdash; alongside the I Ching, the Hindu chakra
              system, and Western astrology. Understanding the Sefirot deepens your understanding of
              the Centers in your chart.
            </p>
          </DocInfoBox>
        </DocSection>

        {/* ============================================================ */}
        {/* The Four Worlds */}
        {/* ============================================================ */}
        <DocSection id="gem-four-worlds" title="The Four Worlds (Olamot)">
          <p className="text-muted-foreground leading-relaxed mb-6">
            Kabbalah teaches that reality exists on four levels or &quot;worlds&quot; &mdash; each a complete Tree of Life
            at a different density of manifestation. The Four Worlds describe the stages by which divine
            thought becomes physical reality, and they also map to four levels of the human soul, four
            letters of the divine name YHVH, and four elements.
          </p>

          <div className="space-y-4 mb-8">
            <div className="doc-card p-6" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(0, 0%, 88%)' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl font-serif">י</span>
                <div>
                  <h4 className="font-heading text-lg text-foreground">Atzilut (Emanation)</h4>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">The World of Nearness</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The highest world, closest to Ein Sof. Pure divine emanation where the Sefirot exist
                in their most refined form. There is no separation between Creator and creation here.
                Atzilut is the realm of archetypal ideas, the world of divine will before it takes any
                form. It corresponds to the soul-level of <strong className="text-foreground">Chayah</strong> (living essence)
                and the element of <strong className="text-foreground">Fire</strong>.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Letter of YHVH:</strong> Yod (י)</span>
                <span><strong className="text-foreground">Element:</strong> Fire</span>
                <span><strong className="text-foreground">Soul Level:</strong> Chayah</span>
                <span><strong className="text-foreground">Sefirah:</strong> Chokhmah</span>
              </div>
            </div>

            <div className="doc-card p-6" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(210, 60%, 55%)' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl font-serif">ה</span>
                <div>
                  <h4 className="font-heading text-lg text-foreground">Beriah (Creation)</h4>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">The World of Thrones</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The world of intellectual creation, where the archetypes of Atzilut first take on
                distinct conceptual form. The great archangels operate at this level. Beriah is
                where &quot;something from nothing&quot; (yesh me&apos;ayin) occurs &mdash; the first moment an idea
                becomes a thing. It corresponds to the soul-level of <strong className="text-foreground">Neshamah</strong> (divine breath)
                and the element of <strong className="text-foreground">Water</strong>.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Letter of YHVH:</strong> He (ה)</span>
                <span><strong className="text-foreground">Element:</strong> Water</span>
                <span><strong className="text-foreground">Soul Level:</strong> Neshamah</span>
                <span><strong className="text-foreground">Sefirah:</strong> Binah</span>
              </div>
            </div>

            <div className="doc-card p-6" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(150, 50%, 45%)' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl font-serif">ו</span>
                <div>
                  <h4 className="font-heading text-lg text-foreground">Yetzirah (Formation)</h4>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">The World of Angels</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The world of emotional and formative energies, where the concepts of Beriah take on
                shape and pattern. Angels and spiritual forces operate here. Yetzirah is the realm
                of feeling, imagination, and the astral plane. The Sefer Yetzirah (Book of Formation)
                primarily describes this world&apos;s mechanisms. It corresponds to the soul-level
                of <strong className="text-foreground">Ruach</strong> (spirit) and the element of <strong className="text-foreground">Air</strong>.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Letter of YHVH:</strong> Vav (ו)</span>
                <span><strong className="text-foreground">Element:</strong> Air</span>
                <span><strong className="text-foreground">Soul Level:</strong> Ruach</span>
                <span><strong className="text-foreground">Sefirot:</strong> Chesed through Yesod</span>
              </div>
            </div>

            <div className="doc-card p-6" style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(30, 50%, 45%)' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl font-serif">ה</span>
                <div>
                  <h4 className="font-heading text-lg text-foreground">Assiah (Action)</h4>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">The World of Making</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The physical world of action, matter, and manifest reality. This is where we live,
                where spiritual forces become tangible events and objects. Assiah is not &quot;lower&quot; in a
                pejorative sense &mdash; it is the purpose of creation, the place where Tikkun happens,
                where the divine plan is actualized through human deeds. It corresponds to the
                soul-level of <strong className="text-foreground">Nefesh</strong> (animal soul) and the element
                of <strong className="text-foreground">Earth</strong>.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span><strong className="text-foreground">Letter of YHVH:</strong> He (ה) final</span>
                <span><strong className="text-foreground">Element:</strong> Earth</span>
                <span><strong className="text-foreground">Soul Level:</strong> Nefesh</span>
                <span><strong className="text-foreground">Sefirah:</strong> Malkhut</span>
              </div>
            </div>
          </div>

          <DocPullQuote
            quote="As above, so below; as below, so above. The wonders of the One are found in each world."
            author="Hermetic-Kabbalistic principle"
          />
        </DocSection>

        {/* ============================================================ */}
        {/* 22 Hebrew Letters */}
        {/* ============================================================ */}
        <DocSection id="gem-letters" title="The 22 Hebrew Letters: Vehicles of Creation">
          <p className="text-muted-foreground leading-relaxed mb-6">
            {gematriaDocs.hebrewAlphabet.introduction.trim()}
          </p>

          <p className="text-muted-foreground leading-relaxed mb-8">
            The Sefer Yetzirah classifies the 22 letters into three categories based on their
            elemental and astrological correspondences. These categories reflect the structure of
            creation itself: the three primordial elements, the seven celestial bodies visible to
            the ancient eye, and the twelve constellations of the zodiac.
          </p>

          {/* Three Mothers */}
          <h3 className="doc-h3">Three Mother Letters (Imot)</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            The three mothers represent the primordial elements from which all of physical creation
            emerges. They correspond to the three horizontal paths on the Tree of Life, bridging the
            pillars of Mercy and Severity.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-10">
            <div className="doc-card p-5 text-center">
              <span className="text-4xl font-serif block mb-2">א</span>
              <div className="font-heading text-foreground mb-1">Aleph</div>
              <div className="text-sm text-muted-foreground mb-2">Value: 1</div>
              <div className="inline-block px-3 py-1 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-medium mb-2">Air</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The silent letter. Divine breath, the mediator between fire and water. Represents unity and the origin of sound.
              </p>
            </div>
            <div className="doc-card p-5 text-center">
              <span className="text-4xl font-serif block mb-2">מ</span>
              <div className="font-heading text-foreground mb-1">Mem</div>
              <div className="text-sm text-muted-foreground mb-2">Value: 40</div>
              <div className="inline-block px-3 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium mb-2">Water</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The revealed and hidden. Transformation (40 days of flood, 40 years in desert). The womb of creation.
              </p>
            </div>
            <div className="doc-card p-5 text-center">
              <span className="text-4xl font-serif block mb-2">ש</span>
              <div className="font-heading text-foreground mb-1">Shin</div>
              <div className="text-sm text-muted-foreground mb-2">Value: 300</div>
              <div className="inline-block px-3 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium mb-2">Fire</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Three flames of the trinity. Divine fire, transformation, the Holy Spirit. Shin has three prongs representing three pillars.
              </p>
            </div>
          </div>

          {/* Seven Doubles */}
          <h3 className="doc-h3">Seven Double Letters (Kefulot)</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            The seven doubles each have two pronunciations (hard and soft), representing duality &mdash;
            the positive and negative expression of each planetary force. They correspond to the
            seven classical planets, the seven days of creation, and the seven vertical paths on the Tree.
          </p>
          <div className="doc-table-wrapper mb-10">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Letter</th>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Planet</th>
                  <th>Positive</th>
                  <th>Negative</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="text-2xl font-serif">ב</td><td>Bet</td><td>2</td><td>Saturn</td><td>Wisdom</td><td>Foolishness</td></tr>
                <tr><td className="text-2xl font-serif">ג</td><td>Gimel</td><td>3</td><td>Jupiter</td><td>Wealth</td><td>Poverty</td></tr>
                <tr><td className="text-2xl font-serif">ד</td><td>Dalet</td><td>4</td><td>Mars</td><td>Fertility</td><td>Desolation</td></tr>
                <tr><td className="text-2xl font-serif">כ</td><td>Kaf</td><td>20</td><td>Sun</td><td>Life</td><td>Death</td></tr>
                <tr><td className="text-2xl font-serif">פ</td><td>Pe</td><td>80</td><td>Venus</td><td>Power</td><td>Servitude</td></tr>
                <tr><td className="text-2xl font-serif">ר</td><td>Resh</td><td>200</td><td>Mercury</td><td>Peace</td><td>War</td></tr>
                <tr><td className="text-2xl font-serif">ת</td><td>Tav</td><td>400</td><td>Moon</td><td>Grace</td><td>Ugliness</td></tr>
              </tbody>
            </table>
          </div>

          {/* Twelve Simples */}
          <h3 className="doc-h3">Twelve Simple Letters (Peshutot)</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            The twelve simple letters correspond to the twelve zodiac signs, twelve months, and
            twelve diagonal paths on the Tree of Life. Each governs a fundamental human experience or sense.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
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
              <div key={item.name} className="doc-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-serif">{item.letter}</span>
                  <span className="text-lg font-heading text-primary">{item.value}</span>
                </div>
                <div className="text-sm font-medium text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.sign}</div>
                <div className="text-xs text-secondary mt-1">Sense: {item.sense}</div>
              </div>
            ))}
          </div>

          {/* Final Forms */}
          <h3 className="doc-h3">Final Letter Forms (Sofit)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Five letters change shape when they appear at the end of a word. In the Mispar Gadol
            system, these final forms carry higher values (500-900), extending the numerical
            range of the alphabet. Mystically, the final forms represent the hidden, transcendent
            dimension of each letter.
          </p>
          <div className="flex flex-wrap gap-3">
            {gematriaDocs.hebrewAlphabet.finalForms.map((item) => (
              <div key={item.name} className="px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-2xl font-serif mr-3">{item.letter}</span>
                <span className="text-sm text-muted-foreground">{item.name}</span>
                <span className="text-sm text-primary ml-2">= {item.value}</span>
              </div>
            ))}
          </div>
        </DocSection>

        {/* ============================================================ */}
        {/* Gematria Calculation Methods */}
        {/* ============================================================ */}
        <DocSection id="gem-methods" title="Gematria: The Science of Number">
          <p className="text-muted-foreground leading-relaxed mb-6">
            Gematria (from the Greek <em>geometria</em>, or possibly from the Hebrew <em>gimatria</em>)
            is the practice of calculating the numerical value of Hebrew words and phrases to discover
            hidden connections. When two words share the same numerical value, Kabbalists understand
            them as spiritually equivalent &mdash; different expressions of the same underlying reality.
          </p>

          <p className="text-muted-foreground leading-relaxed mb-8">
            There are numerous methods of gematria, each offering a different lens. The most important
            are detailed below, along with worked examples.
          </p>

          <div className="space-y-6 mb-8">
            {/* Standard */}
            <div className="doc-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-heading text-primary">1</span>
                <h4 className="font-heading text-lg text-foreground">Mispar Hechrachi (Standard Value)</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                The most common and fundamental method. Each letter carries its standard value:
                Aleph=1 through Tav=400. Final letters retain their standard values (e.g., final Mem = 40, not 600).
              </p>
              <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm text-muted-foreground mb-3">
                <div className="mb-2"><strong className="text-foreground">Example: שָׁלוֹם (Shalom, &quot;Peace&quot;)</strong></div>
                <div>Shin(300) + Lamed(30) + Vav(6) + Mem(40) = <strong className="text-foreground">376</strong></div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm text-muted-foreground">
                <div className="mb-2"><strong className="text-foreground">Example: אֱמֶת (Emet, &quot;Truth&quot;)</strong></div>
                <div>Aleph(1) + Mem(40) + Tav(400) = <strong className="text-foreground">441</strong></div>
                <div className="text-xs mt-1 text-muted-foreground/70">Note: 441 = 21 x 21, a perfect square of the value of the divine name Ehyeh (אהיה = 21)</div>
              </div>
            </div>

            {/* Gadol */}
            <div className="doc-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-heading text-primary">2</span>
                <h4 className="font-heading text-lg text-foreground">Mispar Gadol (Full / Great Value)</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Identical to standard except that the five final letter forms receive extended values:
                Kaf Sofit=500, Mem Sofit=600, Nun Sofit=700, Pe Sofit=800, Tsade Sofit=900.
                This reveals connections invisible to the standard method.
              </p>
              <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm text-muted-foreground">
                <div className="mb-2"><strong className="text-foreground">Example: שָׁלוֹם (Shalom) with final Mem</strong></div>
                <div>Shin(300) + Lamed(30) + Vav(6) + Mem Sofit(600) = <strong className="text-foreground">936</strong></div>
              </div>
            </div>

            {/* Katan */}
            <div className="doc-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-heading text-primary">3</span>
                <h4 className="font-heading text-lg text-foreground">Mispar Katan (Reduced / Small Value)</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Each letter is reduced to its single-digit root by removing zeros. So Yod (10) becomes 1,
                Kaf (20) becomes 2, Shin (300) becomes 3. This method reveals the essential, archetypal
                vibration of a word.
              </p>
              <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm text-muted-foreground mb-3">
                <div className="mb-2"><strong className="text-foreground">Example: שָׁלוֹם (Shalom)</strong></div>
                <div>Shin(3) + Lamed(3) + Vav(6) + Mem(4) = <strong className="text-foreground">16</strong> &rarr; 1+6 = <strong className="text-foreground">7</strong></div>
              </div>
              <div className="text-xs text-secondary">Seven is the number of completion, the Sabbath &mdash; peace leads to wholeness.</div>
            </div>

            {/* Siduri */}
            <div className="doc-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-heading text-primary">4</span>
                <h4 className="font-heading text-lg text-foreground">Mispar Siduri (Ordinal Value)</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Each letter is valued by its position in the alphabet: Aleph=1, Bet=2, ... Tav=22.
                This creates a simpler, more uniform scale that can reveal sequential and positional
                relationships between words.
              </p>
              <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm text-muted-foreground">
                <div className="mb-2"><strong className="text-foreground">Example: חַי (Chai, &quot;Life&quot;)</strong></div>
                <div>Chet(8th letter) + Yod(10th letter) = <strong className="text-foreground">18</strong></div>
                <div className="text-xs mt-1 text-muted-foreground/70">The same as the standard value, since both letters are in the first decade</div>
              </div>
            </div>

            {/* AtBash */}
            <div className="doc-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-heading text-primary">5</span>
                <h4 className="font-heading text-lg text-foreground">AtBash Cipher</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                A substitution cipher where the first letter (Aleph) swaps with the last (Tav),
                the second (Bet) with the second-to-last (Shin), and so on. This creates a mirror
                transformation &mdash; revealing the &quot;hidden face&quot; of a word. AtBash is used extensively
                in the Book of Jeremiah and in Kabbalistic meditation.
              </p>
              <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm text-muted-foreground">
                <div className="mb-2"><strong className="text-foreground">Key pairs:</strong></div>
                <div>א&harr;ת &nbsp; ב&harr;ש &nbsp; ג&harr;ר &nbsp; ד&harr;ק &nbsp; ה&harr;צ &nbsp; ו&harr;פ &nbsp; ז&harr;ע &nbsp; ח&harr;ס &nbsp; ט&harr;נ &nbsp; י&harr;מ &nbsp; כ&harr;ל</div>
              </div>
            </div>

            {/* Kolel */}
            <div className="doc-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-heading text-primary">6</span>
                <h4 className="font-heading text-lg text-foreground">Mispar Kolel (Integral Value)</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                The standard gematria value plus the number of letters in the word (or plus one for the
                word as a whole). This accounts for the &quot;body&quot; of the word itself as a discrete entity.
                It is often used to explain near-misses between words that differ by a small amount.
              </p>
              <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm text-muted-foreground">
                <div className="mb-2"><strong className="text-foreground">Example: שָׁלוֹם (Shalom)</strong></div>
                <div>Standard (376) + 4 letters = <strong className="text-foreground">380</strong></div>
              </div>
            </div>
          </div>

          <DocInfoBox variant="default" title="Why So Many Methods?">
            <p className="leading-relaxed">
              Each method of gematria is like a different frequency on a radio dial &mdash; it tunes into
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
          <p className="text-muted-foreground leading-relaxed mb-8">
            Certain numbers carry profound significance in the Kabbalistic tradition, appearing
            repeatedly across scripture, cosmology, and mystical practice. Understanding these
            numbers provides a foundation for interpreting gematria results.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {gematriaDocs.significantNumbers.numbers.map((item) => (
              <div
                key={item.value}
                className="doc-card p-5"
                style={{ borderLeftWidth: '4px', borderLeftColor: 'hsl(230, 50%, 50%)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-heading text-primary">{item.value}</span>
                  <span className="text-xl font-serif">{item.hebrew}</span>
                  <span className="text-sm text-secondary">{item.meaning}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.significance}</p>
              </div>
            ))}
          </div>

          <DocInfoBox variant="primary" title="The Number 137: Where Kabbalah Meets Physics">
            <p className="leading-relaxed">
              The word Kabbalah (קבלה) has a standard gematria value of 137. Remarkably, 1/137 is
              the fine-structure constant in physics &mdash; a dimensionless number that governs the
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
        <DocSection id="gem-practice" title="Practical Applications in OmnisX">
          <p className="text-muted-foreground leading-relaxed mb-8">
            OmnisX integrates Kabbalistic wisdom and gematria analysis into your personal profile,
            connecting these ancient tools with your other system readings. Here is how the
            calculations work in practice.
          </p>

          <h3 className="doc-h3">Name Analysis</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Your Hebrew name is your spiritual identifier &mdash; a numerical signature that connects
            you to cosmic patterns. OmnisX calculates your name across multiple gematria methods
            simultaneously, revealing layers of meaning.
          </p>

          <div className="doc-card p-6 mb-8">
            <h4 className="font-heading text-lg text-foreground mb-4">How to Calculate Your Name</h4>
            <div className="doc-steps">
              {gematriaDocs.practicalApplication.steps.map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                    {item.step}
                  </div>
                  <span className="text-sm text-muted-foreground pt-1">{item.instruction}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-lg bg-muted/30 border border-border mb-8">
            <h4 className="font-medium text-foreground mb-3">Worked Example: דָּוִד (David)</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="p-3 rounded-lg bg-background font-mono">
                <div><strong className="text-foreground">Standard:</strong> Dalet(4) + Vav(6) + Dalet(4) = <strong className="text-foreground">14</strong></div>
                <div><strong className="text-foreground">Ordinal:</strong> Dalet(4th) + Vav(6th) + Dalet(4th) = <strong className="text-foreground">14</strong></div>
                <div><strong className="text-foreground">Reduced:</strong> 4 + 6 + 4 = 14 &rarr; 1+4 = <strong className="text-foreground">5</strong></div>
              </div>
              <p className="leading-relaxed">
                David&apos;s name equals <strong className="text-foreground">14</strong>, the same as
                יד (<em>yad</em>, &quot;hand&quot;) and the same as אהב (<em>ahav</em>, &quot;loved&quot;).
                The digital root <strong className="text-foreground">5</strong> corresponds to the letter He (ה),
                representing divine breath, revelation, and the window through which God&apos;s presence enters
                the world. David was both &quot;the hand of God&quot; on earth and &quot;the beloved&quot; &mdash; both meanings
                encoded in his name&apos;s number.
              </p>
            </div>
          </div>

          <h3 className="doc-h3">Date Analysis</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Hebrew dates can also be calculated using gematria. Since Hebrew uses letters for
            numbers, every date is also a word &mdash; and that word has meaning. In traditional
            practice, spans of time carry their own signatures: weeks are linked to the Sefirot,
            months to their Hebrew letters. In OmnisX, the calendar side of your chart is carried
            by the time systems &mdash; Dreamspell, the Tzolkin, and the Long Count &mdash; while
            gematria does what it does best: reading the names.
          </p>

          <h3 className="doc-h3">Word Connection Discovery</h3>
          <p className="text-muted-foreground leading-relaxed mb-8">
            One of the most powerful features of gematria is discovering that two seemingly unrelated
            words share the same numerical value. OmnisX keeps a curated table of significant gematria
            values, so when your name&apos;s total lands on a notable number &mdash; a divine name, a
            foundational concept &mdash; the reading flags the connection. And because every person you
            chart is saved to your map, OmnisX can also compare names directly, surfacing matching
            values between you and the people in your life. These are not mere coincidences to the
            Kabbalist &mdash; they are threads in the tapestry of hidden meaning that connects all of
            reality.
          </p>

          <DocInfoBox variant="secondary" title="Hebrew Name Tip">
            <p className="leading-relaxed">
              If you have a Hebrew name, enter it in your OmnisX profile to see its gematria value and
              discover words and phrases that share your number. If you don&apos;t have a Hebrew name,
              you can transliterate your English name into Hebrew letters, though the connections
              may be less traditional. Consult a knowledgeable source for accurate transliteration &mdash;
              vowel choices in Hebrew significantly affect meaning.
            </p>
          </DocInfoBox>
        </DocSection>

        {/* ============================================================ */}
        {/* Integration with Other Systems */}
        {/* ============================================================ */}
        <DocSection id="gem-integration" title="Kabbalah & the Other Systems">
          <p className="text-muted-foreground leading-relaxed mb-6">
            Kabbalah does not exist in isolation. Its Tree of Life has been adopted and adapted by
            virtually every Western esoteric tradition, and its influence runs through several of the
            systems OmnisX brings together. Understanding these connections reveals a deeper unity
            beneath the surface diversity.
          </p>

          <h3 className="doc-h3">Kabbalah & Human Design</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The connection between Kabbalah and Human Design is not metaphorical &mdash; it is structural.
            The Human Design Bodygraph is built on four ancient systems, and the <strong className="text-foreground">Kabbalistic Tree
            of Life is one of them</strong>. The nine Centers of the Bodygraph correspond to the Sefirot, and
            the channels between them correspond to the 22 paths on the Tree.
          </p>

          <div className="doc-table-wrapper mb-8">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Sefirah</th>
                  <th>Human Design Center</th>
                  <th>Function</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Keter (Crown)</td><td>Head Center</td><td>Inspiration, mental pressure</td></tr>
                <tr><td>Chokhmah &amp; Binah</td><td>Ajna Center</td><td>Conceptualization, processing</td></tr>
                <tr><td>Da&apos;at (Knowledge)</td><td>Throat Center</td><td>Communication, manifestation</td></tr>
                <tr><td>Chesed &amp; Gevurah</td><td>G Center</td><td>Identity, direction, love</td></tr>
                <tr><td>Tiferet</td><td>Heart/Ego Center</td><td>Willpower, self-worth</td></tr>
                <tr><td>Netzach &amp; Hod</td><td>Solar Plexus / Spleen</td><td>Emotions, intuition, health</td></tr>
                <tr><td>Yesod</td><td>Sacral Center</td><td>Life force, sexuality, work energy</td></tr>
                <tr><td>Malkhut</td><td>Root Center</td><td>Adrenaline, drive, grounding</td></tr>
              </tbody>
            </table>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-8">
            When you study your defined and undefined Centers in Human Design, you are also studying
            your relationship to the Sefirot. A defined Sacral, for instance, means you have
            consistent access to the energy of Yesod &mdash; the foundation, the capacity to connect and
            transmit life force. An undefined Head Center means you are permeable to the inspirational
            pressure of Keter &mdash; the crown, divine will seeking to express through you.
          </p>

          <h3 className="doc-h3">Kabbalah & Astrology</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The relationship between Kabbalah and astrology is ancient. The Sefer Yetzirah explicitly
            assigns the seven classical planets to the seven double letters and the twelve zodiac signs
            to the twelve simple letters. The Sefirot also have planetary correspondences.
          </p>

          <div className="doc-table-wrapper mb-8">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Sefirah</th>
                  <th>Planet</th>
                  <th>Astrological Theme</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Binah</td><td>Saturn</td><td>Structure, limits, karma, time</td></tr>
                <tr><td>Chesed</td><td>Jupiter</td><td>Expansion, abundance, faith</td></tr>
                <tr><td>Gevurah</td><td>Mars</td><td>Will, action, conflict, courage</td></tr>
                <tr><td>Tiferet</td><td>Sun</td><td>Core self, vitality, consciousness</td></tr>
                <tr><td>Netzach</td><td>Venus</td><td>Love, beauty, desire, art</td></tr>
                <tr><td>Hod</td><td>Mercury</td><td>Mind, communication, analysis</td></tr>
                <tr><td>Yesod</td><td>Moon</td><td>Emotions, cycles, the unconscious</td></tr>
              </tbody>
            </table>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-8">
            This means that when you examine your natal chart&apos;s planetary placements, you are also
            seeing which Sefirot are activated in your life. A strong Jupiter placement activates
            Chesed (lovingkindness and expansion); a prominent Saturn activates Binah (understanding
            and structure). The astrological houses can be mapped onto the Tree as well, creating a
            rich multi-layered reading.
          </p>

          <h3 className="doc-h3">Kabbalah & Dreamspell</h3>
          <p className="text-muted-foreground leading-relaxed mb-8">
            While the Dreamspell system draws primarily from Mesoamerican traditions, several structural
            parallels with Kabbalah are worth noting. The 13 Galactic Tones can be mapped to the 10 Sefirot
            plus the 3 veils of Ein Sof (Ein, Ein Sof, Ein Sof Or). The 20 Solar Seals, combined with
            the 13 Tones to create 260 Kin, mirror the Kabbalistic principle that divine light (the Sefirot)
            expresses through vessels (letters/seals) to create the full spectrum of reality. Both systems
            understand the universe as an interplay of number and archetype &mdash; of quantity and quality united
            in a sacred mathematics.
          </p>

          <DocPullQuote
            quote="Know what is above you: an eye that sees, an ear that hears, and all your deeds are recorded in a book."
            author="Pirkei Avot 2:1"
          />
        </DocSection>

        {/* FAQ */}
        <DocSection id="gem-faq" title="Frequently Asked Questions">
          <div className="space-y-4">
            {gematriaFaqs.map((faq, i) => (
              <div key={i} className="doc-card p-5">
                <h4 className="font-heading text-lg text-foreground mb-2">{faq.question}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </DocSection>

        {/* ============================================================ */}
        {/* CTA */}
        {/* ============================================================ */}
        <section className="doc-card p-8 sm:p-10 text-center mt-16">
          <h3 className="text-2xl font-heading text-foreground mb-4">Explore Your Hebrew Name</h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Enter your Hebrew name in your profile to discover its gematria values, Sefirah correspondences,
            and connections to ancient wisdom.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-none bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Calculate Gematria
            </Link>
            <Link
              href="/learn/human-design"
              className="inline-flex items-center justify-center px-8 py-4 rounded-none border border-border hover:bg-muted/50 transition-colors"
            >
              Explore Human Design
            </Link>
          </div>
        </section>

        {/* Navigation */}
        <DocNav
          prev={{ href: '/learn/astrology', title: 'Astrology' }}
          next={{ href: '/learn/tzolkin', title: 'Traditional Tzolkin' }}
        />
      </DocLayout>

      <Footer />
    </div>
  )
}
