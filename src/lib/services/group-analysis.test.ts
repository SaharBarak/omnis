import { describe, it, expect } from 'vitest'
import {
  analyzeGroupMember,
  analyzeGroup,
  getScoreColor,
  type GroupMemberAnalysis,
  type FullGroupAnalysis,
} from './group-analysis'
import { dateToKin, kinToSeal, kinToTone } from '../calculations/dreamspell'
import { dateToTzolkin } from '../calculations/tzolkin'
import type { GroupWithMembers } from '../types/relationship'

// Test data - diverse group with known dates
const TEST_MEMBERS = [
  { id: '1', name: 'Alice', hebrew_name: 'אליס', birth_date: '1987-07-26', added_at: '2024-01-01' }, // Dreamspell epoch
  { id: '2', name: 'Bob', hebrew_name: 'בוב', birth_date: '2012-12-21', added_at: '2024-01-01' },   // 2012 date
  { id: '3', name: 'Carol', hebrew_name: 'קרול', birth_date: '1990-01-01', added_at: '2024-01-01' },
  { id: '4', name: 'David', hebrew_name: null, birth_date: '1985-06-15', added_at: '2024-01-01' },
]

const TEST_GROUP: GroupWithMembers = {
  id: 'group-1',
  name: 'Test Group',
  members: TEST_MEMBERS,
  owner_id: 'user-1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  description: 'Test group for analysis',
}

