'use client'

import { useState } from 'react'
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
  const { createShare } = useShares()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<ShareLink | null>(null)
  const [copied, setCopied] = useState(false)

  // Form state
  const [expirationDays, setExpirationDays] = useState<string>('7')
  const [maxViews, setMaxViews] = useState<string>('')
  const [password, setPassword] = useState('')

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
      } else {
        setError('Failed to create share link')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share')
    } finally {
      setLoading(false)
    }
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
          <DialogTitle>שיתוף {title}</DialogTitle>
          <DialogDescription>
            צור קישור לשיתוף עם אחרים
          </DialogDescription>
        </DialogHeader>

        {createdLink ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-800 font-medium mb-2">קישור נוצר בהצלחה!</div>
              <div className="flex items-center gap-2">
                <Input
                  value={createdLink.url}
                  readOnly
                  className="flex-1 text-sm"
                  dir="ltr"
                />
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {copied ? 'הועתק!' : 'העתק'}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              {createdLink.expiresAt && (
                <p>תפוגה: {new Date(createdLink.expiresAt).toLocaleDateString('he-IL')}</p>
              )}
              {createdLink.maxViews && (
                <p>מקסימום צפיות: {createdLink.maxViews}</p>
              )}
              {createdLink.hasPassword && (
                <p>מוגן בסיסמה</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>סגור</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiration">תפוגה</Label>
              <select
                id="expiration"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="1">יום אחד</option>
                <option value="7">שבוע</option>
                <option value="30">חודש</option>
                <option value="90">3 חודשים</option>
                <option value="0">ללא תפוגה</option>
              </select>
            </div>

            {/* Max views */}
            <div className="space-y-2">
              <Label htmlFor="maxViews">מקסימום צפיות (אופציונלי)</Label>
              <Input
                id="maxViews"
                type="number"
                min="1"
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
                placeholder="ללא הגבלה"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה (אופציונלי)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הגנה בסיסמה"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                ביטול
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'יוצר...' : 'צור קישור'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
