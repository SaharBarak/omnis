/**
 * Wavespell Data - 20 wavespells of 13 days each in the 260-day Tzolkin cycle
 *
 * Each wavespell is named after its first kin (Magnetic tone, Tone 1)
 * and represents a 13-day journey of purpose through transcendence.
 */

export interface WavespellData {
  number: number        // 1-20
  sealNumber: number    // 1-20 (the seal that defines this wavespell)
  name: string          // English name
  nameHebrew: string    // Hebrew name
  kinRange: [number, number]  // [startKin, endKin]
  theme: string         // Brief theme description
  journey: string       // The journey/transformation of this wavespell
  purpose: string       // What this wavespell initiates
  question: string      // The question this wavespell asks
}

export const WAVESPELLS: readonly WavespellData[] = Object.freeze([
  {
    number: 1,
    sealNumber: 1,
    name: 'Red Dragon Wavespell',
    nameHebrew: 'גל הדרקון האדום',
    kinRange: [1, 13],
    theme: 'Birth & Nurturing',
    journey: 'From purpose through transcendence',
    purpose: 'Nurturing the primordial force of being',
    question: 'What needs to be birthed into existence?',
  },
  {
    number: 2,
    sealNumber: 14,
    name: 'White Wizard Wavespell',
    nameHebrew: 'גל הקוסם הלבן',
    kinRange: [14, 26],
    theme: 'Timelessness & Enchantment',
    journey: 'Enchanting receptivity into manifestation',
    purpose: 'Opening to the eternal present moment',
    question: 'What magic wants to flow through you?',
  },
  {
    number: 3,
    sealNumber: 7,
    name: 'Blue Hand Wavespell',
    nameHebrew: 'גל היד הכחולה',
    kinRange: [27, 39],
    theme: 'Healing & Accomplishment',
    journey: 'Knowing through doing, healing through touch',
    purpose: 'Activating the power of accomplishment',
    question: 'What needs to be healed or completed?',
  },
  {
    number: 4,
    sealNumber: 20,
    name: 'Yellow Sun Wavespell',
    nameHebrew: 'גל השמש הצהובה',
    kinRange: [40, 52],
    theme: 'Enlightenment & Universal Fire',
    journey: 'Universal fire illuminating all life',
    purpose: 'Awakening to the light of consciousness',
    question: 'What truth wants to be illuminated?',
  },
  {
    number: 5,
    sealNumber: 13,
    name: 'Red Skywalker Wavespell',
    nameHebrew: 'גל הולך השמיים האדום',
    kinRange: [53, 65],
    theme: 'Space & Exploration',
    journey: 'Wakefulness expanding into new dimensions',
    purpose: 'Exploring the limitless frontier of consciousness',
    question: 'What new territory is calling you?',
  },
  {
    number: 6,
    sealNumber: 6,
    name: 'White Worldbridger Wavespell',
    nameHebrew: 'גל מגשר העולמות הלבן',
    kinRange: [66, 78],
    theme: 'Surrender & Opportunity',
    journey: 'Death leading to rebirth through release',
    purpose: 'Bridging worlds through letting go',
    question: 'What must die so new life can emerge?',
  },
  {
    number: 7,
    sealNumber: 19,
    name: 'Blue Storm Wavespell',
    nameHebrew: 'גל הסערה הכחולה',
    kinRange: [79, 91],
    theme: 'Transformation & Catalysis',
    journey: 'Self-generation catalyzing radical change',
    purpose: 'Activating the transformative power within',
    question: 'What energy is ready to break through?',
  },
  {
    number: 8,
    sealNumber: 12,
    name: 'Yellow Human Wavespell',
    nameHebrew: 'גל האדם הצהוב',
    kinRange: [92, 104],
    theme: 'Free Will & Wisdom',
    journey: 'Wisdom influencing choice through freedom',
    purpose: 'Embracing the power of conscious choice',
    question: 'How will you use your free will?',
  },
  {
    number: 9,
    sealNumber: 5,
    name: 'Red Serpent Wavespell',
    nameHebrew: 'גל הנחש האדום',
    kinRange: [105, 117],
    theme: 'Life Force & Instinct',
    journey: 'Instinct and survival awakening kundalini',
    purpose: 'Activating the primal life force energy',
    question: 'What does your body know?',
  },
  {
    number: 10,
    sealNumber: 18,
    name: 'White Mirror Wavespell',
    nameHebrew: 'גל המראה הלבנה',
    kinRange: [118, 130],
    theme: 'Reflection & Endless Order',
    journey: 'Endless order revealed through reflection',
    purpose: 'Seeing truth in the mirror of reality',
    question: 'What is being reflected back to you?',
  },
  {
    number: 11,
    sealNumber: 11,
    name: 'Blue Monkey Wavespell',
    nameHebrew: 'גל הקוף הכחול',
    kinRange: [131, 143],
    theme: 'Magic & Play',
    journey: 'Illusion as teacher, play as wisdom',
    purpose: 'Rediscovering the magic of innocent play',
    question: 'What happens when you stop being serious?',
  },
  {
    number: 12,
    sealNumber: 4,
    name: 'Yellow Seed Wavespell',
    nameHebrew: 'גל הזרע הצהוב',
    kinRange: [144, 156],
    theme: 'Flowering & Awareness',
    journey: 'Awareness targeting growth and blooming',
    purpose: 'Planting seeds of conscious intention',
    question: 'What are you ready to plant and nurture?',
  },
  {
    number: 13,
    sealNumber: 17,
    name: 'Red Earth Wavespell',
    nameHebrew: 'גל האדמה האדומה',
    kinRange: [157, 169],
    theme: 'Synchronicity & Navigation',
    journey: 'Navigation evolving through synchronicity',
    purpose: 'Grounding in the flow of natural time',
    question: 'What synchronicities are guiding you?',
  },
  {
    number: 14,
    sealNumber: 10,
    name: 'White Dog Wavespell',
    nameHebrew: 'גל הכלב הלבן',
    kinRange: [170, 182],
    theme: 'Love & Loyalty',
    journey: 'Heart guiding through unconditional love',
    purpose: 'Opening to the power of heart-centered living',
    question: 'What does your heart truly love?',
  },
  {
    number: 15,
    sealNumber: 3,
    name: 'Blue Night Wavespell',
    nameHebrew: 'גל הלילה הכחול',
    kinRange: [183, 195],
    theme: 'Abundance & Intuition',
    journey: 'Dreams of intuition revealing abundance',
    purpose: 'Accessing the limitless dreaming mind',
    question: 'What dreams are trying to manifest?',
  },
  {
    number: 16,
    sealNumber: 16,
    name: 'Yellow Warrior Wavespell',
    nameHebrew: 'גל הלוחם הצהוב',
    kinRange: [196, 208],
    theme: 'Intelligence & Fearlessness',
    journey: 'Questions bringing fearlessness through intelligence',
    purpose: 'Awakening the courage to question everything',
    question: 'What are you willing to fight for?',
  },
  {
    number: 17,
    sealNumber: 9,
    name: 'Red Moon Wavespell',
    nameHebrew: 'גל הירח האדום',
    kinRange: [209, 221],
    theme: 'Universal Water & Purification',
    journey: 'Purification flowing through surrender',
    purpose: 'Cleansing and releasing into the cosmic flow',
    question: 'What needs to be purified or released?',
  },
  {
    number: 18,
    sealNumber: 2,
    name: 'White Wind Wavespell',
    nameHebrew: 'גל הרוח הלבנה',
    kinRange: [222, 234],
    theme: 'Spirit & Communication',
    journey: 'Communication breathing spirit into form',
    purpose: 'Channeling the divine breath of inspiration',
    question: 'What message wants to be communicated?',
  },
  {
    number: 19,
    sealNumber: 15,
    name: 'Blue Eagle Wavespell',
    nameHebrew: 'גל הנשר הכחול',
    kinRange: [235, 247],
    theme: 'Vision & Mind',
    journey: 'Mind creating through visionary perception',
    purpose: 'Seeing from the highest perspective',
    question: 'What can you see from the eagle\'s view?',
  },
  {
    number: 20,
    sealNumber: 8,
    name: 'Yellow Star Wavespell',
    nameHebrew: 'גל הכוכב הצהוב',
    kinRange: [248, 260],
    theme: 'Elegance & Art',
    journey: 'Art beautifying existence through harmony',
    purpose: 'Expressing beauty and artistic vision',
    question: 'How can you bring more beauty into the world?',
  },
])

export function getWavespellData(wavespellNumber: number): WavespellData {
  if (wavespellNumber < 1 || wavespellNumber > 20) {
    throw new RangeError(`Invalid wavespell number: ${wavespellNumber}`)
  }
  return WAVESPELLS[wavespellNumber - 1]
}

export function getWavespellBySeal(sealNumber: number): WavespellData | undefined {
  return WAVESPELLS.find(w => w.sealNumber === sealNumber)
}

export function getWavespellByKin(kin: number): WavespellData {
  const wavespellNumber = Math.ceil(kin / 13)
  return getWavespellData(wavespellNumber)
}
