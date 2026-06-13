// Group Analysis Service for Omnis Phase 2.4
// Analyzes groups for distributions and compatibility

import type { GroupAnalysis, CompatibilityMatrix, CompatibilityMatrixEntry } from '../types/relationship'
import type { GroupWithMembers } from '../types/relationship'
import { dateToKin, kinToSeal, kinToTone } from '../calculations/dreamspell'
import { dateToTzolkin } from '../calculations/tzolkin'
import { getSeal } from '../data/seals'
import { getTone } from '../data/tones'
import { getTzolkinSign } from '../data/tzolkin-signs'
import { calculateFiveSystemCompatibility, getScoreColor } from './compatibility'

// ============================================================================
// TYPES
// ============================================================================

export interface GroupMemberAnalysis {
  id: string
  name: string
  hebrewName: string | null
  birthDate: string
  birthTime: string | null
  birthPlace: { lat?: number | null; lng?: number | null } | null
  dreamspell: {
    kin: number
    seal: number
    sealName: string
    sealNameHebrew: string
    tone: number
    toneName: string
    toneNameHebrew: string
    color: 'red' | 'white' | 'blue' | 'yellow'
  }
  tzolkin: {
    sign: number
    signName: string
    signNameHebrew: string
    tone: number
  }
}

export interface DistributionItem {
  value: number
  name: string
  nameHebrew: string
  count: number
  percentage: number
  members: Array<{ id: string; name: string }>
}

export interface ColorBalance {
  red: { count: number; percentage: number; members: Array<{ id: string; name: string }> }
  white: { count: number; percentage: number; members: Array<{ id: string; name: string }> }
  blue: { count: number; percentage: number; members: Array<{ id: string; name: string }> }
  yellow: { count: number; percentage: number; members: Array<{ id: string; name: string }> }
}

export interface FullGroupAnalysis {
  groupId: string
  groupName: string
  memberCount: number
  members: GroupMemberAnalysis[]
  dreamspell: {
    sealDistribution: DistributionItem[]
    toneDistribution: DistributionItem[]
    colorBalance: ColorBalance
  }
  tzolkin: {
    signDistribution: DistributionItem[]
    toneDistribution: DistributionItem[]
  }
  compatibility: {
    matrix: CompatibilityMatrixEntry[]
    averageScore: number
    highestPair: { person1: string; person2: string; score: number } | null
    lowestPair: { person1: string; person2: string; score: number } | null
  }
  insights: Array<{
    type: 'strength' | 'challenge' | 'pattern'
    english: string
    hebrew: string
  }>
}

// ============================================================================
// MEMBER ANALYSIS
// ============================================================================

export function analyzeGroupMember(member: {
  id: string
  name: string
  hebrew_name: string | null
  birth_date: string
  birth_time?: string | null
  birth_place?: { lat?: number | null; lng?: number | null } | null
}): GroupMemberAnalysis {
  const kin = dateToKin(member.birth_date)
  const seal = kinToSeal(kin)
  const tone = kinToTone(kin)
  const sealData = getSeal(seal)
  const toneData = getTone(tone)

  const tzolkinData = dateToTzolkin(member.birth_date)
  const tzolkinSignNumber = tzolkinData.daySign.number

  return {
    id: member.id,
    name: member.name,
    hebrewName: member.hebrew_name,
    birthDate: member.birth_date,
    birthTime: member.birth_time ?? null,
    birthPlace: member.birth_place ?? null,
    dreamspell: {
      kin,
      seal,
      sealName: sealData.english,
      sealNameHebrew: sealData.hebrew,
      tone,
      toneName: toneData.name,
      toneNameHebrew: toneData.nameHebrew,
      color: sealData.color,
    },
    tzolkin: {
      sign: tzolkinSignNumber,
      signName: tzolkinData.daySign.yucatec,
      signNameHebrew: tzolkinData.daySign.hebrew,
      tone: tzolkinData.tone,
    },
  }
}

