-- =============================================
-- Billing Schema Migration
-- =============================================
-- Creates tables for subscription management and usage tracking
-- Part of EPIC-001: SaaS Billing Integration

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
-- Stores user subscription data synced with Stripe

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'complete', 'practitioner')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one subscription per user
    CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan);

-- =============================================
-- USAGE TABLE
-- =============================================
-- Tracks monthly usage per user for enforcing limits

CREATE TABLE IF NOT EXISTS public.usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- Format: YYYY-MM
    profiles_count INTEGER DEFAULT 0,
    ai_interpretations_used INTEGER DEFAULT 0,
    boards_count INTEGER DEFAULT 0,
    exports_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One record per user per period
    CONSTRAINT usage_user_period_unique UNIQUE (user_id, period)
);

-- Index for efficient period lookups
CREATE INDEX IF NOT EXISTS idx_usage_period ON public.usage(period);
CREATE INDEX IF NOT EXISTS idx_usage_user_period ON public.usage(user_id, period);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update/delete subscriptions (via webhooks)
CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS on usage
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Users can only read their own usage
CREATE POLICY "Users can view own usage"
    ON public.usage FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all usage
CREATE POLICY "Service role can manage usage"
    ON public.usage FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to increment usage metrics atomically
CREATE OR REPLACE FUNCTION public.increment_usage(
    p_user_id UUID,
    p_period TEXT,
    p_metric TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update usage record
    INSERT INTO public.usage (user_id, period, profiles_count, ai_interpretations_used, boards_count, exports_count)
    VALUES (
        p_user_id,
        p_period,
        CASE WHEN p_metric = 'profiles_count' THEN p_amount ELSE 0 END,
        CASE WHEN p_metric = 'ai_interpretations_used' THEN p_amount ELSE 0 END,
        CASE WHEN p_metric = 'boards_count' THEN p_amount ELSE 0 END,
        CASE WHEN p_metric = 'exports_count' THEN p_amount ELSE 0 END
    )
    ON CONFLICT (user_id, period) DO UPDATE SET
        profiles_count = CASE 
            WHEN p_metric = 'profiles_count' 
            THEN public.usage.profiles_count + p_amount 
            ELSE public.usage.profiles_count 
        END,
        ai_interpretations_used = CASE 
            WHEN p_metric = 'ai_interpretations_used' 
            THEN public.usage.ai_interpretations_used + p_amount 
            ELSE public.usage.ai_interpretations_used 
        END,
        boards_count = CASE 
            WHEN p_metric = 'boards_count' 
            THEN public.usage.boards_count + p_amount 
            ELSE public.usage.boards_count 
        END,
        exports_count = CASE 
            WHEN p_metric = 'exports_count' 
            THEN public.usage.exports_count + p_amount 
            ELSE public.usage.exports_count 
        END,
        updated_at = NOW();
END;
$$;

-- Function to get user's current plan (with caching consideration)
CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_plan TEXT;
    v_status TEXT;
    v_period_end TIMESTAMPTZ;
BEGIN
    SELECT plan, status, current_period_end
    INTO v_plan, v_status, v_period_end
    FROM public.subscriptions
    WHERE user_id = p_user_id;
    
    -- Return free if no subscription found
    IF NOT FOUND THEN
        RETURN 'free';
    END IF;
    
    -- Check if subscription is still valid
    IF v_status IN ('active', 'trialing') AND (v_period_end IS NULL OR v_period_end > NOW()) THEN
        RETURN v_plan;
    END IF;
    
    RETURN 'free';
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_updated_at
    BEFORE UPDATE ON public.usage
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Create free subscription for existing users who don't have one
-- This is commented out by default - run manually if needed
-- INSERT INTO public.subscriptions (user_id, plan, status)
-- SELECT id, 'free', 'active'
-- FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM public.subscriptions);

COMMENT ON TABLE public.subscriptions IS 'User subscription data synced with Stripe';
COMMENT ON TABLE public.usage IS 'Monthly usage tracking for enforcing plan limits';
COMMENT ON FUNCTION public.increment_usage IS 'Atomically increment usage metrics for a user';
COMMENT ON FUNCTION public.get_user_plan IS 'Get current plan for a user with validity check';
