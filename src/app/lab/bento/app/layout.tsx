import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/bento-lab/app'
import { SiteTreeProvider } from '@/components/bento-lab/site/site-tree'
import { getSession } from '@/lib/auth-server'
import { signInHref } from '@/lib/site/routes'

export const metadata: Metadata = {
  title: { default: 'Pleiad', template: '%s · Pleiad' },
  robots: { index: false, follow: false, noarchive: true },
}

/**
 * Signed-in pages of the bento site. The middleware gate sends visitors to
 * the site login first; this server check is the guard itself.
 */
export default async function BentoAppLayout({ children }: { readonly children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect(signInHref('/app'))
  return (
    <SiteTreeProvider tree="v1">
      <AppShell user={{ email: session.user.email, name: session.user.name }}>{children}</AppShell>
    </SiteTreeProvider>
  )
}