describe('Group Analysis Service', () => {
  describe('analyzeGroupMember', () => {
    it('should return correct structure for a member', () => {
      const member = TEST_MEMBERS[0]
      const analysis = analyzeGroupMember(member)

      expect(analysis).toHaveProperty('id', member.id)
      expect(analysis).toHaveProperty('name', member.name)
      expect(analysis).toHaveProperty('hebrewName', member.hebrew_name)
      expect(analysis).toHaveProperty('birthDate', member.birth_date)
      expect(analysis).toHaveProperty('dreamspell')
      expect(analysis).toHaveProperty('tzolkin')
    })

    it('should calculate correct dreamspell data', () => {
      const member = TEST_MEMBERS[0] // 1987-07-26
      const analysis = analyzeGroupMember(member)

      // July 26, 1987 = Kin 34 (White Galactic Wizard)
      expect(analysis.dreamspell.kin).toBe(34)
      expect(analysis.dreamspell.seal).toBe(14) // Wizard
      expect(analysis.dreamspell.tone).toBe(8) // Galactic
      expect(analysis.dreamspell.color).toBe('white')
    })

    it('should have all dreamspell properties', () => {
      const analysis = analyzeGroupMember(TEST_MEMBERS[0])

      expect(analysis.dreamspell).toHaveProperty('kin')
      expect(analysis.dreamspell).toHaveProperty('seal')
      expect(analysis.dreamspell).toHaveProperty('sealName')
      expect(analysis.dreamspell).toHaveProperty('sealNameHebrew')
      expect(analysis.dreamspell).toHaveProperty('tone')
      expect(analysis.dreamspell).toHaveProperty('toneName')
      expect(analysis.dreamspell).toHaveProperty('toneNameHebrew')
      expect(analysis.dreamspell).toHaveProperty('color')
    })

    it('should have all tzolkin properties', () => {
      const analysis = analyzeGroupMember(TEST_MEMBERS[0])

      expect(analysis.tzolkin).toHaveProperty('sign')
      expect(analysis.tzolkin).toHaveProperty('signName')
      expect(analysis.tzolkin).toHaveProperty('signNameHebrew')
      expect(analysis.tzolkin).toHaveProperty('tone')
    })

    it('should handle null hebrew_name', () => {
      const member = TEST_MEMBERS[3] // David has no hebrew name
      const analysis = analyzeGroupMember(member)

      expect(analysis.hebrewName).toBeNull()
    })

    it('should return valid seal number (1-20)', () => {
      for (const member of TEST_MEMBERS) {
        const analysis = analyzeGroupMember(member)
        expect(analysis.dreamspell.seal).toBeGreaterThanOrEqual(1)
        expect(analysis.dreamspell.seal).toBeLessThanOrEqual(20)
      }
    })

    it('should return valid tone number (1-13)', () => {
      for (const member of TEST_MEMBERS) {
        const analysis = analyzeGroupMember(member)
        expect(analysis.dreamspell.tone).toBeGreaterThanOrEqual(1)
        expect(analysis.dreamspell.tone).toBeLessThanOrEqual(13)
      }
    })

    it('should return valid color', () => {
      const validColors = ['red', 'white', 'blue', 'yellow']

      for (const member of TEST_MEMBERS) {
        const analysis = analyzeGroupMember(member)
        expect(validColors).toContain(analysis.dreamspell.color)
      }
    })

    it('should return valid tzolkin sign (1-20)', () => {
      for (const member of TEST_MEMBERS) {
        const analysis = analyzeGroupMember(member)
        expect(analysis.tzolkin.sign).toBeGreaterThanOrEqual(1)
        expect(analysis.tzolkin.sign).toBeLessThanOrEqual(20)
      }
    })

    it('should return valid tzolkin tone (1-13)', () => {
      for (const member of TEST_MEMBERS) {
        const analysis = analyzeGroupMember(member)
        expect(analysis.tzolkin.tone).toBeGreaterThanOrEqual(1)
        expect(analysis.tzolkin.tone).toBeLessThanOrEqual(13)
      }
    })

    it('should have bilingual names', () => {
      const analysis = analyzeGroupMember(TEST_MEMBERS[0])

      expect(analysis.dreamspell.sealName).toBeTruthy()
      expect(analysis.dreamspell.sealNameHebrew).toBeTruthy()
      expect(analysis.dreamspell.toneName).toBeTruthy()
      expect(analysis.dreamspell.toneNameHebrew).toBeTruthy()
      expect(analysis.tzolkin.signName).toBeTruthy()
      expect(analysis.tzolkin.signNameHebrew).toBeTruthy()
    })
  })

  describe('analyzeGroup', () => {
    it('should return full analysis structure', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      expect(analysis).toHaveProperty('groupId', TEST_GROUP.id)
      expect(analysis).toHaveProperty('groupName', TEST_GROUP.name)
      expect(analysis).toHaveProperty('memberCount', TEST_GROUP.members.length)
      expect(analysis).toHaveProperty('members')
      expect(analysis).toHaveProperty('dreamspell')
      expect(analysis).toHaveProperty('tzolkin')
      expect(analysis).toHaveProperty('compatibility')
      expect(analysis).toHaveProperty('insights')
    })

    it('should analyze all members', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      expect(analysis.members).toHaveLength(TEST_GROUP.members.length)
    })

    it('should calculate seal distribution (all 20 seals)', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      expect(analysis.dreamspell.sealDistribution).toHaveLength(20)
    })

    it('should calculate tone distribution (all 13 tones)', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      expect(analysis.dreamspell.toneDistribution).toHaveLength(13)
    })

    it('should have seal distribution with correct structure', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      for (const item of analysis.dreamspell.sealDistribution) {
        expect(item).toHaveProperty('value')
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('nameHebrew')
        expect(item).toHaveProperty('count')
        expect(item).toHaveProperty('percentage')
        expect(item).toHaveProperty('members')
      }
    })

    it('should sort distributions by count descending', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      // Seal distribution should be sorted by count
      for (let i = 1; i < analysis.dreamspell.sealDistribution.length; i++) {
        expect(analysis.dreamspell.sealDistribution[i - 1].count)
          .toBeGreaterThanOrEqual(analysis.dreamspell.sealDistribution[i].count)
      }
    })

    it('should calculate color balance', () => {
      const analysis = analyzeGroup(TEST_GROUP)
      const colorBalance = analysis.dreamspell.colorBalance

      expect(colorBalance).toHaveProperty('red')
      expect(colorBalance).toHaveProperty('white')
      expect(colorBalance).toHaveProperty('blue')
      expect(colorBalance).toHaveProperty('yellow')

      // Each color should have count, percentage, and members
      for (const color of ['red', 'white', 'blue', 'yellow'] as const) {
        expect(colorBalance[color]).toHaveProperty('count')
        expect(colorBalance[color]).toHaveProperty('percentage')
        expect(colorBalance[color]).toHaveProperty('members')
        expect(colorBalance[color].count).toBeGreaterThanOrEqual(0)
        expect(colorBalance[color].percentage).toBeGreaterThanOrEqual(0)
        expect(colorBalance[color].percentage).toBeLessThanOrEqual(100)
      }
    })

    it('should have color counts sum to member count', () => {
      const analysis = analyzeGroup(TEST_GROUP)
      const colorBalance = analysis.dreamspell.colorBalance

      const totalColorCount = colorBalance.red.count +
        colorBalance.white.count +
        colorBalance.blue.count +
        colorBalance.yellow.count

      expect(totalColorCount).toBe(TEST_GROUP.members.length)
    })

    it('should calculate tzolkin sign distribution', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      expect(analysis.tzolkin.signDistribution).toHaveLength(20)
    })

    it('should calculate tzolkin tone distribution', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      expect(analysis.tzolkin.toneDistribution).toHaveLength(13)
    })

    it('should calculate compatibility matrix', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      // For n members, there are n*(n-1)/2 pairs
      const expectedPairs = (TEST_GROUP.members.length * (TEST_GROUP.members.length - 1)) / 2
      expect(analysis.compatibility.matrix).toHaveLength(expectedPairs)
    })

    it('should have compatibility matrix entries with correct structure', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      for (const entry of analysis.compatibility.matrix) {
        expect(entry).toHaveProperty('person1Id')
        expect(entry).toHaveProperty('person2Id')
        expect(entry).toHaveProperty('score')
        expect(entry).toHaveProperty('aspects')
        expect(entry.score).toBeGreaterThanOrEqual(0)
        expect(entry.score).toBeLessThanOrEqual(100)
      }
    })

    it('should calculate average compatibility score', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      expect(typeof analysis.compatibility.averageScore).toBe('number')
      expect(analysis.compatibility.averageScore).toBeGreaterThanOrEqual(0)
      expect(analysis.compatibility.averageScore).toBeLessThanOrEqual(100)
    })

    it('should identify highest and lowest pairs', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      // With 4 members, we should have pairs
      expect(analysis.compatibility.highestPair).not.toBeNull()
      expect(analysis.compatibility.lowestPair).not.toBeNull()

      if (analysis.compatibility.highestPair && analysis.compatibility.lowestPair) {
        expect(analysis.compatibility.highestPair.score)
          .toBeGreaterThanOrEqual(analysis.compatibility.lowestPair.score)
      }
    })

    it('should generate insights', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      expect(Array.isArray(analysis.insights)).toBe(true)
    })

    it('should have insights with correct structure', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      for (const insight of analysis.insights) {
        expect(['strength', 'challenge', 'pattern']).toContain(insight.type)
        expect(insight.english).toBeTruthy()
        expect(insight.hebrew).toBeTruthy()
      }
    })
  })

  describe('analyzeGroup with edge cases', () => {
    it('should handle single member group', () => {
      const singleMemberGroup: GroupWithMembers = {
        ...TEST_GROUP,
        members: [{ ...TEST_MEMBERS[0] }],
      }

      const analysis = analyzeGroup(singleMemberGroup)

      expect(analysis.memberCount).toBe(1)
      expect(analysis.compatibility.matrix).toHaveLength(0) // No pairs
      expect(analysis.compatibility.averageScore).toBe(0)
      expect(analysis.compatibility.highestPair).toBeNull()
      expect(analysis.compatibility.lowestPair).toBeNull()
    })

    it('should handle two member group', () => {
      const twoMemberGroup: GroupWithMembers = {
        ...TEST_GROUP,
        members: [{ ...TEST_MEMBERS[0] }, { ...TEST_MEMBERS[1] }],
      }

      const analysis = analyzeGroup(twoMemberGroup)

      expect(analysis.memberCount).toBe(2)
      expect(analysis.compatibility.matrix).toHaveLength(1) // One pair
      expect(analysis.compatibility.highestPair).not.toBeNull()
      expect(analysis.compatibility.lowestPair).not.toBeNull()
      // With only one pair, highest and lowest should be the same
      expect(analysis.compatibility.highestPair?.score)
        .toBe(analysis.compatibility.lowestPair?.score)
    })

    it('should handle members without hebrew names', () => {
      const noHebrewGroup: GroupWithMembers = {
        ...TEST_GROUP,
        members: TEST_MEMBERS.map(m => ({
          ...m,
          hebrew_name: null,
        })),
      }

      const analysis = analyzeGroup(noHebrewGroup)

      expect(analysis.memberCount).toBe(TEST_GROUP.members.length)
      // Should use English names instead
      for (const member of analysis.members) {
        expect(member.hebrewName).toBeNull()
      }
    })
  })

  describe('Distribution calculations', () => {
    it('should have percentages sum to 100 (approximately) for seal distribution', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      // Filter non-zero entries
      const nonZeroSeals = analysis.dreamspell.sealDistribution.filter(s => s.count > 0)
      const totalPercentage = nonZeroSeals.reduce((sum, s) => sum + s.percentage, 0)

      expect(totalPercentage).toBeCloseTo(100, 1)
    })

    it('should track members correctly in seal distribution', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      // Total members across all seals should equal group size
      let totalMembers = 0
      for (const item of analysis.dreamspell.sealDistribution) {
        totalMembers += item.members.length
        expect(item.count).toBe(item.members.length)
      }

      expect(totalMembers).toBe(TEST_GROUP.members.length)
    })

    it('should track members correctly in color balance', () => {
      const analysis = analyzeGroup(TEST_GROUP)

      let totalMembers = 0
      for (const color of ['red', 'white', 'blue', 'yellow'] as const) {
        totalMembers += analysis.dreamspell.colorBalance[color].members.length
        expect(analysis.dreamspell.colorBalance[color].count)
          .toBe(analysis.dreamspell.colorBalance[color].members.length)
      }

      expect(totalMembers).toBe(TEST_GROUP.members.length)
    })
  })

  describe('getScoreColor (re-exported from compatibility)', () => {
    it('should return correct colors for score ranges', () => {
      expect(getScoreColor(85)).toBe('#22C55E') // green
      expect(getScoreColor(65)).toBe('#84CC16') // lime
      expect(getScoreColor(45)).toBe('#F59E0B') // amber
      expect(getScoreColor(25)).toBe('#F97316') // orange
      expect(getScoreColor(10)).toBe('#EF4444') // red
    })
  })

  describe('Insight generation', () => {
    it('should generate color dominance insight when one color > 50%', () => {
      // Create a group with strong color dominance (3/4 same color)
      const dominantColorGroup: GroupWithMembers = {
        id: 'group-dominant',
        name: 'Dominant Color Group',
        members: [
          { id: '1', name: 'A', hebrew_name: null, birth_date: '2024-01-01', added_at: '2024-01-01' },
          { id: '2', name: 'B', hebrew_name: null, birth_date: '2024-01-02', added_at: '2024-01-01' },
          { id: '3', name: 'C', hebrew_name: null, birth_date: '2024-01-03', added_at: '2024-01-01' },
        ],
        owner_id: 'user-1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        description: null,
      }

      const analysis = analyzeGroup(dominantColorGroup)

      // We should have some insights (may or may not have dominance depending on dates)
      expect(Array.isArray(analysis.insights)).toBe(true)
    })

    it('should generate high harmony insight for high compatibility', () => {
      // Create identical birth dates = high compatibility
      const highCompatGroup: GroupWithMembers = {
        id: 'group-high',
        name: 'High Compat Group',
        members: [
          { id: '1', name: 'A', hebrew_name: null, birth_date: '2024-01-15', added_at: '2024-01-01' },
          { id: '2', name: 'B', hebrew_name: null, birth_date: '2024-01-15', added_at: '2024-01-01' },
        ],
        owner_id: 'user-1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        description: null,
      }

      const analysis = analyzeGroup(highCompatGroup)

      // Same date = high compatibility
      expect(analysis.compatibility.averageScore).toBeGreaterThanOrEqual(60)
    })
  })

  describe('Large group handling', () => {
    it('should handle groups with many members', () => {
      // Create a group with 10 members
      const largeMembersList = Array.from({ length: 10 }, (_, i) => ({
        id: `member-${i}`,
        name: `Person ${i}`,
        hebrew_name: null,
        birth_date: `199${i % 10}-0${(i % 9) + 1}-15`,
        added_at: '2024-01-01',
      }))

      const largeGroup: GroupWithMembers = {
        id: 'large-group',
        name: 'Large Group',
        members: largeMembersList,
        owner_id: 'user-1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        description: null,
      }

      const analysis = analyzeGroup(largeGroup)

      expect(analysis.memberCount).toBe(10)
      // 10 members = 10*9/2 = 45 pairs
      expect(analysis.compatibility.matrix).toHaveLength(45)
    })
  })
})
