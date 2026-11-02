import type { Metadata } from 'next'
import { LibraryIndex } from '@/components/bento-lab/docs/library-index'
import { LibraryShelf } from '@/components/bento-lab/docs/library-shelf'
import { ARTICLES, LIBRARY_ENTRIES } from '@/components/bento-lab/docs/library'

const LEAD = `${ARTICLES.length} articles and ${LIBRARY_ENTRIES.length} sections on the systems behind the map. Search for a seal, a gate or a letter, or start with a system.`

export const metadata: Metadata = { title: 'Library', description: LEAD }

export default function LibraryPage() {
  return (
    <LibraryIndex entries={LIBRARY_ENTRIES} lead={LEAD}>
      <LibraryShelf articles={ARTICLES} />
    </LibraryIndex>
  )
}
