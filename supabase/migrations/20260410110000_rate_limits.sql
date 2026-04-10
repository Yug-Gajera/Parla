-- Daily abuse-protection rate limits (separate from usage_tracking)

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE,
  last_request_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, operation, date)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_date
ON rate_limits(user_id, operation, date);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits_select_own" ON rate_limits;
CREATE POLICY "rate_limits_select_own"
  ON rate_limits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "rate_limits_insert_own" ON rate_limits;
CREATE POLICY "rate_limits_insert_own"
  ON rate_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "rate_limits_update_own" ON rate_limits;
CREATE POLICY "rate_limits_update_own"
  ON rate_limits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id UUID,
  p_operation TEXT,
  p_date DATE
)
RETURNS void AS $$
BEGIN
  INSERT INTO rate_limits (user_id, operation, date, count)
  VALUES (p_user_id, p_operation, p_date, 1)
  ON CONFLICT (user_id, operation, date)
  DO UPDATE SET
    count = rate_limits.count + 1,
    last_request_at = NOW();
END;
$$ LANGUAGE plpgsql;
