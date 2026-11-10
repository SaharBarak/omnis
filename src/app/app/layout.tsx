import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { peopleOnce } from './_data'
import { V2Shell } from './_dash/v2-shell'
import { SiteTreeProvider } from '@/components/bento-lab/site/site-tree'
import { getSession } from '@/lib/auth-server'
import { loginHref } from '@/lib/auth/gates'
import { V2_GATE, v2Href } from '@/lib/site/v2-routes'

export const metadata: Metadata = {
  title: { default: 'Pleiad v2', template: '%s · Pleiad v2' },
  robots: { index: false, follow: false, noarchive: true },
}

/**
 * Signed-in pages of v2 (BENTO_V2.md "Dashboard"). The middleware gate sends
 * visitors to the bento login first; this server check is the guard itself.
 */
export default async function V2AppLayout({ children }: { readonly children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect(loginHref(V2_GATE.prefix, v2Href('/app')))
  const people = await peopleOnce(session.user.id)
  return (
    <SiteTreeProvider tree="v2">
      <V2Shell user={{ email: session.user.email, name: session.user.name }} people={people.length}>
        {children}
      </V2Shell>
    </SiteTreeProvider>
  )
}
