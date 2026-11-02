import postgres from 'postgres'
const sql = postgres(process.env.DBURL, { ssl: 'require', max: 1 })

// Every base table in public. Enable RLS with NO policies => deny-all for the
// PostgREST anon/authenticated roles, while the `postgres` owner (rolbypassrls)
// keeps full access, so Drizzle is unaffected. NOT forced — forcing would make
// the owner obey policies too and break the app.
const tables = await sql`
  select c.relname as t
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' order by c.relname`

const before = tables.filter(x => x.rls)
const names = tables.map(t => t.t)
console.log('enabling RLS on', names.length, 'tables')

await sql.begin(async (tx) => {
  for (const { t } of tables) {
    await tx.unsafe(`ALTER TABLE public."${t}" ENABLE ROW LEVEL SECURITY`)
  }
})

// Verify: which tables now have RLS on, and confirm owner can still read people.
const after = await sql`
  select c.relname as t, c.relrowsecurity as rls
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' order by c.relname`
const off = after.filter(x => !x.rls).map(x => x.t)
console.log('RLS still OFF on:', off.length ? off.join(', ') : 'NONE — all enabled')
const [{ n }] = await sql`select count(*)::int n from people`
console.log('owner (Drizzle) still reads people:', n, 'rows')
await sql.end()