// ============================================================================
// DISTRIBUTION CALCULATIONS
// ============================================================================

function calculateSealDistribution(members: GroupMemberAnalysis[]): DistributionItem[] {
  const sealCounts = new Map<number, Array<{ id: string; name: string }>>()

  for (const member of members) {
    const seal = member.dreamspell.seal
    if (!sealCounts.has(seal)) {
      sealCounts.set(seal, [])
    }
    sealCounts.get(seal)!.push({ id: member.id, name: member.hebrewName || member.name })
  }

  const distribution: DistributionItem[] = []
  for (let seal = 1; seal <= 20; seal++) {
    const sealMembers = sealCounts.get(seal) || []
    const sealData = getSeal(seal)
    distribution.push({
      value: seal,
      name: sealData.english,
      nameHebrew: sealData.hebrew,
      count: sealMembers.length,
      percentage: members.length > 0 ? (sealMembers.length / members.length) * 100 : 0,
      members: sealMembers,
    })
  }

  return distribution.sort((a, b) => b.count - a.count)
}

function calculateToneDistribution(members: GroupMemberAnalysis[], system: 'dreamspell' | 'tzolkin'): DistributionItem[] {
  const toneCounts = new Map<number, Array<{ id: string; name: string }>>()

  for (const member of members) {
    const tone = system === 'dreamspell' ? member.dreamspell.tone : member.tzolkin.tone
    if (!toneCounts.has(tone)) {
      toneCounts.set(tone, [])
    }
    toneCounts.get(tone)!.push({ id: member.id, name: member.hebrewName || member.name })
  }

  const distribution: DistributionItem[] = []
  for (let tone = 1; tone <= 13; tone++) {
    const toneMembers = toneCounts.get(tone) || []
    const toneData = getTone(tone)
    distribution.push({
      value: tone,
      name: toneData.name,
      nameHebrew: toneData.nameHebrew,
      count: toneMembers.length,
      percentage: members.length > 0 ? (toneMembers.length / members.length) * 100 : 0,
      members: toneMembers,
    })
  }

  return distribution.sort((a, b) => b.count - a.count)
}

function calculateTzolkinSignDistribution(members: GroupMemberAnalysis[]): DistributionItem[] {
  const signCounts = new Map<number, Array<{ id: string; name: string }>>()

  for (const member of members) {
    const sign = member.tzolkin.sign
    if (!signCounts.has(sign)) {
      signCounts.set(sign, [])
    }
    signCounts.get(sign)!.push({ id: member.id, name: member.hebrewName || member.name })
  }

  const distribution: DistributionItem[] = []
  for (let sign = 1; sign <= 20; sign++) {
    const signMembers = signCounts.get(sign) || []
    const signData = getTzolkinSign(sign)
    distribution.push({
      value: sign,
      name: signData.yucatec,
      nameHebrew: signData.hebrew,
      count: signMembers.length,
      percentage: members.length > 0 ? (signMembers.length / members.length) * 100 : 0,
      members: signMembers,
    })
  }

  return distribution.sort((a, b) => b.count - a.count)
}

function calculateColorBalance(members: GroupMemberAnalysis[]): ColorBalance {
  const colorGroups: Record<'red' | 'white' | 'blue' | 'yellow', Array<{ id: string; name: string }>> = {
    red: [],
    white: [],
    blue: [],
    yellow: [],
  }

  for (const member of members) {
    const color = member.dreamspell.color
    colorGroups[color].push({ id: member.id, name: member.hebrewName || member.name })
  }

  const total = members.length || 1

  return {
    red: {
      count: colorGroups.red.length,
      percentage: (colorGroups.red.length / total) * 100,
      members: colorGroups.red,
    },
    white: {
      count: colorGroups.white.length,
      percentage: (colorGroups.white.length / total) * 100,
      members: colorGroups.white,
    },
    blue: {
      count: colorGroups.blue.length,
      percentage: (colorGroups.blue.length / total) * 100,
      members: colorGroups.blue,
    },
    yellow: {
      count: colorGroups.yellow.length,
      percentage: (colorGroups.yellow.length / total) * 100,
      members: colorGroups.yellow,
    },
  }
}

