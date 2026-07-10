# Data Models Architecture Specification

## Overview

Comprehensive data models for the Pleiad platform, using TypeScript with branded types for type safety and clear domain boundaries.

---

## Branded Types

### Type Safety Foundation
```typescript
// Branded types prevent mixing IDs of different entities
declare const brand: unique symbol;

type Brand<T, B> = T & { readonly [brand]: B };

// Entity IDs
type UserId = Brand<string, 'UserId'>;
type PersonId = Brand<string, 'PersonId'>;
type RelationshipId = Brand<string, 'RelationshipId'>;
type TagId = Brand<string, 'TagId'>;
type GroupId = Brand<string, 'GroupId'>;
type BoardId = Brand<string, 'BoardId'>;
type ResultId = Brand<string, 'ResultId'>;
type ShareId = Brand<string, 'ShareId'>;
type SessionId = Brand<string, 'SessionId'>;

// Value types
type ISODate = Brand<string, 'ISODate'>;           // YYYY-MM-DD
type ISOTime = Brand<string, 'ISOTime'>;           // HH:MM
type ISODateTime = Brand<string, 'ISODateTime'>;   // ISO 8601
type HexColor = Brand<string, 'HexColor'>;         // #RRGGBB

// System-specific types
type KinNumber = Brand<number, 'KinNumber'>;       // 1-260
type SealNumber = Brand<number, 'SealNumber'>;     // 1-20
type ToneNumber = Brand<number, 'ToneNumber'>;     // 1-13
type DaySignNumber = Brand<number, 'DaySignNumber'>; // 1-20
type GateNumber = Brand<number, 'GateNumber'>;     // 1-64

// Helpers
function createUserId(id: string): UserId {
  return id as UserId;
}

function createKin(n: number): KinNumber {
  if (n < 1 || n > 260) throw new Error('Kin must be 1-260');
  return n as KinNumber;
}
```

---

## Core Entities

### User
```typescript
interface User {
  id: UserId;
  email: string;
  emailVerified: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;

  // OAuth metadata
  provider: 'google' | 'apple' | 'email';
  providerUserId?: string;
}

interface UserProfile {
  userId: UserId;
  displayName: string;
  avatarUrl?: string;
  birthDate?: ISODate;
  birthTime?: ISOTime;
  birthPlace?: BirthPlace;
  hebrewName?: string;
  locale: Locale;
  timezone: string;
  onboardingCompleted: boolean;
  preferences: UserPreferences;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface BirthPlace {
  name: string;                  // "Tel Aviv, Israel"
  latitude: number;              // 32.0853
  longitude: number;             // 34.7818
  timezone: string;              // "Asia/Jerusalem"
}

type Locale = 'he' | 'en';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultSystem: SystemType;
  notifications: NotificationPreferences;
  aiEnabled: boolean;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
}
```

### Person
```typescript
interface Person {
  id: PersonId;
  ownerId: UserId;
  name: string;
  hebrewName?: string;
  birthDate: ISODate;
  birthTime?: ISOTime;
  birthPlace?: BirthPlace;
  avatarUrl?: string;
  tags: TagId[];
  notes?: string;
  isSelf: boolean;
  deletedAt?: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface Tag {
  id: TagId;
  ownerId?: UserId;              // null = system tag
  name: string;
  hebrewName: string;
  color: HexColor;
  isSystem: boolean;
  order: number;
}
```

### Relationship
```typescript
interface Relationship {
  id: RelationshipId;
  ownerId: UserId;
  person1Id: PersonId;
  person2Id: PersonId;
  type: RelationshipType;
  subtype?: string;
  bidirectional: boolean;
  strength: RelationshipStrength;
  startDate?: ISODate;
  endDate?: ISODate;
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

type RelationshipType =
  | 'family'
  | 'romantic'
  | 'friend'
  | 'professional'
  | 'other';

type RelationshipStrength = 1 | 2 | 3 | 4 | 5;
```

### Group
```typescript
interface Group {
  id: GroupId;
  ownerId: UserId;
  name: string;
  description?: string;
  personIds: PersonId[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

---

## System Results

### Computed Result Container
```typescript
interface ComputedResult<T extends SystemResult = SystemResult> {
  id: ResultId;
  personId: PersonId;
  system: SystemType;
  version: string;               // Algorithm version
  data: T;
  computedAt: ISODateTime;
}

type SystemType =
  | 'dreamspell'
  | 'tzolkin'
  | 'longcount'
  | 'humandesign'
  | 'astrology'
  | 'gematria';

type SystemResult =
  | DreamspellResult
  | TzolkinResult
  | LongCountResult
  | HumanDesignResult
  | AstrologyResult
  | GematriaResult;
```

### Dreamspell Result
```typescript
interface DreamspellResult {
  system: 'dreamspell';
  birthKin: KinNumber;
  seal: SealData;
  tone: ToneData;
  oracle: OracleData;
  wavespell: WavespellData;
  castle: CastleData;
  earthFamily: EarthFamily;
  colorFamily: ColorFamily;
}

