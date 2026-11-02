import type { Metadata } from 'next'
import { routeTitle } from '@/lib/site/routes'
import { TreeView } from '@/components/bento-lab/systems/tree-view'

export const metadata: Metadata = { title: routeTitle('/app/tree-of-life') }

export default function Page() {
  return <TreeView />
}
