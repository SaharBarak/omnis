/**
 * Omnis cron worker — replaces Vercel cron.
 *
 * Cloudflare Cron Triggers fire `scheduled()` with the matching schedule in
 * `event.cron`. Each schedule maps to a Next.js cron route, which we invoke
 * over HTTP with the shared `CRON_SECRET` bearer (the route already enforces it).
 *
 * Schedules here MUST stay in sync with `triggers.crons` in wrangler.jsonc.
 */

interface Env {
  SITE_URL: string
  CRON_SECRET: string
}

const CRON_ROUTES: Record<string, string> = {
  '0 6 * * *': '/api/cron/daily-kin',
  '0 4 * * *': '/api/cron/daily-predictions',
  '0 8 * * *': '/api/cron/send-notifications',
}

const handler: ExportedHandler<Env> = {
  async scheduled(event, env, ctx): Promise<void> {
    const route = CRON_ROUTES[event.cron]
    if (!route) {
      console.error(`No route mapped for cron schedule "${event.cron}"`)
      return
    }

    const run = async () => {
      const res = await fetch(`${env.SITE_URL}${route}`, {
        method: 'GET',
        headers: { authorization: `Bearer ${env.CRON_SECRET}` },
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(`Cron ${route} failed: ${res.status} ${body}`)
        return
      }
      console.log(`Cron ${route} ok: ${res.status}`)
    }

    ctx.waitUntil(run())
  },
}

export default handler
