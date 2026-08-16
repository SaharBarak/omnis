# Human Design System Specification

## Overview

Human Design is a synthesis system combining astrology, I Ching, Kabbalah, and the chakra system. It generates a "bodygraph" based on precise birth time and location. **Requires birth time and place for accuracy.**

---

## Core Concepts

### Bodygraph
A diagram showing 9 centers connected by 36 channels, with 64 gates.

```
           ┌─────┐
           │Head │ ← Inspiration
           └──┬──┘
              │
           ┌──┴──┐
           │Ajna │ ← Mental awareness
           └──┬──┘
              │
           ┌──┴──┐
           │Throat│ ← Communication/Action
           └──┬──┘
          ┌──┘ └──┐
       ┌──┴──┐ ┌──┴──┐
       │  G  │ │Self │ ← Identity/Direction
       └──┬──┘ └──┬──┘
          │      │
       ┌──┴──┐ ┌──┴──┐
       │Heart│ │Spleen│ ← Willpower / Intuition
       └──┬──┘ └──┬──┘
          └──┬───┘
          ┌──┴──┐
          │Sacral│ ← Life force (Generators)
          └──┬──┘
             │
          ┌──┴──┐
          │Root │ ← Pressure/Adrenaline
          └─────┘
```

### Centers (9)
```typescript
type Center =
  | 'head'      // Inspiration, pressure to think
  | 'ajna'      // Conceptualization, mental awareness
  | 'throat'    // Communication, manifestation
  | 'g'         // Identity, love, direction
  | 'heart'     // Willpower, ego, material world
  | 'spleen'    // Intuition, health, survival
  | 'sacral'    // Life force, sexuality, work
  | 'solar'     // Emotions, feelings, desires
  | 'root';     // Pressure, adrenaline, drive

interface CenterState {
  center: Center;
  defined: boolean;   // Colored vs white
  gates: number[];    // Active gates (1-64)
}
```

### Gates (64)
Correspond to the 64 hexagrams of the I Ching.

```typescript
interface Gate {
  number: number;           // 1-64
  name: string;             // Gate name
  center: Center;           // Which center it belongs to
  iChingHexagram: number;
  theme: string;
  line?: number;            // 1-6, specific line activated
}

const gatesByCenters: Record<Center, number[]> = {
  head: [64, 61, 63],
  ajna: [47, 24, 4, 17, 43, 11],
  throat: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  g: [7, 1, 13, 25, 46, 2, 15, 10],
  heart: [21, 40, 26, 51],
  spleen: [48, 57, 44, 50, 32, 28, 18],
  sacral: [5, 14, 29, 59, 9, 3, 42, 27, 34],
  solar: [36, 22, 37, 6, 49, 55, 30],
  root: [53, 60, 52, 19, 39, 41, 58, 38, 54],
};
```

### Channels (36)
Connect two centers when both gates are defined.

```typescript
interface Channel {
  number: number;
  name: string;
  gates: [number, number];  // Two gate numbers
  centers: [Center, Center];
  circuitry: Circuitry;
  theme: string;
}

type Circuitry =
  | 'individual'    // Mutation, empowerment
  | 'collective'    // Sharing, logic/abstract
  | 'tribal';       // Support, resources
```

---

## Types

### The 5 Types

```typescript
type HumanDesignType =
  | 'manifestor'
  | 'generator'
  | 'manifesting-generator'
  | 'projector'
  | 'reflector';

interface TypeDefinition {
  type: HumanDesignType;
  strategy: string;
  notSelfTheme: string;
  signatureTheme: string;
  aura: string;
  percentage: string;      // Population percentage
}

const typeDefinitions: Record<HumanDesignType, TypeDefinition> = {
  manifestor: {
    type: 'manifestor',
    strategy: 'To Inform',
    notSelfTheme: 'Anger',
    signatureTheme: 'Peace',
    aura: 'Closed and repelling',
    percentage: '~8%',
  },
  generator: {
    type: 'generator',
    strategy: 'To Respond',
    notSelfTheme: 'Frustration',
    signatureTheme: 'Satisfaction',
    aura: 'Open and enveloping',
    percentage: '~37%',
  },
  'manifesting-generator': {
    type: 'manifesting-generator',
    strategy: 'To Respond, then Inform',
    notSelfTheme: 'Frustration/Anger',
    signatureTheme: 'Satisfaction',
    aura: 'Open and enveloping',
    percentage: '~33%',
  },
  projector: {
    type: 'projector',
    strategy: 'Wait for Invitation',
    notSelfTheme: 'Bitterness',
    signatureTheme: 'Success',
    aura: 'Focused and absorbing',
    percentage: '~20%',
  },
  reflector: {
    type: 'reflector',
    strategy: 'Wait 28 Days (Lunar Cycle)',
    notSelfTheme: 'Disappointment',
    signatureTheme: 'Surprise',
    aura: 'Resistant and sampling',
    percentage: '~1%',
  },
};
```

