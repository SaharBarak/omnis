# Database Architecture Specification

## Overview

PostgreSQL database hosted on Supabase with Row Level Security (RLS) for multi-tenant data isolation.

---

## Technology Stack

```typescript
const stack = {
  database: 'PostgreSQL 15',
  hosting: 'Supabase',
  orm: 'None (raw SQL + typed queries)',
  migrations: 'Supabase CLI',
  vectorStore: 'pgvector (for RAG)',
};
```

---

## Schema Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        auth.users                           │
│                    (Supabase managed)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ profiles │ │  people  │ │  boards  │
        └──────────┘ └────┬─────┘ └──────────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │   tags   │ │relations │ │ results  │
        └──────────┘ └──────────┘ └──────────┘
```

---

## Tables

### profiles
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  birth_date DATE,
  birth_time TIME,
  birth_place JSONB,
  hebrew_name TEXT,
  locale TEXT NOT NULL DEFAULT 'he' CHECK (locale IN ('he', 'en')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_locale ON profiles(locale);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### people
```sql
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hebrew_name TEXT,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_place JSONB,
  avatar_url TEXT,
  notes TEXT,
  is_self BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_birth_date CHECK (birth_date >= '1900-01-01' AND birth_date <= CURRENT_DATE)
);

-- Indexes
CREATE INDEX idx_people_owner ON people(owner_id);
CREATE INDEX idx_people_owner_deleted ON people(owner_id, deleted_at);
CREATE INDEX idx_people_name ON people(owner_id, name);
CREATE INDEX idx_people_birth_date ON people(birth_date);

-- Full text search
CREATE INDEX idx_people_search ON people USING GIN (
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(hebrew_name, ''))
);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### tags
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hebrew_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  UNIQUE (owner_id, name)
);

-- System tags (owner_id is NULL)
INSERT INTO tags (id, owner_id, name, hebrew_name, color, is_system, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'family', 'משפחה', '#EF4444', TRUE, 0),
  ('00000000-0000-0000-0000-000000000002', NULL, 'partner', 'בן/בת זוג', '#EC4899', TRUE, 1),
  ('00000000-0000-0000-0000-000000000003', NULL, 'friend', 'חברים', '#8B5CF6', TRUE, 2),
  ('00000000-0000-0000-0000-000000000004', NULL, 'colleague', 'עמיתים', '#3B82F6', TRUE, 3),
  ('00000000-0000-0000-0000-000000000005', NULL, 'child', 'ילדים', '#10B981', TRUE, 4),
  ('00000000-0000-0000-0000-000000000006', NULL, 'parent', 'הורים', '#F59E0B', TRUE, 5);
```

### person_tags
```sql
CREATE TABLE person_tags (
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (person_id, tag_id)
);

CREATE INDEX idx_person_tags_tag ON person_tags(tag_id);
```

### relationships
```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person1_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('family', 'romantic', 'friend', 'professional', 'other')),
  subtype TEXT,
  bidirectional BOOLEAN NOT NULL DEFAULT TRUE,
  strength INTEGER NOT NULL DEFAULT 3 CHECK (strength >= 1 AND strength <= 5),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT different_people CHECK (person1_id != person2_id),
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date),
  UNIQUE (owner_id, person1_id, person2_id, type)
);

CREATE INDEX idx_relationships_owner ON relationships(owner_id);
CREATE INDEX idx_relationships_person1 ON relationships(person1_id);
CREATE INDEX idx_relationships_person2 ON relationships(person2_id);
CREATE INDEX idx_relationships_type ON relationships(owner_id, type);
```

### groups
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_owner ON groups(owner_id);

CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (group_id, person_id)
);

CREATE INDEX idx_group_members_person ON group_members(person_id);
```

### computed_results
```sql
CREATE TABLE computed_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  system TEXT NOT NULL CHECK (system IN ('dreamspell', 'tzolkin', 'longcount', 'humandesign', 'astrology', 'gematria')),
  version TEXT NOT NULL,
  data JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (person_id, system, version)
);

CREATE INDEX idx_results_person ON computed_results(person_id);
CREATE INDEX idx_results_system ON computed_results(person_id, system);
```

### boards
```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT,
  canvas JSONB NOT NULL DEFAULT '{}',
  layers JSONB NOT NULL DEFAULT '[]',
  thumbnail TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boards_owner ON boards(owner_id);
CREATE INDEX idx_boards_public ON boards(is_public) WHERE is_public = TRUE;
```

### shared_views
```sql
CREATE TABLE shared_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('board', 'person', 'group', 'relationship')),
  entity_id UUID NOT NULL,
  options JSONB NOT NULL DEFAULT '{}',
  url TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shared_views_owner ON shared_views(owner_id);
CREATE INDEX idx_shared_views_url ON shared_views(url);
CREATE INDEX idx_shared_views_active ON shared_views(active, expires_at);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

### usage
```sql
CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,          -- '2025-01'
  people_count INTEGER NOT NULL DEFAULT 0,
  ai_tokens_used INTEGER NOT NULL DEFAULT 0,
  exports_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, period)
);

