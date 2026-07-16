import { COLORS } from '@/lib/design/landing-tokens'

/**
 * The one branded HTML shell every Pleiad email renders into. Colours come
 * straight from the landing design tokens (COLORS.brand = #7D5BC9) so email
 * and web can never drift; each email supplies only its inner `bodyHtml`
 * fragment + a footer line. Web fonts don't load reliably in mail clients, so
 * the type is a system stack — weight and colour carry the hierarchy.
 */

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export interface EmailLayoutOptions {
  /** Hidden inbox-preview text (the first line shown in the list, before open). */
  preheader?: string
  /** Optional H1 under the wordmark. */
  title?: string
  /** The email's inner content — already-safe HTML (escape any dynamic text). */
  bodyHtml: string
  /** Small grey line above the footer link, e.g. "You joined the newsletter." */
  footerText: string
  /** Unsubscribe / manage link. */
  footerLink?: { url: string; label: string }
}

/** HTML-escape dynamic text before it goes into email markup. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderEmail({
  preheader,
  title,
  bodyHtml,
  footerText,
  footerLink,
}: EmailLayoutOptions): string {
  // CAN-SPAM requires a physical postal address on marketing mail; we render it
  // only when configured rather than inventing one.
  const address = process.env.EMAIL_POSTAL_ADDRESS

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background-color:${COLORS.ground};font-family:${FONT};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>` : ''}
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="color:${COLORS.brand};font-size:22px;line-height:1;">&#10022;</span>
      <div style="color:${COLORS.brandBright};font-size:14px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;margin-top:8px;">Pleiad</div>
      ${title ? `<h1 style="color:#ffffff;font-size:26px;margin:16px 0 0;">${esc(title)}</h1>` : ''}
    </div>
    <div style="background:${COLORS.surface2};border:1px solid rgba(167,143,223,0.22);border-radius:16px;padding:28px;">
      ${bodyHtml}
    </div>
    <div style="text-align:center;border-top:1px solid rgba(255,255,255,0.08);margin-top:28px;padding-top:20px;">
      <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0 0 8px;">${esc(footerText)}</p>
      ${
        footerLink
          ? `<p style="margin:0 0 8px;"><a href="${footerLink.url}" style="color:${COLORS.brandSoft};font-size:12px;">${esc(footerLink.label)}</a></p>`
          : ''
      }
      ${address ? `<p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">${esc(address)}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}
