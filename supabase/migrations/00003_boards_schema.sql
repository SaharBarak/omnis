-- Omnis Phase 4 Database Schema: Canvas Editor / Boards
-- Migration: 00003_boards_schema.sql

-- ============================================================================
-- BOARDS TABLE
-- Visual workspace for creating and arranging symbolic system outputs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT CHECK (template IN ('blank', 'relationship-map', 'family-tree', 'yearly-overview', 'personal-profile', 'group-analysis')),
  canvas JSONB NOT NULL DEFAULT '{
    "width": 1920,
    "height": 1080,
    "viewBox": { "x": 0, "y": 0, "width": 1920, "height": 1080, "zoom": 1 },
    "background": { "type": "solid", "color": "#FFFFFF" },
    "grid": { "visible": true, "size": 20, "snap": true, "color": "#E5E7EB" },
    "nodes": [],
    "connections": [],
    "annotations": []
  }'::jsonb,
  layers JSONB NOT NULL DEFAULT '[
    { "id": "background", "name": "רקע", "visible": true, "locked": false, "opacity": 1, "order": 0, "color": "#9CA3AF" },
    { "id": "people", "name": "אנשים", "visible": true, "locked": false, "opacity": 1, "order": 1, "color": "#3B82F6" },
    { "id": "connections", "name": "קשרים", "visible": true, "locked": false, "opacity": 1, "order": 2, "color": "#10B981" },
    { "id": "annotations", "name": "הערות", "visible": true, "locked": false, "opacity": 1, "order": 3, "color": "#F59E0B" }
  ]'::jsonb,
  thumbnail TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for boards
CREATE INDEX IF NOT EXISTS idx_boards_owner ON public.boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_boards_template ON public.boards(template) WHERE template IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_boards_public ON public.boards(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_boards_updated ON public.boards(updated_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- BOARD_SHARES TABLE
-- Separate table for sharing boards (extends shared_views concept)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.board_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  url_token TEXT NOT NULL UNIQUE,
  permissions TEXT NOT NULL DEFAULT 'view' CHECK (permissions IN ('view', 'comment', 'edit')),
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for board_shares
CREATE INDEX IF NOT EXISTS idx_board_shares_board ON public.board_shares(board_id);
CREATE INDEX IF NOT EXISTS idx_board_shares_token ON public.board_shares(url_token);
CREATE INDEX IF NOT EXISTS idx_board_shares_active ON public.board_shares(active) WHERE active = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_shares ENABLE ROW LEVEL SECURITY;

-- Boards policies
CREATE POLICY "Users can view own boards"
  ON public.boards FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public boards"
  ON public.boards FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can insert own boards"
  ON public.boards FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own boards"
  ON public.boards FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own boards"
  ON public.boards FOR DELETE
  USING (auth.uid() = owner_id);

-- Board shares policies
CREATE POLICY "Users can view shares for own boards"
  ON public.board_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_shares.board_id
      AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert shares for own boards"
  ON public.board_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_shares.board_id
      AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update shares for own boards"
  ON public.board_shares FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_shares.board_id
      AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares for own boards"
  ON public.board_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_shares.board_id
      AND boards.owner_id = auth.uid()
    )
  );

-- Public access policy for viewing shared boards (by token)
CREATE POLICY "Anyone can view active board_shares by token"
  ON public.board_shares FOR SELECT
  USING (active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get board with share info
CREATE OR REPLACE FUNCTION public.get_board_by_share_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  template TEXT,
  canvas JSONB,
  layers JSONB,
  permissions TEXT,
  expires_at TIMESTAMPTZ,
  owner_name TEXT
) SECURITY DEFINER AS $$
BEGIN
  -- Check if token is valid and active
  IF NOT EXISTS (
    SELECT 1 FROM public.board_shares bs
    WHERE bs.url_token = p_token
    AND bs.active = TRUE
    AND (bs.expires_at IS NULL OR bs.expires_at > NOW())
    AND (bs.max_views IS NULL OR bs.view_count < bs.max_views)
  ) THEN
    RETURN;
  END IF;

  -- Increment view count
  UPDATE public.board_shares
  SET view_count = view_count + 1
  WHERE url_token = p_token;

  -- Return board data
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.description,
    b.template,
    b.canvas,
    b.layers,
    bs.permissions,
    bs.expires_at,
    p.display_name AS owner_name
  FROM public.boards b
  JOIN public.board_shares bs ON bs.board_id = b.id
  LEFT JOIN public.profiles p ON p.user_id = b.owner_id
  WHERE bs.url_token = p_token;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_board_by_share_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_board_by_share_token(TEXT) TO authenticated;

-- Function to duplicate a board
CREATE OR REPLACE FUNCTION public.duplicate_board(p_board_id UUID, p_new_name TEXT DEFAULT NULL)
RETURNS UUID SECURITY DEFINER AS $$
DECLARE
  v_new_board_id UUID;
  v_original_name TEXT;
BEGIN
  -- Check ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.boards
    WHERE id = p_board_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Board not found or access denied';
  END IF;

  -- Get original name if new name not provided
  IF p_new_name IS NULL THEN
    SELECT name || ' (העתק)' INTO v_original_name
    FROM public.boards WHERE id = p_board_id;
    p_new_name := v_original_name;
  END IF;

  -- Create duplicate
  INSERT INTO public.boards (owner_id, name, description, template, canvas, layers)
  SELECT auth.uid(), p_new_name, description, template, canvas, layers
  FROM public.boards
  WHERE id = p_board_id
  RETURNING id INTO v_new_board_id;

  RETURN v_new_board_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.duplicate_board(UUID, TEXT) TO authenticated;

-- Function to get user's recent boards
CREATE OR REPLACE FUNCTION public.get_recent_boards(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  template TEXT,
  thumbnail TEXT,
  is_public BOOLEAN,
  node_count INTEGER,
  updated_at TIMESTAMPTZ
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.description,
    b.template,
    b.thumbnail,
    b.is_public,
    COALESCE(jsonb_array_length(b.canvas->'nodes'), 0)::INTEGER AS node_count,
    b.updated_at
  FROM public.boards b
  WHERE b.owner_id = auth.uid()
  ORDER BY b.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_recent_boards(INTEGER) TO authenticated;
