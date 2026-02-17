'use client'

import { cn } from '@/lib/utils'
import {
  calculateBodygraph,
  isCompleteBodygraph,
  getBodygraphSummary,
} from '@/lib/calculations/human-design'
import type {
  Bodygraph,
  PartialBodygraph,
  HumanDesignResult,
  HumanDesignInput,
  CenterId,
  PlanetaryActivation,
  Channel,
} from '@/lib/types/human-design'
import {
  TYPE_LABELS_HEBREW,
  AUTHORITY_LABELS_HEBREW,
  CENTER_LABELS,
  CENTER_LABELS_HEBREW,
  DEFINITION_LABELS,
  DEFINITION_LABELS_HEBREW,
  CIRCUITRY_LABELS_HEBREW,
} from '@/lib/types/human-design'
import { getGate } from '@/lib/data/human-design-gates'
import { BodygraphChart } from '@/components/human-design/BodygraphChart'

// =============================================================================
// PROPS INTERFACES
// =============================================================================

export interface HumanDesignDisplayProps {
  date: string
  time?: string | null
  latitude: number
  longitude: number
  showActivations?: boolean
  showChannels?: boolean
  showCenters?: boolean
  compact?: boolean
  className?: string
}

export interface BodygraphSummaryCardProps {
  bodygraph: Bodygraph
  showDefinition?: boolean
  className?: string
}

export interface CenterStateDisplayProps {
  bodygraph: Bodygraph
  compact?: boolean
  className?: string
}

export interface ActivationsDisplayProps {
  bodygraph: Bodygraph
  showDesign?: boolean
  compact?: boolean
  className?: string
}

export interface ChannelsDisplayProps {
  channels: readonly Channel[]
  compact?: boolean
  className?: string
}

export interface MissingBirthTimeMessageProps {
  partial: PartialBodygraph
  className?: string
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Center badge showing defined/undefined state
 */
function CenterBadge({
  centerId,
  defined,
  compact = false,
}: {
  centerId: CenterId
  defined: boolean
  compact?: boolean
}) {
  const hebrewName = CENTER_LABELS_HEBREW[centerId]
  const englishName = CENTER_LABELS[centerId]

  const bgColor = defined
    ? getCenterColor(centerId)
    : 'bg-muted'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg transition-colors',
        compact ? 'p-1 min-w-[48px]' : 'p-2 min-w-[64px]',
        bgColor,
        defined ? 'text-white' : 'text-muted-foreground border border-dashed'
      )}
    >
      <span className={cn('font-semibold', compact ? 'text-xs' : 'text-sm')}>
        {englishName}
      </span>
      {!compact && (
        <span className="text-xs opacity-75">{hebrewName}</span>
      )}
    </div>
  )
}

/**
 * Get the color for a center (when defined)
 */
function getCenterColor(centerId: CenterId): string {
  const colors: Record<CenterId, string> = {
    head: 'bg-yellow-500',
    ajna: 'bg-green-500',
    throat: 'bg-amber-600',
    g: 'bg-yellow-400',
    heart: 'bg-red-500',
    spleen: 'bg-amber-700',
    sacral: 'bg-red-600',
    solar: 'bg-amber-600',
    root: 'bg-amber-700',
  }
  return colors[centerId]
}

/**
 * Activation row for displaying gate activations
 */
function ActivationRow({
  activation,
  isPersonality,
}: {
  activation: PlanetaryActivation
  isPersonality: boolean
}) {
  const gate = getGate(activation.gate)

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm py-1 px-2 rounded',
        isPersonality ? 'bg-black/5' : 'bg-red-500/10'
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          isPersonality ? 'bg-black' : 'bg-red-500'
        )}
      />
      <span className="font-medium w-8">{activation.planet}</span>
      <span className="font-bold text-base">{activation.gate}.{activation.line}</span>
      <span className="text-muted-foreground truncate">{gate.name}</span>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENTS
// =============================================================================

/**
 * Message shown when birth time is missing
 */
export function MissingBirthTimeMessage({
  partial,
  className = '',
}: MissingBirthTimeMessageProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border border-dashed',
        className
      )}
    >
      <div className="text-4xl mb-3">⏰</div>
      <p className="text-center text-muted-foreground">
        {partial.message}
      </p>
      <p className="text-center text-sm text-muted-foreground mt-2">
        {partial.messageHebrew}
      </p>
    </div>
  )
}

