-- Omnis Phase 2 Database Schema: Relationships & Groups
-- Migration: 00002_relationships_schema.sql

-- ============================================================================
-- RELATIONSHIPS TABLE
-- Models connections between people
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person1_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('family', 'romantic', 'friend', 'professional', 'other')),
  subtype TEXT,
  bidirectional BOOLEAN NOT NULL DEFAULT TRUE,
  strength INTEGER NOT NULL DEFAULT 3 CHECK (strength >= 1 AND strength <= 5),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate relationships
  CONSTRAINT unique_relationship UNIQUE (owner_id, person1_id, person2_id, type),
  -- Ensure person1 and person2 are different
  CONSTRAINT different_people CHECK (person1_id != person2_id)
);

-- Indexes for relationships
CREATE INDEX IF NOT EXISTS idx_relationships_owner ON public.relationships(owner_id);
CREATE INDEX IF NOT EXISTS idx_relationships_person1 ON public.relationships(person1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_person2 ON public.relationships(person2_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON public.relationships(type);

-- Trigger for updated_at
CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON public.relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GROUPS TABLE
-- Named collections of people
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for groups
CREATE INDEX IF NOT EXISTS idx_groups_owner ON public.groups(owner_id);

-- Trigger for updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GROUP_MEMBERS TABLE
-- Junction table linking groups to people
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, person_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_group_members_person ON public.group_members(person_id);

-- ============================================================================
-- SHARED_VIEWS TABLE
-- Share links for public viewing
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shared_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('person', 'relationship', 'group', 'graph')),
  options JSONB NOT NULL DEFAULT '{}',
  url_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for shared_views
CREATE INDEX IF NOT EXISTS idx_shared_views_owner ON public.shared_views(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_views_token ON public.shared_views(url_token);
CREATE INDEX IF NOT EXISTS idx_shared_views_active ON public.shared_views(active) WHERE active = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_views ENABLE ROW LEVEL SECURITY;

-- Relationships policies
CREATE POLICY "Users can view own relationships"
  ON public.relationships FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own relationships"
  ON public.relationships FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (SELECT 1 FROM public.people WHERE id = person1_id AND owner_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.people WHERE id = person2_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can update own relationships"
  ON public.relationships FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own relationships"
  ON public.relationships FOR DELETE
  USING (auth.uid() = owner_id);

-- Groups policies
CREATE POLICY "Users can view own groups"
  ON public.groups FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own groups"
  ON public.groups FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own groups"
  ON public.groups FOR DELETE
  USING (auth.uid() = owner_id);

-- Group members policies
CREATE POLICY "Users can view group_members for own groups"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert group_members for own groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = group_members.person_id
      AND people.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete group_members for own groups"
  ON public.group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.owner_id = auth.uid()
    )
  );

-- Shared views policies
CREATE POLICY "Users can view own shared_views"
  ON public.shared_views FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own shared_views"
  ON public.shared_views FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own shared_views"
  ON public.shared_views FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own shared_views"
  ON public.shared_views FOR DELETE
  USING (auth.uid() = owner_id);

-- Public access policy for viewing shared content (by token)
CREATE POLICY "Anyone can view active shared_views by token"
  ON public.shared_views FOR SELECT
  USING (active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get relationships for a person (both directions)
CREATE OR REPLACE FUNCTION public.get_person_relationships(p_person_id UUID)
RETURNS TABLE (
  id UUID,
  person1_id UUID,
  person2_id UUID,
  type TEXT,
  subtype TEXT,
  bidirectional BOOLEAN,
  strength INTEGER,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  other_person_id UUID,
  other_person_name TEXT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.person1_id,
    r.person2_id,
    r.type,
    r.subtype,
    r.bidirectional,
    r.strength,
    r.start_date,
    r.end_date,
    r.notes,
    r.created_at,
    r.updated_at,
    CASE WHEN r.person1_id = p_person_id THEN r.person2_id ELSE r.person1_id END AS other_person_id,
    p.name AS other_person_name
  FROM public.relationships r
  JOIN public.people p ON p.id = CASE WHEN r.person1_id = p_person_id THEN r.person2_id ELSE r.person1_id END
  WHERE r.owner_id = auth.uid()
  AND (r.person1_id = p_person_id OR (r.person2_id = p_person_id AND r.bidirectional = TRUE));
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_person_relationships(UUID) TO authenticated;

-- Function to get full graph data for the current user
CREATE OR REPLACE FUNCTION public.get_relationship_graph()
RETURNS TABLE (
  nodes JSONB,
  edges JSONB
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    (
      SELECT COALESCE(json_agg(json_build_object(
        'id', p.id,
        'name', p.name,
        'hebrew_name', p.hebrew_name,
        'birth_date', p.birth_date
      )), '[]'::json)::jsonb
      FROM public.people p
      WHERE p.owner_id = auth.uid()
      AND p.deleted_at IS NULL
    ) AS nodes,
    (
      SELECT COALESCE(json_agg(json_build_object(
        'id', r.id,
        'source', r.person1_id,
        'target', r.person2_id,
        'type', r.type,
        'subtype', r.subtype,
        'bidirectional', r.bidirectional,
        'strength', r.strength
      )), '[]'::json)::jsonb
      FROM public.relationships r
      WHERE r.owner_id = auth.uid()
    ) AS edges;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_relationship_graph() TO authenticated;

-- Function to get group with members
CREATE OR REPLACE FUNCTION public.get_group_with_members(p_group_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  members JSONB
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.description,
    g.created_at,
    g.updated_at,
    COALESCE(
      (
        SELECT json_agg(json_build_object(
          'id', p.id,
          'name', p.name,
          'hebrew_name', p.hebrew_name,
          'birth_date', p.birth_date,
          'added_at', gm.added_at
        ))
        FROM public.group_members gm
        JOIN public.people p ON p.id = gm.person_id
        WHERE gm.group_id = g.id
      ),
      '[]'::json
    )::jsonb
  FROM public.groups g
  WHERE g.id = p_group_id
  AND g.owner_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_group_with_members(UUID) TO authenticated;

-- Function to increment view count for shared views (callable without auth)
CREATE OR REPLACE FUNCTION public.increment_shared_view_count(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_view_count INTEGER;
  v_max_views INTEGER;
BEGIN
  SELECT view_count, max_views INTO v_view_count, v_max_views
  FROM public.shared_views
  WHERE url_token = p_token
  AND active = TRUE
  AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if max views exceeded
  IF v_max_views IS NOT NULL AND v_view_count >= v_max_views THEN
    UPDATE public.shared_views SET active = FALSE WHERE url_token = p_token;
    RETURN FALSE;
  END IF;

  -- Increment view count
  UPDATE public.shared_views
  SET view_count = view_count + 1
  WHERE url_token = p_token;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anonymous access to increment view count
GRANT EXECUTE ON FUNCTION public.increment_shared_view_count(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_shared_view_count(TEXT) TO authenticated;
