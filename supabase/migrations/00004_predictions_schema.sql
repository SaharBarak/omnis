-- Omnis Predictions Schema
-- Stores cached predictions and notification settings

-- ============================================================================
-- PREDICTIONS TABLE
-- Cached prediction results for people
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  system TEXT NOT NULL CHECK (system IN ('dreamspell', 'tzolkin', 'astrology', 'humandesign', 'longcount')),
  type TEXT NOT NULL CHECK (type IN ('wavespell', 'castle', 'yearly-kin', 'trecena', 'year-bearer', 'transit', 'return', 'retrograde', 'hd-transit')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  intensity TEXT NOT NULL DEFAULT 'medium' CHECK (intensity IN ('low', 'medium', 'high', 'peak')),
  themes TEXT[] DEFAULT '{}',
  interpretation TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for predictions
CREATE INDEX IF NOT EXISTS idx_predictions_owner ON public.predictions(owner_id);
CREATE INDEX IF NOT EXISTS idx_predictions_person ON public.predictions(person_id);
CREATE INDEX IF NOT EXISTS idx_predictions_system ON public.predictions(system);
CREATE INDEX IF NOT EXISTS idx_predictions_dates ON public.predictions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_predictions_expires ON public.predictions(expires_at);

-- ============================================================================
-- NOTIFICATION_SETTINGS TABLE
-- User notification preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in-app'],
  daily_digest BOOLEAN NOT NULL DEFAULT FALSE,
  daily_digest_time TIME DEFAULT '08:00',
  weekly_digest BOOLEAN NOT NULL DEFAULT FALSE,
  weekly_digest_day INTEGER DEFAULT 0 CHECK (weekly_digest_day >= 0 AND weekly_digest_day <= 6),
  advance_notice INTEGER NOT NULL DEFAULT 1 CHECK (advance_notice >= 0 AND advance_notice <= 30),
  systems TEXT[] NOT NULL DEFAULT ARRAY['dreamspell', 'tzolkin'],
  min_intensity TEXT NOT NULL DEFAULT 'medium' CHECK (min_intensity IN ('low', 'medium', 'high', 'peak')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- CALENDAR_EVENTS TABLE
-- Exported calendar events for tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT TRUE,
  category TEXT,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_owner ON public.calendar_events(owner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON public.calendar_events(start_date, end_date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Predictions policies
CREATE POLICY "Users can view own predictions"
  ON public.predictions FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own predictions"
  ON public.predictions FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own predictions"
  ON public.predictions FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own predictions"
  ON public.predictions FOR DELETE
  USING (auth.uid() = owner_id);

-- Notification settings policies
CREATE POLICY "Users can view own notification settings"
  ON public.notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON public.notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can view own calendar events"
  ON public.calendar_events FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own calendar events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own calendar events"
  ON public.calendar_events FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get predictions for a date range
CREATE OR REPLACE FUNCTION public.get_predictions_for_range(
  p_start_date DATE,
  p_end_date DATE,
  p_systems TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  person_id UUID,
  system TEXT,
  type TEXT,
  start_date DATE,
  end_date DATE,
  intensity TEXT,
  themes TEXT[],
  interpretation TEXT,
  data JSONB
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.person_id,
    p.system,
    p.type,
    p.start_date,
    p.end_date,
    p.intensity,
    p.themes,
    p.interpretation,
    p.data
  FROM public.predictions p
  WHERE p.owner_id = auth.uid()
  AND p.start_date <= p_end_date
  AND p.end_date >= p_start_date
  AND (p_systems IS NULL OR p.system = ANY(p_systems))
  ORDER BY p.start_date, p.intensity DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_predictions_for_range(DATE, DATE, TEXT[]) TO authenticated;
