# Astrology System Specification

## Overview

Western tropical astrology calculates planetary positions at the exact moment and location of birth to create a natal chart. **Requires birth time and place for full accuracy.**

---

## Core Concepts

### Zodiac Signs (12)
```typescript
interface ZodiacSign {
  number: number;          // 1-12
  name: string;
  hebrew: string;
  symbol: string;
  element: Element;
  modality: Modality;
  ruler: Planet;
  degreesStart: number;    // 0, 30, 60, etc.
  degreesEnd: number;
  keywords: string[];
}

type Element = 'fire' | 'earth' | 'air' | 'water';
type Modality = 'cardinal' | 'fixed' | 'mutable';

const zodiacSigns: ZodiacSign[] = [
  { number: 1, name: 'Aries', hebrew: 'טלה', symbol: '♈', element: 'fire', modality: 'cardinal', ruler: 'mars', degreesStart: 0, degreesEnd: 30, keywords: ['initiative', 'courage', 'independence'] },
  { number: 2, name: 'Taurus', hebrew: 'שור', symbol: '♉', element: 'earth', modality: 'fixed', ruler: 'venus', degreesStart: 30, degreesEnd: 60, keywords: ['stability', 'sensuality', 'persistence'] },
  { number: 3, name: 'Gemini', hebrew: 'תאומים', symbol: '♊', element: 'air', modality: 'mutable', ruler: 'mercury', degreesStart: 60, degreesEnd: 90, keywords: ['communication', 'curiosity', 'adaptability'] },
  { number: 4, name: 'Cancer', hebrew: 'סרטן', symbol: '♋', element: 'water', modality: 'cardinal', ruler: 'moon', degreesStart: 90, degreesEnd: 120, keywords: ['nurturing', 'emotion', 'home'] },
  { number: 5, name: 'Leo', hebrew: 'אריה', symbol: '♌', element: 'fire', modality: 'fixed', ruler: 'sun', degreesStart: 120, degreesEnd: 150, keywords: ['creativity', 'leadership', 'expression'] },
  { number: 6, name: 'Virgo', hebrew: 'בתולה', symbol: '♍', element: 'earth', modality: 'mutable', ruler: 'mercury', degreesStart: 150, degreesEnd: 180, keywords: ['analysis', 'service', 'precision'] },
  { number: 7, name: 'Libra', hebrew: 'מאזניים', symbol: '♎', element: 'air', modality: 'cardinal', ruler: 'venus', degreesStart: 180, degreesEnd: 210, keywords: ['balance', 'partnership', 'harmony'] },
  { number: 8, name: 'Scorpio', hebrew: 'עקרב', symbol: '♏', element: 'water', modality: 'fixed', ruler: 'pluto', degreesStart: 210, degreesEnd: 240, keywords: ['transformation', 'intensity', 'depth'] },
  { number: 9, name: 'Sagittarius', hebrew: 'קשת', symbol: '♐', element: 'fire', modality: 'mutable', ruler: 'jupiter', degreesStart: 240, degreesEnd: 270, keywords: ['expansion', 'philosophy', 'adventure'] },
  { number: 10, name: 'Capricorn', hebrew: 'גדי', symbol: '♑', element: 'earth', modality: 'cardinal', ruler: 'saturn', degreesStart: 270, degreesEnd: 300, keywords: ['ambition', 'structure', 'mastery'] },
  { number: 11, name: 'Aquarius', hebrew: 'דלי', symbol: '♒', element: 'air', modality: 'fixed', ruler: 'uranus', degreesStart: 300, degreesEnd: 330, keywords: ['innovation', 'community', 'independence'] },
  { number: 12, name: 'Pisces', hebrew: 'דגים', symbol: '♓', element: 'water', modality: 'mutable', ruler: 'neptune', degreesStart: 330, degreesEnd: 360, keywords: ['intuition', 'compassion', 'transcendence'] },
];
```

