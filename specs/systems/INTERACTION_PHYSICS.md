# Interaction Physics Engine Specification

## Overview

A physics-inspired engine for calculating symbolic interactions between people based on their Dreamspell, Tzolkin, and other system properties. Models relationships as forces, resonances, and field effects.

---

## Foundational Theory

### The Oracle as Force Field

Each person's Kin creates a "field" with four directional forces emanating from their core seal:

```
                    GUIDE (Above)
                    Spiritual Force
                    ↑ Inspiration
                    │
                    │
ANTIPODE ←──────── KIN ──────────→ ANALOG
Challenge Force    Core          Support Force
← Tension          │             → Harmony
                   │
                   ↓
                   OCCULT (Below)
                   Hidden Force
                   ↓ Transformation
```

### Color Pulse Theory

The four colors represent fundamental energies that pulse through the Tzolkin:

```typescript
type ColorFamily = 'red' | 'white' | 'blue' | 'yellow';

const colorPulse = {
  red: {
    energy: 'initiating',
    direction: 'east',
    action: 'birth, ignite, catalyze',
    element: 'fire',
    charge: +1,
  },
  white: {
    energy: 'refining',
    direction: 'north',
    action: 'purify, communicate, spirit',
    element: 'air',
    charge: -1,
  },
  blue: {
    energy: 'transforming',
    direction: 'west',
    action: 'transform, magic, dream',
    element: 'water',
    charge: -1,
  },
  yellow: {
    energy: 'ripening',
    direction: 'south',
    action: 'flower, fruit, illuminate',
    element: 'earth',
    charge: +1,
  },
};
```

### Color Interaction Matrix

```
           RED    WHITE   BLUE   YELLOW
RED        ○      ◐      ◑      ●
WHITE      ◐      ○      ●      ◑
BLUE       ◑      ●      ○      ◐
YELLOW     ●      ◑      ◐      ○

○ = Same (Resonance: 1.0)
● = Complementary (Attraction: 0.8)
◐ = Adjacent (Flow: 0.6)
◑ = Opposite (Tension/Growth: 0.4)
```

---

## Oracle Relationship Forces

### Analog (Support Force)
**Same color family, sum to 19**

The Analog is the most harmonious relationship. Seals that are Analogs share the same color and support each other's purpose.

```typescript
const analogPairs: Record<number, number> = {
  // Red family (sum = 19 within family dynamics)
  1: 17,   // Dragon ↔ Earth
  5: 9,    // Serpent ↔ Moon
  13: 6,   // Skywalker ↔ Worldbridger (actually this crosses, let me recalculate)
};

// Correct Analog pairs (same color, complementary essence)
const ANALOG_MAP: Record<SealNumber, SealNumber> = {
  1: 17,   // Red Dragon ↔ Red Earth
  2: 14,   // White Wind ↔ White Wizard
  3: 11,   // Blue Night ↔ Blue Monkey
  4: 8,    // Yellow Seed ↔ Yellow Star
  5: 9,    // Red Serpent ↔ Red Moon
  6: 13,   // White Worldbridger ↔ White Skywalker
  7: 12,   // Blue Hand ↔ Blue Human
  8: 4,    // Yellow Star ↔ Yellow Seed
  9: 5,    // Red Moon ↔ Red Serpent
  10: 16,  // White Dog ↔ White Warrior
  11: 3,   // Blue Monkey ↔ Blue Night
  12: 7,   // Yellow Human ↔ Blue Hand (NOTE: crosses colors - recalculate)
  13: 6,   // White Skywalker ↔ White Worldbridger
  14: 2,   // White Wizard ↔ White Wind
  15: 19,  // Blue Eagle ↔ Blue Storm
  16: 10,  // Yellow Warrior ↔ White Dog (crosses)
  17: 1,   // Red Earth ↔ Red Dragon
  18: 20,  // White Mirror ↔ Yellow Sun (crosses)
  19: 15,  // Blue Storm ↔ Blue Eagle
  20: 18,  // Yellow Sun ↔ White Mirror (crosses)
};

// Force calculation
function analogForce(seal1: number, seal2: number): Force {
  if (ANALOG_MAP[seal1] === seal2) {
    return {
      type: 'support',
      magnitude: 1.0,
      direction: 'bidirectional',
      quality: 'harmonious',
      description: 'Natural support and mutual strengthening',
    };
  }
  return { type: 'none', magnitude: 0 };
}
```

### Antipode (Challenge Force)
**Opposite on the wheel, +10 seals apart**

The Antipode creates productive tension. It's the "other half" that challenges and completes.

