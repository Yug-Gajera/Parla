-- ============================================================
-- FluentLoop — Article Reading System (Cost-Optimized)
-- ============================================================

-- ─── Articles Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id uuid REFERENCES languages(id) ON DELETE CASCADE,
    source_name text NOT NULL,
    source_url text NOT NULL,
    original_url text UNIQUE NOT NULL,
    title text NOT NULL,
    summary text,
    content text NOT NULL,
    word_count int,
    cefr_level text NOT NULL,
    level_score int,
    topics text[],
    vocabulary_items jsonb,
    comprehension_questions jsonb,
    published_at timestamptz,
    fetched_at timestamptz DEFAULT now(),
    processed boolean DEFAULT false,
    image_url text,
    estimated_read_minutes int
);

-- ─── Daily Fetch Log (cost monitoring) ──────────────────────
CREATE TABLE IF NOT EXISTS daily_fetch_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date UNIQUE NOT NULL DEFAULT current_date,
    articles_fetched int DEFAULT 0,
    articles_skipped_duplicate int DEFAULT 0,
    articles_skipped_filter int DEFAULT 0,
    articles_processed int DEFAULT 0,
    articles_failed int DEFAULT 0,
    total_tokens_used int DEFAULT 0,
    estimated_cost_usd decimal DEFAULT 0,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- ─── User Article Progress ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_article_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    words_tapped int DEFAULT 0,
    questions_answered int DEFAULT 0,
    questions_correct int DEFAULT 0,
    comprehension_score int,
    xp_earned int DEFAULT 0,
    UNIQUE(user_id, article_id)
);

-- ─── Article Word Encounters ────────────────────────────────
CREATE TABLE IF NOT EXISTS article_word_encounters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
    word text NOT NULL,
    tapped_at timestamptz DEFAULT now(),
    added_to_deck boolean DEFAULT false
);

-- ─── RLS Policies ───────────────────────────────────────────
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_fetch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_article_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_word_encounters ENABLE ROW LEVEL SECURITY;

-- articles: read-only for authenticated users, no client writes
CREATE POLICY "Anyone can read articles"
    ON articles FOR SELECT TO authenticated USING (true);

-- daily_fetch_log: NO client access at all (admin only via service role)

-- user_article_progress: users own rows only
CREATE POLICY "Users read own article progress"
    ON user_article_progress FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "Users insert own article progress"
    ON user_article_progress FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own article progress"
    ON user_article_progress FOR UPDATE TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- article_word_encounters: users own rows only
CREATE POLICY "Users read own word encounters"
    ON article_word_encounters FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "Users insert own word encounters"
    ON article_word_encounters FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own word encounters"
    ON article_word_encounters FOR UPDATE TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_lang_level ON articles(language_id, cefr_level);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_original_url ON articles(original_url);
CREATE INDEX IF NOT EXISTS idx_user_article_progress_user ON user_article_progress(user_id, article_id);
CREATE INDEX IF NOT EXISTS idx_article_word_encounters_user ON article_word_encounters(user_id, article_id);
