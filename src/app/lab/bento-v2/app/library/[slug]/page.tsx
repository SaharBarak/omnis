import type { Metadata } from 'next'
import { LibraryArticleBody, libraryArticleMetadata, type SlugParams } from '@/components/bento-lab/app/pages'

export const generateMetadata = ({ params }: { readonly params: SlugParams }): Promise<Metadata> => libraryArticleMetadata(params)

export default function Page({ params }: { readonly params: SlugParams }) {
  return <LibraryArticleBody tree="v2" params={params} />
}
