import { baseRateOf, EDGE_CEILING, mayDrawEdge, surprisal, TIER_CEILING } from '@pleiad/engine/services/rarity'
import { tieOdds } from '@/lib/relations/odds'

/**
 * The rarity scale behind BaseRateChart (BENTO_MOTION.md storyboard 6,
 * "Method"). Every number is read from the engine's measured base rates and
 * its tier ceilings; nothing here is tuned by hand except layout fractions.
 */

/** One measured kind of tie: its share of random pairs and the bits that share is worth. */
export interface BaseRateRow {
  readonly type: string
  readonly label: string
  readonly share: number
  readonly bits: number
}

/** One tie a sample pair actually has, placed on the same scale. */
export interface SampleTie {
  readonly key: string
  readonly label: string
  readonly share: number
  readonly bits: number
}

export interface BaseRateSample {
  /** Who the ties belong to, e.g. "Maya and Ari". */
  readonly label: string
  readonly ties: readonly SampleTie[]
}

/** A measured row by its engine type name: share and bits come from the rarity service. */
export const measuredRow = (type: string, label: string): BaseRateRow => ({ type, label, share: baseRateOf(type), bits: surprisal(type) })

export interface ChartColumn extends BaseRateRow {
  /** Centre of the column, 0..1 across the plot, commonest on the left. */
  readonly x: number
  readonly odds: string
  readonly drawn: boolean
  readonly leads: boolean
}

export interface ChartDot extends SampleTie {
  readonly x: number
  readonly drawn: boolean
  /** Row in the lane, so dots that would touch stack instead. */
  readonly level: number
}

export interface ChartMark {
  readonly x: number
  readonly share: number
  readonly odds: string
}

export interface ChartModel {
  readonly columns: readonly ChartColumn[]
  readonly dots: readonly ChartDot[]
  readonly levels: number
  /** The line-or-no-line threshold: the ceiling of the commonest drawn tier. */
  readonly edge: ChartMark
  /** The ceiling of the rarest tier: ties past it lead the map. */
  readonly lead: ChartMark
}

/** Closest two dots may sit in one lane row, as a share of the plot width. */
const DOT_GAP = 0.04
/** How far past the rarest column the scale runs before the plot ends. */
const TAIL = 0.6

const weight = (share: number): number => (share >= 1 ? 0 : share <= 0 ? Number.POSITIVE_INFINITY : -Math.log2(share))

const [RAREST_TIER] = TIER_CEILING
const LEAD_CEILING = RAREST_TIER ? RAREST_TIER[1] : EDGE_CEILING

/**
 * Position on the plot for a weight in bits: piecewise linear between the
 * measured columns, so the scale reads common on the left and rare on the
 * right with every column evenly spaced and labelled.
 */
const scaleOf = (columns: readonly { readonly x: number; readonly w: number }[]) => (bits: number): number => {
  const first = columns[0]
  const last = columns[columns.length - 1]
  if (!first || !last) return 0.5
  if (bits <= first.w) return first.w > 0 ? first.x * (bits / first.w) : first.x
  const upper = columns.findIndex((c) => c.w >= bits)
  if (upper < 0) {
    const room = (1 - last.x) * TAIL
    return last.x + room * Math.min(1, (bits - last.w) / Math.max(last.w, 1))
  }
  const hi = columns[upper]
  const lo = columns[upper - 1] ?? hi
  const span = hi.w - lo.w
  return span > 0 ? lo.x + ((bits - lo.w) / span) * (hi.x - lo.x) : hi.x
}

const stack = (dots: readonly Omit<ChartDot, 'level'>[]): readonly ChartDot[] => {
  const ends: number[] = []
  return [...dots]
    .sort((a, b) => a.x - b.x)
    .map((dot) => {
      const free = ends.findIndex((end) => dot.x - end >= DOT_GAP)
      const level = free < 0 ? ends.length : free
      ends[level] = dot.x
      return { ...dot, level }
    })
}

export function baseRateModel(rows: readonly BaseRateRow[], sample?: BaseRateSample): ChartModel {
  const sorted = [...rows].sort((a, b) => b.share - a.share)
  const placed = sorted.map((row, i) => ({ row, x: (i + 0.5) / sorted.length, w: weight(row.share) }))
  const at = scaleOf(placed)
  const columns = placed.map(({ row, x }) => ({
    ...row,
    x,
    odds: tieOdds(row.share),
    drawn: mayDrawEdge(row.share),
    leads: row.share < LEAD_CEILING,
  }))
  const dots = stack((sample?.ties ?? []).map((tie) => ({ ...tie, x: at(weight(tie.share)), drawn: mayDrawEdge(tie.share) })))
  return {
    columns,
    dots,
    levels: dots.reduce((most, dot) => Math.max(most, dot.level + 1), 0),
    edge: { x: at(weight(EDGE_CEILING)), share: EDGE_CEILING, odds: tieOdds(EDGE_CEILING) },
    lead: { x: at(weight(LEAD_CEILING)), share: LEAD_CEILING, odds: tieOdds(LEAD_CEILING) },
  }
}
