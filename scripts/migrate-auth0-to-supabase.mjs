#!/usr/bin/env node
/**
 * Remap users.id from Auth0 subs to Supabase Auth UUIDs.
 *
 * users.id IS the Auth0 `sub`, and every owner-scoped table references it, so
 * the id cannot simply be swapped in place — the children must move with it,
 * inside one transaction.
 *
 * Keyed on email, the only identifier stable across the two systems. Auth0
 * duplicates (the same email signed up via several connections) collapse onto
 * one Supabase user; their rows are merged under the surviving id.
 *
 * Rows whose email cannot be trusted (the literal string "undefined", empty)
 * are NOT migrated and NOT deleted — they are reported, and left for a human.
 *
 *   node scripts/migrate-auth0-to-supabase.mjs --dry-run   # default
 *   node scripts/migrate-auth0-to-supabase.mjs --apply
 *
 * Requires DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')

const required = ['DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key}`)
    process.exit(1)
  }
}

/**
 * Every table referencing users.id, read off information_schema — NOT guessed.
 * A table missing from these lists is silently orphaned by the remap, so if the
 * schema gains one, add it here:
 *   select table_name, column_name from information_schema.columns
 *   where table_schema='public' and column_name in ('owner_id','user_id');
 */
const OWNER_TABLES = [
  'boards',
  'calendar_events',
  'groups',
  'people',
  'predictions',
  'relationships',
  'shared_views',
  'tags',
]
const USER_TABLES = [
  'device_push_tokens',
  'notification_settings',
  'profiles',
  'subscriptions',
  'usage',
]

const sql = postgres(process.env.DATABASE_URL, { prepare: false })
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const mask = (email) => {
  const [user, domain] = String(email).split('@')
  return `${user.slice(0, 3)}***@${domain}`
}

const isUsableEmail = (email) =>
  typeof email === 'string' && email.includes('@') && !email.endsWith('@undefined')

/**
 * Auth0 subs carry a connection prefix (`auth0|…`, `google-oauth2|…`). A plain
 * UUID id means the row is already a Supabase user — a prior login or a prior
 * run — so it must not be re-migrated (re-inserting its own id would conflict).
 */
const isAuth0Id = (id) => typeof id === 'string' && id.includes('|')

async function tableExists(name) {
  const [row] = await sql`select to_regclass(${'public.' + name}) as t`
  return row.t !== null
}

async function main() {
  const users = await sql`select id, email, created_at from users order by created_at`
  console.log(`${users.length} users in the database\n`)

  const byEmail = new Map()
  const skipped = []
  const alreadySupabase = []
  for (const user of users) {
    if (!isAuth0Id(user.id)) {
      alreadySupabase.push(user)
      continue
    }
    if (!isUsableEmail(user.email)) {
      skipped.push(user)
      continue
    }
    const email = user.email.toLowerCase()
    if (!byEmail.has(email)) byEmail.set(email, [])
    byEmail.get(email).push(user)
  }

  if (alreadySupabase.length > 0) {
    console.log('ALREADY SUPABASE — skipped (not an Auth0 id):')
    for (const user of alreadySupabase) console.log(`  ${user.id}  ${mask(user.email)}`)
    console.log()
  }

  if (skipped.length > 0) {
    console.log('NOT MIGRATED — unusable email, left in place for a human:')
    for (const user of skipped) console.log(`  ${user.id}  email=${JSON.stringify(user.email)}`)
    console.log()
  }

  // Only migrate tables that actually exist — the schema has moved before.
  const ownerTables = []
  for (const t of OWNER_TABLES) if (await tableExists(t)) ownerTables.push(t)
  const userTables = []
  for (const t of USER_TABLES) if (await tableExists(t)) userTables.push(t)

  const plan = []
  for (const [email, rows] of byEmail) {
    // Create (or find) the Supabase Auth user. Email is pre-confirmed: these
    // people already proved ownership of the address in Auth0.
    let supabaseId = null
    if (APPLY) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      })
      if (error) {
        // Already exists — find them rather than failing the run.
        const { data: list } = await admin.auth.admin.listUsers()
        const existing = list?.users?.find((u) => u.email?.toLowerCase() === email)
        if (!existing) throw new Error(`Cannot create or find Supabase user for ${mask(email)}: ${error.message}`)
        supabaseId = existing.id
      } else {
        supabaseId = data.user.id
      }
    }
    plan.push({ email, rows, supabaseId })
  }

  for (const { email, rows, supabaseId } of plan) {
    const survivor = rows[0]
    const merged = rows.slice(1)
    console.log(
      `${mask(email)}  ${rows.length} auth0 row(s) -> ${supabaseId ?? '<uuid on apply>'}` +
        (merged.length > 0 ? `  (merging ${merged.length})` : '')
    )

    if (!APPLY) continue

    await sql.begin(async (tx) => {
      // Children first: point every row at the survivor, then at the new id.
      for (const old of merged) {
        for (const t of ownerTables) {
          await tx.unsafe(`update ${t} set owner_id = $1 where owner_id = $2`, [survivor.id, old.id])
        }
        for (const t of userTables) {
          await tx.unsafe(`update ${t} set user_id = $1 where user_id = $2`, [survivor.id, old.id])
        }
        await tx`delete from users where id = ${old.id}`
      }

      // users.id is referenced by the children, so insert the new row, move the
      // children onto it, then drop the old one. (A bare UPDATE on the PK would
      // orphan every child that lacks ON UPDATE CASCADE.)
      await tx`
        insert into users (id, email, name, image, created_at, updated_at)
        select ${supabaseId}, email, name, image, created_at, updated_at
        from users where id = ${survivor.id}
      `
      for (const t of ownerTables) {
        await tx.unsafe(`update ${t} set owner_id = $1 where owner_id = $2`, [supabaseId, survivor.id])
      }
      for (const t of userTables) {
        await tx.unsafe(`update ${t} set user_id = $1 where user_id = $2`, [supabaseId, survivor.id])
      }
      await tx`delete from users where id = ${survivor.id}`
    })
  }

  console.log(
    `\n${APPLY ? 'APPLIED' : 'DRY RUN — nothing written'}. ` +
      `${plan.length} Supabase user(s), ${skipped.length} left alone.`
  )
  if (!APPLY) console.log('Re-run with --apply to write.')
  await sql.end()
}

main().catch(async (error) => {
  console.error('FAILED:', error.message)
  await sql.end()
  process.exit(1)
})
