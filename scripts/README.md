# Scripts

## Knowledge Base Pipeline

The knowledge pipeline scrapes educational content from 100+ esoteric/metaphysical websites, chunks it, generates vector embeddings, and stores everything in Supabase for semantic search.

### Architecture

```
knowledge-sources.json  →  scrape-knowledge.ts  →  data/knowledge/{source-id}/*.md
                                                            ↓
                                                    embed-knowledge.ts  →  Supabase (knowledge_base + content_chunks)
                                                            ↓
                                                    knowledge-search.ts  →  Vector similarity search
```

### Prerequisites

1. Run the Supabase migration `00007_knowledge_base.sql`
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — service role key (for writes)
   - `OPENAI_API_KEY` — for generating embeddings

### Sources Configuration

All knowledge sources are defined in `scripts/knowledge-sources.json`. Each entry has:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (used as directory name) |
| `name` | Human-readable name |
| `url` | Base URL of the website |
| `category` | One of: `human-design`, `dreamspell`, `tzolkin`, `kabbalah`, `gematria`, `i-ching`, `astrology`, `numerology`, `vedic-astrology`, `tarot`, `sacred-geometry`, `general-esoteric` |
| `startPaths` | Array of URL paths to begin crawling from |
| `crawlPattern` | Glob pattern for which paths to follow (e.g., `/pages/*`) |
| `priority` | 1 (highest) to 3 (lowest) — affects scrape order |
| `notes` | Optional description |

### Step 1: Scrape Content

```bash
# Scrape all sources
npm run scrape:knowledge

# Scrape a single source
npm run scrape:knowledge -- --source=jovianarchive

# Scrape all sources in a category
npm run scrape:knowledge -- --category=kabbalah

# Dry run — show what would be scraped without fetching
npm run scrape:knowledge -- --dry-run

# Limit pages per source
npm run scrape:knowledge -- --max-pages=50

# Combine flags
npm run scrape:knowledge -- --source=cafeastrology --max-pages=100
```

The scraper:
- Reads source config from `knowledge-sources.json`
- Respects `robots.txt` for each domain
- Rate-limits to ~1.2 requests/second per domain
- Follows internal links matching the configured `crawlPattern`
- Saves markdown files to `data/knowledge/{source-id}/`
- Tracks progress in `_state.json` for resume capability
- Extracts clean text content (removes nav, ads, scripts, etc.)

### Step 2: Generate Embeddings

```bash
# Embed all sources
npm run embed:knowledge

# Embed a single source
npm run embed:knowledge -- --source=jovianarchive

# Embed a category
npm run embed:knowledge -- --category=i-ching

# Dry run — show chunk stats without embedding
npm run embed:knowledge -- --dry-run
```

The embedder:
- Reads markdown files from `data/knowledge/{source-id}/`
- Chunks content by headings/sections (~500-800 tokens per chunk)
- Generates embeddings via OpenAI `text-embedding-3-small`
- Upserts into `knowledge_base` and `content_chunks` tables

### Using the Search

```typescript
import { searchKnowledge } from '@/lib/services/knowledge-search'

const results = await searchKnowledge('What are the four types in Human Design?', 5)
// Returns relevant chunks with source URLs, categories, and similarity scores
```

### Categories & Source Count

| Category | Sources | Description |
|----------|---------|-------------|
| `human-design` | 11 | Types, centers, gates, channels, profiles |
| `dreamspell` | 10 | 13 Moon calendar, Dreamspell kin, wavespells |
| `tzolkin` | 10 | Traditional Mayan Tzolkin, day signs, trecenas |
| `kabbalah` | 10 | Tree of Life, Sefirot, Zohar, Hermetic Kabbalah |
| `gematria` | 10 | Hebrew gematria, ciphers, number meanings |
| `i-ching` | 10 | 64 hexagrams, trigrams, changing lines |
| `astrology` | 10 | Signs, houses, aspects, transits, planets |
| `numerology` | 10 | Life path, expression, soul urge numbers |
| `vedic-astrology` | 6 | Jyotish, nakshatras, dashas, yogas |
| `tarot` | 5 | Major/Minor Arcana, spreads, symbolism |
| `sacred-geometry` | 5 | Platonic solids, Flower of Life, phi |
| `general-esoteric` | 6 | Cross-tradition esoteric encyclopedias |

### Data Directory Structure

```
data/knowledge/
├── jovianarchive/
│   ├── _state.json          # Resume state (scraped URLs, last run)
│   ├── about-human-design.md
│   ├── the-four-types.md
│   └── ...
├── cafeastrology/
│   ├── _state.json
│   ├── articles-signs.md
│   └── ...
└── ...
```

### Adding New Sources

1. Add an entry to `scripts/knowledge-sources.json`
2. Run `npm run scrape:knowledge -- --source=your-new-id --dry-run` to verify
3. Run `npm run scrape:knowledge -- --source=your-new-id` to scrape
4. Run `npm run embed:knowledge -- --source=your-new-id` to embed
