-- ============================================================
-- FluentLoop — AI Generated Stories (Cost-Optimized)
-- ============================================================

-- ─── Generated Stories (shared across all users) ────────────
CREATE TABLE IF NOT EXISTS generated_stories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id uuid REFERENCES languages(id) ON DELETE CASCADE,
    content_type text NOT NULL,
    topic text NOT NULL,
    topic_category text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    word_count int,
    cefr_level text NOT NULL,
    vocabulary_items jsonb,
    comprehension_questions jsonb,
    summary text,
    generated_at timestamptz DEFAULT now(),
    times_read int DEFAULT 0
);

-- ─── User Story Progress ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_story_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    story_id uuid REFERENCES generated_stories(id) ON DELETE CASCADE,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    words_tapped int DEFAULT 0,
    comprehension_score int,
    xp_earned int DEFAULT 0,
    UNIQUE(user_id, story_id)
);

-- ─── Daily Generation Counter ───────────────────────────────
CREATE TABLE IF NOT EXISTS user_daily_generation_count (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT current_date,
    count int DEFAULT 0,
    UNIQUE(user_id, date)
);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE generated_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_story_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_generation_count ENABLE ROW LEVEL SECURITY;

-- generated_stories: read-only for authenticated, no client writes
CREATE POLICY "Anyone can read stories"
    ON generated_stories FOR SELECT TO authenticated USING (true);

-- user_story_progress: users own rows
CREATE POLICY "Users read own story progress"
    ON user_story_progress FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "Users insert own story progress"
    ON user_story_progress FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own story progress"
    ON user_story_progress FOR UPDATE TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_daily_generation_count: read own only, server writes
CREATE POLICY "Users read own generation count"
    ON user_daily_generation_count FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- ─── Indexes ────────────────────────────────────────────────
-- Compound index for fast story lookup (findExistingStory)
CREATE INDEX IF NOT EXISTS idx_stories_lookup
    ON generated_stories(language_id, cefr_level, topic_category, content_type);
-- Popular stories first
CREATE INDEX IF NOT EXISTS idx_stories_popular
    ON generated_stories(times_read DESC);
-- User progress
CREATE INDEX IF NOT EXISTS idx_story_progress_user
    ON user_story_progress(user_id, story_id);
-- Daily counter
CREATE INDEX IF NOT EXISTS idx_daily_gen_count
    ON user_daily_generation_count(user_id, date);
