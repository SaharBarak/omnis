'use client'

/**
 * Cross-System Insights Component
 *
 * Analyzes correlations and themes across multiple symbolic systems:
 * - Dreamspell, Tzolkin, Long Count, Astrology, Human Design, Gematria
 *
 * Highlights patterns that appear across systems, revealing deeper
 * archetypal themes and connections.
 */

import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// =============================================================================
// TYPES
// =============================================================================

export interface CrossSystemInsightsProps {
  /** Dreamspell data */
  dreamspell?: {
    kin: number
    seal: number
    tone: number
    sealName?: string
    toneName?: string
    earthFamily?: string
    colorFamily?: string
  } | null
  /** Astrology data */
  astrology?: {
    sunSign: string
    moonSign?: string | null
    risingSign?: string | null
    dominantElement?: string
    dominantModality?: string
  } | null
  /** Human Design data */
  humanDesign?: {
    type: string
    strategy?: string
    authority?: string
    profile?: string | null
    definedCenters?: string[]
  } | null
  /** Gematria data */
  gematria?: {
    standardValue: number
    digitalRoot: number
    letterCount: number
  } | null
  /** Long Count data */
  longCount?: {
    baktun: number
    katun: number
    tun: number
    daysSinceCreation: number
  } | null
  className?: string
}

export interface InsightTheme {
  id: string
  title: string
  description: string
  systems: string[]
  strength: 'strong' | 'moderate' | 'subtle'
  color: string
}

// =============================================================================
// CORRELATION ANALYSIS
// =============================================================================

/**
 * Map Dreamspell seal colors to their elemental correspondence
 */
const SEAL_COLOR_TO_ELEMENT: Record<string, string> = {
  red: 'fire',
  white: 'air',
  blue: 'water',
  yellow: 'earth',
}

/**
 * Map astrology signs to elements
 */
const SIGN_TO_ELEMENT: Record<string, string> = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
}

/**
 * Digital root interpretations
 */
const DIGITAL_ROOT_MEANINGS: Record<number, string> = {
  1: 'Unity and Leadership',
  2: 'Partnership and Balance',
  3: 'Creativity and Expression',
  4: 'Structure and Foundation',
  5: 'Freedom and Change',
  6: 'Harmony and Responsibility',
  7: 'Wisdom and Introspection',
  8: 'Power and Abundance',
  9: 'Completion and Compassion',
}

/**
 * Analyze correlations between systems and identify themes
 */
