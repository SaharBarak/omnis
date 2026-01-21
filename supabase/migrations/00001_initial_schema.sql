-- Omnis Phase 1 Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- Extended user profile data (linked to auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  birth_date DATE,
  birth_time TIME,
  birth_place JSONB,
  hebrew_name TEXT,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'he' CHECK (locale IN ('he', 'en')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
  preferences JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster locale queries
CREATE INDEX IF NOT EXISTS idx_profiles_locale ON public.profiles(locale);

-- ============================================================================
-- PEOPLE TABLE
-- People entries owned by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hebrew_name TEXT,
  birth_date DATE NOT NULL CHECK (birth_date >= '1900-01-01' AND birth_date <= CURRENT_DATE),
  birth_time TIME,
  birth_place JSONB,
  avatar_url TEXT,
  notes TEXT,
  is_self BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for people
CREATE INDEX IF NOT EXISTS idx_people_owner ON public.people(owner_id);
CREATE INDEX IF NOT EXISTS idx_people_owner_deleted ON public.people(owner_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_people_name ON public.people(name);
CREATE INDEX IF NOT EXISTS idx_people_birth_date ON public.people(birth_date);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_people_search ON public.people
  USING GIN (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(hebrew_name, '')));

-- ============================================================================
-- TAGS TABLE
-- System and custom tags for organizing people
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hebrew_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_tag_name UNIQUE (owner_id, name)
);

-- Insert system tags (owner_id is NULL for system tags)
INSERT INTO public.tags (owner_id, name, hebrew_name, color, is_system, sort_order) VALUES
  (NULL, 'family', 'משפחה', '#EF4444', TRUE, 1),
  (NULL, 'partner', 'בן/בת זוג', '#EC4899', TRUE, 2),
  (NULL, 'friend', 'חבר/ה', '#8B5CF6', TRUE, 3),
  (NULL, 'colleague', 'עמית/ה', '#3B82F6', TRUE, 4),
  (NULL, 'child', 'ילד/ה', '#22C55E', TRUE, 5),
  (NULL, 'parent', 'הורה', '#F59E0B', TRUE, 6)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PERSON_TAGS JUNCTION TABLE
-- Links people to tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.person_tags (
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_person_tags_tag ON public.person_tags(tag_id);

-- ============================================================================
-- COMPUTED_RESULTS TABLE
-- Cached calculation results for people
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.computed_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  system TEXT NOT NULL CHECK (system IN ('dreamspell', 'tzolkin', 'longcount', 'humandesign', 'astrology', 'gematria')),
  version TEXT NOT NULL,
  data JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_person_system_version UNIQUE (person_id, system, version)
);

CREATE INDEX IF NOT EXISTS idx_computed_results_person ON public.computed_results(person_id);
CREATE INDEX IF NOT EXISTS idx_computed_results_system ON public.computed_results(system);

-- ============================================================================
-- TRIGGERS
-- Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.computed_results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- People policies
CREATE POLICY "Users can view own people"
  ON public.people FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own people"
  ON public.people FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own people"
  ON public.people FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own people"
  ON public.people FOR DELETE
  USING (auth.uid() = owner_id);

-- Tags policies (users see system tags + their own custom tags)
CREATE POLICY "Users can view system and own tags"
  ON public.tags FOR SELECT
  USING (is_system = TRUE OR auth.uid() = owner_id);

CREATE POLICY "Users can insert own custom tags"
  ON public.tags FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND is_system = FALSE);

CREATE POLICY "Users can delete own custom tags"
  ON public.tags FOR DELETE
  USING (auth.uid() = owner_id AND is_system = FALSE);

-- Person_tags policies (users can manage tags for their people)
CREATE POLICY "Users can view person_tags for own people"
  ON public.person_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = person_tags.person_id
      AND people.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert person_tags for own people"
  ON public.person_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = person_tags.person_id
      AND people.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete person_tags for own people"
  ON public.person_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = person_tags.person_id
      AND people.owner_id = auth.uid()
    )
  );

-- Computed_results policies
CREATE POLICY "Users can view computed_results for own people"
  ON public.computed_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = computed_results.person_id
      AND people.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert computed_results for own people"
  ON public.computed_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = computed_results.person_id
      AND people.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update computed_results for own people"
  ON public.computed_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = computed_results.person_id
      AND people.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get a person with their tags
CREATE OR REPLACE FUNCTION public.get_person_with_tags(p_person_id UUID)
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
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tags JSONB
) SECURITY DEFINER AS $$
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
    p.deleted_at,
    p.created_at,
    p.updated_at,
    COALESCE(
      (
        SELECT json_agg(json_build_object(
          'id', t.id,
          'name', t.name,
          'hebrew_name', t.hebrew_name,
          'color', t.color
        ))
        FROM public.person_tags pt
        JOIN public.tags t ON t.id = pt.tag_id
        WHERE pt.person_id = p.id
      ),
      '[]'::json
    )::jsonb
  FROM public.people p
  WHERE p.id = p_person_id
  AND p.owner_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_person_with_tags(UUID) TO authenticated;
