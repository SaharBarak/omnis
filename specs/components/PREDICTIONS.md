# Predictions Component Specification

> **Status:** COMPLETE
> **Phase:** 5 (Predictions + Time Intelligence)
> **Implemented:** Daily/weekly/monthly forecasts, timelines, notifications

## Overview

The Predictions component provides time-based forecasting and cycle awareness across symbolic systems. It surfaces relevant transits, cycles, and windows for personal planning.

---

## Core Concepts

### Prediction Types
```typescript
type Prediction =
  | CyclePrediction      // Regular recurring cycles
  | TransitPrediction    // Planetary transits (astrology)
  | WindowPrediction     // Special time windows
  | EventPrediction;     // Specific dates/events

interface BasePrediction {
  id: PredictionId;
  system: SystemType;
  personId: PersonId;
  startDate: ISODate;
  endDate: ISODate;
  intensity: Intensity;
  themes: string[];
  interpretation: string;
}

type Intensity = 'low' | 'medium' | 'high' | 'peak';
```

---

## System-Specific Predictions

### Dreamspell Cycles

#### Wavespell Position
```typescript
interface WavespellPrediction extends BasePrediction {
  system: 'dreamspell';
  type: 'wavespell';
  wavespell: {
    name: string;
    startKin: number;
    currentDay: number;          // 1-13
    currentTone: number;
    purpose: string;
  };
}

function getCurrentWavespell(date: Date): WavespellPrediction {
  const kin = calculateKin(date);
  const wavespell = getWavespell(kin);
  const dayInWavespell = ((kin - wavespell.startKin) % 13) + 1;

  return {
    system: 'dreamspell',
    type: 'wavespell',
    startDate: wavespellStartDate(wavespell),
    endDate: wavespellEndDate(wavespell),
    intensity: dayInWavespell === 1 ? 'peak' : dayInWavespell === 13 ? 'high' : 'medium',
    wavespell: {
      name: wavespell.name,
      startKin: wavespell.startKin,
      currentDay: dayInWavespell,
      currentTone: dayInWavespell,
      purpose: wavespellPurposes[dayInWavespell],
    },
  };
}
```

#### Castle Cycle
```typescript
interface CastlePrediction extends BasePrediction {
  system: 'dreamspell';
  type: 'castle';
  castle: {
    color: Castle;
    name: string;
    theme: string;
    daysRemaining: number;
  };
}

// 5 castles, each 52 days = 260 day cycle
const castleThemes: Record<Castle, string> = {
  red: 'Initiative and beginnings',
  white: 'Refinement and purification',
  blue: 'Transformation',
  yellow: 'Ripening and blossoming',
  green: 'Magic and matrix',
};
```

#### Yearly Kin
```typescript
interface YearlyKinPrediction extends BasePrediction {
  system: 'dreamspell';
  type: 'yearly-kin';
  yearlyKin: {
    kin: number;
    seal: number;
    tone: number;
    theme: string;
    daysUntilBirthday: number;
  };
}

function getYearlyKinPrediction(person: Person, date: Date): YearlyKinPrediction {
  const nextBirthday = getNextBirthday(person.birthDate, date);
  const currentYearKin = calculateKin(getLastBirthday(person.birthDate, date));

  return {
    system: 'dreamspell',
    type: 'yearly-kin',
    yearlyKin: {
      kin: currentYearKin,
      ...kinToSealTone(currentYearKin),
      theme: getYearlyTheme(currentYearKin),
      daysUntilBirthday: daysBetween(date, nextBirthday),
    },
  };
}
```

### Tzolkin Cycles

#### Trecena Position
```typescript
interface TrecenaPrediction extends BasePrediction {
  system: 'tzolkin';
  type: 'trecena';
  trecena: {
    ruling: number;              // Ruling day sign
    name: string;
    currentDay: number;          // 1-13
    daysRemaining: number;
  };
}
```