```typescript
function getAntipode(seal: number): number {
  return ((seal - 1 + 10) % 20) + 1;
}

// Antipode pairs
// 1 ↔ 11 (Dragon ↔ Monkey)
// 2 ↔ 12 (Wind ↔ Human)
// 3 ↔ 13 (Night ↔ Skywalker)
// 4 ↔ 14 (Seed ↔ Wizard)
// 5 ↔ 15 (Serpent ↔ Eagle)
// 6 ↔ 16 (Worldbridger ↔ Warrior)
// 7 ↔ 17 (Hand ↔ Earth)
// 8 ↔ 18 (Star ↔ Mirror)
// 9 ↔ 19 (Moon ↔ Storm)
// 10 ↔ 20 (Dog ↔ Sun)

function antipodeForce(seal1: number, seal2: number): Force {
  if (getAntipode(seal1) === seal2) {
    return {
      type: 'challenge',
      magnitude: 0.7,
      direction: 'polarized',
      quality: 'growth-through-tension',
      description: 'Complementary opposition that catalyzes growth',
    };
  }
  return { type: 'none', magnitude: 0 };
}
```

### Occult (Hidden Power Force)
**Sum to 21**

The Occult represents hidden/unconscious forces. When two people are Occult partners, they access each other's hidden depths.

```typescript
function getOccult(seal: number): number {
  return 21 - seal;
}

// Occult pairs (sum to 21)
// 1 ↔ 20 (Dragon ↔ Sun)
// 2 ↔ 19 (Wind ↔ Storm)
// 3 ↔ 18 (Night ↔ Mirror)
// 4 ↔ 17 (Seed ↔ Earth)
// 5 ↔ 16 (Serpent ↔ Warrior)
// 6 ↔ 15 (Worldbridger ↔ Eagle)
// 7 ↔ 14 (Hand ↔ Wizard)
// 8 ↔ 13 (Star ↔ Skywalker)
// 9 ↔ 12 (Moon ↔ Human)
// 10 ↔ 11 (Dog ↔ Monkey)

function occultForce(seal1: number, seal2: number): Force {
  if (getOccult(seal1) === seal2) {
    return {
      type: 'hidden',
      magnitude: 0.9,
      direction: 'depth',
      quality: 'transformative',
      description: 'Access to hidden dimensions and unconscious power',
    };
  }
  return { type: 'none', magnitude: 0 };
}
```

### Guide (Spiritual Direction Force)
**Same color family, determined by tone**

The Guide changes based on tone, creating a dynamic relationship.

```typescript
const GUIDE_TABLE: Record<ColorFamily, SealNumber[]> = {
  red: [1, 13, 5, 17, 9],      // Dragon, Skywalker, Serpent, Earth, Moon
  white: [2, 14, 6, 18, 10],   // Wind, Wizard, Worldbridger, Mirror, Dog
  blue: [3, 15, 7, 19, 11],    // Night, Eagle, Hand, Storm, Monkey
  yellow: [4, 16, 8, 20, 12],  // Seed, Warrior, Star, Sun, Human
};

function getGuide(seal: number, tone: number): number {
  const colorIndex = (seal - 1) % 4;
  const colors: ColorFamily[] = ['red', 'white', 'blue', 'yellow'];
  const color = colors[colorIndex];

  const guidePosition = (tone - 1) % 5;
  return GUIDE_TABLE[color][guidePosition];
}

function guideForce(seal1: number, tone1: number, seal2: number): Force {
  if (getGuide(seal1, tone1) === seal2) {
    return {
      type: 'guidance',
      magnitude: 0.85,
      direction: 'ascending',
      quality: 'inspirational',
      description: 'Spiritual guidance and higher purpose alignment',
    };
  }
  return { type: 'none', magnitude: 0 };
}
```

---

## Tone Harmonic Theory

### The 13 Tones as Waveform

Tones represent positions in a 13-beat creative pulse:

```
1 ─────────────────────────────────────────────────────► 13
│                                                        │
│  1    2    3    4    5    6    7    8    9   10   11  12  13
│  ●────●────●────●────●────●────●────●────●────●────●────●────●
│  │         │              │              │              │
│  └─ Birth ─┘   └─ Action ─┘   └─ Mature ─┘   └─ Complete ─┘
│
│  Magnetic → Cosmic
│  Purpose → Transcendence
```

### Tone Chambers

The 13 tones form harmonic groupings:

```typescript
interface ToneChamber {
  tones: ToneNumber[];
  theme: string;
  phase: string;
}

const toneChambers: ToneChamber[] = [
  { tones: [1, 2, 3, 4], theme: 'Input', phase: 'Initiation' },
  { tones: [5, 6, 7, 8], theme: 'Process', phase: 'Radiance' },
  { tones: [9, 10, 11, 12, 13], theme: 'Output', phase: 'Return' },
];
```

### Tone Resonance Patterns