/**
 * Summary card showing Type, Authority, Profile, Definition
 */
export function BodygraphSummaryCard({
  bodygraph,
  showDefinition = true,
  className = '',
}: BodygraphSummaryCardProps) {
  const summary = getBodygraphSummary(bodygraph)

  return (
    <div
      className={cn('bodygraph-summary bg-card border rounded-lg p-4', className)}
    >
      {/* Type and Strategy */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold mb-1">
          {bodygraph.typeDefinition.name}
        </div>
        <div className="text-muted-foreground">
          {bodygraph.typeDefinition.nameHebrew}
        </div>
        <div className="text-sm mt-2 bg-muted p-2 rounded">
          <span className="font-medium">Strategy: </span>
          {bodygraph.typeDefinition.strategy}
          <span className="text-muted-foreground"> ({bodygraph.typeDefinition.strategyHebrew})</span>
        </div>
      </div>

      {/* Authority */}
      <div className="border-t pt-4 mb-4">
        <h4 className="text-sm font-medium mb-2">Inner Authority (סמכות פנימית)</h4>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {bodygraph.authorityDefinition.name}
          </span>
          <span className="text-sm text-muted-foreground">
            ({bodygraph.authorityDefinition.nameHebrew})
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {bodygraph.authorityDefinition.description}
        </p>
      </div>

      {/* Profile */}
      <div className="border-t pt-4 mb-4">
        <h4 className="text-sm font-medium mb-2">Profile (פרופיל)</h4>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{bodygraph.profile.id}</span>
          <div className="flex flex-col">
            <span className="font-semibold">{bodygraph.profile.name}</span>
            <span className="text-sm text-muted-foreground">{bodygraph.profile.nameHebrew}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {bodygraph.profile.theme}
        </p>
      </div>

      {/* Definition */}
      {showDefinition && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Definition (הגדרה)</h4>
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {DEFINITION_LABELS[bodygraph.definition]}
            </span>
            <span className="text-sm text-muted-foreground">
              ({DEFINITION_LABELS_HEBREW[bodygraph.definition]})
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {bodygraph.definedCenters.length} defined centers • {bodygraph.channels.length} channels
          </div>
        </div>
      )}

      {/* Incarnation Cross */}
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-medium mb-2">Incarnation Cross (צלב הגלגול)</h4>
        <div className="text-center p-3 bg-muted rounded">
          <div className="font-semibold">{bodygraph.incarnationCross.name}</div>
          <div className="text-sm text-muted-foreground">{bodygraph.incarnationCross.nameHebrew}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Gates: {bodygraph.incarnationCross.gates.personalitySun} / {bodygraph.incarnationCross.gates.personalityEarth} | {bodygraph.incarnationCross.gates.designSun} / {bodygraph.incarnationCross.gates.designEarth}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Display for center states (defined/undefined)
 */
export function CenterStateDisplay({
  bodygraph,
  compact = false,
  className = '',
}: CenterStateDisplayProps) {
  const centerOrder: CenterId[] = [
    'head',
    'ajna',
    'throat',
    'g',
    'heart',
    'spleen',
    'sacral',
    'solar',
    'root',
  ]

  return (
    <div className={cn('center-state-display', className)}>
      <h4 className="text-sm font-medium mb-3 text-center">
        Centers (מרכזים)
      </h4>
      <div className={cn('grid gap-2', compact ? 'grid-cols-5' : 'grid-cols-3')}>
        {centerOrder.map((centerId) => (
          <CenterBadge
            key={centerId}
            centerId={centerId}
            defined={bodygraph.centers[centerId].defined}
            compact={compact}
          />
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-amber-600 rounded" /> Defined
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-muted border border-dashed rounded" /> Open
        </span>
      </div>
    </div>
  )
}

/**
 * Display planetary activations (personality and design)
 */
export function ActivationsDisplay({
  bodygraph,
  showDesign = true,
  compact = false,
  className = '',
}: ActivationsDisplayProps) {
  return (
    <div className={cn('activations-display', className)}>
      <div className={cn('grid gap-4', showDesign ? 'grid-cols-2' : 'grid-cols-1')}>
        {/* Personality (Conscious) */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-black rounded-full" />
            Personality (Conscious)
          </h4>
          <div className="space-y-1">
            {bodygraph.activations.personality.slice(0, compact ? 5 : undefined).map((activation, i) => (
              <ActivationRow
                key={`personality-${i}`}
                activation={activation}
                isPersonality={true}
              />
            ))}
            {compact && bodygraph.activations.personality.length > 5 && (
              <div className="text-sm text-muted-foreground text-center">
                +{bodygraph.activations.personality.length - 5} more
              </div>
            )}
          </div>
        </div>

        {/* Design (Unconscious) */}
        {showDesign && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              Design (Unconscious)
            </h4>
            <div className="space-y-1">
              {bodygraph.activations.design.slice(0, compact ? 5 : undefined).map((activation, i) => (
                <ActivationRow
                  key={`design-${i}`}
                  activation={activation}
                  isPersonality={false}
                />
              ))}
              {compact && bodygraph.activations.design.length > 5 && (
                <div className="text-sm text-muted-foreground text-center">
                  +{bodygraph.activations.design.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Display defined channels
 */
export function ChannelsDisplay({
  channels,
  compact = false,
  className = '',
}: ChannelsDisplayProps) {
  if (channels.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground py-4', className)}>
        No defined channels (אין ערוצים מוגדרים)
      </div>
    )
  }

  return (
    <div className={cn('channels-display', className)}>
      <h4 className="text-sm font-medium mb-3">
        Defined Channels ({channels.length})
      </h4>
      <div className="space-y-2">
        {channels.slice(0, compact ? 5 : undefined).map((channel) => (
          <div
            key={channel.id}
            className="flex items-center gap-3 p-2 bg-muted rounded text-sm"
          >
            <span className="font-bold text-base">{channel.id}</span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium truncate">{channel.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {channel.nameHebrew} • {channel.circuitry}
              </span>
            </div>
          </div>
        ))}
        {compact && channels.length > 5 && (
          <div className="text-sm text-muted-foreground text-center">
            +{channels.length - 5} more channels
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Mini display for Human Design (compact view)
 */
export function HumanDesignMini({
  date,
  time,
  latitude,
  longitude,
  className = '',
}: {
  date: string
  time?: string | null
  latitude: number
  longitude: number
  className?: string
}) {
  const result = calculateBodygraph({
    birthDate: date,
    birthTime: time ?? null,
    latitude,
    longitude,
  })

  if (!isCompleteBodygraph(result)) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        Birth time required
      </div>
    )
  }

  return (
    <div className={cn('human-design-mini', className)}>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">{result.typeDefinition.name}</span>
        <span className="text-muted-foreground">•</span>
        <span>{result.profile.id}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-sm text-muted-foreground">
          {result.authorityDefinition.name}
        </span>
      </div>
    </div>
  )
}

/**
 * Main Human Design Display component
 */
export function HumanDesignDisplay({
  date,
  time,
  latitude,
  longitude,
  showActivations = true,
  showChannels = true,
  showCenters = true,
  compact = false,
  className = '',
}: HumanDesignDisplayProps) {
  const result = calculateBodygraph({
    birthDate: date,
    birthTime: time ?? null,
    latitude,
    longitude,
  })

  if (!isCompleteBodygraph(result)) {
    return <MissingBirthTimeMessage partial={result} className={className} />
  }

  return (
    <div className={cn('human-design-display space-y-6', className)}>
      {/* Visual Bodygraph Chart */}
      {result.isComplete && (
        <div className="bg-card border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3 text-center">Bodygraph (בודיגרף)</h4>
          <div className="flex justify-center">
            <BodygraphChart bodygraph={result} className="w-full max-w-[400px]" />
          </div>
        </div>
      )}

      {/* Summary Card */}
      <BodygraphSummaryCard
        bodygraph={result}
        showDefinition={!compact}
      />

      {/* Centers */}
      {showCenters && (
        <div className="bg-card border rounded-lg p-4">
          <CenterStateDisplay bodygraph={result} compact={compact} />
        </div>
      )}

      {/* Channels */}
      {showChannels && (
        <div className="bg-card border rounded-lg p-4">
          <ChannelsDisplay channels={result.channels} compact={compact} />
        </div>
      )}

      {/* Activations */}
      {showActivations && (
        <div className="bg-card border rounded-lg p-4">
          <ActivationsDisplay bodygraph={result} compact={compact} />
        </div>
      )}
    </div>
  )
}

export default HumanDesignDisplay
