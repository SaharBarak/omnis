'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useShares, ShareLink } from '@/lib/hooks/use-shares'
import type { ShareOptions } from '@/lib/types/relationship'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareType: 'person' | 'relationship' | 'group' | 'graph'
  title: string
  options: ShareOptions
}

export function ShareDialog({ open, onOpenChange, shareType, title, options }: ShareDialogProps) {
  const { shares, fetchShares, createShare, deactivateShare } = useShares()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<ShareLink | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  // Form state
  const [expirationDays, setExpirationDays] = useState<string>('7')
  const [maxViews, setMaxViews] = useState<string>('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (open) fetchShares()
  }, [open, fetchShares])

  const activeLinks = shares.filter((s) => s.shareType === shareType && s.active)

  const handleCreate = async () => {
    setLoading(true)
    setError(null)

    try {
      // Calculate expiration date
      let expiresAt: string | undefined
      if (expirationDays && expirationDays !== '0') {
        const date = new Date()
        date.setDate(date.getDate() + parseInt(expirationDays))
        expiresAt = date.toISOString()
      }

      const result = await createShare({
        shareType,
        options,
        expiresAt,
        maxViews: maxViews ? parseInt(maxViews) : undefined,
        password: password || undefined,
      })

      if (result) {
        setCreatedLink(result)
        // Dashboard get-to-value checklist reads this flag ("Share a reading").
        try { window.localStorage.setItem('omnis.checklist.shared', '1') } catch { /* storage disabled */ }
      } else {
        setError('Failed to create share link')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id: string) => {
    setRevokingId(id)
    setError(null)
    const ok = await deactivateShare(id)
    if (!ok) setError('Failed to revoke share link')
    if (createdLink?.id === id) setCreatedLink(null)
    setRevokingId(null)
  }

  const handleCopy = async () => {
    if (!createdLink) return
    try {
      await navigator.clipboard.writeText(createdLink.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClose = () => {
    setCreatedLink(null)
    setError(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share {title}</DialogTitle>
          <DialogDescription>
            Create a link to share with others
          </DialogDescription>
        </DialogHeader>

        {createdLink ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-800 font-medium mb-2">Link created!</div>
              <div className="flex items-center gap-2">
                <Input
                  value={createdLink.url}
                  readOnly
                  className="flex-1 text-sm"
                  dir="ltr"
                />
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              {createdLink.expiresAt && (
                <p>Expires: {new Date(createdLink.expiresAt).toLocaleDateString()}</p>
              )}
              {createdLink.maxViews && (
                <p>Max views: {createdLink.maxViews}</p>
              )}
              {createdLink.hasPassword && (
                <p>Password protected</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiration">Expiration</Label>
              <select
                id="expiration"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="1">1 day</option>
                <option value="7">1 week</option>
                <option value="30">1 month</option>
                <option value="90">3 months</option>
                <option value="0">Never</option>
              </select>
            </div>

            {/* Max views */}
            <div className="space-y-2">
              <Label htmlFor="maxViews">Max views (optional)</Label>
              <Input
                id="maxViews"
                type="number"
                min="1"
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
                placeholder="Unlimited"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password (optional)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password protection"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            {/* Existing active links for this share type */}
            {activeLinks.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Label>Active links</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activeLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-2 p-2 rounded-md border border-input"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" dir="ltr">{link.url}</p>
                        <p className="text-xs text-muted-foreground">
                          {link.viewCount} view{link.viewCount === 1 ? '' : 's'}
                          {link.expiresAt &&
                            ` · expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(link.id)}
                        disabled={revokingId === link.id}
                      >
                        {revokingId === link.id ? 'Revoking…' : 'Revoke'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating…' : 'Create link'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
