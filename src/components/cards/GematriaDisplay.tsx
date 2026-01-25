'use client'

/**
 * Gematria Display Components
 *
 * Components for displaying Hebrew gematria analysis including:
 * - Letter breakdown with values
 * - Multiple calculation methods
 * - Notable number interpretations
 * - Name comparisons
 */

import { cn } from '@/lib/utils'
import {
  calculateGematria,
  standardGematria,
  compareNames,
  hasNotableMeaning,
  getLetterBreakdown,
  getGematriaSummary,
} from '@/lib/calculations/gematria'
import {
  getNotableNumber,
} from '@/lib/data/hebrew-letters'
import type {
  GematriaResult,
  GematriaValue,
  GematriaMethod,
  LetterBreakdown,
  NameComparison,
} from '@/lib/types/gematria'
import {
  GEMATRIA_METHOD_LABELS,
  DIGITAL_ROOT_LABELS,
} from '@/lib/types/gematria'

// =============================================================================
// PROPS INTERFACES
// =============================================================================

export interface GematriaDisplayProps {
  text: string
  showBreakdown?: boolean
  showAllMethods?: boolean
  showNotable?: boolean
  compact?: boolean
  className?: string
}

export interface GematriaSummaryCardProps {
  result: GematriaResult
  showNotable?: boolean
  className?: string
}

export interface LetterBreakdownDisplayProps {
  breakdown: readonly LetterBreakdown[]
  compact?: boolean
  className?: string
}

export interface MethodValuesDisplayProps {
  result: GematriaResult
  compact?: boolean
  className?: string
}

export interface NameComparisonDisplayProps {
  name1: string
  name2: string
  className?: string
}

export interface GematriaMiniProps {
  text: string
  className?: string
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Single letter display with value
 */
function LetterBadge({ letter, value, isFinal }: { letter: string; value: number; isFinal: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-center',
        'px-2 py-1 rounded-md',
        'min-w-[2.5rem]',
        isFinal ? 'bg-purple-500/20' : 'bg-muted/50'
      )}
    >
      <span className="text-lg font-medium">{letter}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  )
}

/**
 * Method value row
 */
function MethodRow({
  method,
  methodValue,
  compact,
}: {
  method: GematriaMethod
  methodValue: GematriaValue
  compact?: boolean
}) {
  const labels = GEMATRIA_METHOD_LABELS[method]

  return (
    <div className={cn(
      'flex items-center justify-between',
      compact ? 'py-1' : 'py-2',
      'border-b border-border/50 last:border-0'
    )}>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{labels.label}</span>
        {!compact && (
          <span className="text-xs text-muted-foreground">({labels.labelHebrew})</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">{methodValue.value}</span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
          {methodValue.digitalRoot}
        </span>
      </div>
    </div>
  )
}

/**
 * Notable number badge
 */
function NotableBadge({ value }: { value: number }) {
  const notable = getNotableNumber(value)
  if (!notable) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
      <span className="text-amber-600 font-medium">{value}</span>
      <span className="text-sm">=</span>
      <span className="text-sm">{notable.meaning}</span>
      <span className="text-xs text-muted-foreground">({notable.meaningHebrew})</span>
    </div>
  )
}

// =============================================================================
// LETTER BREAKDOWN DISPLAY
// =============================================================================

/**
 * Display letter-by-letter breakdown of gematria calculation
 */
export function LetterBreakdownDisplay({
  breakdown,
  compact,
  className,
}: LetterBreakdownDisplayProps) {
  if (breakdown.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground', className)}>
        No Hebrew letters in text
      </div>
    )
  }

  return (
    <div className={cn('bg-card border rounded-lg p-4', className)} dir="rtl">
      <h4 className="text-sm font-medium mb-3 text-center">Letter Breakdown (פירוט אותיות)</h4>
      <div className={cn(
        'flex flex-wrap justify-center',
        compact ? 'gap-1' : 'gap-2'
      )}>
        {breakdown.map((item, index) => (
          <LetterBadge
            key={`${item.letter}-${index}`}
            letter={item.letter}
            value={item.value}
            isFinal={item.isFinal}
          />
        ))}
      </div>
      <div className="mt-3 text-center text-sm text-muted-foreground">
        {breakdown.map(b => b.value).join(' + ')} = {breakdown.reduce((sum, b) => sum + b.value, 0)}
      </div>
    </div>
  )
}

// =============================================================================
// SUMMARY CARD
// =============================================================================

/**
 * Summary card showing main gematria values
 */
