'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PredictionEvent, AIInterpretationResponse } from '@/lib/types/prediction'
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
      <Card className={cn('border-destructive/50', className)}>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => generateInterpretation()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!interpretation && !isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            AI Interpretation
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </CardTitle>
          <CardDescription>
            Get a personalized AI interpretation of this cosmic event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => generateInterpretation(false)} disabled={isLoading}>
              Get Full Interpretation
            </Button>
            <Button
              variant="outline"
              onClick={() => generateInterpretation(true)}
              disabled={isLoading}
            >
              Quick Insight
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Powered by Gemini. Interpretations are for inspiration and self-reflection.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Generating interpretation...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-primary/20', className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          AI Interpretation
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </CardTitle>
        {interpretation?.cachedAt && (
          <CardDescription>
            Generated {new Date(interpretation.cachedAt).toLocaleDateString()}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main interpretation */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{interpretation?.interpretation}</p>
        </div>

        {/* Themes */}
        {interpretation?.themes && interpretation.themes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Key Themes</h4>
            <div className="flex flex-wrap gap-2">
              {interpretation.themes.map((theme, i) => (
                <Badge key={i} variant="outline">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Affirmation */}
        {interpretation?.affirmation && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
            <h4 className="text-sm font-medium mb-2">Affirmation</h4>
            <p className="text-sm italic">&ldquo;{interpretation.affirmation}&rdquo;</p>
          </div>
        )}

        {/* Guidance */}
        {interpretation?.guidance && (
          <div>
            <h4 className="text-sm font-medium mb-2">Guidance</h4>
            <p className="text-sm text-muted-foreground">{interpretation.guidance}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateInterpretation(false)}
            disabled={isLoading}
          >
            Regenerate
          </Button>
          <p className="text-xs text-muted-foreground">
            AI interpretations are for inspiration only
          </p>
        </div>
      </CardContent>
    </Card>
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
        {isLoading ? 'Loading...' : insight ? (isOpen ? 'Hide Insight' : 'Show Insight') : 'Get AI Insight'}
      </Button>
      {isOpen && insight && (
        <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          {insight}
        </p>
      )}
    </div>
  )
}
