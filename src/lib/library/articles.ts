/**
 * Learning Library (#79) — re-export of the shared article data so web and
 * mobile read the same text. Content and shape live in
 * `packages/engine/src/data/articles.ts`.
 */

export {
  ARTICLES,
  ARTICLE_BY_SLUG,
  TOPIC_LABELS,
} from '@pleiad/engine/data/articles'
export type { Article, ArticleSection } from '@pleiad/engine/data/articles'
