'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Flame, Sparkles } from 'lucide-react'
import { useGroups } from '@/lib/hooks/use-groups'
import { analyzeGroup, getScoreColor } from '@pleiad/engine/services/group-analysis'
import type { FullGroupAnalysis, DistributionItem, GroupMemberAnalysis } from '@pleiad/engine/services/group-analysis'
import type { GroupWithMembers } from '@/lib/types/relationship'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Color display names
const COLOR_LABELS: Record<string, { english: string; hex: string }> = {
  red: { english: 'Red', hex: '#EF4444' },
  white: { english: 'White', hex: '#F3F4F6' },
  blue: { english: 'Blue', hex: '#3B82F6' },
  yellow: { english: 'Yellow', hex: '#F59E0B' },
}

// Distribution bar component
function DistributionBar({ item, maxCount }: { item: DistributionItem; maxCount: number }) {
  const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-32 text-sm truncate" title={item.name}>
        <span className="font-medium">{item.name}</span>
      </div>
      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <div className="w-16 text-sm text-right font-mono tabular-nums">
        <span className="font-medium">{item.count}</span>
        <span className="text-muted-foreground text-xs"> ({item.percentage.toFixed(0)}%)</span>
      </div>
    </div>
  )
}

// Color balance pie chart (simplified bar view)
function ColorBalanceChart({ colorBalance }: { colorBalance: FullGroupAnalysis['dreamspell']['colorBalance'] }) {
  const colors = ['red', 'white', 'blue', 'yellow'] as const

  return (
    <div className="space-y-3">
      {colors.map(color => {
        const data = colorBalance[color]
        return (
          <div key={color} className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full border-2"
              style={{ backgroundColor: COLOR_LABELS[color].hex, borderColor: color === 'white' ? '#D1D5DB' : COLOR_LABELS[color].hex }}
            />
            <div className="w-20 text-sm">
              <span className="font-medium">{COLOR_LABELS[color].english}</span>
            </div>
            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${data.percentage}%`, backgroundColor: COLOR_LABELS[color].hex }}
              />
            </div>
            <div className="w-12 text-sm text-right font-mono tabular-nums">
              {data.count} ({data.percentage.toFixed(0)}%)
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Compatibility matrix component
function CompatibilityMatrix({ analysis }: { analysis: FullGroupAnalysis }) {
  const { members, compatibility } = analysis

  if (members.length < 2) {
    return (
      <div className="text-center text-muted-foreground py-8">
        At least two members are needed to compute compatibility.
      </div>
    )
  }

  // Create a lookup for quick score finding
  const scoreMap = new Map<string, number>()
  for (const entry of compatibility.matrix) {
    const key1 = `${entry.person1Id}-${entry.person2Id}`
    const key2 = `${entry.person2Id}-${entry.person1Id}`
    scoreMap.set(key1, entry.score)
    scoreMap.set(key2, entry.score)
  }

  const getScore = (p1Id: string, p2Id: string): number | null => {
    if (p1Id === p2Id) return null
    return scoreMap.get(`${p1Id}-${p2Id}`) ?? null
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border bg-muted text-left text-sm min-w-[100px]"></th>
            {members.map(m => (
              <th key={m.id} className="p-2 border bg-muted text-center text-xs min-w-[60px]">
                <div className="truncate max-w-[60px]" title={m.name || m.hebrewName || ''}>
                  {(m.name || m.hebrewName || '').slice(0, 5)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map(row => (
            <tr key={row.id}>
              <td className="p-2 border bg-muted text-left text-sm font-medium">
                <div className="truncate max-w-[100px]" title={row.name || row.hebrewName || ''}>
                  {row.name || row.hebrewName}
                </div>
              </td>
              {members.map(col => {
                const score = getScore(row.id, col.id)
                return (
                  <td
                    key={col.id}
                    className="p-2 border text-center text-sm font-medium font-mono tabular-nums"
                    style={{
                      backgroundColor: score !== null ? getScoreColor(score) : 'hsl(var(--muted))',
                      color: score === null
                        ? 'hsl(var(--muted-foreground))'
                        : score >= 40 ? 'white' : '#1F2937',
                    }}
                  >
                    {score !== null ? score : '-'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22C55E' }} />
          <span>80+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#84CC16' }} />
          <span>60-79</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }} />
          <span>40-59</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F97316' }} />
          <span>20-39</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }} />
          <span>&lt;20</span>
        </div>
      </div>
    </div>
  )
}

// Member card component
function MemberCard({ member }: { member: GroupMemberAnalysis }) {
  const colorHex = COLOR_LABELS[member.dreamspell.color]?.hex || '#6B7280'

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold font-mono tabular-nums"
        style={{ backgroundColor: colorHex }}
      >
        {member.dreamspell.kin}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{member.name || member.hebrewName}</div>
        <div className="text-sm text-muted-foreground">
          {member.dreamspell.toneName} {member.dreamspell.sealName}
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        Kin {member.dreamspell.kin}
      </Badge>
    </div>
  )
}

// Insight card component
function InsightCard({ insight }: { insight: FullGroupAnalysis['insights'][0] }) {
  const styles = {
    strength: 'border-green-500/40 bg-green-500/10',
    challenge: 'border-amber-500/40 bg-amber-500/10',
    pattern: 'border-blue-500/40 bg-blue-500/10',
  }
  const icons = {
    strength: <Zap className="h-4 w-4 text-green-500" />,
    challenge: <Flame className="h-4 w-4 text-amber-500" />,
    pattern: <Sparkles className="h-4 w-4 text-blue-500" />,
  }

  return (
    <div className={`p-4 border-l-4 rounded-lg ${styles[insight.type]}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icons[insight.type]}</span>
        <p className="text-sm text-foreground">{insight.english}</p>
      </div>
    </div>
  )
}

// Main page component
export default function GroupAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { getGroupWithMembers } = useGroups()
  const [analysis, setAnalysis] = useState<FullGroupAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnalysis = async () => {
      setLoading(true)
      setError(null)

      try {
        const group = await getGroupWithMembers(id)
        if (!group) {
          setError('Group not found')
          return
        }

        const analysisResult = analyzeGroup(group)
        setAnalysis(analysisResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong while loading the analysis')
      } finally {
        setLoading(false)
      }
    }

    loadAnalysis()
  }, [id, getGroupWithMembers])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading analysis...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          &larr; Back
        </Button>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-destructive">{error}</div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  // Get top items for quick view
  const topSeals = analysis.dreamspell.sealDistribution.slice(0, 5).filter(d => d.count > 0)
  const topTones = analysis.dreamspell.toneDistribution.slice(0, 5).filter(d => d.count > 0)
  const maxSealCount = Math.max(...analysis.dreamspell.sealDistribution.map(d => d.count), 1)
  const maxToneCount = Math.max(...analysis.dreamspell.toneDistribution.map(d => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/app/groups" className="hover:underline">Groups</Link>
            <span>/</span>
            <span>{analysis.groupName}</span>
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-tight">Group analysis</h1>
          <p className="text-muted-foreground">
            {analysis.memberCount} members
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back to groups
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tabular-nums">{analysis.memberCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Average compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: getScoreColor(analysis.compatibility.averageScore) }}>
              {analysis.compatibility.averageScore}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Most common seal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {topSeals[0]?.name || '-'}
            </div>
            <div className="text-sm text-muted-foreground">
              {topSeals[0] ? `${topSeals[0].count} people` : ''}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Most common tone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {topTones[0]?.name || '-'}
            </div>
            <div className="text-sm text-muted-foreground">
              {topTones[0] ? `${topTones[0].count} people` : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
            <CardDescription>Key observations from the group data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed analysis */}
      <Tabs defaultValue="compatibility" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
          <TabsTrigger value="dreamspell">Dreamspell</TabsTrigger>
          <TabsTrigger value="tzolkin">Tzolkin</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="compatibility" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Compatibility matrix</CardTitle>
              <CardDescription>
                Compatibility scores for every pair in the group (0-100)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompatibilityMatrix analysis={analysis} />

              {analysis.compatibility.highestPair && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 font-medium text-green-500">
                    <Sparkles className="h-4 w-4" />
                    Highest-compatibility pair
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {analysis.compatibility.highestPair.person1} &harr; {analysis.compatibility.highestPair.person2}: {analysis.compatibility.highestPair.score}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dreamspell" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Seal distribution</CardTitle>
                <CardDescription>The 20 solar seals of the Dreamspell</CardDescription>
              </CardHeader>
              <CardContent>
                {topSeals.length > 0 ? (
                  <div className="space-y-1">
                    {analysis.dreamspell.sealDistribution.filter(d => d.count > 0).map(item => (
                      <DistributionBar key={item.value} item={item} maxCount={maxSealCount} />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">No data</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tone distribution</CardTitle>
                <CardDescription>The 13 galactic tones</CardDescription>
              </CardHeader>
              <CardContent>
                {topTones.length > 0 ? (
                  <div className="space-y-1">
                    {analysis.dreamspell.toneDistribution.filter(d => d.count > 0).map(item => (
                      <DistributionBar key={item.value} item={item} maxCount={maxToneCount} />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">No data</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Color balance</CardTitle>
              <CardDescription>Distribution of the four directional colors</CardDescription>
            </CardHeader>
            <CardContent>
              <ColorBalanceChart colorBalance={analysis.dreamspell.colorBalance} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tzolkin" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Day sign distribution</CardTitle>
                <CardDescription>The 20 day signs of the traditional Tzolkin</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.tzolkin.signDistribution.filter(d => d.count > 0).length > 0 ? (
                  <div className="space-y-1">
                    {analysis.tzolkin.signDistribution.filter(d => d.count > 0).map(item => (
                      <DistributionBar key={item.value} item={item} maxCount={Math.max(...analysis.tzolkin.signDistribution.map(d => d.count), 1)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">No data</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tone distribution (Tzolkin)</CardTitle>
                <CardDescription>The 13 Tzolkin tones</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.tzolkin.toneDistribution.filter(d => d.count > 0).length > 0 ? (
                  <div className="space-y-1">
                    {analysis.tzolkin.toneDistribution.filter(d => d.count > 0).map(item => (
                      <DistributionBar key={item.value} item={item} maxCount={Math.max(...analysis.tzolkin.toneDistribution.map(d => d.count), 1)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">No data</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Group members</CardTitle>
              <CardDescription>Every member with their Dreamspell profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {analysis.members.map(member => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