CREATE INDEX idx_usage_user_period ON usage(user_id, period);
```

### ai_cache
```sql
CREATE TABLE ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  model_version TEXT NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);

-- Cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_ai_cache() RETURNS void AS $$
BEGIN
  DELETE FROM ai_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### rag_documents (pgvector)
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),        -- OpenAI embedding dimension
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rag_embedding ON rag_documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_rag_source ON rag_documents(source_id);
```

---

## Row Level Security (RLS)

### Enable RLS
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE computed_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
```

### Policies

#### profiles
```sql
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### people
```sql
CREATE POLICY "Users can view own people"
  ON people FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create people"
  ON people FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own people"
  ON people FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own people"
  ON people FOR DELETE
  USING (auth.uid() = owner_id);
```

#### tags
```sql
CREATE POLICY "Users can view system tags and own tags"
  ON tags FOR SELECT
  USING (is_system = TRUE OR auth.uid() = owner_id);

CREATE POLICY "Users can create custom tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND is_system = FALSE);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = owner_id AND is_system = FALSE);
```

#### relationships
```sql
CREATE POLICY "Users can view own relationships"
  ON relationships FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage own relationships"
  ON relationships FOR ALL
  USING (auth.uid() = owner_id);
```

#### boards
```sql
CREATE POLICY "Users can view own boards"
  ON boards FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public boards"
  ON boards FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can manage own boards"
  ON boards FOR ALL
  USING (auth.uid() = owner_id);
```

---

## Functions

### update_updated_at_column
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### get_person_with_tags
```sql
CREATE OR REPLACE FUNCTION get_person_with_tags(p_person_id UUID)
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  name TEXT,
  hebrew_name TEXT,
  birth_date DATE,
  birth_time TIME,
  birth_place JSONB,
  avatar_url TEXT,
  notes TEXT,
  is_self BOOLEAN,
  tags JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.owner_id,
    p.name,
    p.hebrew_name,
    p.birth_date,
    p.birth_time,
    p.birth_place,
    p.avatar_url,
    p.notes,
    p.is_self,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'name', t.name,
          'hebrewName', t.hebrew_name,
          'color', t.color
        )
      ) FILTER (WHERE t.id IS NOT NULL),
      '[]'::jsonb
    ) AS tags,
    p.created_at,
    p.updated_at
  FROM people p
  LEFT JOIN person_tags pt ON p.id = pt.person_id
  LEFT JOIN tags t ON pt.tag_id = t.id
  WHERE p.id = p_person_id
    AND p.deleted_at IS NULL
    AND auth.uid() = p.owner_id
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### increment_usage
```sql
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_field TEXT,
  p_amount INTEGER DEFAULT 1
) RETURNS void AS $$
DECLARE
  v_period TEXT;
BEGIN
  v_period := to_char(NOW(), 'YYYY-MM');

  INSERT INTO usage (user_id, period)
  VALUES (p_user_id, v_period)
  ON CONFLICT (user_id, period) DO NOTHING;

  EXECUTE format(
    'UPDATE usage SET %I = %I + $1, updated_at = NOW() WHERE user_id = $2 AND period = $3',
    p_field, p_field
  ) USING p_amount, p_user_id, v_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migrations

### Migration Naming
```
20250101000000_create_profiles.sql
20250101000001_create_people.sql
20250101000002_create_tags.sql
...
```

### Running Migrations
```bash
# Apply migrations
supabase db push

# Generate migration from diff
supabase db diff -f migration_name

# Reset database
supabase db reset
```

---

## Backups

### Supabase Managed
- Daily automated backups
- Point-in-time recovery (PITR) available on Pro plan
- 7-day retention on free, 30-day on Pro

### Manual Backup
```bash
# Export data
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

## Performance Optimization

### Query Optimization
```sql
-- Use EXPLAIN ANALYZE for query analysis
EXPLAIN ANALYZE
SELECT * FROM people
WHERE owner_id = '...'
  AND deleted_at IS NULL
ORDER BY name;

-- Add covering indexes for common queries
CREATE INDEX idx_people_list ON people(owner_id, deleted_at, name)
  INCLUDE (hebrew_name, birth_date);
```

### Connection Pooling
```typescript
// Supabase uses PgBouncer for connection pooling
// Use transaction mode for serverless
const supabase = createClient(url, key, {
  db: { schema: 'public' },
  auth: { persistSession: true },
});
```

### Caching Strategy
```typescript
// Cache frequently accessed data
const cacheStrategy = {
  tags: '1h',                    // System tags rarely change
  people: '5m',                  // People list
  results: '24h',                // Computed results
  profile: '10m',                // User profile
};
```
