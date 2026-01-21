'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGroups } from '@/lib/hooks/use-groups'
import { analyzeGroup, getScoreColor } from '@/lib/services/group-analysis'
import type { FullGroupAnalysis, DistributionItem, GroupMemberAnalysis } from '@/lib/services/group-analysis'
import type { GroupWithMembers } from '@/lib/types/relationship'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Color display names
const COLOR_LABELS: Record<string, { english: string; hebrew: string; hex: string }> = {
  red: { english: 'Red', hebrew: 'אדום', hex: '#EF4444' },
  white: { english: 'White', hebrew: 'לבן', hex: '#F3F4F6' },
  blue: { english: 'Blue', hebrew: 'כחול', hex: '#3B82F6' },
  yellow: { english: 'Yellow', hebrew: 'צהוב', hex: '#F59E0B' },
}

// Distribution bar component
function DistributionBar({ item, maxCount }: { item: DistributionItem; maxCount: number }) {
  const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-32 text-sm truncate" title={item.name}>
        <span className="font-medium">{item.nameHebrew}</span>
        <span className="text-muted-foreground text-xs mr-1">({item.name})</span>
      </div>
      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <div className="w-16 text-sm text-left">
        <span className="font-medium">{item.count}</span>
        <span className="text-muted-foreground text-xs"> ({item.percentage.toFixed(0)}%)</span>
      </div>
    </div>
  )
}