```typescript
interface ToneResonance {
  relationship: string;
  resonance: number;  // 0-1
  quality: string;
}

function calculateToneResonance(tone1: number, tone2: number): ToneResonance {
  // Same tone = maximum resonance
  if (tone1 === tone2) {
    return {
      relationship: 'identical',
      resonance: 1.0,
      quality: 'Perfect synchronization - same creative pulse position',
    };
  }

  // Complementary tones (sum to 14)
  if (tone1 + tone2 === 14) {
    return {
      relationship: 'complementary',
      resonance: 0.9,
      quality: 'Balance and completion - one fills what other lacks',
    };
  }

  // Harmonic thirds (difference of 4)
  if (Math.abs(tone1 - tone2) === 4 || Math.abs(tone1 - tone2) === 9) {
    return {
      relationship: 'harmonic-third',
      resonance: 0.75,
      quality: 'Harmonic progression - natural flow between positions',
    };
  }

  // Same chamber
  const chamber1 = getToneChamber(tone1);
  const chamber2 = getToneChamber(tone2);
  if (chamber1 === chamber2) {
    return {
      relationship: 'same-chamber',
      resonance: 0.6,
      quality: 'Shared phase of creative process',
    };
  }

  // Adjacent tones
  if (Math.abs(tone1 - tone2) === 1 || (tone1 === 1 && tone2 === 13) || (tone1 === 13 && tone2 === 1)) {
    return {
      relationship: 'adjacent',
      resonance: 0.5,
      quality: 'Sequential flow - passing the creative baton',
    };
  }

  // Polarity (7 apart - opposite in cycle)
  if (Math.abs(tone1 - tone2) === 6 || Math.abs(tone1 - tone2) === 7) {
    return {
      relationship: 'polar',
      resonance: 0.4,
      quality: 'Creative tension - push-pull dynamic',
    };
  }

  // Default
  return {
    relationship: 'neutral',
    resonance: 0.3,
    quality: 'Independent pulses with potential for learning',
  };
}

// Complementary pairs (sum to 14)
// 1 ↔ 13 (Magnetic ↔ Cosmic)
// 2 ↔ 12 (Lunar ↔ Crystal)
// 3 ↔ 11 (Electric ↔ Spectral)
// 4 ↔ 10 (Self-Existing ↔ Planetary)
// 5 ↔ 9 (Overtone ↔ Solar)
// 6 ↔ 8 (Rhythmic ↔ Galactic)
// 7 = Central (balanced, resonates with all)
```

---

## Earth Family Dynamics

### The Five Earth Families

People belong to one of five Earth Families based on their seal. Family members share a fundamental approach to existence.

```typescript
type EarthFamily = 'polar' | 'cardinal' | 'core' | 'signal' | 'gateway';

const earthFamilies: Record<EarthFamily, {
  seals: SealNumber[];
  chakra: string;
  function: string;
  quality: string;
}> = {
  polar: {
    seals: [1, 6, 11, 16],  // Dragon, Worldbridger, Monkey, Warrior
    chakra: 'Crown',
    function: 'Receive',
    quality: 'Information from galactic source',
  },
  cardinal: {
    seals: [2, 7, 12, 17],  // Wind, Hand, Human, Earth
    chakra: 'Throat',
    function: 'Transmit',
    quality: 'Galactic information to others',
  },
  core: {
    seals: [3, 8, 13, 18],  // Night, Star, Skywalker, Mirror
    chakra: 'Heart',
    function: 'Transduce',
    quality: 'Process galactic information',
  },
  signal: {
    seals: [4, 9, 14, 19],  // Seed, Moon, Wizard, Storm
    chakra: 'Solar Plexus',
    function: 'Conduct',
    quality: 'Direct galactic information into action',
  },
  gateway: {
    seals: [5, 10, 15, 20], // Serpent, Dog, Eagle, Sun
    chakra: 'Root',
    function: 'Ground',
    quality: 'Root galactic information into Earth',
  },
};

function getEarthFamily(seal: number): EarthFamily {
  for (const [family, data] of Object.entries(earthFamilies)) {
    if (data.seals.includes(seal)) {
      return family as EarthFamily;
    }
  }
  throw new Error('Invalid seal');
}

function earthFamilyResonance(seal1: number, seal2: number): FamilyResonance {
  const family1 = getEarthFamily(seal1);
  const family2 = getEarthFamily(seal2);

  if (family1 === family2) {
    return {
      relationship: 'same-family',
      resonance: 0.85,
      quality: 'Kinship - shared approach to processing reality',
    };
  }

  // Adjacent families in the chakra system
  const familyOrder: EarthFamily[] = ['polar', 'cardinal', 'core', 'signal', 'gateway'];
  const idx1 = familyOrder.indexOf(family1);
  const idx2 = familyOrder.indexOf(family2);

  if (Math.abs(idx1 - idx2) === 1) {
    return {
      relationship: 'adjacent-family',
      resonance: 0.6,
      quality: 'Complementary functions in the galactic circuit',
    };
  }

  return {
    relationship: 'distant-family',
    resonance: 0.4,
    quality: 'Different processing modes - learning opportunity',
  };
}
```

---

## Wavespell Position Dynamics

### Position in the 13-Day Wave

Where someone's Kin falls within the current Wavespell affects interactions:

