/**
 * Single source of truth for the transactional sender identity.
 * Resend only delivers from a verified domain — set EMAIL_FROM (worker
 * secret + .env.local) once the sending domain is verified, e.g.
 * "Pleiad <hello@yourdomain.com>". The fallback keeps payload shape valid
 * but will be rejected by Resend until a real domain is configured.
 */
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Pleiad <noreply@pleiad.io>'

/**
 * Sender for bulk / marketing mail (newsletter welcome, daily-kin blast).
 * Defaults to EMAIL_FROM so a single verified domain works out of the box.
 * Point it at a verified marketing subdomain — e.g.
 * "Pleiad <hello@updates.pleiad.io>" — to keep bulk-send reputation off the
 * root transactional domain, once that subdomain is verified in Resend and its
 * SPF/DKIM/DMARC records are added to Cloudflare DNS (see
 * docs/playbooks/production-cutover.md).
 */
export const EMAIL_FROM_MARKETING = process.env.EMAIL_FROM_MARKETING || EMAIL_FROM
