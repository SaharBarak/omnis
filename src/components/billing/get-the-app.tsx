import { APP_STORE_URL, PLAY_STORE_URL, hasStoreLinks } from '@/lib/store-links'

/**
 * The single upgrade CTA on the web.
 *
 * Paid plans are in-app purchases, so the web never takes payment — it points
 * at the app. Renders a "coming soon" state until a store listing is live so we
 * never ship a dead link.
 */
export function GetTheApp({
  label = 'Upgrade in the app',
  className = '',
}: {
  label?: string
  className?: string
}) {
  if (!hasStoreLinks) {
    return (
      <p className={`text-sm text-white/50 ${className}`}>
        Plans are purchased in the Pleiad app — coming soon to the App Store and
        Google Play.
      </p>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {APP_STORE_URL && (
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition active:scale-[0.98]"
        >
          {label} — App Store
        </a>
      )}
      {PLAY_STORE_URL && (
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/5 active:scale-[0.98]"
        >
          {label} — Google Play
        </a>
      )}
    </div>
  )
}
