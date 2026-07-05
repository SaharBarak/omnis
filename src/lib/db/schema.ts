import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core'

/**
 * Supabase Postgres schema — the single source of truth for the data layer.
 *
 * Conventions (carried over from the Mongo port, which itself was ported
 * from the original Supabase schema):
 *  - snake_case column names, `id` uuid PK (gen_random_uuid()),
 *  - `owner_id`/`user_id` are Auth0 subject strings (text), never FKs —
 *    tenant isolation is enforced in the repositories, callers MUST pass
 *    the id from requireUserId().
 *  - enum-ish columns are plain text; values are validated with Zod at the
 *    API edge (same contract the Mongoose `enum` options enforced).
 *  - timestamps are timestamptz; repositories serialize them to ISO strings.
 *
 * pgvector: `content_chunks.embedding` is vector(384) — cosine-matched to
 * Workers AI @cf/baai/bge-small-en-v1.5 query embeddings (knowledge search).
 */

const id = () => uuid('id').primaryKey().default(sql`gen_random_uuid()`)
const createdAt = () =>
  timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' })

/** Mirror of the Auth0 identity — upserted on session (ensureUser). */
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Auth0 `sub`
  email: text('email').notNull(),
  name: text('name'),
  image: text('image'),
  created_at: createdAt(),
  updated_at: updatedAt(),
})

export const profiles = pgTable(
  'profiles',
  {
    id: id(),
    user_id: text('user_id').notNull(),
    display_name: text('display_name').notNull(),
    birth_date: text('birth_date'),
    birth_time: text('birth_time'),
    birth_place: jsonb('birth_place').$type<{ lat?: number; lng?: number; name?: string; city?: string; country?: string; timezone?: string } | null>(),
    hebrew_name: text('hebrew_name'),
    avatar_url: text('avatar_url'),
    locale: text('locale').$type<'he' | 'en'>().notNull().default('he'),
    timezone: text('timezone').notNull().default('Asia/Jerusalem'),
    preferences: jsonb('preferences').notNull().default({}),
    onboarding_completed: boolean('onboarding_completed').notNull().default(false),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [uniqueIndex('profiles_user_id_uq').on(t.user_id)]
)

export const people = pgTable(
  'people',
  {
    id: id(),
    owner_id: text('owner_id').notNull(),
    name: text('name').notNull(),
    hebrew_name: text('hebrew_name'),
    birth_date: text('birth_date').notNull(),
    birth_time: text('birth_time'),
    birth_place: jsonb('birth_place').$type<{ lat?: number; lng?: number; name?: string; city?: string; country?: string; timezone?: string } | null>(),
    avatar_url: text('avatar_url'),
    notes: text('notes'),
    is_self: boolean('is_self').notNull().default(false),
    deleted_at: ts('deleted_at'),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [
    index('people_owner_idx').on(t.owner_id),
    index('people_owner_deleted_idx').on(t.owner_id, t.deleted_at),
    index('people_name_idx').on(t.name),
    index('people_birth_date_idx').on(t.birth_date),
  ]
)

export const tags = pgTable(
  'tags',
  {
    id: id(),
    owner_id: text('owner_id'), // null = system tag
    name: text('name').notNull(),
    hebrew_name: text('hebrew_name').notNull(),
    color: text('color').notNull().default('#6B7280'),
    is_system: boolean('is_system').notNull().default(false),
    sort_order: integer('sort_order').notNull().default(0),
    created_at: createdAt(),
  },
  (t) => [uniqueIndex('tags_owner_name_uq').on(t.owner_id, t.name)]
)

export const person_tags = pgTable(
  'person_tags',
  {
    person_id: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    tag_id: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.person_id, t.tag_id] }), index('person_tags_tag_idx').on(t.tag_id)]
)

