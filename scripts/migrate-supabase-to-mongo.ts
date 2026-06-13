/**
 * One-off data migration: Supabase Postgres -> MongoDB.
 *
 * RUN THIS AGAINST A STAGING DB FIRST. Always dry-run before a live write.
 *
 *   npm i -D pg            # postgres driver (not an app dependency)
 *   MONGODB_URI=...                  \
 *   SUPABASE_DB_URL=postgres://...   \  # Supabase > Project Settings > Database
 *   USER_ID_MAP=./user-id-map.json   \  # see "Identity mapping" below
 *   npx tsx scripts/migrate-supabase-to-mongo.ts --dry-run
 *
 * ── Identity mapping (READ THIS) ───────────────────────────────────────────
 * Supabase auth.users ids are UUIDs; Better Auth issues its own user ids. Every
 * owner_id / user_id column must be REMAPPED from the old Supabase UUID to the
 * new Better Auth id, or all ownership breaks. There is no automatic mapping —
 * users must exist in Better Auth first. Provide USER_ID_MAP as a JSON object
 * `{ "<supabase-uuid>": "<better-auth-id>" }`. Rows whose owner is absent from
 * the map are SKIPPED and reported (never written with a dangling owner).
 *
 * Strategy options for producing the map (pick one, out of scope for this
 * script): (a) pre-create Better Auth users from the exported auth.users and
 * record the pairing; (b) migrate lazily — users re-authenticate, and a
 * back-office job claims their legacy rows by email. (a) is the clean cutover.
 *
 * ── FK rewiring ────────────────────────────────────────────────────────────
 * App-to-app foreign keys (person_id, tag_id, board_id, group_id, ...) are
 * UUIDs in Postgres and become ObjectIds in Mongo. We assign a fresh ObjectId
 * per source row and keep a per-table { uuid -> ObjectId } map to rewire FKs.
 * Tables are processed in dependency order so parents exist before children.
 */

import { readFileSync } from 'node:fs'
import { MongoClient, ObjectId, type Db } from 'mongodb'
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { Client as PgClient } from 'pg'

const DRY_RUN = process.argv.includes('--dry-run')

type IdMap = Map<string, ObjectId>
const idMaps: Record<string, IdMap> = {}
const userIdMap: Record<string, string> = JSON.parse(
  readFileSync(process.env.USER_ID_MAP || './user-id-map.json', 'utf8')
)

const skipped: Record<string, number> = {}
function noteSkip(table: string) {
  skipped[table] = (skipped[table] ?? 0) + 1
}

/** Resolve a Supabase owner UUID to a Better Auth id, or null if unmapped. */
function mapOwner(uuid: string | null): string | null {
  if (!uuid) return null
  return userIdMap[uuid] ?? null
}

/** Get-or-create the ObjectId a source row will receive in Mongo. */
function mapRowId(table: string, uuid: string): ObjectId {
  idMaps[table] ??= new Map()
  let oid = idMaps[table].get(uuid)
  if (!oid) {
    oid = new ObjectId()
    idMaps[table].set(uuid, oid)
  }
  return oid
}

interface TableSpec {
  /** Source Postgres table. */
  table: string
  /** Destination Mongo collection. */
  collection: string
  /** Column holding the owning Supabase user UUID (remapped to Better Auth id). */
  ownerColumn?: 'owner_id' | 'user_id'
  /** FK columns -> the source table whose id map rewires them. */
  fks?: Record<string, string>
  /** Drop these source columns (e.g. the Postgres UUID PK, replaced by _id). */
  drop?: string[]
}

