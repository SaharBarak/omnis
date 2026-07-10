# Pleiad External Readings Feature Spec

**Fits into:** Phase 5.5 (between Predictions and AI Layer)
**New spec file:** `/specs/components/EXTERNAL_READINGS.md`

---

## 1. Overview

Aggregate daily/weekly/yearly spiritual readings from external sources across multiple countries and traditions. Display on homepage widget + dedicated `/readings` page to increase engagement and SEO traffic.

**Goal:** Drive organic traffic via "daily tarot reading", "horoscope today" searches while providing value that keeps users coming back daily.

---

## 2. Supported Practices

| Practice | Description | Reading Types |
|----------|-------------|---------------|
| **Tarot** | Daily card draws, spreads, interpretations | Daily, Weekly |
| **Western Astrology** | Horoscopes by zodiac sign | Daily, Weekly, Monthly, Yearly |
| **Vedic Astrology (Jyotish)** | Indian astrological readings | Daily, Weekly |
| **Numerology** | Personal day/year numbers | Daily, Yearly |
| **I-Ching** | Hexagram of the day | Daily |
| **Runes** | Rune of the day | Daily |
| **Kabbalah** | Hebrew letter/sephira meditations | Daily, Weekly |
| **Dreamspell** | Already exists (Today's Kin) - integrate here | Daily |

---

## 3. Target Regions & Sources

### Israel (Hebrew)
- Ynet Astrology (ynet.co.il/astrology)
- Mako Astrology
- Kabbalah Centre Israel
- Local Hebrew tarot sites

### United States (English)
- Cafe Astrology (cafeastrology.com)
- Biddy Tarot (biddytarot.com)
- Labyrinthos (labyrinthos.co)
- Tarot.com
- Astro.com
- Numerology.com
- I Ching Online

### Mexico (Spanish)
- Horoscopos.com
- Tarot de Maria
- Astrocentro Mexico

### Argentina (Spanish)
- Clarín Horóscopo
- La Nación Astrología
- Tarot Argentina

### Guatemala (Spanish/Mayan)
- Mayan Calendar portals
- Local spirituality sites

### India (English/Hindi)
- GaneshaSpeaks (ganeshaspeaks.com)
- AstroSage (astrosage.com)
- Kundli Software portals
- Prokerala

---

## 4. Database Schema

### Table: `reading_sources`
```sql
CREATE TABLE public.reading_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name TEXT NOT NULL,                    -- "Cafe Astrology"
  slug TEXT UNIQUE NOT NULL,             -- "cafe-astrology"

  -- Classification
  practice TEXT NOT NULL,                -- tarot, astrology, numerology, iching, runes, kabbalah
  tradition TEXT,                        -- western, vedic, mayan, jewish
  region TEXT NOT NULL,                  -- us, israel, mexico, argentina, guatemala, india
  language TEXT NOT NULL DEFAULT 'en',   -- en, he, es, hi

  -- Scraping config
  base_url TEXT NOT NULL,
  daily_url_pattern TEXT,                -- e.g., "/horoscope/daily/{sign}"
  weekly_url_pattern TEXT,
  monthly_url_pattern TEXT,
  yearly_url_pattern TEXT,

  scrape_config JSONB DEFAULT '{}',      -- CSS selectors, XPath, etc.
  /* Example:
  {
    "content_selector": ".horoscope-content p",
    "title_selector": "h1.title",
    "date_selector": ".date",
    "requires_js": false,
    "rate_limit_ms": 2000
  }
  */

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  last_error TEXT,
  success_rate DECIMAL(5,2),             -- % successful scrapes

  -- Metadata
  logo_url TEXT,
  attribution_text TEXT,                 -- "Powered by Cafe Astrology"
  robots_txt_allows BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sources_practice ON reading_sources(practice);
CREATE INDEX idx_sources_region ON reading_sources(region);
CREATE INDEX idx_sources_active ON reading_sources(is_active);
```

### Table: `external_readings`
```sql
CREATE TABLE public.external_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source reference
  source_id UUID NOT NULL REFERENCES reading_sources(id) ON DELETE CASCADE,

  -- Classification
  practice TEXT NOT NULL,                -- matches source practice
  reading_type TEXT NOT NULL,            -- daily, weekly, monthly, yearly

  -- For zodiac-specific readings (nullable for general readings)
  zodiac_sign TEXT,                      -- aries, taurus, etc. (western)
  vedic_sign TEXT,                       -- mesha, vrishabha, etc. (vedic)

  -- Content
  title TEXT,                            -- "Today's Tarot: The Fool"
  snippet TEXT NOT NULL,                 -- 2-3 sentence preview (displayed)
  full_content TEXT,                     -- full reading (stored but not displayed)

  -- Media
  image_url TEXT,                        -- card image, zodiac icon, etc.

  -- Attribution (REQUIRED)
  source_url TEXT NOT NULL,              -- link back to original
  source_name TEXT NOT NULL,             -- "Cafe Astrology"
  author TEXT,                           -- if available

  -- Metadata
  keywords TEXT[],                       -- ['love', 'career', 'health']
  themes TEXT[],                         -- extracted themes
  sentiment TEXT,                        -- positive, neutral, challenging

  -- Temporal
  reading_date DATE NOT NULL,            -- the date this reading is for
  valid_from DATE,                       -- for weekly/monthly ranges
  valid_until DATE,

  -- Scrape tracking
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  content_hash TEXT,                     -- detect duplicate content

  -- Unique constraint: one reading per source/type/date/sign
  UNIQUE(source_id, reading_type, reading_date, zodiac_sign)
);

-- Indexes for common queries
CREATE INDEX idx_readings_date ON external_readings(reading_date);
CREATE INDEX idx_readings_practice ON external_readings(practice);
CREATE INDEX idx_readings_type ON external_readings(reading_type);
CREATE INDEX idx_readings_sign ON external_readings(zodiac_sign);
CREATE INDEX idx_readings_scraped ON external_readings(scraped_at);
```

### Table: `reading_favorites` (optional - user engagement)
```sql
CREATE TABLE public.reading_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_id UUID NOT NULL REFERENCES external_readings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reading_id)
);
```

---

## 5. Scraper Architecture

### Directory Structure
```
/src/lib/scrapers/
├── index.ts                 # Main orchestrator
├── types.ts                 # TypeScript interfaces
├── config.ts                # Source configurations
├── utils/
│   ├── fetcher.ts          # Rate-limited HTTP client
│   ├── parser.ts           # HTML parsing helpers (cheerio)
│   ├── translator.ts       # Auto-translate snippets (optional)
│   └── cache.ts            # Deduplication logic
└── sources/
    ├── base.ts             # Abstract base scraper class
    ├── tarot/
    │   ├── biddy-tarot.ts
    │   ├── labyrinthos.ts
    │   └── tarot-com.ts
    ├── astrology/
    │   ├── western/
    │   │   ├── cafe-astrology.ts
    │   │   └── astro-com.ts
    │   └── vedic/
    │       ├── ganeshaspeaks.ts
    │       └── astrosage.ts
    ├── numerology/
    │   └── numerology-com.ts
    ├── iching/
    │   └── iching-online.ts
    ├── runes/
    │   └── rune-secrets.ts
    ├── kabbalah/
    │   └── kabbalah-centre.ts
    └── regional/
        ├── israel/
        │   └── ynet-astrology.ts
        ├── mexico/
        │   └── horoscopos-com.ts
        └── india/
            └── ganeshaspeaks.ts
```

### Base Scraper Interface
```typescript
// /src/lib/scrapers/types.ts

export interface ScraperConfig {
  sourceId: string;
  baseUrl: string;
  selectors: {
    content: string;
    title?: string;
    date?: string;
    image?: string;
  };
  requiresJS: boolean;
  rateLimitMs: number;
}

export interface ScrapedReading {
  sourceId: string;
  practice: string;
  readingType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  zodiacSign?: string;
  title?: string;
  snippet: string;
  fullContent?: string;
  imageUrl?: string;
  sourceUrl: string;
  sourceName: string;
  readingDate: Date;
  keywords?: string[];
}

export abstract class BaseScraper {
  abstract scrape(): Promise<ScrapedReading[]>;

  protected async fetch(url: string): Promise<string>;
  protected parseHTML(html: string, selector: string): string;
  protected extractSnippet(content: string, maxLength?: number): string;
  protected normalizeDate(dateStr: string): Date;
}
```

### Orchestrator
```typescript
// /src/lib/scrapers/index.ts

export async function scrapeAllSources(): Promise<ScrapeResult> {
  const sources = await getActiveSources();
  const results: ScrapedReading[] = [];
  const errors: ScrapeError[] = [];

  // Process in batches to respect rate limits
  for (const batch of chunk(sources, 5)) {
    const batchResults = await Promise.allSettled(
      batch.map(source => scraperFor(source).scrape())
    );

    // Collect results and errors
    // Update source last_scraped_at and success_rate
  }

  // Upsert readings to database
  await upsertReadings(results);

  return { success: results.length, failed: errors.length, errors };
}
```

---

## 6. API Routes

### Cron Job: `/api/cron/scrape-readings/route.ts`
```typescript
// Runs daily at 5:00 AM UTC (before daily-kin email at 6 AM)
export async function GET(request: Request) {
  // 1. Verify CRON_SECRET
  // 2. Call scrapeAllSources()
  // 3. Log metrics to database
  // 4. Return summary
}
```

**Vercel cron config:**
```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-readings",
      "schedule": "0 5 * * *"
    }
  ]
}
```

### Public API: `/api/readings/route.ts`
```typescript
// GET /api/readings
// Query params:
//   - practice: tarot | astrology | numerology | iching | runes | kabbalah
//   - type: daily | weekly | monthly | yearly
//   - sign: aries | taurus | ... (optional)
//   - region: us | israel | mexico | india | ... (optional)
//   - date: YYYY-MM-DD (optional, defaults to today)
//   - limit: number (default 10)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const readings = await supabase
    .from('external_readings')
    .select(`
      *,
      source:reading_sources(name, logo_url, attribution_text)
    `)
    .eq('reading_date', date)
    .order('practice')
    .limit(limit);

  return Response.json(readings);
}
```

### Individual Reading: `/api/readings/[id]/route.ts`
```typescript
// GET /api/readings/[id]
// Returns single reading with full content (for detail view)
```

---

## 7. Frontend Components

### Homepage Widget: `/src/components/landing/DailyReadings.tsx`
```typescript
interface DailyReadingsProps {
  maxItems?: number;  // default 6
}

// Features:
// - Grid of 6 reading cards (2x3 on desktop, 1x6 on mobile)
// - Practice icon + name
// - Snippet (2 lines, truncated)
// - Source attribution link
// - "See all readings →" CTA
// - Auto-refresh at midnight
// - Skeleton loading state
```

### Dedicated Page: `/src/app/(public)/readings/page.tsx`
```typescript
// Features:
// - Hero section with today's date
// - Filter sidebar:
//   - Practice (multi-select)
//   - Type (daily/weekly/monthly)
//   - Zodiac sign (for horoscopes)
//   - Region (optional)
// - Reading cards grid
// - Pagination or infinite scroll
// - SEO: title="Daily Spiritual Readings | Pleiad"
// - Structured data (JSON-LD) for search
```

### Reading Card: `/src/components/readings/ReadingCard.tsx`
```typescript
interface ReadingCardProps {
  practice: string;
  title?: string;
  snippet: string;
  sourceUrl: string;
  sourceName: string;
  imageUrl?: string;
  zodiacSign?: string;
  readingDate: Date;
}

// Design:
// - Matches cosmic design system (dark bg, gold accents)
// - Practice icon (tarot cards, zodiac, etc.)
// - Title (if available)
// - Snippet text (2-3 lines)
// - "Read full reading →" link to source
// - "Powered by [Source]" attribution
// - Optional: favorite button (authenticated users)
```

### Reading Detail Modal: `/src/components/readings/ReadingDetail.tsx`
```typescript
// Features:
// - Full reading content (if available)
// - Large practice icon/image
// - Source attribution (prominent)
// - Share buttons
// - Related readings
// - CTA to sign up for daily email
```

---

## 8. Legal & Attribution Requirements

### Content Policy
1. **Snippet only:** Display max 2-3 sentences (fair use)
2. **Always link back:** Every reading must link to original source
3. **Attribution visible:** "Powered by [Source]" or "From [Source]" always shown
4. **No full content display:** Full text stored but only snippet shown
5. **Respect robots.txt:** Check before scraping, skip if disallowed
6. **Rate limiting:** Minimum 2 seconds between requests to same domain
7. **User-agent:** Identify as "PleiadBot/1.0 (+https://omnis.app/bot)"

### Source Vetting
Before adding a source:
- [ ] Check robots.txt allows scraping
- [ ] Review Terms of Service
- [ ] Ensure content is freely available (not paywalled)
- [ ] Verify attribution requirements
- [ ] Test scraper doesn't break site

---

## 9. Newsletter Integration

### Daily Email Enhancement
Update `/api/cron/daily-kin/route.ts` to include:

```typescript
// After Today's Kin section, add:

## Today's Readings

**Tarot:** [Card Name] - [Snippet]
**Horoscope:** [Sign if known] - [Snippet]

[View all readings →]
```

### Optional: Personalized Readings
If user has birth data:
- Show their zodiac sign's horoscope
- Show their numerology day number

---

## 10. Analytics & Monitoring

### Track
- Readings page views (per practice)
- Click-through rate to sources
- Scraper success/failure rates
- Most popular practices/sources
- Time on page

### Alerts
- Scraper failure rate > 20%
- Source returning empty content
- New sources to add (based on user requests)

---

## 11. SEO Strategy

### Target Keywords
- "daily tarot reading"
- "horoscope today [sign]"
- "daily numerology"
- "i ching reading today"
- "rune of the day"
- "kabbalah daily meditation"
- "vedic astrology today"

### Pages to Create
- `/readings` - Main hub
- `/readings/tarot` - Tarot readings
- `/readings/horoscope` - All horoscopes
- `/readings/horoscope/[sign]` - Sign-specific
- `/readings/numerology` - Numerology
- `/readings/iching` - I Ching
- `/readings/runes` - Runes
- `/readings/kabbalah` - Kabbalah

### Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Daily Tarot Reading - January 30, 2026",
  "datePublished": "2026-01-30",
  "author": {
    "@type": "Organization",
    "name": "Pleiad"
  }
}
```

---

## 12. Implementation Phases

### Phase 1: Infrastructure (2 days)
- [ ] Create database migration
- [ ] Set up scraper base architecture
- [ ] Implement rate-limited fetcher
- [ ] Create cron job endpoint

### Phase 2: Initial Sources (3 days)
- [ ] Cafe Astrology (Western horoscopes)
- [ ] Biddy Tarot (Daily tarot)
- [ ] Numerology.com (Daily numbers)
- [ ] I Ching Online (Daily hexagram)
- [ ] Test full scrape cycle

### Phase 3: Frontend (2 days)
- [ ] ReadingCard component
- [ ] DailyReadings homepage widget
- [ ] /readings page with filters
- [ ] Add widget to landing page

### Phase 4: Expand Sources (3 days)
- [ ] GaneshaSpeaks (Vedic - India)
- [ ] Ynet Astrology (Hebrew - Israel)
- [ ] Horoscopos.com (Spanish - Mexico)
- [ ] Kabbalah Centre
- [ ] Rune Secrets

### Phase 5: Polish (2 days)
- [ ] Newsletter integration
- [ ] SEO metadata
- [ ] Analytics events
- [ ] Error monitoring
- [ ] Documentation

---

## 13. Files to Create

```
New Files:
├── supabase/migrations/00006_external_readings.sql
├── src/lib/scrapers/
│   ├── index.ts
│   ├── types.ts
│   ├── config.ts
│   ├── utils/fetcher.ts
│   ├── utils/parser.ts
│   └── sources/[...per source]
├── src/app/api/cron/scrape-readings/route.ts
├── src/app/api/readings/route.ts
├── src/app/(public)/readings/page.tsx
├── src/app/(public)/readings/[practice]/page.tsx
├── src/components/readings/ReadingCard.tsx
├── src/components/readings/ReadingDetail.tsx
├── src/components/readings/ReadingsFilter.tsx
├── src/components/readings/ReadingsGrid.tsx
├── src/components/landing/DailyReadings.tsx
└── specs/components/EXTERNAL_READINGS.md

Modify:
├── src/app/page.tsx (add DailyReadings widget)
├── src/app/api/cron/daily-kin/route.ts (add readings to email)
└── vercel.json (add cron schedule)
```

---

## 14. Verification Checklist

- [ ] Migration runs successfully
- [ ] Manual scrape returns readings
- [ ] Cron job triggers on schedule
- [ ] Homepage widget displays readings
- [ ] /readings page loads with filters
- [ ] Source links work correctly
- [ ] Attribution visible on all readings
- [ ] Rate limiting prevents abuse
- [ ] Errors logged and alerted
- [ ] SEO metadata renders correctly