#### Year Bearer
```typescript
interface YearBearerPrediction extends BasePrediction {
  system: 'tzolkin';
  type: 'year-bearer';
  yearBearer: {
    daySign: string;
    tone: number;
    yearTheme: string;
    startDate: Date;             // Mayan new year
  };
}
```

### Astrology Transits

#### Personal Transits
```typescript
interface TransitPrediction extends BasePrediction {
  system: 'astrology';
  type: 'transit';
  transit: {
    transitingPlanet: Planet;
    natalPlanet: Planet;
    aspect: Aspect;
    exactDate: Date;
    orb: number;
    applying: boolean;           // Getting closer?
  };
}

function getActiveTransits(
  natalChart: NatalChart,
  date: Date,
  lookahead: number = 30
): TransitPrediction[] {
  const transits: TransitPrediction[] = [];

  // Get current planetary positions
  const currentPositions = getPlanetaryPositions(date);

  // Check each transit planet against natal positions
  for (const transitPlanet of currentPositions) {
    for (const natalPlanet of natalChart.planets) {
      for (const aspect of majorAspects) {
        const angle = angleBetween(transitPlanet.longitude, natalPlanet.longitude);
        const orb = Math.abs(angle - aspect.angle);

        if (orb <= aspect.orb) {
          transits.push({
            system: 'astrology',
            type: 'transit',
            transit: {
              transitingPlanet: transitPlanet.planet,
              natalPlanet: natalPlanet.planet,
              aspect,
              exactDate: calculateExactDate(transitPlanet, natalPlanet, aspect),
              orb,
              applying: isApplying(transitPlanet, natalPlanet, aspect),
            },
            intensity: orbToIntensity(orb),
            themes: getTransitThemes(transitPlanet, natalPlanet, aspect),
          });
        }
      }
    }
  }

  return transits;
}
```

#### Planetary Returns
```typescript
interface ReturnPrediction extends BasePrediction {
  system: 'astrology';
  type: 'return';
  return: {
    planet: Planet;
    returnNumber: number;        // 1st, 2nd, etc.
    exactDate: Date;
  };
}

// Major returns
const returns = {
  moon: { period: 27.3, significance: 'monthly emotional cycle' },
  sun: { period: 365.25, significance: 'birthday, yearly renewal' },
  mercury: { period: 88, significance: 'mental cycles' },
  venus: { period: 225, significance: 'love & value cycles' },
  mars: { period: 687, significance: 'energy & drive cycles' },
  jupiter: { period: 4333, significance: '12-year growth cycle' },
  saturn: { period: 10759, significance: '29-year maturity cycle' },
};
```

#### Retrograde Periods
```typescript
interface RetrogradePrediction extends BasePrediction {
  system: 'astrology';
  type: 'retrograde';
  retrograde: {
    planet: Planet;
    startDate: Date;
    endDate: Date;
    stationDate: Date;           // When it turns retrograde
    directDate: Date;            // When it goes direct
    affectedHouses: number[];
  };
}
```

### Human Design Transits

```typescript
interface HDTransitPrediction extends BasePrediction {
  system: 'human-design';
  type: 'transit';
  hdTransit: {
    transitGate: number;
    natalGate?: number;          // If completing a channel
    center: Center;
    channelCompleted?: Channel;
    theme: string;
  };
}
```

---

## Timeline Views

### Daily View
```
+------------------------------------------------------------------+
|  Today: 20.1.2025 - Sunday                                        |
+------------------------------------------------------------------+
|                                                                   |
|  Dreamspell: Kin 156 - Cosmic Yellow Warrior                     |
|     Day 13 in the Blue Monkey Wavespell                          |
|     "I endure in order to question, transcending intelligence"   |
|                                                                   |
|  Tzolkin: 8 Men - 8 Eagle                                        |
|     Day 8 in the Deer Trecena                                    |
|                                                                   |
|  Astrology:                                                       |
|     - Sun in Aquarius (transit in 2 days)                        |
|     - Moon in Cancer square Pluto - emotional tension            |
|     - Mercury Retrograde (until Feb 8)                           |
|                                                                   |
+------------------------------------------------------------------+
|  Today's Themes:                                                  |
|     Persistence, completing cycles, intelligence, questioning     |
|                                                                   |
+------------------------------------------------------------------+
```