### Planets (10 + Nodes)
```typescript
interface Planet {
  name: string;
  hebrew: string;
  symbol: string;
  type: PlanetType;
  keywords: string[];
  orbitDays?: number;
}

type PlanetType = 'luminary' | 'personal' | 'social' | 'transpersonal' | 'point';

const planets: Planet[] = [
  { name: 'Sun', hebrew: 'שמש', symbol: '☉', type: 'luminary', keywords: ['identity', 'vitality', 'ego'] },
  { name: 'Moon', hebrew: 'ירח', symbol: '☽', type: 'luminary', keywords: ['emotions', 'instincts', 'needs'] },
  { name: 'Mercury', hebrew: 'כוכב חמה', symbol: '☿', type: 'personal', keywords: ['communication', 'thinking', 'learning'], orbitDays: 88 },
  { name: 'Venus', hebrew: 'נוגה', symbol: '♀', type: 'personal', keywords: ['love', 'beauty', 'values'], orbitDays: 225 },
  { name: 'Mars', hebrew: 'מאדים', symbol: '♂', type: 'personal', keywords: ['action', 'desire', 'energy'], orbitDays: 687 },
  { name: 'Jupiter', hebrew: 'צדק', symbol: '♃', type: 'social', keywords: ['expansion', 'wisdom', 'luck'], orbitDays: 4333 },
  { name: 'Saturn', hebrew: 'שבתאי', symbol: '♄', type: 'social', keywords: ['structure', 'limits', 'discipline'], orbitDays: 10759 },
  { name: 'Uranus', hebrew: 'אורנוס', symbol: '♅', type: 'transpersonal', keywords: ['change', 'rebellion', 'innovation'], orbitDays: 30687 },
  { name: 'Neptune', hebrew: 'נפטון', symbol: '♆', type: 'transpersonal', keywords: ['dreams', 'illusion', 'spirituality'], orbitDays: 60190 },
  { name: 'Pluto', hebrew: 'פלוטו', symbol: '♇', type: 'transpersonal', keywords: ['transformation', 'power', 'rebirth'], orbitDays: 90560 },
  { name: 'North Node', hebrew: 'ראש התלי', symbol: '☊', type: 'point', keywords: ['destiny', 'growth', 'future'] },
  { name: 'South Node', hebrew: 'זנב התלי', symbol: '☋', type: 'point', keywords: ['past', 'comfort', 'release'] },
];
```

### Houses (12)
```typescript
interface House {
  number: number;
  name: string;
  hebrew: string;
  theme: string;
  keywords: string[];
  naturalSign: string;
}

const houses: House[] = [
  { number: 1, name: 'First House', hebrew: 'בית ראשון', theme: 'Self', keywords: ['identity', 'appearance', 'beginnings'], naturalSign: 'Aries' },
  { number: 2, name: 'Second House', hebrew: 'בית שני', theme: 'Values', keywords: ['money', 'possessions', 'self-worth'], naturalSign: 'Taurus' },
  { number: 3, name: 'Third House', hebrew: 'בית שלישי', theme: 'Communication', keywords: ['siblings', 'learning', 'local travel'], naturalSign: 'Gemini' },
  { number: 4, name: 'Fourth House', hebrew: 'בית רביעי', theme: 'Home', keywords: ['family', 'roots', 'emotional foundation'], naturalSign: 'Cancer' },
  { number: 5, name: 'Fifth House', hebrew: 'בית חמישי', theme: 'Creativity', keywords: ['children', 'romance', 'self-expression'], naturalSign: 'Leo' },
  { number: 6, name: 'Sixth House', hebrew: 'בית שישי', theme: 'Service', keywords: ['health', 'work', 'daily routines'], naturalSign: 'Virgo' },
  { number: 7, name: 'Seventh House', hebrew: 'בית שביעי', theme: 'Partnership', keywords: ['marriage', 'contracts', 'open enemies'], naturalSign: 'Libra' },
  { number: 8, name: 'Eighth House', hebrew: 'בית שמיני', theme: 'Transformation', keywords: ['death', 'shared resources', 'intimacy'], naturalSign: 'Scorpio' },
  { number: 9, name: 'Ninth House', hebrew: 'בית תשיעי', theme: 'Philosophy', keywords: ['travel', 'higher education', 'beliefs'], naturalSign: 'Sagittarius' },
  { number: 10, name: 'Tenth House', hebrew: 'בית עשירי', theme: 'Career', keywords: ['public image', 'authority', 'achievement'], naturalSign: 'Capricorn' },
  { number: 11, name: 'Eleventh House', hebrew: 'בית אחד עשר', theme: 'Community', keywords: ['friends', 'groups', 'hopes'], naturalSign: 'Aquarius' },
  { number: 12, name: 'Twelfth House', hebrew: 'בית שנים עשר', theme: 'Unconscious', keywords: ['hidden', 'spiritual', 'self-undoing'], naturalSign: 'Pisces' },
];
```

---

## Aspects

Angular relationships between planets.

