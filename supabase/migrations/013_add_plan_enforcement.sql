-- 013_add_plan_enforcement.sql
-- Adds tier-based plan tracking and usage monitoring

-- 1. Add columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'pro_plus')),
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS plan_granted_by TEXT NULL, -- 'stripe' | 'manual' | 'beta' | 'lifetime'
ADD COLUMN IF NOT EXISTS is_beta_user BOOLEAN DEFAULT false;

-- 2. Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL, -- 'conversation' | 'article' | 'story' | 'word_lookup' | 'level_test'
  counted_at TIMESTAMPTZ DEFAULT NOW(),
  week_number INTEGER, -- extract(week from counted_at)
  year_number INTEGER   -- extract(year from counted_at)
);

-- 3. Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_usage_user_metric_week 
ON usage_tracking(user_id, metric, week_number, year_number);

-- 4. Enable RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies
CREATE POLICY "usage_tracking_select_own"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usage_tracking_insert_own"
  ON usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);
