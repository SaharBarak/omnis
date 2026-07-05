/**
 * Compatibility shim — the canonical JSON-LD module now lives at
 * `@/components/seo/json-ld`. Existing imports keep working and pick up
 * the SSR-inlined renderer and env-aware SITE_URL.
 */
export {
  JsonLd,
  SITE_URL,
  SITE_NAME,
  ORGANIZATION_ID,
  organizationSchema,
  webSiteSchema,
  softwareApplicationSchema,
  buildBreadcrumbs,
  buildFaqPage,
  buildArticle,
  buildSpeakable,
  type JsonLdData,
} from '@/components/seo/json-ld'