// Color balance pie chart (simplified bar view)
function ColorBalanceChart({ colorBalance }: { colorBalance: FullGroupAnalysis['dreamspell']['colorBalance'] }) {
  const colors = ['red', 'white', 'blue', 'yellow'] as const
  const total = colors.reduce((sum, c) => sum + colorBalance[c].count, 0)

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
              <span className="font-medium">{COLOR_LABELS[color].hebrew}</span>
            </div>
            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${data.percentage}%`, backgroundColor: COLOR_LABELS[color].hex }}
              />
            </div>
            <div className="w-12 text-sm text-left">
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
        נדרשים לפחות 2 חברים בקבוצה כדי לחשב תאימות
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
            <th className="p-2 border bg-muted text-right text-sm min-w-[100px]"></th>
            {members.map(m => (
              <th key={m.id} className="p-2 border bg-muted text-center text-xs min-w-[60px]">
                <div className="truncate max-w-[60px]" title={m.hebrewName || m.name}>
                  {(m.hebrewName || m.name).slice(0, 5)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map(row => (
            <tr key={row.id}>
              <td className="p-2 border bg-muted text-right text-sm font-medium">
                <div className="truncate max-w-[100px]" title={row.hebrewName || row.name}>
                  {row.hebrewName || row.name}
                </div>
              </td>
              {members.map(col => {
                const score = getScore(row.id, col.id)
                return (
                  <td
                    key={col.id}
                    className="p-2 border text-center text-sm font-medium"
                    style={{
                      backgroundColor: score !== null ? getScoreColor(score) : '#F3F4F6',
                      color: score !== null && score >= 40 ? 'white' : '#374151',
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
        <span className="text-muted-foreground">מקרא:</span>
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
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: colorHex }}
      >
        {member.dreamspell.kin}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{member.hebrewName || member.name}</div>
        <div className="text-sm text-muted-foreground">
          {member.dreamspell.sealNameHebrew} {member.dreamspell.toneNameHebrew}
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
  const colors = {
    strength: 'border-green-500 bg-green-50',
    challenge: 'border-amber-500 bg-amber-50',
    pattern: 'border-blue-500 bg-blue-50',
  }
  const icons = {
    strength: '💪',
    challenge: '🔥',
    pattern: '🔮',
  }

  return (
    <div className={`p-4 border-r-4 rounded-lg ${colors[insight.type]}`}>
      <div className="flex items-start gap-2">
        <span className="text-xl">{icons[insight.type]}</span>
        <div>
          <p className="font-medium">{insight.hebrew}</p>
          <p className="text-sm text-muted-foreground">{insight.english}</p>
        </div>
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
          setError('הקבוצה לא נמצאה')
          return
        }

        const analysisResult = analyzeGroup(group)
        setAnalysis(analysisResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים')
      } finally {
        setLoading(false)
      }
    }

    loadAnalysis()
  }, [id, getGroupWithMembers])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">טוען ניתוח...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← חזור
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
            <Link href="/app/groups" className="hover:underline">קבוצות</Link>
            <span>/</span>
            <span>{analysis.groupName}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">ניתוח קבוצתי</h1>
          <p className="text-muted-foreground">
            {analysis.memberCount} חברים בקבוצה
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          חזור לקבוצות
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">חברים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.memberCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">תאימות ממוצעת</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: getScoreColor(analysis.compatibility.averageScore) }}>
              {analysis.compatibility.averageScore}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">חותם נפוץ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {topSeals[0]?.nameHebrew || '-'}
            </div>
            <div className="text-sm text-muted-foreground">
              {topSeals[0] ? `${topSeals[0].count} אנשים` : ''}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">טון נפוץ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {topTones[0]?.nameHebrew || '-'}
            </div>
            <div className="text-sm text-muted-foreground">
              {topTones[0] ? `${topTones[0].count} אנשים` : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>תובנות</CardTitle>
            <CardDescription>ממצאים עיקריים מהניתוח הקבוצתי</CardDescription>
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
          <TabsTrigger value="compatibility">מטריצת תאימות</TabsTrigger>
          <TabsTrigger value="dreamspell">דרימספל</TabsTrigger>
          <TabsTrigger value="tzolkin">צולקין</TabsTrigger>
          <TabsTrigger value="members">חברים</TabsTrigger>
        </TabsList>

        <TabsContent value="compatibility" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>מטריצת תאימות</CardTitle>
              <CardDescription>
                ציוני תאימות בין כל זוגות חברי הקבוצה (0-100)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompatibilityMatrix analysis={analysis} />

              {analysis.compatibility.highestPair && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800">
                    🌟 הזוג בעל התאימות הגבוהה ביותר
                  </div>
                  <div className="text-green-700">
                    {analysis.compatibility.highestPair.person1} ↔ {analysis.compatibility.highestPair.person2}: {analysis.compatibility.highestPair.score}%
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
                <CardTitle>התפלגות חותמות</CardTitle>
                <CardDescription>20 החותמות השמשיות של הדרימספל</CardDescription>
              </CardHeader>
              <CardContent>
                {topSeals.length > 0 ? (
                  <div className="space-y-1">
                    {analysis.dreamspell.sealDistribution.filter(d => d.count > 0).map(item => (
                      <DistributionBar key={item.value} item={item} maxCount={maxSealCount} />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">אין נתונים</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>התפלגות טונים</CardTitle>
                <CardDescription>13 הטונים הגלקטיים</CardDescription>
              </CardHeader>
              <CardContent>
                {topTones.length > 0 ? (
                  <div className="space-y-1">
                    {analysis.dreamspell.toneDistribution.filter(d => d.count > 0).map(item => (
                      <DistributionBar key={item.value} item={item} maxCount={maxToneCount} />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">אין נתונים</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>מאזן צבעים</CardTitle>
              <CardDescription>התפלגות ארבעת הצבעים הכיווניים</CardDescription>
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
                <CardTitle>התפלגות סימני יום</CardTitle>
                <CardDescription>20 סימני היום של הצולקין המסורתי</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.tzolkin.signDistribution.filter(d => d.count > 0).length > 0 ? (
                  <div className="space-y-1">
                    {analysis.tzolkin.signDistribution.filter(d => d.count > 0).map(item => (
                      <DistributionBar key={item.value} item={item} maxCount={Math.max(...analysis.tzolkin.signDistribution.map(d => d.count), 1)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">אין נתונים</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>התפלגות טונים (צולקין)</CardTitle>
                <CardDescription>13 הטונים של הצולקין</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.tzolkin.toneDistribution.filter(d => d.count > 0).length > 0 ? (
                  <div className="space-y-1">
                    {analysis.tzolkin.toneDistribution.filter(d => d.count > 0).map(item => (
                      <DistributionBar key={item.value} item={item} maxCount={Math.max(...analysis.tzolkin.toneDistribution.map(d => d.count), 1)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">אין נתונים</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>חברי הקבוצה</CardTitle>
              <CardDescription>רשימת כל החברים עם נתוני הדרימספל שלהם</CardDescription>
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
