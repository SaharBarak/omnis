/**
 * Single source of truth for sender identity.
 *
 * Read at call time, not module scope: on Cloudflare Workers `process.env` is
 * populated per-request by @opennextjs/cloudflare, so a module-scope read can
 * run before the env exists and freeze the fallback in place for the life of
 * the isolate (same reason turnstile.ts reads its secret per call).
 */

/**
 * Transactional sender: contact acks, notification digests, confirmation mail,
 * ops briefing, test mail. Resend only delivers from a verified domain — set
 * EMAIL_FROM (worker secret + .env.local), e.g. "Pleiad <hello@pleiad.io>".
 * The fallback keeps the payload shape valid and matches the verified
 * pleiad.io domain.
 */
export function emailFrom(): string {
  return process.env.EMAIL_FROM || 'Pleiad <noreply@pleiad.io>'
}

/**
 * Sender for bulk / marketing mail (newsletter welcome, daily-kin blast).
 * Defaults to emailFrom() so a single verified domain works out of the box.
 * Point EMAIL_FROM_MARKETING at a verified marketing subdomain — e.g.
 * "Pleiad <hello@updates.pleiad.io>" — to keep bulk-send reputation off the
 * root transactional domain, once that subdomain is verified in Resend and its
 * SPF/DKIM/DMARC records are added to Cloudflare DNS (see
 * docs/playbooks/production-cutover.md).
 */
export function emailFromMarketing(): string {
  return process.env.EMAIL_FROM_MARKETING || emailFrom()
}
