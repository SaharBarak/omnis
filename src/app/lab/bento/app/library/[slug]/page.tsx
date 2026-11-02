import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LibraryArticle } from '@/components/bento-lab/systems/library-view'
import { ARTICLE_BY_SLUG } from '@/lib/library/articles'

interface Props {
  readonly params: Promise<{ readonly slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = ARTICLE_BY_SLUG[slug]
  return { title: article ? article.title : 'Library' }
}

export default async function LibraryArticlePage({ params }: Props) {
  const { slug } = await params
  const article = ARTICLE_BY_SLUG[slug]
  if (!article) notFound()
  return <LibraryArticle article={article} />
}