### Type Determination
```typescript
function determineType(bodygraph: Bodygraph): HumanDesignType {
  const sacralDefined = bodygraph.centers.sacral.defined;
  const throatConnectedToMotor = hasMotorToThroat(bodygraph);

  // Reflector: No centers defined
  if (bodygraph.definedCenters.length === 0) {
    return 'reflector';
  }

  // Manifestor: Throat connected to motor, sacral undefined
  if (throatConnectedToMotor && !sacralDefined) {
    return 'manifestor';
  }

  // Generator types: Sacral defined
  if (sacralDefined) {
    if (throatConnectedToMotor) {
      return 'manifesting-generator';
    }
    return 'generator';
  }

  // Projector: No sacral, no motor-to-throat
  return 'projector';
}

function hasMotorToThroat(bodygraph: Bodygraph): boolean {
  const motorCenters: Center[] = ['sacral', 'root', 'solar', 'heart'];
  // Check if any motor center connects to throat through defined channels
  // ... traversal logic
  return false; // placeholder
}
```

---

## Authority

Inner authority for decision-making.

```typescript
type Authority =
  | 'emotional'      // Solar Plexus defined
  | 'sacral'         // Sacral defined, no emotional
  | 'splenic'        // Spleen defined, no sacral/emotional
  | 'ego-manifested' // Heart to throat, Manifestor
  | 'ego-projected'  // Heart defined, Projector
  | 'self-projected' // G center to throat, Projector
  | 'mental'         // Projector, no inner authority
  | 'lunar';         // Reflector, wait 28 days

function determineAuthority(bodygraph: Bodygraph, type: HumanDesignType): Authority {
  if (bodygraph.centers.solar.defined) {
    return 'emotional';
  }

  if (bodygraph.centers.sacral.defined) {
    return 'sacral';
  }

  if (bodygraph.centers.spleen.defined) {
    return 'splenic';
  }

  if (bodygraph.centers.heart.defined) {
    if (type === 'manifestor') return 'ego-manifested';
    if (type === 'projector') return 'ego-projected';
  }

  if (type === 'projector' && bodygraph.centers.g.defined) {
    return 'self-projected';
  }

  if (type === 'reflector') {
    return 'lunar';
  }

  return 'mental';
}
```

---

## Profile

The costume or role in life, based on line positions.

```typescript
type ProfileLine = 1 | 2 | 3 | 4 | 5 | 6;

interface Profile {
  conscious: ProfileLine;    // Personality Sun line
  unconscious: ProfileLine;  // Design Sun line
  name: string;
  theme: string;
}

const profiles: Record<string, Profile> = {
  '1/3': { conscious: 1, unconscious: 3, name: 'Investigator/Martyr', theme: 'Trial and error through research' },
  '1/4': { conscious: 1, unconscious: 4, name: 'Investigator/Opportunist', theme: 'Foundation through network' },
  '2/4': { conscious: 2, unconscious: 4, name: 'Hermit/Opportunist', theme: 'Natural talent called out' },
  '2/5': { conscious: 2, unconscious: 5, name: 'Hermit/Heretic', theme: 'Called to universalize' },
  '3/5': { conscious: 3, unconscious: 5, name: 'Martyr/Heretic', theme: 'Trial and error for others' },
  '3/6': { conscious: 3, unconscious: 6, name: 'Martyr/Role Model', theme: 'Trial to wisdom' },
  '4/6': { conscious: 4, unconscious: 6, name: 'Opportunist/Role Model', theme: 'Network to example' },
  '4/1': { conscious: 4, unconscious: 1, name: 'Opportunist/Investigator', theme: 'Fixed foundation' },
  '5/1': { conscious: 5, unconscious: 1, name: 'Heretic/Investigator', theme: 'Universal solutions' },
  '5/2': { conscious: 5, unconscious: 2, name: 'Heretic/Hermit', theme: 'Called savior' },
  '6/2': { conscious: 6, unconscious: 2, name: 'Role Model/Hermit', theme: 'Wisdom from withdrawal' },
  '6/3': { conscious: 6, unconscious: 3, name: 'Role Model/Martyr', theme: 'Wisdom through trial' },
};
```

---

## Calculation Requirements

### Required Input
```typescript
interface BirthData {
  date: Date;           // Required
  time: string;         // Required (HH:MM format, local time)
  timezone: string;     // Required (IANA timezone)
  latitude: number;     // Required (decimal degrees)
  longitude: number;    // Required (decimal degrees)
}
```