// Dependency order: parents before children.
const SPECS: TableSpec[] = [
  { table: 'profiles', collection: 'profiles', ownerColumn: 'user_id', drop: ['user_id'] },
  { table: 'people', collection: 'people', ownerColumn: 'owner_id' },
  { table: 'tags', collection: 'tags', ownerColumn: 'owner_id' },
  { table: 'person_tags', collection: 'person_tags', fks: { person_id: 'people', tag_id: 'tags' } },
  { table: 'computed_results', collection: 'computed_results', fks: { person_id: 'people' } },
  { table: 'relationships', collection: 'relationships', ownerColumn: 'owner_id', fks: { person1_id: 'people', person2_id: 'people' } },
  { table: 'groups', collection: 'groups', ownerColumn: 'owner_id' },
  { table: 'group_members', collection: 'group_members', fks: { group_id: 'groups', person_id: 'people' } },
  { table: 'shared_views', collection: 'shared_views', ownerColumn: 'owner_id' },
  { table: 'boards', collection: 'boards', ownerColumn: 'owner_id' },
  { table: 'board_shares', collection: 'board_shares', fks: { board_id: 'boards' } },
  { table: 'predictions', collection: 'predictions', ownerColumn: 'owner_id', fks: { person_id: 'people' } },
  { table: 'notification_settings', collection: 'notification_settings', ownerColumn: 'user_id', drop: ['user_id'] },
  { table: 'calendar_events', collection: 'calendar_events', ownerColumn: 'owner_id' },
  { table: 'newsletter_subscribers', collection: 'newsletter_subscribers' },
  { table: 'email_send_log', collection: 'email_send_log', fks: { subscriber_id: 'newsletter_subscribers' } },
  { table: 'subscriptions', collection: 'subscriptions', ownerColumn: 'user_id', drop: ['user_id'] },
  { table: 'usage', collection: 'usage', ownerColumn: 'user_id', drop: ['user_id'] },
  { table: 'knowledge_base', collection: 'knowledge_base' },
  { table: 'content_chunks', collection: 'content_chunks', fks: { knowledge_base_id: 'knowledge_base' } },
]

function transformRow(spec: TableSpec, row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row }

  // Source PK 'id' -> deterministic ObjectId (registered in this table's map).
  if (typeof row.id === 'string') {
    out._id = mapRowId(spec.table, row.id)
    delete out.id
  } else {
    out._id = new ObjectId()
  }

  // Owner remap (Supabase UUID -> Better Auth id). Unmapped owner => skip row.
  if (spec.ownerColumn) {
    const mapped = mapOwner(row[spec.ownerColumn] as string | null)
    if (!mapped) {
      noteSkip(spec.table)
      return null
    }
    const dest = spec.ownerColumn === 'user_id' && spec.drop?.includes('user_id')
      ? 'user_id'
      : spec.ownerColumn
    out[dest] = mapped
  }

  // Rewire app-to-app FKs to their new ObjectIds.
  for (const [col, parent] of Object.entries(spec.fks ?? {})) {
    const v = row[col]
    if (typeof v === 'string') out[col] = mapRowId(parent, v)
  }

  for (const col of spec.drop ?? []) {
    if (col !== 'user_id') delete out[col]
  }
  // Note: stripe_* columns are intentionally NOT migrated; Paddle issues new
  // customer/subscription ids on re-subscribe.
  delete out.stripe_customer_id
  delete out.stripe_subscription_id

  return out
}

async function migrate(pg: InstanceType<typeof PgClient>, db: Db) {
  for (const spec of SPECS) {
    const { rows } = await pg.query(`SELECT * FROM public.${spec.table}`)
    const docs = rows.map((r) => transformRow(spec, r)).filter(Boolean)
    console.log(
      `${spec.table}: ${rows.length} read, ${docs.length} to write` +
        (skipped[spec.table] ? `, ${skipped[spec.table]} skipped (unmapped owner)` : '')
    )
    if (!DRY_RUN && docs.length) {
      await db.collection(spec.collection).insertMany(docs as Record<string, unknown>[], { ordered: false })
    }
  }
}

async function main() {
  const pg = new PgClient({ connectionString: process.env.SUPABASE_DB_URL })
  const mongo = new MongoClient(process.env.MONGODB_URI!)
  await pg.connect()
  await mongo.connect()
  try {
    console.log(DRY_RUN ? '— DRY RUN (no writes) —' : '— LIVE WRITE —')
    await migrate(pg, mongo.db())
    const totalSkipped = Object.values(skipped).reduce((a, b) => a + b, 0)
    if (totalSkipped) {
      console.warn(`\n${totalSkipped} rows skipped due to unmapped owners. Review USER_ID_MAP.`)
    }
    console.log('\nReminder: create the Atlas Vector Search index on content_chunks.embedding')
    console.log('and re-embed the corpus with bge-small (scraper) — embeddings are NOT migrated 1:1.')
  } finally {
    await pg.end()
    await mongo.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
