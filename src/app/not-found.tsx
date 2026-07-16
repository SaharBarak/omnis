import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[#0B0D16] px-6 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-brand-soft">404</p>
      <h1 className="mt-3 text-2xl font-display font-semibold text-white">
        This page isn&apos;t on the map
      </h1>
      <p className="mt-2 max-w-sm text-white/50">
        The link may be broken, or the page may have moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
      >
        Back home
      </Link>
    </div>
  )
}