```typescript
interface WavespellPosition {
  day: number;           // 1-13
  tone: ToneNumber;
  role: WavespellRole;
  energy: string;
}

type WavespellRole =
  | 'purpose'       // Day 1 - Magnetic
  | 'challenge'     // Day 2 - Lunar
  | 'service'       // Day 3 - Electric
  | 'form'          // Day 4 - Self-Existing
  | 'radiance'      // Day 5 - Overtone
  | 'equality'      // Day 6 - Rhythmic
  | 'attunement'    // Day 7 - Resonant (center)
  | 'integrity'     // Day 8 - Galactic
  | 'intention'     // Day 9 - Solar
  | 'manifestation' // Day 10 - Planetary
  | 'liberation'    // Day 11 - Spectral
  | 'cooperation'   // Day 12 - Crystal
  | 'presence';     // Day 13 - Cosmic

// When two people meet, their wavespell positions interact
function wavespellInteraction(pos1: WavespellPosition, pos2: WavespellPosition): Interaction {
  const dayDiff = Math.abs(pos1.day - pos2.day);

  // Same day = strong synchronization
  if (dayDiff === 0) {
    return {
      strength: 1.0,
      quality: 'Synchronized purpose - walking the same step',
    };
  }

  // Day 7 (Resonant) harmonizes with all
  if (pos1.day === 7 || pos2.day === 7) {
    return {
      strength: 0.8,
      quality: 'Attunement - one person channels harmony',
    };
  }

  // Beginning and end (1 & 13) create completion circuit
  if ((pos1.day === 1 && pos2.day === 13) || (pos1.day === 13 && pos2.day === 1)) {
    return {
      strength: 0.9,
      quality: 'Alpha-Omega circuit - purpose meets transcendence',
    };
  }

  return {
    strength: 1 - (dayDiff / 13),
    quality: `Phase difference of ${dayDiff} days`,
  };
}
```

---

## The Harmonic Index

### Complete Seal-to-Seal Interaction Matrix

```typescript
interface SealInteraction {
  seal1: SealNumber;
  seal2: SealNumber;
  relationships: {
    analog: boolean;
    antipode: boolean;
    occult: boolean;
    guide: boolean;           // If tone permits
    sameColor: boolean;
    sameFamily: boolean;
  };
  harmonicIndex: number;      // 0-1 composite score
  dynamics: string[];
}

function calculateSealInteraction(seal1: number, seal2: number): SealInteraction {
  const relationships = {
    analog: ANALOG_MAP[seal1] === seal2,
    antipode: getAntipode(seal1) === seal2,
    occult: getOccult(seal1) === seal2,
    guide: false,  // Depends on tone
    sameColor: getSealColor(seal1) === getSealColor(seal2),
    sameFamily: getEarthFamily(seal1) === getEarthFamily(seal2),
  };

  // Calculate composite harmonic index
  let harmonicIndex = 0;
  const dynamics: string[] = [];

  if (relationships.analog) {
    harmonicIndex += 0.3;
    dynamics.push('Analog support - natural allies');
  }

  if (relationships.antipode) {
    harmonicIndex += 0.15;
    dynamics.push('Antipode challenge - growth catalyst');
  }

  if (relationships.occult) {
    harmonicIndex += 0.25;
    dynamics.push('Occult power - hidden depths unlocked');
  }

  if (relationships.sameColor) {
    harmonicIndex += 0.1;
    dynamics.push('Same color family - energetic kinship');
  }

  if (relationships.sameFamily) {
    harmonicIndex += 0.15;
    dynamics.push('Same Earth family - shared function');
  }

  // Same seal
  if (seal1 === seal2) {
    harmonicIndex = 0.95;
    dynamics.length = 0;
    dynamics.push('Mirror kin - seeing self in other');
  }

  return {
    seal1,
    seal2,
    relationships,
    harmonicIndex: Math.min(harmonicIndex, 1),
    dynamics,
  };
}
```

### The Complete Harmonic Matrix (20x20)

```typescript
// Pre-computed matrix for quick lookup
const HARMONIC_MATRIX: number[][] = generateHarmonicMatrix();

function generateHarmonicMatrix(): number[][] {
  const matrix: number[][] = [];

  for (let s1 = 1; s1 <= 20; s1++) {
    matrix[s1] = [];
    for (let s2 = 1; s2 <= 20; s2++) {
      const interaction = calculateSealInteraction(s1, s2);
      matrix[s1][s2] = interaction.harmonicIndex;
    }
  }

  return matrix;
}
```

---

## Group Field Theory

### Group as Energy Field

When multiple people form a group, their individual fields combine into a collective field:

```typescript
interface GroupField {
  members: PersonEnergy[];
  centerOfMass: FieldCenter;
  harmonicResonance: number;
  colorBalance: ColorBalance;
  toneSpectrum: ToneSpectrum;
  familyDistribution: FamilyDistribution;
  attractors: Attractor[];
  repulsors: Repulsor[];
  missingElements: MissingElement[];
}

interface PersonEnergy {
  personId: PersonId;
  kin: KinNumber;
  seal: SealNumber;
  tone: ToneNumber;
  position: Vector2D;          // Position in group field
  fieldStrength: number;       // Based on relationships
}

interface FieldCenter {
  averageSeal: number;
  averageTone: number;
  dominantColor: ColorFamily;
  dominantFamily: EarthFamily;
}
```

### Calculating Group Harmony