export function GematriaSummaryCard({
  result,
  showNotable = true,
  className,
}: GematriaSummaryCardProps) {
  const summary = getGematriaSummary(result)
  const digitalRootMeaning = DIGITAL_ROOT_LABELS[summary.digitalRoot]

  return (
    <div className={cn('bg-card border rounded-lg p-4', className)} dir="rtl">
      <h4 className="text-sm font-medium mb-3 text-center">
        Gematria of &quot;{result.cleanedText}&quot;
      </h4>

      {/* Main value */}
      <div className="text-center mb-4">
        <span className="text-4xl font-bold">{summary.standardValue}</span>
        <div className="text-sm text-muted-foreground mt-1">
          {result.letterCount} letters • Digital root: {summary.digitalRoot}
        </div>
      </div>

      {/* Digital root meaning */}
      {digitalRootMeaning && (
        <div className="text-center text-sm px-4 py-2 rounded-lg bg-muted/30 mb-4">
          <span className="font-medium">{digitalRootMeaning.meaning}</span>
          <span className="text-muted-foreground mx-1">—</span>
          <span className="text-muted-foreground">({digitalRootMeaning.meaningHebrew})</span>
        </div>
      )}

      {/* Notable number */}
      {showNotable && hasNotableMeaning(summary.standardValue) && (
        <div className="flex justify-center">
          <NotableBadge value={summary.standardValue} />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// METHOD VALUES DISPLAY
// =============================================================================

/**
 * Display all gematria calculation methods
 */
export function MethodValuesDisplay({
  result,
  compact,
  className,
}: MethodValuesDisplayProps) {
  const methods: GematriaMethod[] = [
    'standard',
    'full',
    'ordinal',
    'small',
    'atbash',
    'avgad',
    'albam',
  ]

  return (
    <div className={cn('bg-card border rounded-lg p-4', className)} dir="rtl">
      <h4 className="text-sm font-medium mb-3 text-center">Calculation Methods (שיטות חישוב)</h4>
      <div className="space-y-1">
        {methods.map(method => (
          <MethodRow
            key={method}
            method={method}
            methodValue={result.methods[method]}
            compact={compact}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// NAME COMPARISON DISPLAY
// =============================================================================

/**
 * Display comparison between two names
 */
export function NameComparisonDisplay({
  name1,
  name2,
  className,
}: NameComparisonDisplayProps) {
  const comparison = compareNames(name1, name2)

  return (
    <div className={cn('bg-card border rounded-lg p-4', className)} dir="rtl">
      <h4 className="text-sm font-medium mb-4 text-center">Name Comparison (השוואת שמות)</h4>

      {/* Two names side by side */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <div className="text-lg font-medium">{comparison.name1}</div>
          <div className="text-2xl font-bold">{comparison.value1}</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <div className="text-lg font-medium">{comparison.name2}</div>
          <div className="text-2xl font-bold">{comparison.value2}</div>
        </div>
      </div>

      {/* Combined stats */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Combined value:</span>
          <span className="font-bold">{comparison.combinedValue}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Difference:</span>
          <span className="font-bold">{comparison.difference}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shared digital root:</span>
          <span className={cn(
            'font-bold',
            comparison.sharedDigitalRoot ? 'text-green-600' : 'text-muted-foreground'
          )}>
            {comparison.sharedDigitalRoot ? 'Yes ✓' : 'No'}
          </span>
        </div>
      </div>

      {/* Interpretation */}
      {comparison.interpretation && (
        <div className="mt-4 p-3 rounded-lg bg-primary/10 text-center">
          <div className="text-sm font-medium">{comparison.interpretation}</div>
          <div className="text-xs text-muted-foreground">({comparison.interpretationHebrew})</div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MINI DISPLAY
// =============================================================================

/**
 * Compact inline gematria display
 */
export function GematriaMini({ text, className }: GematriaMiniProps) {
  const value = standardGematria(text)
  const notable = hasNotableMeaning(value)

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="text-muted-foreground">Gematria:</span>
      <span className={cn(
        'font-bold px-2 py-0.5 rounded',
        notable ? 'bg-amber-500/20 text-amber-700' : 'bg-muted'
      )}>
        {value}
      </span>
    </div>
  )
}

// =============================================================================
// MAIN DISPLAY COMPONENT
// =============================================================================

/**
 * Full gematria display with all sections
 */
export function GematriaDisplay({
  text,
  showBreakdown = true,
  showAllMethods = false,
  showNotable = true,
  compact = false,
  className,
}: GematriaDisplayProps) {
  // Handle empty text
  if (!text || text.trim() === '') {
    return (
      <div className={cn('bg-card border rounded-lg p-4 text-center', className)}>
        <span className="text-muted-foreground">Enter Hebrew text for gematria calculation</span>
      </div>
    )
  }

  const result = calculateGematria(text)

  // No Hebrew letters found
  if (result.letterCount === 0) {
    return (
      <div className={cn('bg-card border rounded-lg p-4 text-center', className)}>
        <span className="text-muted-foreground">No Hebrew letters found in text</span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)} dir="rtl">
      {/* Summary card */}
      <GematriaSummaryCard result={result} showNotable={showNotable} />

      {/* Letter breakdown */}
      {showBreakdown && (
        <LetterBreakdownDisplay
          breakdown={result.methods.standard.breakdown}
          compact={compact}
        />
      )}

      {/* All methods */}
      {showAllMethods && (
        <MethodValuesDisplay result={result} compact={compact} />
      )}
    </div>
  )
}

export default GematriaDisplay