export const computed_results = pgTable(
  'computed_results',
  {
    id: id(),
    person_id: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    system: text('system').notNull(), // dreamspell|tzolkin|longcount|humandesign|astrology|gematria
    version: text('version').notNull(),
    data: jsonb('data').notNull(),
    computed_at: ts('computed_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('computed_results_person_system_version_uq').on(t.person_id, t.system, t.version),
    index('computed_results_system_idx').on(t.system),
  ]
)

export const relationships = pgTable(
  'relationships',
  {
    id: id(),
    owner_id: text('owner_id').notNull(),
    person1_id: uuid('person1_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    person2_id: uuid('person2_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // family|romantic|friend|professional|other
    subtype: text('subtype'),
    bidirectional: boolean('bidirectional').notNull().default(true),
    strength: integer('strength').notNull().default(3),
    start_date: text('start_date'),
    end_date: text('end_date'),
    notes: text('notes'),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [
    uniqueIndex('relationships_uq').on(t.owner_id, t.person1_id, t.person2_id, t.type),
    index('relationships_owner_idx').on(t.owner_id),
    index('relationships_p1_idx').on(t.person1_id),
    index('relationships_p2_idx').on(t.person2_id),
  ]
)

export const groups = pgTable(
  'groups',
  {
    id: id(),
    owner_id: text('owner_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [index('groups_owner_idx').on(t.owner_id)]
)

export const group_members = pgTable(
  'group_members',
  {
    group_id: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    person_id: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    added_at: ts('added_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.group_id, t.person_id] }),
    index('group_members_person_idx').on(t.person_id),
  ]
)

export const shared_views = pgTable(
  'shared_views',
  {
    id: id(),
    owner_id: text('owner_id').notNull(),
    share_type: text('share_type').notNull(), // person|relationship|group|graph
    options: jsonb('options').notNull().default({}),
    url_token: text('url_token').notNull(),
    expires_at: ts('expires_at'),
    max_views: integer('max_views'),
    view_count: integer('view_count').notNull().default(0),
    password_hash: text('password_hash'),
    active: boolean('active').notNull().default(true),
    created_at: createdAt(),
  },
  (t) => [
    uniqueIndex('shared_views_token_uq').on(t.url_token),
    index('shared_views_owner_idx').on(t.owner_id),
  ]
)

export const boards = pgTable(
  'boards',
  {
    id: id(),
    owner_id: text('owner_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    template: text('template'),
    canvas: jsonb('canvas').notNull().default({}),
    layers: jsonb('layers').notNull().default([]),
    thumbnail: text('thumbnail'),
    is_public: boolean('is_public').notNull().default(false),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [index('boards_owner_idx').on(t.owner_id), index('boards_updated_idx').on(t.updated_at)]
)

export const board_shares = pgTable(
  'board_shares',
  {
    id: id(),
    board_id: uuid('board_id')
      .notNull()
      .references(() => boards.id, { onDelete: 'cascade' }),
    url_token: text('url_token').notNull(),
    permissions: text('permissions').notNull().default('view'), // view|comment|edit
    expires_at: ts('expires_at'),
    max_views: integer('max_views'),
    view_count: integer('view_count').notNull().default(0),
    password_hash: text('password_hash'),
    active: boolean('active').notNull().default(true),
    created_at: createdAt(),
  },
  (t) => [
    uniqueIndex('board_shares_token_uq').on(t.url_token),
    index('board_shares_board_idx').on(t.board_id),
  ]
)

export const predictions = pgTable(
  'predictions',
  {
    id: id(),
    person_id: uuid('person_id').references(() => people.id, { onDelete: 'set null' }),
    owner_id: text('owner_id').notNull(),
    system: text('system').notNull(),
    type: text('type').notNull(),
    start_date: text('start_date').notNull(),
    end_date: text('end_date').notNull(),
    intensity: text('intensity').notNull().default('medium'), // low|medium|high|peak
    themes: jsonb('themes').notNull().default([]),
    interpretation: text('interpretation'),
    data: jsonb('data').notNull().default({}),
    computed_at: ts('computed_at').notNull().defaultNow(),
    expires_at: ts('expires_at').notNull(),
    created_at: createdAt(),
  },
  (t) => [
    index('predictions_owner_idx').on(t.owner_id),
    index('predictions_person_idx').on(t.person_id),
    index('predictions_dates_idx').on(t.start_date, t.end_date),
    index('predictions_expires_idx').on(t.expires_at),
  ]
)

export const notification_settings = pgTable(
  'notification_settings',
  {
    id: id(),
    user_id: text('user_id').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    channels: jsonb('channels').notNull().default(['in-app']),
    daily_digest: boolean('daily_digest').notNull().default(false),
    daily_digest_time: text('daily_digest_time').notNull().default('08:00'),
    weekly_digest: boolean('weekly_digest').notNull().default(false),
    weekly_digest_day: integer('weekly_digest_day').notNull().default(0),
    advance_notice: integer('advance_notice').notNull().default(1),
    systems: jsonb('systems').notNull().default(['dreamspell', 'tzolkin']),
    min_intensity: text('min_intensity').notNull().default('medium'),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [uniqueIndex('notification_settings_user_uq').on(t.user_id)]
)

export const calendar_events = pgTable(
  'calendar_events',
  {
    id: id(),
    owner_id: text('owner_id').notNull(),
    prediction_id: uuid('prediction_id').references(() => predictions.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    start_date: text('start_date').notNull(),
    end_date: text('end_date').notNull(),
    all_day: boolean('all_day').notNull().default(true),
    category: text('category'),
    exported_at: ts('exported_at').notNull().defaultNow(),
    external_id: text('external_id'),
    created_at: createdAt(),
  },
  (t) => [
    index('calendar_events_owner_idx').on(t.owner_id),
    index('calendar_events_dates_idx').on(t.start_date, t.end_date),
  ]
)

export const newsletter_subscribers = pgTable(
  'newsletter_subscribers',
  {
    id: id(),
    email: text('email').notNull(),
    subscribed_at: ts('subscribed_at').defaultNow(),
    confirmed_at: ts('confirmed_at'),
    unsubscribed_at: ts('unsubscribed_at'),
    confirmed: boolean('confirmed').notNull().default(false),
    preferences: jsonb('preferences').notNull().default({ daily_kin: true }),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [uniqueIndex('newsletter_email_uq').on(t.email)]
)

export const email_send_log = pgTable(
  'email_send_log',
  {
    id: id(),
    subscriber_id: uuid('subscriber_id').references(() => newsletter_subscribers.id, {
      onDelete: 'set null',
    }),
    email_type: text('email_type').notNull(),
    subject: text('subject'),
    sent_at: ts('sent_at').notNull().defaultNow(),
    resend_id: text('resend_id'),
    status: text('status').notNull().default('sent'),
    error_message: text('error_message'),
  },
  (t) => [index('email_log_subscriber_idx').on(t.subscriber_id), index('email_log_sent_idx').on(t.sent_at)]
)

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: id(),
    user_id: text('user_id').notNull(),
    plan: text('plan').notNull().default('free'), // free|complete|practitioner
    status: text('status').notNull().default('active'),
    paddle_customer_id: text('paddle_customer_id'),
    paddle_subscription_id: text('paddle_subscription_id'),
    current_period_start: ts('current_period_start'),
    current_period_end: ts('current_period_end'),
    trial_end: ts('trial_end'),
    cancel_at_period_end: boolean('cancel_at_period_end').notNull().default(false),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [
    uniqueIndex('subscriptions_user_uq').on(t.user_id),
    index('subscriptions_paddle_customer_idx').on(t.paddle_customer_id),
    index('subscriptions_paddle_sub_idx').on(t.paddle_subscription_id),
  ]
)

export const usage = pgTable(
  'usage',
  {
    id: id(),
    user_id: text('user_id').notNull(),
    period: text('period').notNull(), // YYYY-MM
    profiles_count: integer('profiles_count').notNull().default(0),
    ai_interpretations_used: integer('ai_interpretations_used').notNull().default(0),
    boards_count: integer('boards_count').notNull().default(0),
    exports_count: integer('exports_count').notNull().default(0),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [uniqueIndex('usage_user_period_uq').on(t.user_id, t.period)]
)

export const knowledge_base = pgTable(
  'knowledge_base',
  {
    id: id(),
    source_url: text('source_url').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    created_at: createdAt(),
  },
  (t) => [uniqueIndex('knowledge_source_uq').on(t.source_url)]
)

export const content_chunks = pgTable(
  'content_chunks',
  {
    id: id(),
    knowledge_base_id: uuid('knowledge_base_id')
      .notNull()
      .references(() => knowledge_base.id, { onDelete: 'cascade' }),
    chunk_index: integer('chunk_index').notNull(),
    chunk_text: text('chunk_text').notNull(),
    embedding: vector('embedding', { dimensions: 384 }),
    metadata: jsonb('metadata').notNull().default({}),
    created_at: createdAt(),
  },
  (t) => [index('content_chunks_kb_idx').on(t.knowledge_base_id)]
)