// ============================================================================
// COMPATIBILITY MATRIX
// ============================================================================

function calculateCompatibilityMatrix(members: GroupMemberAnalysis[]): {
  matrix: CompatibilityMatrixEntry[]
  averageScore: number
  highestPair: { person1: string; person2: string; score: number } | null
  lowestPair: { person1: string; person2: string; score: number } | null
} {
  const matrix: CompatibilityMatrixEntry[] = []
  let totalScore = 0
  let pairCount = 0
  let highestPair: { person1: string; person2: string; score: number } | null = null
  let lowestPair: { person1: string; person2: string; score: number } | null = null

  // Calculate pairwise compatibility
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const p1 = members[i]
      const p2 = members[j]

      const compatibility = calculateFiveSystemCompatibility(
        {
          birthDate: p1.birthDate,
          birthTime: p1.birthTime,
          birthPlace: p1.birthPlace,
          hebrewName: p1.hebrewName,
          name: p1.name,
        },
        {
          birthDate: p2.birthDate,
          birthTime: p2.birthTime,
          birthPlace: p2.birthPlace,
          hebrewName: p2.hebrewName,
          name: p2.name,
        }
      )

      const entry: CompatibilityMatrixEntry = {
        person1Id: p1.id,
        person2Id: p2.id,
        score: compatibility.overallScore,
        // Aspects summarize which systems contributed to this pair's score.
        aspects: compatibility.availableSystems,
      }

      matrix.push(entry)
      totalScore += compatibility.overallScore
      pairCount++

      // Track highest and lowest
      if (!highestPair || compatibility.overallScore > highestPair.score) {
        highestPair = {
          person1: p1.hebrewName || p1.name,
          person2: p2.hebrewName || p2.name,
          score: compatibility.overallScore,
        }
      }
      if (!lowestPair || compatibility.overallScore < lowestPair.score) {
        lowestPair = {
          person1: p1.hebrewName || p1.name,
          person2: p2.hebrewName || p2.name,
          score: compatibility.overallScore,
        }
      }
    }
  }

  return {
    matrix,
    averageScore: pairCount > 0 ? Math.round(totalScore / pairCount) : 0,
    highestPair,
    lowestPair,
  }
}

// ============================================================================
// INSIGHTS GENERATION
// ============================================================================