function analyzeCorrelations(props: CrossSystemInsightsProps): InsightTheme[] {
  const themes: InsightTheme[] = []
  const { dreamspell, astrology, humanDesign, gematria, longCount } = props

  // 1. Elemental correlation between Dreamspell color and Astrology element
  if (dreamspell?.colorFamily && astrology?.dominantElement) {
    const sealElement = SEAL_COLOR_TO_ELEMENT[dreamspell.colorFamily]
    const astroElement = astrology.dominantElement.toLowerCase()

    if (sealElement && astroElement && sealElement === astroElement) {
      themes.push({
        id: 'elemental-alignment',
        title: 'Elemental Alignment',
        description: `Both Dreamspell (${dreamspell.colorFamily}) and Astrology (${astrology.dominantElement}) point to ${sealElement} energy.`,
        systems: ['Dreamspell', 'Astrology'],
        strength: 'strong',
        color: getElementColor(sealElement),
      })
    }
  }

  // 2. Sun sign element matches Dreamspell color element
  if (dreamspell?.colorFamily && astrology?.sunSign) {
    const sealElement = SEAL_COLOR_TO_ELEMENT[dreamspell.colorFamily]
    const sunElement = SIGN_TO_ELEMENT[astrology.sunSign.toLowerCase()]

    if (sealElement && sunElement && sealElement === sunElement) {
      themes.push({
        id: 'sun-seal-harmony',
        title: 'Sun-Seal Harmony',
        description: `Your Sun sign and Dreamspell seal share the ${sealElement} element.`,
        systems: ['Dreamspell', 'Astrology'],
        strength: 'moderate',
        color: getElementColor(sealElement),
      })
    }
  }

  // 3. Tone-Type correlation (initiating tones + manifestor, etc.)
  if (dreamspell?.tone && humanDesign?.type) {
    const hdTypeKey = humanDesign.type.toLowerCase().replace(/\s+/g, '-')

    // Check for correlations
    const isInitiator = (dreamspell.tone === 1 || dreamspell.tone === 5 || dreamspell.tone === 9) &&
                       (hdTypeKey === 'manifestor' || hdTypeKey === 'manifesting-generator')
    const isResponder = (dreamspell.tone === 2 || dreamspell.tone === 6 || dreamspell.tone === 10) &&
                       (hdTypeKey === 'generator' || hdTypeKey === 'manifesting-generator')
    const isGuide = (dreamspell.tone === 3 || dreamspell.tone === 7 || dreamspell.tone === 11) &&
                   hdTypeKey === 'projector'
    const isReflective = (dreamspell.tone === 4 || dreamspell.tone === 8 || dreamspell.tone === 12 || dreamspell.tone === 13) &&
                        hdTypeKey === 'reflector'

    if (isInitiator || isResponder || isGuide || isReflective) {
      themes.push({
        id: 'energy-pattern-match',
        title: 'Energy Pattern Match',
        description: `Your Dreamspell tone (${dreamspell.tone}) resonates with your Human Design type (${humanDesign.type}).`,
        systems: ['Dreamspell', 'Human Design'],
        strength: 'moderate',
        color: 'purple',
      })
    }
  }

  // 4. Numeric patterns - Kin digital root matches Gematria digital root
  if (dreamspell?.kin && gematria?.digitalRoot) {
    const kinDigitalRoot = calculateDigitalRoot(dreamspell.kin)

    if (kinDigitalRoot === gematria.digitalRoot) {
      const rootMeaning = DIGITAL_ROOT_MEANINGS[kinDigitalRoot]
      themes.push({
        id: 'numeric-resonance',
        title: 'Numeric Resonance',
        description: `Your Kin (${dreamspell.kin}) and name share the digital root ${kinDigitalRoot}: ${rootMeaning || ''}.`,
        systems: ['Dreamspell', 'Gematria'],
        strength: 'strong',
        color: 'amber',
      })
    }
  }

  // 5. Letter count and tone resonance
  if (gematria?.letterCount && dreamspell?.tone) {
    const letterDigitalRoot = calculateDigitalRoot(gematria.letterCount)
    const toneDigitalRoot = calculateDigitalRoot(dreamspell.tone)

    if (letterDigitalRoot === toneDigitalRoot) {
      themes.push({
        id: 'name-tone-link',
        title: 'Name-Tone Link',
        description: `The letters in your name (${gematria.letterCount}) relate to your tone (${dreamspell.tone}).`,
        systems: ['Dreamspell', 'Gematria'],
        strength: 'subtle',
        color: 'teal',
      })
    }
  }

  // 6. Long Count era themes
  if (longCount?.baktun) {
    // We're in Baktun 13 (the current era)
    if (longCount.baktun === 13) {
      themes.push({
        id: 'transformation-era',
        title: 'Era of Transformation',
        description: 'You were born in the 13th Baktun, an era of profound transformation and completion.',
        systems: ['Long Count'],
        strength: 'moderate',
        color: 'indigo',
      })
    }
  }

  // 7. Earth Family and Human Design centers correlation
  if (dreamspell?.earthFamily && humanDesign?.definedCenters) {
    const earthFamilyChakra = getEarthFamilyChakra(dreamspell.earthFamily)
    const definedCentersSet = new Set(humanDesign.definedCenters.map(c => c.toLowerCase()))

    // Map chakras to HD centers
    const chakraToCenters: Record<string, string[]> = {
      crown: ['head', 'ajna'],
      throat: ['throat'],
      heart: ['heart', 'g'],
      'solar-plexus': ['solar-plexus'],
      sacral: ['sacral'],
      root: ['root'],
    }

    const relatedCenters = chakraToCenters[earthFamilyChakra] || []
    const hasRelatedCenter = relatedCenters.some(c => definedCentersSet.has(c))

    if (hasRelatedCenter) {
      themes.push({
        id: 'chakra-center-alignment',
        title: 'Chakra-Center Alignment',
        description: `Your ${dreamspell.earthFamily} Earth Family chakra aligns with your defined Human Design centers.`,
        systems: ['Dreamspell', 'Human Design'],
        strength: 'moderate',
        color: 'green',
      })
    }
  }

  return themes
}