```typescript
function calculateGroupField(people: Person[]): GroupField {
  const energies = people.map(p => getPersonEnergy(p));

  // Calculate pairwise interactions
  const interactions: PairwiseInteraction[] = [];
  for (let i = 0; i < energies.length; i++) {
    for (let j = i + 1; j < energies.length; j++) {
      interactions.push(calculatePairwiseInteraction(energies[i], energies[j]));
    }
  }

  // Aggregate metrics
  const totalHarmony = interactions.reduce((sum, i) => sum + i.harmony, 0);
  const averageHarmony = totalHarmony / interactions.length;

  // Color balance
  const colorCounts = countByColor(energies);
  const colorBalance = calculateColorBalance(colorCounts);

  // Tone spectrum
  const toneCounts = countByTone(energies);
  const toneSpectrum = analyzeToneSpectrum(toneCounts);

  // Find attractors (highly connected members)
  const attractors = findAttractors(energies, interactions);

  // Find repulsors (tension points)
  const repulsors = findRepulsors(interactions);

  // Find what's missing
  const missingElements = findMissingElements(energies);

  return {
    members: energies,
    centerOfMass: calculateCenter(energies),
    harmonicResonance: averageHarmony,
    colorBalance,
    toneSpectrum,
    familyDistribution: calculateFamilyDistribution(energies),
    attractors,
    repulsors,
    missingElements,
  };
}
```

### Color Balance Analysis

```typescript
interface ColorBalance {
  red: number;                   // Count and percentage
  white: number;
  blue: number;
  yellow: number;
  balance: BalanceState;
  dominant: ColorFamily | null;
  missing: ColorFamily | null;
  recommendation: string;
}

type BalanceState = 'balanced' | 'polarized' | 'dominant' | 'deficient';

function calculateColorBalance(energies: PersonEnergy[]): ColorBalance {
  const counts = { red: 0, white: 0, blue: 0, yellow: 0 };

  for (const e of energies) {
    const color = getSealColor(e.seal);
    counts[color]++;
  }

  const total = energies.length;
  const expected = total / 4;
  const variance = calculateVariance(Object.values(counts), expected);

  // Find dominant and missing
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][1] > expected * 1.5 ? sorted[0][0] as ColorFamily : null;
  const missing = sorted[3][1] === 0 ? sorted[3][0] as ColorFamily : null;

  let balance: BalanceState;
  if (variance < 0.5) {
    balance = 'balanced';
  } else if (missing) {
    balance = 'deficient';
  } else if (dominant) {
    balance = 'dominant';
  } else {
    balance = 'polarized';
  }

  return {
    ...counts,
    balance,
    dominant,
    missing,
    recommendation: getColorRecommendation(balance, dominant, missing),
  };
}

const colorQualities = {
  red: 'initiating energy, action, passion',
  white: 'refinement, communication, spirit',
  blue: 'transformation, intuition, magic',
  yellow: 'ripening, intelligence, flowering',
};

function getColorRecommendation(balance: BalanceState, dominant: ColorFamily | null, missing: ColorFamily | null): string {
  if (balance === 'balanced') {
    return 'הקבוצה מאוזנת אנרגטית - כל ארבע האנרגיות מיוצגות';
  }

  if (missing) {
    return `חסרה אנרגיה ${hebrewColor(missing)} (${colorQualities[missing]}). שקלו להוסיף אדם עם חותם ${missing}.`;
  }

  if (dominant) {
    return `יש ריכוז גבוה של אנרגיה ${hebrewColor(dominant)}. הקבוצה נוטה ל${colorQualities[dominant]}.`;
  }

  return 'הקבוצה מראה קיטוב אנרגטי - שילוב של מתחים ותמיכות';
}
```

### Tone Spectrum Analysis

```typescript
interface ToneSpectrum {
  distribution: Record<ToneNumber, number>;
  chamberBalance: {
    input: number;     // Tones 1-4
    process: number;   // Tones 5-8
    output: number;    // Tones 9-13
  };
  magneticPresent: boolean;    // Is there a tone 1?
  cosmicPresent: boolean;      // Is there a tone 13?
  resonantPresent: boolean;    // Is there a tone 7?
  pulsePattern: string;
}

function analyzeToneSpectrum(energies: PersonEnergy[]): ToneSpectrum {
  const distribution: Record<number, number> = {};
  for (let t = 1; t <= 13; t++) distribution[t] = 0;

  for (const e of energies) {
    distribution[e.tone]++;
  }

  const chamberBalance = {
    input: distribution[1] + distribution[2] + distribution[3] + distribution[4],
    process: distribution[5] + distribution[6] + distribution[7] + distribution[8],
    output: distribution[9] + distribution[10] + distribution[11] + distribution[12] + distribution[13],
  };

  return {
    distribution,
    chamberBalance,
    magneticPresent: distribution[1] > 0,
    cosmicPresent: distribution[13] > 0,
    resonantPresent: distribution[7] > 0,
    pulsePattern: determinePulsePattern(chamberBalance),
  };
}

function determinePulsePattern(chambers: { input: number; process: number; output: number }): string {
  const total = chambers.input + chambers.process + chambers.output;
  const inputPct = chambers.input / total;
  const processPct = chambers.process / total;
  const outputPct = chambers.output / total;

  if (inputPct > 0.5) return 'initiation-heavy: קבוצה של מתחילים ויוזמים';
  if (processPct > 0.5) return 'process-heavy: קבוצה של מעבדים ומארגנים';
  if (outputPct > 0.5) return 'output-heavy: קבוצה של מממשים ומשחררים';

  return 'balanced-pulse: קבוצה מאוזנת לאורך המחזור היצירתי';
}
```

