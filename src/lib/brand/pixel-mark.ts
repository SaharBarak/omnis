/**
 * The Lantern as pixels (docs/redesign/BENTO_V2.md "Pixel mark"): the mark's
 * own paths sampled onto a grid, for art that assembles the logo from
 * squares. Pure and deterministic; the canvas that draws it lives in the v2
 * kit. Pages read the generated table (`pixel-lantern.gen.ts`, written by
 * `npm run brand:icons`); sampling the paths costs too much to run on load.
 */

import { LANTERN, MARK_PARTS, lanternShape, type Lantern, type MarkPart } from './mark'
import { flattenPath, insidePath, type Polygon } from '@/lib/geometry/svg-path'

export interface PixelCell {
  readonly col: number
  readonly row: number
  readonly part: MarkPart
  /** Share of the cell that is ink, 0 to 1; edge cells draw dimmer. */
  readonly cover: number
}

export interface PixelMark {
  readonly cols: number
  readonly rows: number
  readonly cells: readonly PixelCell[]
}

/** Sub-samples per cell side; a cell's coverage is read on this grid. */
export const SAMPLES = 4

/** A cell is lit when at least this share of it is ink. */
export const LIT_COVER = 1 / 2

/** One cell is the drawing's thinnest band, the hanger ring, so every part survives the grid. */
export const cellOf = (l: Lantern): number => l.ring.outer - l.ring.inner

/** The mark's parts as lit cells, top-left first, in reading order. */
export function rasterLantern(l: Lantern = LANTERN, cell: number = cellOf(l)): PixelMark {
  const { paths, box } = lanternShape(l)
  const shapes: ReadonlyArray<readonly [MarkPart, readonly Polygon[]]> = MARK_PARTS.map((part) => [part, flattenPath(paths[part])])
  const cols = Math.round(box.width / cell)
  const rows = Math.round(box.height / cell)
  const cells: PixelCell[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const hits = new Map<MarkPart, number>()
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const point = [box.x + (col + (sx + 0.5) / SAMPLES) * cell, box.y + (row + (sy + 0.5) / SAMPLES) * cell] as const
          const hit = shapes.find(([, polygons]) => insidePath(polygons, point))
          if (hit) hits.set(hit[0], (hits.get(hit[0]) ?? 0) + 1)
        }
      }
      const ink = [...hits.values()].reduce((sum, n) => sum + n, 0)
      const cover = ink / SAMPLES ** 2
      if (cover < LIT_COVER) continue
      const [part] = [...hits.entries()].reduce((best, next) => (next[1] > best[1] ? next : best))
      cells.push({ col, row, part, cover })
    }
  }
  return { cols, rows, cells }
}