/**
 * Calculate digital root of a number
 */
function calculateDigitalRoot(n: number): number {
  if (n === 0) return 0
  const absN = Math.abs(n)
  return 1 + ((absN - 1) % 9)
}

/**
 * Get color class for an element
 */
function getElementColor(element: string): string {
  switch (element) {
    case 'fire': return 'red'
    case 'earth': return 'amber'
    case 'air': return 'cyan'
    case 'water': return 'blue'
    default: return 'gray'
  }
}

/**
 * Get chakra for Earth Family
 */
function getEarthFamilyChakra(family: string): string {
  switch (family.toLowerCase()) {
    case 'polar': return 'crown'
    case 'cardinal': return 'throat'
    case 'core': return 'heart'
    case 'signal': return 'solar-plexus'
    case 'gateway': return 'root'
    default: return ''
  }
}

// =============================================================================
// DISPLAY COMPONENTS
// =============================================================================

/**
 * Single insight card
 */
function InsightCard({ theme }: { theme: InsightTheme }) {
  const strengthColors = {
    strong: 'bg-green-500/20 text-green-700 dark:text-green-300',
    moderate: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    subtle: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  }

  const strengthLabels = {
    strong: 'Strong',
    moderate: 'Moderate',
    subtle: 'Subtle',
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: `var(--${theme.color}-500, hsl(var(--primary)))` }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{theme.title}</CardTitle>
          <Badge variant="secondary" className={cn('text-xs', strengthColors[theme.strength])}>
            {strengthLabels[theme.strength]}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {theme.systems.join(' • ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{theme.description}</p>
      </CardContent>
    </Card>
  )
}

/**
 * System summary mini badges
 */
function SystemSummary({ props }: { props: CrossSystemInsightsProps }) {
  const { dreamspell, astrology, humanDesign, gematria } = props

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {dreamspell && (
        <Badge variant="outline" className="text-xs">
          Kin {dreamspell.kin} • Tone {dreamspell.tone}
        </Badge>
      )}
      {astrology && (
        <Badge variant="outline" className="text-xs">
          {astrology.sunSign}
        </Badge>
      )}
      {humanDesign && (
        <Badge variant="outline" className="text-xs">
          {humanDesign.type}
        </Badge>
      )}
      {gematria && (
        <Badge variant="outline" className="text-xs">
          Gematria {gematria.standardValue}
        </Badge>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Cross-System Insights Display
 *
 * Analyzes and displays correlations between multiple symbolic systems.
 */
export function CrossSystemInsights(props: CrossSystemInsightsProps) {
  const { className } = props
  const themes = analyzeCorrelations(props)

  if (themes.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground py-6', className)}>
        <p>Not enough data to display cross-system insights.</p>
        <p className="text-xs mt-1">Add more information (birth time, Hebrew name) for additional insights.</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <SystemSummary props={props} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themes.map((theme) => (
          <InsightCard key={theme.id} theme={theme} />
        ))}
      </div>

      {themes.length > 0 && (
        <p className="text-xs text-center text-muted-foreground mt-4">
          Found {themes.length} connections between different systems
        </p>
      )}
    </div>
  )
}

/**
 * Mini version for compact display
 */
export function CrossSystemInsightsMini(props: CrossSystemInsightsProps) {
  const themes = analyzeCorrelations(props)
  const strongThemes = themes.filter(t => t.strength === 'strong')

  if (strongThemes.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1">
      {strongThemes.slice(0, 3).map((theme) => (
        <Badge key={theme.id} variant="secondary" className="text-xs">
          {theme.title}
        </Badge>
      ))}
    </div>
  )
}
