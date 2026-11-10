/**
 * The five phases (五行 wǔxíng), in the order of their generating cycle,
 * wood feeding fire, fire making earth, earth bearing metal, metal carrying
 * water, water nourishing wood: each its character and pinyin, the colour
 * and season the correspondences give it. Table as
 * in https://en.wikipedia.org/wiki/Wuxing_(Chinese_philosophy) ("Cycles",
 * "Correspondences"): wood 青 (the blue-green of new growth), fire 赤 red,
 * earth 黄 yellow, metal 白 white, water 黑 black; wood spring, fire summer,
 * earth the late summer (and the turn of each season), metal autumn, water
 * winter.
 */

export type PhaseName = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water'

/** A phase's colour as the correspondences name it. */
export type PhaseColour = 'blue-green' | 'red' | 'yellow' | 'white' | 'black'

export interface Phase {
  readonly name: PhaseName
  readonly character: string
  readonly pinyin: string
  readonly colour: PhaseColour
  /** The colour's own character. */
  readonly colourCharacter: string
  readonly season: 'spring' | 'summer' | 'late summer' | 'autumn' | 'winter'
}

export const PHASES: readonly Phase[] = Object.freeze([
  { name: 'Wood', character: '木', pinyin: 'mù', colour: 'blue-green', colourCharacter: '青', season: 'spring' },
  { name: 'Fire', character: '火', pinyin: 'huǒ', colour: 'red', colourCharacter: '赤', season: 'summer' },
  { name: 'Earth', character: '土', pinyin: 'tǔ', colour: 'yellow', colourCharacter: '黄', season: 'late summer' },
  { name: 'Metal', character: '金', pinyin: 'jīn', colour: 'white', colourCharacter: '白', season: 'autumn' },
  { name: 'Water', character: '水', pinyin: 'shuǐ', colour: 'black', colourCharacter: '黑', season: 'winter' },
])

/** A phase by its name. */
export const phaseNamed = (name: PhaseName): Phase => {
  const phase = PHASES.find((p) => p.name === name)
  if (!phase) throw new RangeError(`No phase ${name}`)
  return phase
}