```typescript
interface Aspect {
  name: string;
  hebrew: string;
  symbol: string;
  angle: number;
  orb: number;           // Allowed deviation in degrees
  nature: AspectNature;
  keywords: string[];
}

type AspectNature = 'major-hard' | 'major-soft' | 'minor';

const aspects: Aspect[] = [
  { name: 'Conjunction', hebrew: 'צימוד', symbol: '☌', angle: 0, orb: 8, nature: 'major-hard', keywords: ['fusion', 'intensification'] },
  { name: 'Opposition', hebrew: 'ניגוד', symbol: '☍', angle: 180, orb: 8, nature: 'major-hard', keywords: ['tension', 'awareness', 'projection'] },
  { name: 'Square', hebrew: 'ריבוע', symbol: '□', angle: 90, orb: 7, nature: 'major-hard', keywords: ['friction', 'challenge', 'action'] },
  { name: 'Trine', hebrew: 'משולש', symbol: '△', angle: 120, orb: 8, nature: 'major-soft', keywords: ['harmony', 'flow', 'ease'] },
  { name: 'Sextile', hebrew: 'משושה', symbol: '⚹', angle: 60, orb: 5, nature: 'major-soft', keywords: ['opportunity', 'cooperation'] },
  { name: 'Quincunx', hebrew: 'קווינקונקס', symbol: '⚻', angle: 150, orb: 3, nature: 'minor', keywords: ['adjustment', 'discomfort'] },
  { name: 'Semi-sextile', hebrew: 'חצי משושה', symbol: '⚺', angle: 30, orb: 2, nature: 'minor', keywords: ['growth', 'irritation'] },
];

interface AspectInstance {
  planet1: string;
  planet2: string;
  aspect: Aspect;
  exactAngle: number;
  orb: number;          // How far from exact
  applying: boolean;    // Getting closer or separating
}
```

---

## Natal Chart Structure

```typescript
interface NatalChart {
  // Birth data
  birthDate: Date;
  birthTime: string;
  birthPlace: {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };

  // Calculated positions
  planets: PlanetPosition[];
  houses: HousePosition[];
  aspects: AspectInstance[];

  // Key points
  ascendant: ZodiacPosition;   // Rising sign
  midheaven: ZodiacPosition;   // MC (career point)
  descendant: ZodiacPosition;  // 7th house cusp
  imumCoeli: ZodiacPosition;   // IC (4th house cusp)

  // Derived data
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign: ZodiacSign;

  // Patterns
  elementBalance: Record<Element, number>;
  modalityBalance: Record<Modality, number>;
  chartShape: ChartShape;
}

interface ZodiacPosition {
  sign: ZodiacSign;
  degree: number;         // 0-29
  minute: number;         // 0-59
  formatted: string;      // e.g., "15°23' Aries"
}

interface PlanetPosition {
  planet: Planet;
  position: ZodiacPosition;
  house: number;
  retrograde: boolean;
  dignity: Dignity;
}

interface HousePosition {
  house: House;
  cusp: ZodiacPosition;
  planets: string[];      // Planets in this house
}

type Dignity = 'domicile' | 'exaltation' | 'detriment' | 'fall' | 'neutral';
type ChartShape = 'bundle' | 'bowl' | 'bucket' | 'locomotive' | 'seesaw' | 'splash' | 'splay';
```

---

## House Systems

Different methods for calculating house cusps.

```typescript
type HouseSystem =
  | 'placidus'      // Most common in Western astrology
  | 'koch'          // Popular in Europe
  | 'whole-sign'    // Traditional, each sign = one house
  | 'equal'         // Equal 30° divisions from Ascendant
  | 'campanus'
  | 'regiomontanus';

const defaultHouseSystem: HouseSystem = 'placidus';
```

---

## Calculation Requirements

### Required Input
```typescript
interface AstrologyInput {
  date: Date;
  time: string;           // HH:MM local time
  timezone: string;       // IANA timezone
  latitude: number;
  longitude: number;
  houseSystem?: HouseSystem;
}
```

### Calculation Steps
```typescript
function calculateNatalChart(input: AstrologyInput): NatalChart {
  // 1. Convert local time to UTC
  const utcDateTime = localToUTC(input.date, input.time, input.timezone);

  // 2. Calculate Julian Day
  const jd = dateToJulianDay(utcDateTime);

  // 3. Calculate sidereal time at birth location
  const lst = calculateLocalSiderealTime(jd, input.longitude);

  // 4. Calculate planetary positions (ecliptic longitude)
  const planetPositions = calculatePlanetaryPositions(jd);

  // 5. Calculate house cusps using selected system
  const houseCusps = calculateHouseCusps(
    jd,
    input.latitude,
    lst,
    input.houseSystem || 'placidus'
  );

  // 6. Assign planets to houses
  const planetHouses = assignPlanetsToHouses(planetPositions, houseCusps);

  // 7. Calculate aspects
  const aspects = calculateAspects(planetPositions);

  // 8. Calculate dignities
  const dignities = calculateDignities(planetPositions);

  // 9. Derive secondary data
  return assembleChart(/*...*/);
}
```

### Ephemeris Data
Planetary positions require astronomical calculations or ephemeris lookup.

```typescript
interface EphemerisProvider {
  getPlanetPosition(planet: string, julianDay: number): {
    longitude: number;    // 0-360 degrees
    latitude: number;     // Ecliptic latitude
    distance: number;     // AU from Earth
    speed: number;        // Degrees per day
  };
}
```

---

## Transits

Current planetary positions relative to natal chart.