interface SealData {
  number: SealNumber;
  mayanName: string;
  englishName: string;
  hebrewName: string;
  color: ColorFamily;
  action: string;
  essence: string;
  power: string;
}

interface ToneData {
  number: ToneNumber;
  name: string;
  hebrewName: string;
  action: string;
  power: string;
  essence: string;
}

interface OracleData {
  guide: SealNumber;
  analog: SealNumber;
  antipode: SealNumber;
  occult: SealNumber;
}

interface WavespellData {
  startKin: KinNumber;
  sealNumber: SealNumber;
  name: string;
}

interface CastleData {
  color: Castle;
  name: string;
  theme: string;
}

type ColorFamily = 'red' | 'white' | 'blue' | 'yellow';
type Castle = 'red' | 'white' | 'blue' | 'yellow' | 'green';
type EarthFamily = 'polar' | 'cardinal' | 'core' | 'signal' | 'gateway';
```

### Tzolkin Result
```typescript
interface TzolkinResult {
  system: 'tzolkin';
  tone: ToneNumber;
  daySign: DaySignNumber;
  daySignData: DaySignData;
  trecena: TrecenaData;
  yearBearer?: YearBearerData;
}

interface DaySignData {
  number: DaySignNumber;
  mayanName: string;
  yucatecName: string;
  englishName: string;
  hebrewName: string;
  element: Element;
  direction: Direction;
  color: TzolkinColor;
}

interface TrecenaData {
  rulingSign: DaySignNumber;
  name: string;
  dayInTrecena: number;
}

type Element = 'fire' | 'earth' | 'air' | 'water';
type Direction = 'east' | 'north' | 'west' | 'south';
type TzolkinColor = 'red' | 'white' | 'black' | 'yellow';
```

### Long Count Result
```typescript
interface LongCountResult {
  system: 'longcount';
  longCount: LongCount;
  calendarRound: CalendarRound;
  daysSinceCreation: number;
  haabDate: HaabDate;
}

interface LongCount {
  baktun: number;
  katun: number;
  tun: number;
  winal: number;
  kin: number;
  formatted: string;             // "13.0.11.5.12"
}

interface CalendarRound {
  tzolkin: { tone: number; daySign: number };
  haab: HaabDate;
  formatted: string;             // "4 Ajpu 3 K'ank'in"
}

interface HaabDate {
  month: number;
  day: number;
  monthName: string;
}
```

### Human Design Result
```typescript
interface HumanDesignResult {
  system: 'humandesign';
  type: HumanDesignType;
  authority: Authority;
  profile: Profile;
  definition: Definition;
  centers: CenterState[];
  channels: ChannelState[];
  gates: GateState[];
  incarnationCross: IncarnationCross;
  variables?: Variables;
}

type HumanDesignType =
  | 'manifestor'
  | 'generator'
  | 'manifesting-generator'
  | 'projector'
  | 'reflector';

type Authority =
  | 'emotional'
  | 'sacral'
  | 'splenic'
  | 'ego-manifested'
  | 'ego-projected'
  | 'self-projected'
  | 'mental'
  | 'lunar';

interface Profile {
  conscious: number;             // 1-6
  unconscious: number;           // 1-6
  name: string;
}

type Definition = 'single' | 'split' | 'triple-split' | 'quadruple-split' | 'none';

interface CenterState {
  center: Center;
  defined: boolean;
  gates: GateNumber[];
}

interface ChannelState {
  channel: number;
  gates: [GateNumber, GateNumber];
  defined: boolean;
}

interface GateState {
  gate: GateNumber;
  line: number;
  defined: boolean;
  activation: 'personality' | 'design' | 'both';
}

interface IncarnationCross {
  name: string;
  quarter: string;
  gates: {
    personalitySun: GateNumber;
    personalityEarth: GateNumber;
    designSun: GateNumber;
    designEarth: GateNumber;
  };
}

type Center =
  | 'head' | 'ajna' | 'throat' | 'g' | 'heart'
  | 'spleen' | 'sacral' | 'solar' | 'root';
```

### Astrology Result
```typescript
interface AstrologyResult {
  system: 'astrology';
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign?: ZodiacSign;
  planets: PlanetPosition[];
  houses?: HousePosition[];
  aspects: AspectInstance[];
  elementBalance: Record<AstroElement, number>;
  modalityBalance: Record<Modality, number>;
}

interface ZodiacSign {
  number: number;
  name: string;
  hebrewName: string;
  symbol: string;
  element: AstroElement;
  modality: Modality;
}

interface PlanetPosition {
  planet: Planet;
  sign: ZodiacSign;
  degree: number;
  minute: number;
  house?: number;
  retrograde: boolean;
}

