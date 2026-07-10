/**
 * Castle Data - 5 castles of 52 days each in the 260-day Tzolkin cycle
 *
 * Each castle contains 4 wavespells and represents a major phase
 * in the galactic journey of consciousness.
 */

export type CastleColor = 'red' | 'white' | 'blue' | 'yellow' | 'green'

export interface CastleData {
  number: number          // 1-5
  color: CastleColor      // Red, White, Blue, Yellow, Green
  name: string            // English name
  nameHebrew: string      // Hebrew name
  kinRange: [number, number]  // [startKin, endKin]
  wavespellRange: [number, number]  // [startWavespell, endWavespell]
  court: string           // Court designation
  theme: string           // Primary theme
  action: string          // Primary action
  description: string     // Detailed description
  direction: string       // Cardinal direction
}

export const CASTLES: readonly CastleData[] = Object.freeze([
  {
    number: 1,
    color: 'red',
    name: 'Castle of Turning',
    nameHebrew: 'טירת הסיבוב',
    kinRange: [1, 52],
    wavespellRange: [1, 4],
    court: 'Eastern Court of Birth',
    theme: 'Initiation',
    action: 'Initiates',
    direction: 'East',
    description: 'The Red Castle of Turning is the place of birth and initiation. Here, the seed of galactic consciousness is planted. The first four wavespells (Dragon, Wizard, Hand, Sun) guide us through the primal awakening of existence. We learn to nurture, enchant, heal, and enlighten as we turn toward our cosmic purpose.',
  },
  {
    number: 2,
    color: 'white',
    name: 'Castle of Crossing',
    nameHebrew: 'טירת המעבר',
    kinRange: [53, 104],
    wavespellRange: [5, 8],
    court: 'Northern Court of Death',
    theme: 'Refinement',
    action: 'Refines',
    direction: 'North',
    description: 'The White Castle of Crossing is the place of death and refinement. Here, we cross the threshold between the known and unknown. The wavespells of Skywalker, Worldbridger, Storm, and Human teach us to explore, surrender, transform, and choose freely. We refine our essence by releasing what no longer serves.',
  },
  {
    number: 3,
    color: 'blue',
    name: 'Castle of Burning',
    nameHebrew: 'טירת הבעירה',
    kinRange: [105, 156],
    wavespellRange: [9, 12],
    court: 'Western Court of Magic',
    theme: 'Transformation',
    action: 'Transforms',
    direction: 'West',
    description: 'The Blue Castle of Burning is the place of magic and transformation. Here, the alchemical fire of change purifies and transmutes. Through Serpent, Mirror, Monkey, and Seed, we awaken our life force, see truth clearly, rediscover sacred play, and plant seeds of conscious intention. Deep transformation burns away illusion.',
  },
  {
    number: 4,
    color: 'yellow',
    name: 'Castle of Giving',
    nameHebrew: 'טירת הנתינה',
    kinRange: [157, 208],
    wavespellRange: [13, 16],
    court: 'Southern Court of Intelligence',
    theme: 'Ripening',
    action: 'Ripens',
    direction: 'South',
    description: 'The Yellow Castle of Giving is the place of intelligence and ripening. Here, the fruits of our journey mature. Earth, Dog, Night, and Warrior guide us to navigate synchronicity, love unconditionally, dream abundantly, and question fearlessly. We give our gifts back to the world as mature beings.',
  },
  {
    number: 5,
    color: 'green',
    name: 'Castle of Enchantment',
    nameHebrew: 'טירת הקסם',
    kinRange: [209, 260],
    wavespellRange: [17, 20],
    court: 'Central Court of Synchronization',
    theme: 'Matrix',
    action: 'Enchants',
    direction: 'Center',
    description: 'The Green Castle of Enchantment is the place of synchronization and the matrix. Here, all threads weave together. Moon, Wind, Eagle, and Star complete the journey through purification, spirit, vision, and art. This is the place of galactic return, where we remember our cosmic origin and purpose.',
  },
])

export function getCastleData(castleNumber: number): CastleData {
  if (castleNumber < 1 || castleNumber > 5) {
    throw new RangeError(`Invalid castle number: ${castleNumber}`)
  }
  return CASTLES[castleNumber - 1]
}

export function getCastleByKin(kin: number): CastleData {
  const castleNumber = Math.ceil(kin / 52)
  return getCastleData(castleNumber)
}

export function getCastleByWavespell(wavespellNumber: number): CastleData {
  const castleNumber = Math.ceil(wavespellNumber / 4)
  return getCastleData(castleNumber)
}

export function getCastleColor(castleNumber: number): CastleColor {
  const colors: CastleColor[] = ['red', 'white', 'blue', 'yellow', 'green']
  return colors[castleNumber - 1]
}

/**
 * Get the wavespell numbers that belong to a castle
 */
export function getCastleWavespellNumbers(castleNumber: number): number[] {
  const start = (castleNumber - 1) * 4 + 1
  return [start, start + 1, start + 2, start + 3]
}
