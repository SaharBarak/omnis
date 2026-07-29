/**
 * The Tree of Life (#76) — ten sefirot and twenty-two connecting paths.
 *
 * Path-to-letter attribution follows the Kircher arrangement (the most
 * widely illustrated tree). Jewish trees (GRA, Ari) draw several paths
 * differently — the page presenting this data says so; the sefirot and
 * pillars are common to all arrangements.
 *
 * Coordinates are SVG-friendly: x in 0-100 (three pillars at 20/50/80),
 * y in 0-130 top-down.
 */

import type { HebrewLetterId } from '../types/gematria'

export type Pillar = 'severity' | 'equilibrium' | 'mercy'

export interface Sefirah {
  /** 1-10 in the order of emanation. */
  readonly number: number
  readonly id: string
  readonly name: string
  readonly hebrew: string
  readonly translation: string
  readonly pillar: Pillar
  readonly meaning: string
  /** SVG layout position. */
  readonly x: number
  readonly y: number
}

export const SEFIROT: readonly Sefirah[] = Object.freeze([
  { number: 1, id: 'keter', name: 'Keter', hebrew: 'כתר', translation: 'Crown', pillar: 'equilibrium', meaning: 'The first stirring of will, before any form — closer to the source than thought can reach', x: 50, y: 8 },
  { number: 2, id: 'chokhmah', name: 'Chokhmah', hebrew: 'חכמה', translation: 'Wisdom', pillar: 'mercy', meaning: 'The flash of insight — undivided knowing before it is broken into pieces', x: 80, y: 26 },
  { number: 3, id: 'binah', name: 'Binah', hebrew: 'בינה', translation: 'Understanding', pillar: 'severity', meaning: 'The womb of form — insight given structure, distinction, and limit', x: 20, y: 26 },
  { number: 4, id: 'chesed', name: 'Chesed', hebrew: 'חסד', translation: 'Kindness', pillar: 'mercy', meaning: 'Expansive giving — love that flows without measure', x: 80, y: 54 },
  { number: 5, id: 'gevurah', name: 'Gevurah', hebrew: 'גבורה', translation: 'Strength', pillar: 'severity', meaning: 'Restraint and judgment — the discipline that gives giving a shape', x: 20, y: 54 },
  { number: 6, id: 'tiferet', name: 'Tiferet', hebrew: 'תפארת', translation: 'Beauty', pillar: 'equilibrium', meaning: 'The heart of the tree — kindness and severity reconciled into harmony', x: 50, y: 68 },
  { number: 7, id: 'netzach', name: 'Netzach', hebrew: 'נצח', translation: 'Eternity', pillar: 'mercy', meaning: 'Endurance and drive — the will to prevail and continue', x: 80, y: 88 },
  { number: 8, id: 'hod', name: 'Hod', hebrew: 'הוד', translation: 'Splendor', pillar: 'severity', meaning: 'Surrender and form in language — the glory of articulation', x: 20, y: 88 },
  { number: 9, id: 'yesod', name: 'Yesod', hebrew: 'יסוד', translation: 'Foundation', pillar: 'equilibrium', meaning: 'The channel that gathers everything above and transmits it below', x: 50, y: 104 },
  { number: 10, id: 'malkhut', name: 'Malkhut', hebrew: 'מלכות', translation: 'Kingdom', pillar: 'equilibrium', meaning: 'The world as it is — the presence received and made manifest', x: 50, y: 124 },
])

export interface TreePath {
  /** 11-32 by the traditional numbering (paths follow the ten sefirot). */
  readonly number: number
  readonly from: string
  readonly to: string
  readonly letterId: HebrewLetterId
}

export const TREE_PATHS: readonly TreePath[] = Object.freeze([
  { number: 11, from: 'keter', to: 'chokhmah', letterId: 'aleph' },
  { number: 12, from: 'keter', to: 'binah', letterId: 'bet' },
  { number: 13, from: 'keter', to: 'tiferet', letterId: 'gimel' },
  { number: 14, from: 'chokhmah', to: 'binah', letterId: 'dalet' },
  { number: 15, from: 'chokhmah', to: 'tiferet', letterId: 'he' },
  { number: 16, from: 'chokhmah', to: 'chesed', letterId: 'vav' },
  { number: 17, from: 'binah', to: 'tiferet', letterId: 'zayin' },
  { number: 18, from: 'binah', to: 'gevurah', letterId: 'chet' },
  { number: 19, from: 'chesed', to: 'gevurah', letterId: 'tet' },
  { number: 20, from: 'chesed', to: 'tiferet', letterId: 'yod' },
  { number: 21, from: 'chesed', to: 'netzach', letterId: 'kaf' },
  { number: 22, from: 'gevurah', to: 'tiferet', letterId: 'lamed' },
  { number: 23, from: 'gevurah', to: 'hod', letterId: 'mem' },
  { number: 24, from: 'tiferet', to: 'netzach', letterId: 'nun' },
  { number: 25, from: 'tiferet', to: 'yesod', letterId: 'samech' },
  { number: 26, from: 'tiferet', to: 'hod', letterId: 'ayin' },
  { number: 27, from: 'netzach', to: 'hod', letterId: 'pe' },
  { number: 28, from: 'netzach', to: 'yesod', letterId: 'tsadi' },
  { number: 29, from: 'netzach', to: 'malkhut', letterId: 'qof' },
  { number: 30, from: 'hod', to: 'yesod', letterId: 'resh' },
  { number: 31, from: 'hod', to: 'malkhut', letterId: 'shin' },
  { number: 32, from: 'yesod', to: 'malkhut', letterId: 'tav' },
])

export const SEFIRAH_BY_ID: Readonly<Record<string, Sefirah>> = Object.freeze(
  Object.fromEntries(SEFIROT.map((s) => [s.id, s]))
)