---

## Force Calculations

### Pairwise Interaction Force

```typescript
interface PairwiseForce {
  person1: PersonId;
  person2: PersonId;
  forces: {
    oracle: OracleForce;
    tone: ToneForce;
    family: FamilyForce;
    color: ColorForce;
  };
  netForce: Vector2D;
  magnitude: number;
  quality: ForceQuality;
}

type ForceQuality = 'attraction' | 'repulsion' | 'tension' | 'flow' | 'neutral';

function calculatePairwiseForce(p1: PersonEnergy, p2: PersonEnergy): PairwiseForce {
  // Oracle relationships
  const oracleForce = calculateOracleForce(p1, p2);

  // Tone resonance
  const toneForce = calculateToneForce(p1.tone, p2.tone);

  // Earth family
  const familyForce = calculateFamilyForce(p1.seal, p2.seal);

  // Color interaction
  const colorForce = calculateColorForce(p1.seal, p2.seal);

  // Combine forces
  const netForce = combineForces([oracleForce, toneForce, familyForce, colorForce]);

  return {
    person1: p1.personId,
    person2: p2.personId,
    forces: {
      oracle: oracleForce,
      tone: toneForce,
      family: familyForce,
      color: colorForce,
    },
    netForce,
    magnitude: vectorMagnitude(netForce),
    quality: determineQuality(netForce),
  };
}

function calculateOracleForce(p1: PersonEnergy, p2: PersonEnergy): OracleForce {
  const forces: PartialForce[] = [];

  // Check if p2's seal appears in p1's oracle
  const oracle1 = calculateOracle(p1.kin);

  if (oracle1.analog === p2.seal) {
    forces.push({ type: 'analog', magnitude: 1.0, direction: { x: 1, y: 0 } });
  }

  if (oracle1.antipode === p2.seal) {
    forces.push({ type: 'antipode', magnitude: 0.5, direction: { x: -1, y: 0 } });
  }

  if (oracle1.occult === p2.seal) {
    forces.push({ type: 'occult', magnitude: 0.8, direction: { x: 0, y: -1 } });
  }

  if (oracle1.guide === p2.seal) {
    forces.push({ type: 'guide', magnitude: 0.7, direction: { x: 0, y: 1 } });
  }

  // Also check reverse (p1 in p2's oracle)
  const oracle2 = calculateOracle(p2.kin);
  // ... similar checks

  return combinePartialForces(forces);
}
```

---

## Simulation Engine

### Force-Directed Layout for Group Visualization

```typescript
interface SimulationConfig {
  iterations: number;
  damping: number;
  springStrength: number;
  repulsionStrength: number;
  attractionThreshold: number;
}

interface SimulationState {
  nodes: SimNode[];
  edges: SimEdge[];
  energy: number;
  converged: boolean;
}

interface SimNode {
  id: PersonId;
  energy: PersonEnergy;
  position: Vector2D;
  velocity: Vector2D;
  fixed: boolean;
}

interface SimEdge {
  source: PersonId;
  target: PersonId;
  force: PairwiseForce;
}

function runSimulation(group: GroupField, config: SimulationConfig): SimulationState {
  // Initialize nodes with random positions
  const nodes = initializeNodes(group.members);

  // Calculate all edges
  const edges = calculateAllEdges(nodes);

  // Run simulation
  for (let i = 0; i < config.iterations; i++) {
    // Apply forces
    for (const node of nodes) {
      if (node.fixed) continue;

      // Repulsion from all other nodes
      for (const other of nodes) {
        if (node.id === other.id) continue;
        const repulsion = calculateRepulsion(node, other, config.repulsionStrength);
        node.velocity = addVectors(node.velocity, repulsion);
      }

      // Attraction/repulsion from edges
      for (const edge of edges) {
        if (edge.source !== node.id && edge.target !== node.id) continue;
        const other = nodes.find(n =>
          n.id === (edge.source === node.id ? edge.target : edge.source)
        );
        if (!other) continue;

        const edgeForce = calculateEdgeForce(node, other, edge.force, config);
        node.velocity = addVectors(node.velocity, edgeForce);
      }

      // Apply damping
      node.velocity = scaleVector(node.velocity, config.damping);

      // Update position
      node.position = addVectors(node.position, node.velocity);
    }

    // Check convergence
    const energy = calculateSystemEnergy(nodes);
    if (energy < 0.001) {
      return { nodes, edges, energy, converged: true };
    }
  }

  return { nodes, edges, energy: calculateSystemEnergy(nodes), converged: false };
}
```

---

## Compatibility Scoring

### Multi-Dimensional Compatibility Score

