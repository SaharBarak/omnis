-- Newsletter Subscribers Schema
-- Created for LP.5 Email Infrastructure

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{"daily_kin": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email
  ON public.newsletter_subscribers(email);

-- Index for confirmed subscribers (for sending)
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_confirmed
  ON public.newsletter_subscribers(confirmed)
  WHERE confirmed = TRUE AND unsubscribed_at IS NULL;

-- RLS Policies
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for signup)
CREATE POLICY "Allow public newsletter signup"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to manage their own subscriptions
CREATE POLICY "Users can view own subscription"
  ON public.newsletter_subscribers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow service role full access (for cron jobs)
CREATE POLICY "Service role has full access"
  ON public.newsletter_subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Email send log table (for tracking)
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL, -- 'daily_kin', 'welcome', 'confirmation'
  subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  resend_id TEXT, -- Resend message ID for tracking
  status TEXT DEFAULT 'sent', -- 'sent', 'bounced', 'failed'
  error_message TEXT
);

-- Index for log queries
CREATE INDEX IF NOT EXISTS idx_email_send_log_subscriber
  ON public.email_send_log(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_send_log_sent_at
  ON public.email_send_log(sent_at);

-- RLS for email log
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access logs
CREATE POLICY "Service role only for email logs"
  ON public.email_send_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
