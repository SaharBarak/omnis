'use client'

import { useState } from 'react'
import type { PredictionEvent, AIInterpretationResponse } from '@pleiad/engine/types/prediction'
import { Eyebrow, Notice, Pill } from '@/components/app-kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AIInterpretationProps {
  prediction: PredictionEvent
  personContext?: {
    birthDate: string
    birthKin: number
    currentAge?: number
    personalYearKin?: number
  }
  locale?: 'en' | 'he'
  className?: string
}

export function AIInterpretation({
  prediction,
  personContext,
  locale = 'en',
  className,
}: AIInterpretationProps) {
  const [interpretation, setInterpretation] = useState<AIInterpretationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateInterpretation(quick = false) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prediction,
          personContext,
          locale,
          quick,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate interpretation')
      }

      setInterpretation(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <Notice
        variant="error"
        title="Interpretation failed"
        className={className}
        action={
          <button
            type="button"
            onClick={() => generateInterpretation()}
            className="rounded-full border border-white/15 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/[0.25] active:scale-[0.98]"
          >
            Try again
          </button>
        }
      >
        {error}
      </Notice>
    )
  }

  if (!interpretation && !isLoading) {
    return (
      <div className={cn('surface-card p-6', className)}>
        <div className="flex items-center gap-2">
          <Eyebrow>AI interpretation</Eyebrow>
          <Pill className="px-2.5 py-0.5 text-[9px]">Beta</Pill>
        </div>
        <p className="mt-2 text-sm text-white/70">
          Get a personalized AI interpretation of this cosmic event
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => generateInterpretation(false)}
            disabled={isLoading}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-soft active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            Get full interpretation
          </button>
          <button
            type="button"
            onClick={() => generateInterpretation(true)}
            disabled={isLoading}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-white/[0.25] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            Quick insight
          </button>
        </div>
        <p className="mt-3 text-xs text-white/35">
          Powered by Gemini. Interpretations are for inspiration and self-reflection.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('surface-card p-6', className)}>
        <div className="skeleton-shimmer h-3 w-36 rounded" />
        <div className="mt-4 flex flex-col gap-2">
          <div className="skeleton-shimmer h-4 w-full rounded" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded" />
          <div className="skeleton-shimmer h-4 w-2/3 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('surface-card p-6', className)}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Eyebrow>AI interpretation</Eyebrow>
          <Pill className="px-2.5 py-0.5 text-[9px]">Beta</Pill>
        </div>
        {interpretation?.cachedAt && (
          <span className="font-mono text-xs text-white/35 [font-variant-numeric:tabular-nums]">
            Generated {new Date(interpretation.cachedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {/* Main interpretation */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
          {interpretation?.interpretation}
        </p>

        {/* Themes */}
        {interpretation?.themes && interpretation.themes.length > 0 && (
          <div>
            <Eyebrow>Key themes</Eyebrow>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {interpretation.themes.map((theme, i) => (
                <span
                  key={i}
                  className="rounded-full border border-white/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/50"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Affirmation */}
        {interpretation?.affirmation && (
          <div className="rounded-xl border border-white/[0.07] bg-surface-2/60 p-4">
            <Eyebrow>Affirmation</Eyebrow>
            <p className="mt-2 text-sm italic text-white/90">
              &ldquo;{interpretation.affirmation}&rdquo;
            </p>
          </div>
        )}

        {/* Guidance */}
        {interpretation?.guidance && (
          <div>
            <Eyebrow>Guidance</Eyebrow>
            <p className="mt-2 text-sm text-white/70">{interpretation.guidance}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateInterpretation(false)}
            disabled={isLoading}
          >
            Regenerate
          </Button>
          <p className="text-xs text-white/35">
            AI interpretations are for inspiration only
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline AI interpretation button for smaller contexts
 */
interface AIInsightButtonProps {
  prediction: PredictionEvent
  locale?: 'en' | 'he'
}

export function AIInsightButton({ prediction, locale = 'en' }: AIInsightButtonProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function getInsight() {
    if (insight) {
      setIsOpen(!isOpen)
      return
    }

    setIsLoading(true)
    setIsOpen(true)

    try {
      const response = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prediction,
          locale,
          quick: true,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setInsight(data.data.interpretation)
      }
    } catch (err) {
      console.error('Error getting AI insight:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={getInsight}
        disabled={isLoading}
        className="text-xs"
      >
        {isLoading ? 'Loading...' : insight ? (isOpen ? 'Hide insight' : 'Show insight') : 'Get AI insight'}
      </Button>
      {isOpen && isLoading && (
        <div className="rounded-lg border border-white/[0.07] p-2">
          <div className="skeleton-shimmer h-3 w-4/5 rounded" />
          <div className="skeleton-shimmer mt-1.5 h-3 w-3/5 rounded" />
        </div>
      )}
      {isOpen && insight && (
        <p className="rounded-lg border border-white/[0.07] bg-surface-2/60 p-2 text-xs text-white/70">
          {insight}
        </p>
      )}
    </div>
  )
}