### Weekly View
```
+------------------------------------------------------------------+
|  Week 20-26.1.2025                                    [<] [>]     |
+------------------------------------------------------------------+
|                                                                   |
|  Sun    Mon    Tue    Wed    Thu    Fri    Sat                   |
|   20     21     22     23     24     25     26                   |
|  +-----++-----++-----++-----++-----++-----++-----+               |
|  |K156 ||K157 ||K158 ||K159 ||K160 ||K161 ||K162 |               |
|  |  Y  ||  R  ||  W  ||  B  ||  Y  ||  R  ||  W  |               |
|  +-----++-----++-----++-----++-----++-----++-----+               |
|                                                                   |
|  Wave: Blue Monkey ========================| Red Earth ====      |
|                                            13^                    |
|                                       Wave ending                 |
|                                                                   |
+------------------------------------------------------------------+
|  Events:                                                          |
|  - 21.1 - Sun enters Aquarius                                    |
|  - 23.1 - Full Moon in Leo                                       |
|                                                                   |
+------------------------------------------------------------------+
```

### Monthly View
```
+------------------------------------------------------------------+
|  January 2025                                        [<] [>]      |
+------------------------------------------------------------------+
|                                                                   |
|  Su   Mo   Tu   We   Th   Fr   Sa                                |
|            1    2    3    4    5                                 |
|  O         K137 K138 K139 K140 K141                              |
|                                                                   |
|  6    7    8    9    10   11   12                                |
|  K142 K143 K144 K145 K146 K147 K148                              |
|       *                                                          |
|                                                                   |
|  13   14   15   16   17   18   19                                |
|  K149 K150 K151 K152 K153 K154 K155                              |
|                          O                                       |
|                                                                   |
|  20   21   22   23   24   25   26                                |
|  K156 K157 K158 K159 K160 K161 K162                              |
|       MRx       *                                                |
|                                                                   |
|  27   28   29   30   31                                          |
|  K163 K164 K165 K166 K167                                        |
|                          O                                       |
|                                                                   |
+------------------------------------------------------------------+
|  O New Moon  * Full Moon  MRx Mercury Retrograde                 |
+------------------------------------------------------------------+
```

---

## Personal Timeline

### Life Overview
```typescript
interface LifeTimeline {
  personId: PersonId;
  birthDate: Date;
  phases: LifePhase[];
  majorCycles: MajorCycle[];
  upcomingMilestones: Milestone[];
}

interface LifePhase {
  name: string;
  startAge: number;
  endAge: number;
  currentProgress: number;       // 0-100%
  theme: string;
}

interface MajorCycle {
  system: SystemType;
  name: string;
  duration: number;              // In years
  currentCycle: number;
  startDate: Date;
  endDate: Date;
}

interface Milestone {
  name: string;
  date: Date;
  system: SystemType;
  significance: string;
}
```

### Saturn Return Example
```
+------------------------------------------------------------------+
|  Saturn Return                                                    |
+------------------------------------------------------------------+
|                                                                   |
|  Saturn returns to its birth position every ~29.5 years          |
|                                                                   |
|  Your first return:                                               |
|  +----------------------------------------+                      |
|  | Start:  March 2024                     |                      |
|  | Peak:   August 2024                    |                      |
|  | End:    January 2025                   | <-- You are here     |
|  +----------------------------------------+                      |
|                                                                   |
|  Themes:                                                          |
|  - Maturation and responsibility                                  |
|  - Defining life structure                                        |
|  - Dealing with limitations                                       |
|  - Building long-term foundations                                 |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Notifications

### Notification Settings
```typescript
interface NotificationSettings {
  enabled: boolean;
  channels: NotificationChannel[];
  timing: NotificationTiming;
  systems: SystemType[];
  minIntensity: Intensity;
}

type NotificationChannel = 'push' | 'email' | 'in-app';

