import type { CenterId } from '@pleiad/engine/types/human-design'

// =============================================================================
// SHARED BODYGRAPH GEOMETRY
// =============================================================================
// Single source of truth for the SVG anatomy used by BodygraphChart,
// CompositeBodygraphChart and PentaChart. Keep positions/shapes here so the
// single-person and composite views stay visually identical.

export const VIEW_WIDTH = 400
export const VIEW_HEIGHT = 560

export interface CenterPosition {
  x: number
  y: number
  shape: 'triangle' | 'triangle-inv' | 'square' | 'diamond' | 'triangle-right' | 'triangle-left'
  size: number
}

/** Anatomical positions for each center */
export const CENTER_POSITIONS: Record<CenterId, CenterPosition> = {
  head:   { x: 200, y: 45,  shape: 'triangle',       size: 30 },
  ajna:   { x: 200, y: 115, shape: 'triangle-inv',   size: 30 },
  throat: { x: 200, y: 190, shape: 'square',          size: 28 },
  g:      { x: 200, y: 280, shape: 'diamond',         size: 32 },
  heart:  { x: 305, y: 245, shape: 'triangle-right',  size: 22 },
  spleen: { x: 95,  y: 340, shape: 'triangle-left',   size: 26 },
  sacral: { x: 200, y: 380, shape: 'square',          size: 28 },
  solar:  { x: 305, y: 380, shape: 'triangle-right',  size: 26 },
  root:   { x: 200, y: 480, shape: 'square',          size: 30 },
}

/** Colors for defined centers */
export const CENTER_COLORS: Record<CenterId, string> = {
  head:   '#F5C542',
  ajna:   '#5CB85C',
  throat: '#D4813B',
  g:      '#F5D442',
  heart:  '#E74C3C',
  spleen: '#C9822B',
  sacral: '#D44C3C',
  solar:  '#D4813B',
  root:   '#C9822B',
}

export const CENTER_GLOW: Record<CenterId, string> = {
  head:   '#F5C54280',
  ajna:   '#5CB85C80',
  throat: '#D4813B80',
  g:      '#F5D44280',
  heart:  '#E74C3C80',
  spleen: '#C9822B80',
  sacral: '#D44C3C80',
  solar:  '#D4813B80',
  root:   '#C9822B80',
}

export function getCenterPath(pos: CenterPosition): string {
  const { x, y, shape, size } = pos
  switch (shape) {
    case 'triangle':
      return `M ${x} ${y - size} L ${x + size} ${y + size * 0.6} L ${x - size} ${y + size * 0.6} Z`
    case 'triangle-inv':
      return `M ${x} ${y + size} L ${x + size} ${y - size * 0.6} L ${x - size} ${y - size * 0.6} Z`
    case 'square':
      return `M ${x - size} ${y - size} L ${x + size} ${y - size} L ${x + size} ${y + size} L ${x - size} ${y + size} Z`
    case 'diamond':
      return `M ${x} ${y - size} L ${x + size} ${y} L ${x} ${y + size} L ${x - size} ${y} Z`
    case 'triangle-right':
      return `M ${x - size} ${y - size} L ${x + size} ${y} L ${x - size} ${y + size} Z`
    case 'triangle-left':
      return `M ${x + size} ${y - size} L ${x - size} ${y} L ${x + size} ${y + size} Z`
  }
}

/** Get a point along the line between two centers, at a fraction t (0=center1, 1=center2) */
export function lerp(c1: CenterPosition, c2: CenterPosition, t: number): { x: number; y: number } {
  return {
    x: c1.x + (c2.x - c1.x) * t,
    y: c1.y + (c2.y - c1.y) * t,
  }
}
