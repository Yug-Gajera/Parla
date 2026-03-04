-- ============================================================
-- FluentLoop — Word Lookup Cache & Daily Counter
-- ============================================================

-- ─── Word Lookup Cache (shared across all users) ────────────
CREATE TABLE IF NOT EXISTS word_lookup_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    word text NOT NULL UNIQUE,
    translation text,
    spanish_explanation text,
    part_of_speech text,
    note text DEFAULT '',
    created_at timestamptz DEFAULT now()
);

-- ─── Daily Lookup Counter ───────────────────────────────────
CREATE TABLE IF NOT EXISTS user_daily_lookup_count (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT current_date,
    count int DEFAULT 0,
    UNIQUE(user_id, date)
);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE word_lookup_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_lookup_count ENABLE ROW LEVEL SECURITY;

-- Cache: read-only for authenticated, server writes
CREATE POLICY "Anyone can read word cache"
    ON word_lookup_cache FOR SELECT TO authenticated USING (true);

-- Daily counter: read own only, server writes
CREATE POLICY "Users read own lookup count"
    ON user_daily_lookup_count FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_word_cache_word ON word_lookup_cache(word);
CREATE INDEX IF NOT EXISTS idx_daily_lookup_user ON user_daily_lookup_count(user_id, date);
