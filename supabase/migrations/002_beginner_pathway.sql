-- ============================================================
-- FluentLoop — Beginner Pathway Tables
-- ============================================================

-- Stores AI-generated learning content per scenario + language.
-- Content is generated once and cached for all users.
CREATE TABLE IF NOT EXISTS scenario_modules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_type text NOT NULL,
    language_id uuid REFERENCES languages(id) ON DELETE CASCADE,
    dialogue_content jsonb,
    phrase_set jsonb,
    challenge_content jsonb,
    target_level text DEFAULT 'A1',
    created_at timestamptz DEFAULT now(),
    UNIQUE(scenario_type, language_id)
);

-- Tracks each user's progress through the 3-step module.
CREATE TABLE IF NOT EXISTS user_module_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    scenario_type text NOT NULL,
    language_id uuid REFERENCES languages(id) ON DELETE CASCADE,
    dialogue_completed boolean DEFAULT false,
    dialogue_score int DEFAULT 0,
    phrases_completed boolean DEFAULT false,
    phrases_learned int DEFAULT 0,
    challenge_completed boolean DEFAULT false,
    challenge_score int DEFAULT 0,
    scenario_unlocked boolean DEFAULT false,
    dialogue_completed_at timestamptz,
    phrases_completed_at timestamptz,
    challenge_completed_at timestamptz,
    scenario_unlocked_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, scenario_type, language_id)
);

-- ── RLS Policies ──

ALTER TABLE scenario_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;

-- scenario_modules: anyone authenticated can read, no client writes
CREATE POLICY "Anyone can read scenario modules"
    ON scenario_modules FOR SELECT
    TO authenticated
    USING (true);

-- user_module_progress: users can only access their own rows
CREATE POLICY "Users can read own module progress"
    ON user_module_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own module progress"
    ON user_module_progress FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own module progress"
    ON user_module_progress FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
