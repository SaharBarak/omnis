import type { Metadata } from 'next'
import { TreeView } from '@/components/bento-lab/systems/tree-view'
import { routeTitle } from '@/lib/site/routes'

export const metadata: Metadata = { title: routeTitle('/app/tree-of-life') }

export default function Page() {
  return <TreeView />
}