### Planetary Positions
Human Design uses two sets of planetary positions:
1. **Personality (Conscious)**: Positions at birth time
2. **Design (Unconscious)**: Positions at the moment the Sun stood **exactly 88°
   of solar arc** before its birth position

> The Design moment must be **solved for**, never approximated as "88 days
> earlier". The Sun's apparent speed swings between 0.953°/day and 1.019°/day,
> so a fixed 88-day offset delivers anywhere from 84.4° to 89.0° of arc — up to
> 3.9 lines of error, enough to move the Design Sun into a different gate.

> The lunar nodes are the **true (osculating) nodes**, not the mean nodes. The
> two differ by up to 1.6°. Verified against published HD transit data: the 2026
> nodal shift into gates 30/29 (25 July 2026) matches the true node to the hour
> and the mean node only 22 days later.

```typescript
interface PlanetaryActivation {
  planet: Planet;
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
}

type Planet =
  | 'sun' | 'earth' | 'moon' | 'northNode' | 'southNode'
  | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'
  | 'uranus' | 'neptune' | 'pluto';

interface ActivationSet {
  personality: PlanetaryActivation[];  // At birth
  design: PlanetaryActivation[];       // ~88° earlier
}
```

### Gate Calculation
Convert tropical zodiac position to I Ching gate.

**The wheel does not start at 0° Aries.** Gate 41 line 1 opens at 2°00'00"
Aquarius = **302.000°**, and every boundary follows at multiples of 5.625° from
there — which is why gate boundaries land on 3°52'30" inside each sign, and why
the Rave New Year (Sun re-entering Gate 41) falls around January 22. Dividing
raw longitude by the gate size, with no offset, rotates the entire mandala by
58 gate positions and makes every activation wrong.

```typescript
const MANDALA_START_DEGREE = 302; // Gate 41.1 — 2°00'00" Aquarius

function zodiacToGate(zodiacDegree: number): { gate: number; line: number } {
  const gateSize = 360 / 64;   // 5.625°
  const lineSize = gateSize / 6; // 0.9375°

  // Measure from the start of the mandala, not from the vernal point
  const wheelPosition = (((zodiacDegree - MANDALA_START_DEGREE) % 360) + 360) % 360;

  const gate = MANDALA_SEQUENCE_FULL[Math.floor(wheelPosition / gateSize)];
  const line = Math.floor((wheelPosition % gateSize) / lineSize) + 1;

  return { gate, line };
}

// Index 0 is Gate 41 at 302°, then every 5.625° onward. Not numerical order.
const MANDALA_SEQUENCE_FULL: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, // 302.000° →
  22, 36, 25, 17, 21, 51, 42, 3,
  // ... 64 total gates around the wheel
];
```

### Incarnation Cross Angle
The cross geometry follows the **full profile**, not the conscious Sun line:

| Angle | Profiles |
|---|---|
| Right Angle | 1/3, 1/4, 2/4, 2/5, 3/5, 3/6, 4/6 |
| Juxtaposition | 4/1 (only) |
| Left Angle | 5/1, 5/2, 6/2, 6/3 |

---

## Bodygraph Generation

```typescript
interface Bodygraph {
  type: HumanDesignType;
  authority: Authority;
  profile: Profile;
  definition: Definition;
  centers: Record<Center, CenterState>;
  channels: Channel[];
  gates: Gate[];
  personality: ActivationSet['personality'];
  design: ActivationSet['design'];
  incarnationCross: IncarnationCross;
}

type Definition =
  | 'single'       // All defined centers connected
  | 'split'        // Two separate areas
  | 'triple-split' // Three separate areas
  | 'quadruple-split' // Four separate areas
  | 'none';        // Reflector

function generateBodygraph(birthData: BirthData): Bodygraph {
  // 1. Calculate planetary positions at birth
  const personalityPositions = calculatePlanetaryPositions(birthData);

  // 2. Calculate design positions (~88° solar arc before)
  const designDate = calculateDesignDate(birthData);
  const designPositions = calculatePlanetaryPositions({ ...birthData, date: designDate });

  // 3. Convert positions to gate activations
  const personality = positionsToActivations(personalityPositions);
  const design = positionsToActivations(designPositions);

  // 4. Determine which centers are defined
  const allGates = [...personality, ...design].map(a => a.gate);
  const centers = calculateCenterStates(allGates);

  // 5. Determine channels
  const channels = findDefinedChannels(allGates);

  // 6. Determine type, authority, profile
  const type = determineType({ centers, channels });
  const authority = determineAuthority({ centers }, type);
  const profile = determineProfile(personality, design);

  // 7. Calculate incarnation cross
  const incarnationCross = calculateIncarnationCross(personality, design);

  return {
    type,
    authority,
    profile,
    definition: calculateDefinition(centers),
    centers,
    channels,
    gates: allGates.map(g => gateData[g]),
    personality,
    design,
    incarnationCross,
  };
}
```

