# EPIC-002: External Readings Aggregation

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** 5.5 (Between Predictions and AI Layer)
**Priority:** Medium-High

---

## Problem Statement

Omnis currently shows only internally-computed symbolic data. Users interested in daily spiritual guidance often visit multiple sites (horoscopes, tarot, etc.) scattered across the web. There's an opportunity to:

1. **Drive organic traffic** via SEO for "daily horoscope", "tarot reading today" searches
2. **Increase daily engagement** by giving users a reason to return every day
3. **Expand beyond the 6 core systems** without building new calculation engines
4. **Serve multiple regions/languages** (Israel, US, Mexico, Argentina, Guatemala, India)

The EXTERNAL_READINGS.md spec defines aggregation from 20+ sources across 8 practices (Tarot, Western Astrology, Vedic, Numerology, I-Ching, Runes, Kabbalah, Dreamspell).

## Proposed Solution

Build a reading aggregation system that:

1. **Scrapes/fetches** readings from external sources on a schedule
2. **Normalizes** content into a unified format
3. **Displays** on homepage widget + dedicated `/readings` page
4. **Personalizes** based on user's birth data (zodiac sign, etc.)
5. **Caches** to minimize external requests

### Supported Practices
| Practice | Sources | Reading Types |
|----------|---------|---------------|
| Tarot | Biddy Tarot, Labyrinthos | Daily, Weekly |
| Western Astrology | Cafe Astrology, Astro.com | Daily, Weekly, Monthly |
| Vedic Astrology | GaneshaSpeaks, AstroSage | Daily, Weekly |
| Numerology | Numerology.com | Daily, Yearly |
| I-Ching | I Ching Online | Daily |
| Runes | Various | Daily |
| Kabbalah | Kabbalah Centre | Daily |

### Regional Coverage
- **Israel (Hebrew):** Ynet, Mako, Kabbalah Centre
- **USA (English):** Cafe Astrology, Biddy Tarot
- **Mexico/Argentina (Spanish):** Horoscopos.com, Clarín
- **India (English/Hindi):** GaneshaSpeaks, AstroSage

## Affected Components

| Component | Changes |
|-----------|---------|
| `src/lib/services/readings.ts` | New - Reading aggregation service |
| `src/lib/services/scrapers/` | New - Per-source scraper modules |
| `src/app/api/cron/fetch-readings/` | New - Scheduled fetching |
| `src/app/readings/page.tsx` | New - Readings browse page |
| `src/components/readings/` | New - ReadingCard, DailyWidget, ReadingsGrid |
| `src/app/app/page.tsx` | Update - Add readings widget to dashboard |
| Database | New tables: reading_sources, readings, reading_cache |

## Success Criteria

- [ ] Database schema for reading_sources and readings tables
- [ ] At least 5 working scrapers (different sources/practices)
- [ ] Cron job fetches readings on schedule (daily for daily, weekly for weekly)
- [ ] `/readings` page displays aggregated readings by practice
- [ ] Homepage widget shows "today's readings" summary
- [ ] Personalized zodiac horoscope based on user's birth date
- [ ] Multi-language support (EN, HE, ES at minimum)
- [ ] Error handling when sources are unavailable
- [ ] Attribution/links back to original sources
- [ ] Cache layer to avoid redundant fetches

## Tasks (Post-Approval)

1. Create database migrations for reading tables
2. Build scraper framework with pluggable adapters
3. Implement 5-8 initial scrapers:
   - Cafe Astrology (Western horoscopes)
   - Biddy Tarot (daily tarot)
   - GaneshaSpeaks (Vedic)
   - Ynet Astrology (Hebrew)
   - I-Ching Online
4. Create cron endpoint for scheduled fetching
5. Build reading normalization/storage service
6. Create `/readings` page UI
7. Build homepage readings widget
8. Add user personalization (zodiac matching)
9. Implement caching layer
10. Add source attribution and links
11. Set up monitoring for scraper health
12. Write tests for scrapers and service

## Dependencies

- Scraping infrastructure (Puppeteer/Playwright for JS-rendered sites)
- Cron job scheduler (Vercel Cron or external)
- Source site stability (external dependency)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Sites change structure | Scraper health monitoring, quick-fix adapters |
| Legal/ToS issues | Proper attribution, link back, consider RSS/APIs |
| Rate limiting | Respectful scraping, caching, backoff |

## Estimated Effort

- **Development:** 4-5 weeks
- **Ongoing:** 2-4 hours/month scraper maintenance
- **Total Initial:** 5-6 weeks

## References

- `/specs/components/EXTERNAL_READINGS.md` - Full specification
