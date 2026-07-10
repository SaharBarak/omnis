'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import type {
  PublicGroupAnalysis,
  PublicGroupMemberAnalysis,
  PublicShareResponse,
} from '@/lib/share/public-share'
import type { ShareOptions } from '@/lib/types/relationship'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Color display names
const COLOR_LABELS: Record<string, { hebrew: string; hex: string }> = {
  red: { hebrew: 'אדום', hex: '#EF4444' },
  white: { hebrew: 'לבן', hex: '#F3F4F6' },
  blue: { hebrew: 'כחול', hex: '#3B82F6' },
  yellow: { hebrew: 'צהוב', hex: '#F59E0B' },
}

// Member card for display
function MemberCard({ member }: { member: PublicGroupMemberAnalysis }) {
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

// Password form
function PasswordForm({
  onSubmit,
  error,
}: {
  onSubmit: (password: string) => void
  error: string | null
}) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Password Protected Content</CardTitle>
          <CardDescription>
            Enter the password to view this content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Group share view
function GroupShareView({ analysis }: { analysis: PublicGroupAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{analysis.groupName}</h1>
        <p className="text-muted-foreground mt-2">
          {analysis.memberCount} members • Group Analysis
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.memberCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.compatibility.averageScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Common Seal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {analysis.dreamspell.sealDistribution.find(d => d.count > 0)?.name || '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.insights.map((insight, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{insight.english}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Color Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Color Balance</CardTitle>
          <CardDescription>Distribution of the four directional colors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(['red', 'white', 'blue', 'yellow'] as const).map(color => {
              const data = analysis.dreamspell.colorBalance[color]
              return (
                <div key={color} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2"
                    style={{ backgroundColor: COLOR_LABELS[color].hex, borderColor: color === 'white' ? '#D1D5DB' : COLOR_LABELS[color].hex }}
                  />
                  <div className="w-16 text-sm font-medium capitalize">
                    {color}
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${data.percentage}%`, backgroundColor: COLOR_LABELS[color].hex }}
                    />
                  </div>
                  <div className="w-12 text-sm text-left">
                    {data.count}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Group Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {analysis.members.map(member => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main page
export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [shareData, setShareData] = useState<{
    type: string
    options: ShareOptions
    groupAnalysis?: PublicGroupAnalysis
  } | null>(null)

  const loadShare = useCallback(async (password?: string) => {
    setLoading(true)
    setError(null)
    setPasswordError(null)

    try {
      // Single public, token-scoped endpoint — no auth required. The server
      // enforces expiry, max-view capping (atomic increment), and password
      // verification, and returns only safe projections of the shared content.
      const res = password
        ? await fetch(`/api/share/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
          })
        : await fetch(`/api/share/${token}`)

      if (res.status === 401) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        if (password) {
          setPasswordError(body.error || 'Incorrect password')
        }
        setRequiresPassword(true)
        setLoading(false)
        return
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setError(body.error || 'Link not found or inactive')
        setLoading(false)
        return
      }

      const { share, group } = (await res.json()) as PublicShareResponse

      setShareData({
        type: share.share_type,
        options: share.options,
        groupAnalysis: group,
      })
      setRequiresPassword(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadShare()
  }, [loadShare])

  const handlePasswordSubmit = (password: string) => {
    loadShare(password)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (requiresPassword) {
    return <PasswordForm onSubmit={handlePasswordSubmit} error={passwordError} />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Link href="/login">
              <Button>Sign in to Pleiad</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 max-w-7xl mx-auto">
          <Link href="/" className="font-bold text-xl">
            Pleiad
          </Link>
          <div className="flex-1" />
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        {shareData?.type === 'group' && shareData.groupAnalysis && (
          <GroupShareView analysis={shareData.groupAnalysis} />
        )}

        {shareData?.type !== 'group' && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">This share type is not yet supported in public view</p>
          </div>
        )}

        {/* CTA */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col md:flex-row items-center justify-between py-6 gap-4">
            <div>
              <h3 className="font-bold text-lg">Want to create your own analysis?</h3>
              <p className="text-muted-foreground">Join Pleiad and discover your symbolic connections</p>
            </div>
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
