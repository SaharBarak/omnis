'use client'

import { useState, useCallback, useRef } from 'react'
import { Download, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  exportCanvas,
  downloadExport,
  EXPORT_FORMAT_OPTIONS,
  EXPORT_SCALE_OPTIONS,
} from '@/lib/services/canvas-export'
import type { ExportFormat } from '@/lib/types/board'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  canvasRef: React.RefObject<HTMLElement | null>
  boardName?: string
}

export function ExportDialog({ open, onClose, canvasRef, boardName }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState(2)
  const [includeBackground, setIncludeBackground] = useState(true)
  const [quality, setQuality] = useState(0.9)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = useCallback(async () => {
    if (!canvasRef.current) {
      setError('לא נמצא אלמנט הקנבס')
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      const result = await exportCanvas({
        format,
        scale,
        background: includeBackground,
        quality,
        canvasElement: canvasRef.current,
        filename: boardName ? `${boardName.replace(/\s+/g, '-')}` : undefined,
      })

      downloadExport(result)
      onClose()
    } catch (err) {
      console.error('Export failed:', err)
      setError(err instanceof Error ? err.message : 'שגיאה בייצוא')
    } finally {
      setIsExporting(false)
    }
  }, [canvasRef, format, scale, includeBackground, quality, boardName, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-xl border w-[400px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold" dir="rtl">ייצוא קנבס</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6" dir="rtl">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">פורמט</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_FORMAT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`p-3 text-right border rounded-lg transition-all ${
                    format === option.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormat(option.value)}
                  disabled={option.value === 'pdf'} // PDF not yet implemented
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                  {option.value === 'pdf' && (
                    <div className="text-xs text-amber-500 mt-1">בקרוב</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scale Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">רזולוציה</Label>
            <div className="flex gap-2">
              {EXPORT_SCALE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex-1 py-2 px-3 text-center border rounded-lg transition-all ${
                    scale === option.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setScale(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              רזולוציה גבוהה יותר = איכות טובה יותר, קובץ גדול יותר
            </p>
          </div>

          {/* Background Option */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="include-background"
              checked={includeBackground}
              onChange={(e) => setIncludeBackground(e.target.checked)}
              className="rounded border"
            />
            <Label htmlFor="include-background" className="text-sm cursor-pointer">
              כלול רקע לבן
            </Label>
          </div>

          {/* Quality Slider (JPEG only) */}
          {format === 'jpeg' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">איכות</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm w-12 text-left">{Math.round(quality * 100)}%</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            ביטול
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                מייצא...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 ml-2" />
                ייצא
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ExportDialog
