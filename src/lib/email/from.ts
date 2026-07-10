/**
 * Single source of truth for the transactional sender identity.
 * Resend only delivers from a verified domain — set EMAIL_FROM (worker
 * secret + .env.local) once the sending domain is verified, e.g.
 * "Pleiad <hello@yourdomain.com>". The fallback keeps payload shape valid
 * but will be rejected by Resend until a real domain is configured.
 */
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Pleiad <noreply@omnis.app>'
