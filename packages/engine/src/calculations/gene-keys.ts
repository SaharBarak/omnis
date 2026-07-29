/**
 * Gene Keys Golden Path profile (#75) — the hologenetic profile derived
 * from the same planetary gate activations Human Design computes.
 *
 * Sphere → planet mapping per the official Gene Keys correlation docs
 * (genekeys.com "What planets does each Sphere correlate to"):
 * - Activation: Life's Work = personality Sun, Evolution = personality
 *   Earth, Radiance = design Sun, Purpose = design Earth.
 * - Venus: Attraction = design Moon, IQ = personality Venus, EQ =
 *   personality Mars, SQ = design Venus, Core = design Mars.
 * - Pearl: Vocation = design Mars, Culture = design Jupiter, Brand =
 *   personality Sun (= Life's Work), Pearl = personality Jupiter.
 *
 * Gene Key n is Human Design gate n; the line carries over unchanged.
 */

import type { ActivationSet, PlanetaryActivation } from '../types/human-design'
import { GENE_KEYS, type GeneKey } from '../data/gene-keys'

export type GeneKeysSequence = 'activation' | 'venus' | 'pearl'

export interface GeneKeysSphere {
  readonly sequence: GeneKeysSequence
  readonly sphere: string
  /** What this sphere speaks to, one line. */
  readonly theme: string
  readonly geneKey: GeneKey
  /** 1-6, carried from the HD activation line. */
  readonly line: number
}

export interface GeneKeysProfile {
  readonly activation: readonly GeneKeysSphere[]
  readonly venus: readonly GeneKeysSphere[]
  readonly pearl: readonly GeneKeysSphere[]
}

interface SphereSpec {
  readonly sequence: GeneKeysSequence
  readonly sphere: string
  readonly theme: string
  readonly side: 'personality' | 'design'
  readonly planet: string
}

const SPHERES: readonly SphereSpec[] = [
  { sequence: 'activation', sphere: "Life's Work", theme: 'What you are here to do', side: 'personality', planet: 'sun' },
  { sequence: 'activation', sphere: 'Evolution', theme: 'What life is teaching you', side: 'personality', planet: 'earth' },
  { sequence: 'activation', sphere: 'Radiance', theme: 'What keeps you healthy and alive', side: 'design', planet: 'sun' },
  { sequence: 'activation', sphere: 'Purpose', theme: 'What fulfills you at the deepest level', side: 'design', planet: 'earth' },
  { sequence: 'venus', sphere: 'Attraction', theme: 'Who and what you draw toward you', side: 'design', planet: 'moon' },
  { sequence: 'venus', sphere: 'IQ', theme: 'The mental patterns learned from 7-14', side: 'personality', planet: 'venus' },
  { sequence: 'venus', sphere: 'EQ', theme: 'The emotional patterns learned from 0-7', side: 'personality', planet: 'mars' },
  { sequence: 'venus', sphere: 'SQ', theme: 'The imprint of your earliest bonding', side: 'design', planet: 'venus' },
  { sequence: 'venus', sphere: 'Core', theme: 'The wound at the root of the sequence', side: 'design', planet: 'mars' },
  { sequence: 'pearl', sphere: 'Vocation', theme: 'The work that liberates your prosperity', side: 'design', planet: 'mars' },
  { sequence: 'pearl', sphere: 'Culture', theme: 'Where you belong in the collective', side: 'design', planet: 'jupiter' },
  { sequence: 'pearl', sphere: 'Pearl', theme: 'The reward that follows service', side: 'personality', planet: 'jupiter' },
]

function findActivation(
  list: readonly PlanetaryActivation[],
  planet: string
): PlanetaryActivation | undefined {
  return list.find((a) => a.planet === planet)
}

/**
 * The Golden Path spheres from an HD activation set. Spheres whose planet
 * is missing from the activation lists are omitted rather than invented.
 */
export function geneKeysProfile(activations: ActivationSet): GeneKeysProfile {
  const spheres: GeneKeysSphere[] = []
  for (const spec of SPHERES) {
    const list = spec.side === 'personality' ? activations.personality : activations.design
    const activation = findActivation(list, spec.planet)
    if (!activation) continue
    spheres.push({
      sequence: spec.sequence,
      sphere: spec.sphere,
      theme: spec.theme,
      geneKey: GENE_KEYS[activation.gate - 1],
      line: activation.line,
    })
  }
  return {
    activation: spheres.filter((s) => s.sequence === 'activation'),
    venus: spheres.filter((s) => s.sequence === 'venus'),
    pearl: spheres.filter((s) => s.sequence === 'pearl'),
  }
}
