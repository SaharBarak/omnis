# Scripts

## Knowledge Base Pipeline

### Prerequisites

1. Run the Supabase migration `00007_knowledge_base.sql` to create the tables
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — service role key (for writes)
   - `OPENAI_API_KEY` — for generating embeddings

### Step 1: Scrape Content

```bash
npm run scrape:knowledge
```

This crawls `jovianarchive.com` starting from `/pages/about-human-design`, follows internal `/pages/*` links, and:
- Saves each page as a markdown file in `data/knowledge/`
- Upserts the raw content into the `knowledge_base` table

### Step 2: Generate Embeddings

```bash
npm run embed:knowledge
```

This reads the scraped markdown files from `data/knowledge/`, chunks them by heading/section (~500-800 tokens per chunk), generates embeddings via OpenAI's `text-embedding-3-small`, and inserts them into `content_chunks`.

### Using the Search Utility

```typescript
import { searchKnowledge } from '@/lib/services/knowledge-search'

const results = await searchKnowledge('What are the four types in Human Design?', 5)
// Returns relevant chunks with source URLs and similarity scores
```
