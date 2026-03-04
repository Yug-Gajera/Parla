-- ============================================================
-- Migration 003: Scenario Variations
-- Adds situation tracking to conversation sessions and
-- creates a history table for variation rotation logic.
-- ============================================================

-- 1. Add situation columns to conversation_sessions
ALTER TABLE conversation_sessions
ADD COLUMN IF NOT EXISTS situation_id text,
ADD COLUMN IF NOT EXISTS situation_name text,
ADD COLUMN IF NOT EXISTS situation_twist text;

-- 2. Create user_situation_history table
CREATE TABLE IF NOT EXISTS user_situation_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language_id uuid NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    scenario_type text NOT NULL,
    situation_id text NOT NULL,
    completed_at timestamptz NOT NULL DEFAULT now(),
    overall_score int
);

-- 3. Index for fast lookup of what situations a user has done per scenario
CREATE INDEX IF NOT EXISTS idx_user_situation_history_lookup
ON user_situation_history (user_id, scenario_type);

-- 4. RLS policies
ALTER TABLE user_situation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own situation history"
ON user_situation_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own situation history"
ON user_situation_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own situation history"
ON user_situation_history FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
