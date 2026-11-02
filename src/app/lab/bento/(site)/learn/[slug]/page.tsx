import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleView } from '@/components/bento-lab/docs/article-view'
import { ARTICLES, findArticle } from '@/components/bento-lab/docs/library'

interface Props {
  readonly params: Promise<{ readonly slug: string }>
}

export const generateStaticParams = (): { slug: string }[] => ARTICLES.map((article) => ({ slug: article.slug }))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = findArticle((await params).slug)
  return article ? { title: article.title, description: article.description } : {}
}

export default async function ArticlePage({ params }: Props) {
  const article = findArticle((await params).slug)
  if (!article) notFound()
  return <ArticleView article={article} />
}