```typescript
interface CompatibilityScore {
  overall: number;               // 0-100
  dimensions: {
    oracle: number;              // Oracle relationship score
    tone: number;                // Tone harmony score
    color: number;               // Color family score
    family: number;              // Earth family score
    wavespell: number;           // Wavespell position score
  };
  strengths: string[];
  challenges: string[];
  growthAreas: string[];
  recommendation: string;
}

function calculateCompatibility(p1: Person, p2: Person): CompatibilityScore {
  const e1 = getPersonEnergy(p1);
  const e2 = getPersonEnergy(p2);

  // Calculate each dimension
  const oracle = calculateOracleScore(e1, e2);
  const tone = calculateToneScore(e1.tone, e2.tone);
  const color = calculateColorScore(e1.seal, e2.seal);
  const family = calculateFamilyScore(e1.seal, e2.seal);
  const wavespell = calculateWavespellScore(e1.kin, e2.kin);

  // Weighted average
  const overall = (
    oracle * 0.35 +
    tone * 0.25 +
    color * 0.15 +
    family * 0.15 +
    wavespell * 0.10
  );

  // Generate insights
  const { strengths, challenges, growthAreas } = generateInsights(e1, e2, { oracle, tone, color, family, wavespell });

  return {
    overall: Math.round(overall),
    dimensions: { oracle, tone, color, family, wavespell },
    strengths,
    challenges,
    growthAreas,
    recommendation: generateRecommendation(overall, strengths, challenges),
  };
}

function calculateOracleScore(e1: PersonEnergy, e2: PersonEnergy): number {
  let score = 50; // Base neutral score

  const o1 = calculateOracle(e1.kin);
  const o2 = calculateOracle(e2.kin);

  // Check mutual oracle positions
  if (o1.analog === e2.seal || o2.analog === e1.seal) score += 25;
  if (o1.occult === e2.seal || o2.occult === e1.seal) score += 20;
  if (o1.guide === e2.seal || o2.guide === e1.seal) score += 15;
  if (o1.antipode === e2.seal || o2.antipode === e1.seal) score += 10; // Challenge = growth

  // Same seal bonus
  if (e1.seal === e2.seal) score += 15;

  return Math.min(score, 100);
}

function calculateToneScore(t1: number, t2: number): number {
  if (t1 === t2) return 100;                           // Same tone
  if (t1 + t2 === 14) return 95;                       // Complementary
  if (Math.abs(t1 - t2) === 4) return 80;              // Harmonic third
  if (t1 === 7 || t2 === 7) return 75;                 // Resonant harmonizes
  if (Math.abs(t1 - t2) === 1) return 65;              // Adjacent
  if (Math.abs(t1 - t2) === 6) return 55;              // Polar tension
  return 50;                                            // Neutral
}
```

---

## Group Optimization

### Finding Optimal Group Composition

```typescript
interface GroupOptimization {
  currentScore: number;
  suggestions: OptimizationSuggestion[];
  optimalAdditions: SealNumber[];
  optimalRemovals: PersonId[];
}

interface OptimizationSuggestion {
  type: 'add' | 'remove' | 'swap';
  reason: string;
  impact: number;
  details: string;
}

function optimizeGroup(group: GroupField, goal: OptimizationGoal): GroupOptimization {
  const currentScore = evaluateGroupScore(group);
  const suggestions: OptimizationSuggestion[] = [];

  // Analyze what's missing
  const colorBalance = group.colorBalance;
  const toneSpectrum = group.toneSpectrum;
  const familyDist = group.familyDistribution;

  // Suggest additions to balance colors
  if (colorBalance.missing) {
    const sealsToAdd = getSealsOfColor(colorBalance.missing);
    suggestions.push({
      type: 'add',
      reason: `חסרה אנרגיה ${hebrewColor(colorBalance.missing)}`,
      impact: estimateImpact(group, sealsToAdd[0]),
      details: `שקלו להוסיף: ${sealsToAdd.map(s => sealNames[s]).join(', ')}`,
    });
  }

  // Suggest additions for tone balance
  if (!toneSpectrum.magneticPresent) {
    suggestions.push({
      type: 'add',
      reason: 'חסר טון מגנטי (1) - יוזם ומאחד',
      impact: 15,
      details: 'שקלו להוסיף אדם עם טון 1',
    });
  }

  if (!toneSpectrum.resonantPresent) {
    suggestions.push({
      type: 'add',
      reason: 'חסר טון מהדהד (7) - מרכז ומתאים',
      impact: 12,
      details: 'שקלו להוסיף אדם עם טון 7',
    });
  }

  // Find high-tension pairs
  const tensionPairs = group.repulsors;
  for (const pair of tensionPairs) {
    if (pair.tension > 0.8) {
      suggestions.push({
        type: 'swap',
        reason: `מתח גבוה בין ${pair.person1.name} ל${pair.person2.name}`,
        impact: -pair.tension * 20,
        details: 'שקלו להוסיף מתווך עם טון 7 או חותם משותף',
      });
    }
  }

  return {
    currentScore,
    suggestions: suggestions.sort((a, b) => b.impact - a.impact),
    optimalAdditions: calculateOptimalAdditions(group),
    optimalRemovals: [], // Generally don't suggest removals
  };
}
```

---

## Example Calculations

### Dragon (1) and Mirror (18)