interface HousePosition {
  house: number;
  sign: ZodiacSign;
  degree: number;
  planets: string[];
}

interface AspectInstance {
  planet1: string;
  planet2: string;
  aspectType: AspectType;
  angle: number;
  orb: number;
  applying: boolean;
}

type Planet =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'
  | 'northNode' | 'southNode';

type AspectType =
  | 'conjunction' | 'opposition' | 'square'
  | 'trine' | 'sextile' | 'quincunx';

type AstroElement = 'fire' | 'earth' | 'air' | 'water';
type Modality = 'cardinal' | 'fixed' | 'mutable';
```

### Gematria Result
```typescript
interface GematriaResult {
  system: 'gematria';
  hebrewName: string;
  values: Record<GematriaMethod, number>;
  breakdown: LetterBreakdown[];
  digitalRoot: number;
  equivalents: GematriaEquivalent[];
}

interface LetterBreakdown {
  letter: string;
  position: number;
  standardValue: number;
  ordinalValue: number;
}

interface GematriaEquivalent {
  hebrew: string;
  value: number;
  english?: string;
  category: string;
}

type GematriaMethod =
  | 'standard'
  | 'full'
  | 'small'
  | 'ordinal'
  | 'atbash';
```

---

## Canvas & Boards

### Board
```typescript
interface Board {
  id: BoardId;
  ownerId: UserId;
  name: string;
  description?: string;
  template?: BoardTemplate;
  canvas: CanvasState;
  layers: Layer[];
  thumbnail?: string;
  isPublic: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface CanvasState {
  width: number;
  height: number;
  viewBox: ViewBox;
  background: Background;
  nodes: CanvasNode[];
  connections: CanvasConnection[];
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  order: number;
}
```

---

## Sharing

### Shared View
```typescript
interface SharedView {
  id: ShareId;
  ownerId: UserId;
  type: ShareType;
  entityId: string;              // BoardId, PersonId, etc.
  options: ShareOptions;
  url: string;
  password?: string;
  expiresAt?: ISODateTime;
  maxViews?: number;
  viewCount: number;
  active: boolean;
  createdAt: ISODateTime;
}

type ShareType = 'board' | 'person' | 'group' | 'relationship';

interface ShareOptions {
  includeSystems: SystemType[];
  includeAnalysis: boolean;
  includeAI: boolean;
}
```

---

## Subscriptions & Billing

### Subscription
```typescript
interface Subscription {
  id: string;
  userId: UserId;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodStart: ISODateTime;
  currentPeriodEnd: ISODateTime;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

type Plan = 'free' | 'pro';

type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'trialing';

interface Usage {
  userId: UserId;
  period: string;                // "2025-01"
  peopleCount: number;
  aiTokensUsed: number;
  exportsCount: number;
}
```

---

## Validation Schemas

### Zod Schemas
```typescript
import { z } from 'zod';

const ISODateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ISOTimeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);
const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const BirthPlaceSchema = z.object({
  name: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string(),
});

const PersonSchema = z.object({
  name: z.string().min(2).max(100),
  hebrewName: z.string().regex(/^[\u0590-\u05FF\s]*$/).optional(),
  birthDate: ISODateSchema,
  birthTime: ISOTimeSchema.optional(),
  birthPlace: BirthPlaceSchema.optional(),
  tags: z.array(z.string().uuid()).default([]),
  notes: z.string().max(5000).optional(),
});

const RelationshipSchema = z.object({
  person1Id: z.string().uuid(),
  person2Id: z.string().uuid(),
  type: z.enum(['family', 'romantic', 'friend', 'professional', 'other']),
  subtype: z.string().optional(),
  bidirectional: z.boolean().default(true),
  strength: z.number().int().min(1).max(5).default(3),
  startDate: ISODateSchema.optional(),
  endDate: ISODateSchema.optional(),
  notes: z.string().max(5000).optional(),
});
```

---

## Type Guards

```typescript
function isDreamspellResult(result: SystemResult): result is DreamspellResult {
  return result.system === 'dreamspell';
}

function isTzolkinResult(result: SystemResult): result is TzolkinResult {
  return result.system === 'tzolkin';
}

function isAstrologyResult(result: SystemResult): result is AstrologyResult {
  return result.system === 'astrology';
}

function isHumanDesignResult(result: SystemResult): result is HumanDesignResult {
  return result.system === 'humandesign';
}

function isGematriaResult(result: SystemResult): result is GematriaResult {
  return result.system === 'gematria';
}
```

---

## Serialization

### JSON Serialization
```typescript
// All dates are serialized as ISO strings
// All IDs are serialized as strings
// No special handling needed for JSON.stringify/parse

// For database storage, convert to/from snake_case
function toSnakeCase<T>(obj: T): Record<string, unknown> {
  // Convert camelCase keys to snake_case
}

function toCamelCase<T>(obj: Record<string, unknown>): T {
  // Convert snake_case keys to camelCase
}
```