interface NotificationTiming {
  dailyDigest: boolean;
  dailyDigestTime: string;       // HH:MM
  weeklyDigest: boolean;
  weeklyDigestDay: number;       // 0-6 (Sunday-Saturday)
  advanceNotice: number;         // Days before event
}
```

### Notification Types
```typescript
type PredictionNotification =
  | DailyDigest
  | WeeklyDigest
  | EventReminder
  | CycleChange;

interface DailyDigest {
  type: 'daily-digest';
  date: Date;
  predictions: Prediction[];
  headline: string;
}

interface EventReminder {
  type: 'event-reminder';
  prediction: Prediction;
  daysUntil: number;
}

interface CycleChange {
  type: 'cycle-change';
  system: SystemType;
  fromPhase: string;
  toPhase: string;
  date: Date;
}
```

### Push Notification Format
```
+--------------------------------+
| Pleiad                      now |
+--------------------------------+
| Tomorrow: New Wavespell begins |
|                                |
| The White Dog Wavespell starts |
| tomorrow. Themes: loyalty,     |
| heart, unconditional love.     |
+--------------------------------+
```

---

## Calendar Integration

### Export to Calendar
```typescript
interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  reminders: CalendarReminder[];
  category: string;
}

async function exportToCalendar(
  predictions: Prediction[],
  format: 'ics' | 'google' | 'apple'
): Promise<void> {
  const events = predictions.map(predictionToCalendarEvent);

  switch (format) {
    case 'ics':
      downloadICS(events);
      break;
    case 'google':
      openGoogleCalendarImport(events);
      break;
    case 'apple':
      openAppleCalendarImport(events);
      break;
  }
}
```

### ICS Format
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pleiad//Predictions//EN
BEGIN:VEVENT
DTSTART:20250121
DTEND:20250122
SUMMARY:White Dog Wavespell begins
DESCRIPTION:Dreamspell Wavespell begins...
CATEGORIES:DREAMSPELL
END:VEVENT
END:VCALENDAR
```

---

## API Endpoints

```
# Predictions
GET /api/predictions/daily/:date           # Get daily predictions
GET /api/predictions/weekly/:date          # Get weekly predictions
GET /api/predictions/monthly/:year/:month  # Get monthly predictions
GET /api/predictions/range                 # Get predictions for date range

# Personal Timeline
GET /api/predictions/timeline/:personId    # Get personal timeline
GET /api/predictions/upcoming/:personId    # Get upcoming events

# Notifications
GET /api/notifications/settings            # Get notification settings
PUT /api/notifications/settings            # Update settings
POST /api/notifications/test               # Send test notification

# Calendar
GET /api/calendar/export                   # Export to ICS
POST /api/calendar/sync                    # Sync with calendar service
```

---

## Data Caching

### Pre-computation Strategy
```typescript
// Pre-compute predictions for efficiency
interface PredictionCache {
  personId: PersonId;
  system: SystemType;
  year: number;
  predictions: Prediction[];
  computedAt: Date;
  expiresAt: Date;
}

// Dreamspell/Tzolkin: Fully deterministic, cache for 1 year
// Astrology: Compute monthly, cache for 30 days
// Human Design transits: Compute daily, cache for 7 days
```

### Invalidation
```typescript
// Invalidate cache when:
// 1. Person's birth data changes
// 2. Algorithm version changes
// 3. Cache expires
// 4. User manually refreshes
```

---

## Accuracy Disclaimers

### Required Disclaimers
```typescript
const disclaimers = {
  general: 'Predictions are based on symbolic systems and are not exact science. Use them for inspiration and self-awareness.',
  astrology: 'Astrological prediction accuracy depends on birth time precision. Without exact time, Moon and house positions are estimated.',
  humanDesign: 'Human Design requires exact birth time. Without it, results are not accurate.',
  medical: 'Do not use these predictions for medical, legal, or financial decisions.',
};
```

### UI Placement
Display disclaimers:
- Footer of prediction pages
- Expandable info icon next to predictions
- First-time user onboarding
- Settings page