function generateInsights(
  members: GroupMemberAnalysis[],
  colorBalance: ColorBalance,
  sealDistribution: DistributionItem[],
  compatibility: { averageScore: number; highestPair: { person1: string; person2: string; score: number } | null }
): Array<{ type: 'strength' | 'challenge' | 'pattern'; english: string; hebrew: string }> {
  const insights: Array<{ type: 'strength' | 'challenge' | 'pattern'; english: string; hebrew: string }> = []

  // Color balance insights
  const colors = ['red', 'white', 'blue', 'yellow'] as const
  const colorCounts = colors.map(c => ({ color: c, count: colorBalance[c].count }))
  const maxColor = colorCounts.reduce((max, c) => c.count > max.count ? c : max, colorCounts[0])
  const minColor = colorCounts.reduce((min, c) => c.count < min.count ? c : min, colorCounts[0])

  const colorNames: Record<string, { english: string; hebrew: string }> = {
    red: { english: 'Red (Initiating)', hebrew: 'אדום (יוזם)' },
    white: { english: 'White (Refining)', hebrew: 'לבן (מזקק)' },
    blue: { english: 'Blue (Transforming)', hebrew: 'כחול (משנה)' },
    yellow: { english: 'Yellow (Ripening)', hebrew: 'צהוב (מבשיל)' },
  }

  if (maxColor.count > members.length / 2) {
    insights.push({
      type: 'strength',
      english: `Strong ${colorNames[maxColor.color].english} energy - ${maxColor.count} of ${members.length} members share this direction.`,
      hebrew: `אנרגיית ${colorNames[maxColor.color].hebrew} חזקה - ${maxColor.count} מתוך ${members.length} חברים חולקים כיוון זה.`,
    })
  }

  if (minColor.count === 0) {
    insights.push({
      type: 'challenge',
      english: `Missing ${colorNames[minColor.color].english} energy - consider how to bring this perspective into the group.`,
      hebrew: `חסרה אנרגיית ${colorNames[minColor.color].hebrew} - שקלו כיצד להכניס פרספקטיבה זו לקבוצה.`,
    })
  }

  // Seal concentration
  const topSeal = sealDistribution[0]
  if (topSeal && topSeal.count >= 2 && topSeal.count > members.length / 3) {
    insights.push({
      type: 'pattern',
      english: `${topSeal.name} seal appears ${topSeal.count} times - strong ${topSeal.name} archetype presence.`,
      hebrew: `חותם ${topSeal.nameHebrew} מופיע ${topSeal.count} פעמים - נוכחות ארכיטיפ ${topSeal.nameHebrew} חזקה.`,
    })
  }

  // Compatibility insights
  if (compatibility.averageScore >= 70) {
    insights.push({
      type: 'strength',
      english: `High group harmony - average compatibility score of ${compatibility.averageScore}%.`,
      hebrew: `הרמוניה גבוהה בקבוצה - ציון תאימות ממוצע של ${compatibility.averageScore}%.`,
    })
  } else if (compatibility.averageScore < 40) {
    insights.push({
      type: 'challenge',
      english: `Diverse energies - average compatibility of ${compatibility.averageScore}% suggests opportunity for growth through differences.`,
      hebrew: `אנרגיות מגוונות - תאימות ממוצעת של ${compatibility.averageScore}% מציעה הזדמנות לצמיחה דרך שונות.`,
    })
  }

  if (compatibility.highestPair && compatibility.highestPair.score >= 80) {
    insights.push({
      type: 'strength',
      english: `${compatibility.highestPair.person1} and ${compatibility.highestPair.person2} have the strongest resonance (${compatibility.highestPair.score}%).`,
      hebrew: `ל${compatibility.highestPair.person1} ו${compatibility.highestPair.person2} יש את התהודה החזקה ביותר (${compatibility.highestPair.score}%).`,
    })
  }

  return insights
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function analyzeGroup(group: GroupWithMembers): FullGroupAnalysis {
  // Analyze all members
  const members = group.members.map(m => analyzeGroupMember(m))

  // Calculate distributions
  const sealDistribution = calculateSealDistribution(members)
  const dreamspellToneDistribution = calculateToneDistribution(members, 'dreamspell')
  const tzolkinSignDistribution = calculateTzolkinSignDistribution(members)
  const tzolkinToneDistribution = calculateToneDistribution(members, 'tzolkin')
  const colorBalance = calculateColorBalance(members)

  // Calculate compatibility matrix
  const compatibility = calculateCompatibilityMatrix(members)

  // Generate insights
  const insights = generateInsights(members, colorBalance, sealDistribution, compatibility)

  return {
    groupId: group.id,
    groupName: group.name,
    memberCount: members.length,
    members,
    dreamspell: {
      sealDistribution,
      toneDistribution: dreamspellToneDistribution,
      colorBalance,
    },
    tzolkin: {
      signDistribution: tzolkinSignDistribution,
      toneDistribution: tzolkinToneDistribution,
    },
    compatibility,
    insights,
  }
}

// ============================================================================
// HELPER EXPORTS
// ============================================================================

export { getScoreColor }