```typescript
interface Transit {
  transitingPlanet: Planet;
  natalPlanet: Planet;
  aspect: Aspect;
  exactDate: Date;
  startDate: Date;        // When aspect enters orb
  endDate: Date;          // When aspect leaves orb
  interpretation: string;
}

interface TransitReport {
  date: Date;
  activeTransits: Transit[];
  upcomingTransits: Transit[];  // Next 30 days
}

function calculateTransits(natalChart: NatalChart, date: Date): TransitReport {
  const currentPositions = calculatePlanetaryPositions(dateToJulianDay(date));

  const transits: Transit[] = [];

  for (const transitPlanet of currentPositions) {
    for (const natalPlanet of natalChart.planets) {
      for (const aspectDef of aspects) {
        const angle = calculateAngle(transitPlanet.position, natalPlanet.position);
        if (isWithinOrb(angle, aspectDef)) {
          transits.push({
            transitingPlanet: transitPlanet.planet,
            natalPlanet: natalPlanet.planet,
            aspect: aspectDef,
            exactDate: calculateExactDate(/*...*/),
            startDate: calculateOrbEntry(/*...*/),
            endDate: calculateOrbExit(/*...*/),
            interpretation: getTransitInterpretation(/*...*/),
          });
        }
      }
    }
  }

  return { date, activeTransits: transits, upcomingTransits: [] };
}
```

---

## Synastry (Relationship Comparison)

Compare two natal charts.

```typescript
interface SynastryReport {
  person1: NatalChart;
  person2: NatalChart;

  interAspects: InterAspect[];    // Aspects between charts
  houseOverlays: HouseOverlay[];  // Person1's planets in Person2's houses
  compositeChart?: NatalChart;    // Midpoint chart
}

interface InterAspect {
  planet1: { person: 1 | 2; planet: Planet; position: ZodiacPosition };
  planet2: { person: 1 | 2; planet: Planet; position: ZodiacPosition };
  aspect: Aspect;
  orb: number;
  interpretation: string;
}

interface HouseOverlay {
  person: 1 | 2;
  planet: Planet;
  houseInOther: number;
  interpretation: string;
}
```

---

## Chart Visualization

### Wheel Layout
```
                    MC (Midheaven)
                         │
            10    11    12/1    1     2
              ╲    │     │     │    ╱
                ╲  │     │     │  ╱
                  ╲│     │     │╱
           9 ──────┼─────┼─────┼────── 3
                  ╱│     │     │╲
                ╱  │     │     │  ╲
              ╱    │     │     │    ╲
            8     7    6/7    5     4
                         │
                    IC (Imum Coeli)

           ASC ←─────────────────────→ DSC
         (Rising)                  (Descendant)
```

### Planet Glyphs
```
☉ Sun     ☽ Moon    ☿ Mercury  ♀ Venus   ♂ Mars
♃ Jupiter ♄ Saturn  ♅ Uranus   ♆ Neptune ♇ Pluto
☊ N.Node  ☋ S.Node
```

### Aspect Lines
- Red lines: Hard aspects (opposition, square)
- Blue lines: Soft aspects (trine, sextile)
- Green lines: Minor aspects

---

## Display Components

### Chart Summary Card
```
┌─────────────────────────────────────────┐
│         ☉ Sun in ♌ Leo                  │
│         ☽ Moon in ♋ Cancer              │
│         ↑ Rising: ♎ Libra               │
├─────────────────────────────────────────┤
│  Element Balance:                       │
│  🔥 Fire: 30%  🌍 Earth: 25%            │
│  💨 Air: 25%   💧 Water: 20%            │
├─────────────────────────────────────────┤
│  Key Aspects:                           │
│  ☉ □ ☽  Sun square Moon                 │
│  ♀ △ ♃  Venus trine Jupiter             │
└─────────────────────────────────────────┘
```

---

## Validation Rules

1. **Birth Time**: Required for accurate house positions
2. **Location**: Required for Ascendant calculation
3. **Date Range**: 1900-2100 (ephemeris coverage)
4. **Coordinates**: Valid latitude (-90 to 90), longitude (-180 to 180)

---

## Without Birth Time

If birth time is unknown:
- Use noon (12:00) as default
- Mark Moon position as approximate (moves ~13°/day)
- Omit house placements and angles
- Focus on sign placements and aspects

```typescript
interface SunSignChart {
  sunSign: ZodiacSign;
  planets: Array<{
    planet: Planet;
    sign: ZodiacSign;
    approximate: boolean;
  }>;
  aspects: AspectInstance[];
  // No houses, no angles
}
```

---

## External Dependencies

Full chart calculation requires:
1. **Swiss Ephemeris** or equivalent for planetary positions
2. **House system algorithms** (Placidus, etc.)
3. **Atlas/Timezone database** for birth place lookup