---

## Incarnation Cross

Life purpose theme based on Sun/Earth gates.

```typescript
interface IncarnationCross {
  name: string;
  quarter: Quarter;
  gates: {
    personalitySun: number;
    personalityEarth: number;
    designSun: number;
    designEarth: number;
  };
  theme: string;
}

type Quarter =
  | 'initiation'    // Gates 13-24
  | 'civilization'  // Gates 2-33
  | 'duality'       // Gates 7-44
  | 'mutation';     // Gates 1-20

// 192 possible crosses (64 gates × 3 variations)
```

---

## Variables (Advanced)

Deeper personality mechanics based on color, tone, and base.

```typescript
interface Variables {
  digestion: { color: number; tone: number; determination: string };
  environment: { color: number; tone: number; view: string };
  perspective: { color: number; tone: number; motivation: string };
  awareness: { color: number; tone: number; sense: string };
}
```

---

## Relationship Analysis (Composite)

Compare two bodygraphs.

```typescript
interface CompositeAnalysis {
  person1: Bodygraph;
  person2: Bodygraph;

  electromagneticConnections: Channel[];  // Where each has one gate
  companionshipConnections: Channel[];    // Same gate activated
  dominanceConnections: Channel[];        // One has channel, other has one gate
  compromiseConnections: Channel[];       // One has channel, other is open

  bridgingGates: number[];    // Gates that complete channels
  overlappingGates: number[]; // Both have same gate

  connectionType: ConnectionType;
}

type ConnectionType =
  | 'electromagnetic'  // Attraction, completion
  | 'companion'        // Friendship, similarity
  | 'dominant';        // One-directional energy
```

---

## Display Structure

### Bodygraph Visual
```
                   ┌───┐
                   │ H │ ← Head (64,61,63)
                   └─┬─┘
                     │
                   ┌─┴─┐
                   │ A │ ← Ajna (47,24,4,17,43,11)
                   └─┬─┘
                     │
                   ┌─┴─┐
                   │ T │ ← Throat (many gates)
                   └─┬─┘
                  /     \
               ┌─┴─┐   ┌─┴─┐
               │ G │   │ ♡ │ ← G Center / Heart
               └─┬─┘   └─┬─┘
                 │       │
               ┌─┴─┐   ┌─┴─┐
               │ ⚡│   │ 🌙 │ ← Spleen / Solar Plexus
               └─┬─┘   └─┬─┘
                  \     /
                   ┌─┴─┐
                   │ S │ ← Sacral
                   └─┬─┘
                     │
                   ┌─┴─┐
                   │ R │ ← Root
                   └───┘

Legend:
■ Defined center (colored)
□ Undefined center (white)
━ Defined channel
╌ Undefined channel
```

---

## Hebrew Translations

```typescript
const hebrewTranslations = {
  types: {
    manifestor: 'מניפסטור',
    generator: "ג'נרטור",
    'manifesting-generator': "מניפסטינג ג'נרטור",
    projector: "פרוג'קטור",
    reflector: 'רפלקטור',
  },
  authority: {
    emotional: 'סמכות רגשית',
    sacral: 'סמכות סקרלית',
    splenic: 'סמכות טחולית',
    // ...
  },
  centers: {
    head: 'ראש',
    ajna: "אג'נה",
    throat: 'גרון',
    g: 'מרכז G',
    heart: 'לב',
    spleen: 'טחול',
    sacral: 'סקראל',
    solar: 'מקלעת השמש',
    root: 'שורש',
  },
};
```

---

## Validation Rules

1. **Birth Time**: Required, must be HH:MM format
2. **Timezone**: Must be valid IANA timezone
3. **Coordinates**: Must be valid latitude/longitude
4. **Date Range**: 1900-2100 (ephemeris coverage)

---

## External Dependencies

Human Design requires astronomical calculations:

```typescript
// Option 1: Use Swiss Ephemeris (most accurate)
// Option 2: Use astronomy libraries
// Option 3: Pre-computed lookup tables (less accurate)

interface EphemerisProvider {
  getPlanetaryPositions(date: Date, location: Location): PlanetaryPositions;
}
```

**Note**: Full implementation requires either:
- Swiss Ephemeris integration (C library with Node bindings)
- Pre-computed ephemeris data
- API call to calculation service
