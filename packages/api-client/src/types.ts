/**
 * Client entity model for the Pleiad API (specs/mobile/DATA_MODEL.md §1).
 *
 * Shapes mirror the server rows post-serialization exactly as the route
 * handlers under src/app/api/** emit them: timestamps are ISO strings, ids
 * are uuid strings, user ids are Auth0 sub strings, and jsonb columns arrive
 * as plain objects. Nothing here imports from the web app or Next — this
 * package is platform-agnostic and shared by mobile and web.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type SystemKey =
  | 'dreamspell'
  | 'tzolkin'
  | 'longcount'
  | 'humandesign'
  | 'astrology'
  | 'gematria'

export type BirthPlace = {
  lat?: number
  lng?: number
  name?: string
  city?: string
  country?: string
  timezone?: string
} | null

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface Profile {
  id: string
  user_id: string
  display_name: string
  birth_date: string | null
  birth_time: string | null
  birth_place: BirthPlace
  hebrew_name: string | null
  avatar_url: string | null
  locale: 'he' | 'en'
  timezone: string
  preferences: { systems?: Partial<Record<SystemKey, boolean>> } & Record<string, unknown>
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// People & tags
// ---------------------------------------------------------------------------

export interface Tag {
  id: string
  owner_id: string | null
  name: string
  hebrew_name: string
  color: string
  is_system: boolean
  sort_order: number
  created_at: string
}

/** User-entered personality frameworks (#75) — engine PersonalityProfile. */
export interface PersonPersonality {
  mbti?: string | null
  enneagram?: string | null
  disc?: string | null
  attachment?: string | null
  loveLanguages?: string[] | null
  bigFive?: Partial<Record<'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism', number>> | null
  viaStrengths?: string[] | null
}

export interface Person {
  id: string
  owner_id: string
  name: string
  hebrew_name: string | null
  birth_date: string
  birth_time: string | null
  birth_place: BirthPlace
  avatar_url: string | null
  notes: string | null
  is_self: boolean
  personality: PersonPersonality | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface PersonWithTags extends Person {
  tags: Tag[]
}

export interface PeopleList {
  people: PersonWithTags[]
  tags: Tag[]
}

// ---------------------------------------------------------------------------
// Computed results
// ---------------------------------------------------------------------------

export interface ComputedResult {
  id: string
  person_id: string
  system: SystemKey
  version: string
  data: Record<string, unknown>
  computed_at: string
}

// ---------------------------------------------------------------------------
// Relationships
// ---------------------------------------------------------------------------

export type RelationshipType =
  | 'family'
  | 'romantic'
  | 'friend'
  | 'professional'
  | 'other'

export type RelationshipStrength = 1 | 2 | 3 | 4 | 5

export interface Relationship {
  id: string
  owner_id: string
  person1_id: string
  person2_id: string
  type: RelationshipType
  subtype: string | null
  bidirectional: boolean
  strength: RelationshipStrength
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RelationshipWithPeople extends Relationship {
  person1: Person
  person2: Person
}

/**
 * Edge shape returned by GET /api/relationships/person/[id] — camelCase,
 * anchored on one person with the other endpoint embedded (see
 * getPersonRelationships in the relationships repository).
 */
export interface PersonRelationshipEdge {
  id: string
  type: RelationshipType
  subtype: string | null
  strength: RelationshipStrength
  bidirectional: boolean
  startDate: string | null
  endDate: string | null
  notes: string | null
  otherPerson: Person
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export interface Group {
  id: string
  owner_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

/** Member projection returned by GET /api/groups/[id] (never full birth PII). */
export interface GroupMember {
  id: string
  name: string
  hebrew_name: string | null
  birth_date: string
  birth_time: string | null
  birth_place: { lat: number | null; lng: number | null } | null
  added_at: string
}

export interface GroupWithMembers extends Group {
  members: GroupMember[]
}

// ---------------------------------------------------------------------------
// Shares
// ---------------------------------------------------------------------------

export type ShareType = 'person' | 'relationship' | 'group' | 'graph'

export interface SharedView {
  id: string
  share_type: ShareType
  options: Record<string, unknown>
  url_token: string
  expires_at: string | null
  max_views: number | null
  view_count: number
  active: boolean
  created_at: string
}

/**
 * Anonymous projection returned by GET/POST /api/share/[token]. The server
 * strips password_hash, owner_id and raw member birth data before this
 * crosses the trust boundary.
 */
export interface PublicShare {
  share: {
    share_type: ShareType
    options: Record<string, unknown>
  }
  group?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export type PlanTier = 'free' | 'explorer' | 'complete' | 'practitioner' | 'lifetime'
export type PaidPlanTier = Exclude<PlanTier, 'free'>

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'

/** `limit` is null when the plan grants Infinity (JSON serializes it as null). */
export interface UsageMeter {
  used: number
  limit: number | null
  percentage: number
}

export interface UsageSummary {
  profiles: UsageMeter
  aiInterpretations: UsageMeter
  boards: UsageMeter
}

export interface PlanFeatures {
  exports: boolean
  timeline: boolean
  relationships: false | 'basic' | 'advanced'
  groupAnalysis: boolean
  apiAccess: boolean
}

/** Response of GET /api/billing/subscription. */
export interface Subscription {
  plan: PlanTier
  planName: string
  status: SubscriptionStatus
  currentPeriodEnd: string | null | undefined
  cancelAtPeriodEnd: boolean
  hasSubscription: boolean
  usage: UsageSummary
  features: PlanFeatures
}


// ---------------------------------------------------------------------------
// Boards (v1 read-only on mobile)
// ---------------------------------------------------------------------------

export interface Board {
  id: string
  owner_id: string
  name: string
  description: string | null
  template: string | null
  canvas: Record<string, unknown>
  layers: Array<Record<string, unknown>>
  thumbnail: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationChannel = 'in-app' | 'email' | 'sms'

export type NotificationSystemKey =
  | 'dreamspell'
  | 'tzolkin'
  | 'longcount'
  | 'astrology'
  | 'humandesign'

export type NotificationIntensity = 'low' | 'medium' | 'high' | 'peak'

export interface NotificationSettings {
  userId: string
  enabled: boolean
  channels: NotificationChannel[]
  dailyDigest: boolean
  dailyDigestTime: string
  weeklyDigest: boolean
  weeklyDigestDay: number
  advanceNotice: number
  systems: NotificationSystemKey[]
  minIntensity: NotificationIntensity
  createdAt?: string
  updatedAt?: string
}

// ---------------------------------------------------------------------------
// AI interpretation & knowledge search
// ---------------------------------------------------------------------------

/**
 * Minimal structural shape POST /api/ai/interpret needs from a prediction.
 * The full PredictionEvent lives in @pleiad/engine — pass it straight
 * through; extra fields are forwarded untouched.
 */
export interface PredictionEventInput {
  type: string
  title: string
  description: string
  themes: string[]
  [key: string]: unknown
}

export interface AiInterpretRequest {
  prediction: PredictionEventInput
  personContext?: {
    birthDate: string
    birthKin: unknown
    currentAge?: number
    personalYearKin?: unknown
  }
  locale?: 'en' | 'he'
  quick?: boolean
}

export interface AiInterpretation {
  interpretation: string
  themes: string[]
  affirmation?: string
  guidance?: string
  cachedAt?: string
  expiresAt?: string
}

export interface KnowledgeSearchResult {
  title: string
  snippet: string
  sourceUrl: string
  similarity: number
}
