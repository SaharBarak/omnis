import type { Metadata } from 'next'
import AppShell from './app-shell'

/**
 * Server layout for the authed app surface (`/app/**`).
 *
 * Exists so the entire authed tree carries `noindex` at the metadata level —
 * robots.txt disallow alone does not prevent URL-only indexing. The
 * interactive shell lives in `app-shell.tsx` (client component, which cannot
 * export metadata).
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