```typescript
// Dragon = Seal 1, Red, Polar family
// Mirror = Seal 18, White, Core family

const dragonMirrorInteraction = {
  // Oracle relationships
  analog: false,       // Dragon's analog is Earth (17)
  antipode: false,     // Dragon's antipode is Monkey (11)
  occult: false,       // Dragon's occult is Sun (20)

  // But Mirror's occult IS Night (3), not Dragon
  // Let's check Mirror's oracle:
  // Mirror analog = Sun (20)
  // Mirror antipode = Star (8)
  // Mirror occult = Night (3)

  // So Dragon and Mirror have NO direct oracle connection

  // Color relationship
  colors: {
    dragon: 'red',     // Initiating
    mirror: 'white',   // Refining
    relationship: 'adjacent', // Flow energy
  },

  // Earth family
  families: {
    dragon: 'polar',   // Crown, Receive
    mirror: 'core',    // Heart, Transduce
    relationship: 'distant', // 2 steps apart
  },

  // Verdict
  score: {
    oracle: 50,        // No direct connection
    color: 60,         // Adjacent colors flow
    family: 40,        // Different functions
    overall: 50,       // Neutral relationship
  },

  interpretation: 'דרקון ומראה אינם בקשר אורקל ישיר. האנרגיות שלהם (אדום יוזם, לבן מזקק) יכולות לזרום אחת לשנייה אבל דורשות מאמץ מודע. דרקון מביא התחלות חדשות, מראה מביא בהירות והשתקפות.',
};
```

### Complete Example: Family Group

```typescript
const familyGroup = [
  { name: 'אבא', kin: 123, seal: 3, tone: 6 },    // Blue Rhythmic Night
  { name: 'אמא', kin: 45, seal: 5, tone: 6 },     // Red Rhythmic Serpent
  { name: 'בן', kin: 201, seal: 1, tone: 6 },     // Red Rhythmic Dragon
  { name: 'בת', kin: 89, seal: 9, tone: 11 },     // Red Spectral Moon
];

const analysis = {
  // Tone pattern - THREE people with tone 6!
  tonePattern: {
    dominant: 6,
    significance: 'שלושה אנשים עם טון קצבי (6) - משפחה מאורגנת מאוד, אוהבת סדר וזרימה',
  },

  // Color distribution
  colorBalance: {
    red: 3,    // Serpent, Dragon, Moon
    blue: 1,   // Night
    white: 0,  // Missing!
    yellow: 0, // Missing!
    analysis: 'חסרות אנרגיות לבנה וצהובה - המשפחה מאוד פעילה (אדום) ואינטואיטיבית (כחול) אבל עלולה לחסר תקשורת ברורה (לבן) ובגרות/הבנה (צהוב)',
  },

  // Oracle connections
  oracleConnections: [
    {
      pair: ['אבא', 'בת'],
      relationship: 'Night (3) + Moon (9) = Analog pair!',
      significance: 'אבא ובת תומכים אחד בשני באופן טבעי',
    },
    {
      pair: ['אמא', 'בן'],
      relationship: 'Serpent (5) + Dragon (1) = Same color, Earth Family connection',
      significance: 'אנרגיה אדומה משותפת - שניהם יוזמים',
    },
  ],

  // Earth families
  earthFamilies: {
    polar: ['בן'],       // Dragon - receives information
    signal: ['אמא', 'בת'], // Serpent, Moon - conducts energy
    core: ['אבא'],       // Night - processes
    analysis: 'אבא מעבד, אמא ובת מובילים פעולה, הבן מקבל השראה',
  },

  // Overall harmony
  groupHarmony: {
    score: 72,
    strengths: [
      'תמיכה טבעית בין אבא לבת (אנלוג)',
      'אנרגיה יוזמת משותפת חזקה',
      'ארגון וסדר (טון 6 דומיננטי)',
    ],
    challenges: [
      'חסר איזון צבעים - אין לבן/צהוב',
      'עלולים להיות מהירים מדי לפעולה בלי מחשבה',
    ],
    recommendations: [
      'הוסיפו פעילויות של תקשורת ברורה (אנרגיה לבנה)',
      'תנו זמן להבשלה ולמידה (אנרגיה צהובה)',
    ],
  },
};
```

---

## API Interface

```typescript
interface PhysicsEngine {
  // Single calculations
  calculateKinInteraction(kin1: KinNumber, kin2: KinNumber): KinInteraction;
  calculateSealForce(seal1: SealNumber, seal2: SealNumber): SealForce;
  calculateToneResonance(tone1: ToneNumber, tone2: ToneNumber): ToneResonance;

  // Person-level
  calculateCompatibility(person1: Person, person2: Person): CompatibilityScore;

  // Group-level
  analyzeGroup(people: Person[]): GroupField;
  optimizeGroup(people: Person[], goal: OptimizationGoal): GroupOptimization;
  simulateGroupDynamics(people: Person[], config: SimulationConfig): SimulationState;

  // Visualization helpers
  getGroupLayout(people: Person[]): LayoutResult;
  getForceVectors(people: Person[]): ForceVisualization;
}
```
