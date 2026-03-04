-- ============================================================
-- Parlai — Watch & Listen (Videos + Podcasts)
-- ============================================================

-- ─── Videos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id uuid REFERENCES languages(id) ON DELETE CASCADE,
    youtube_id text UNIQUE NOT NULL,
    title text NOT NULL,
    channel_name text NOT NULL,
    channel_url text,
    description text,
    thumbnail_url text,
    duration_seconds int,
    cefr_level text NOT NULL,
    topics text[],
    transcript jsonb,
    vocabulary_items jsonb,
    comprehension_questions jsonb,
    summary text,
    processed boolean DEFAULT false,
    is_published boolean DEFAULT false,
    total_views int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- ─── Podcast Shows ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS podcast_shows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id uuid REFERENCES languages(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    rss_url text UNIQUE NOT NULL,
    cover_color text,
    cefr_level_range text[],
    topics text[],
    has_transcripts boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ─── Podcast Episodes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS podcast_episodes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id uuid REFERENCES podcast_shows(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    audio_url text NOT NULL,
    duration_seconds int,
    published_at timestamptz,
    cefr_level text,
    topics text[],
    transcript jsonb,
    transcript_text text,
    vocabulary_items jsonb,
    comprehension_questions jsonb,
    processed boolean DEFAULT false,
    is_published boolean DEFAULT false,
    episode_number int,
    season_number int,
    created_at timestamptz DEFAULT now()
);

-- ─── User Video Progress ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_video_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
    watch_time_seconds int DEFAULT 0,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    words_tapped int DEFAULT 0,
    comprehension_score int,
    xp_earned int DEFAULT 0,
    UNIQUE(user_id, video_id)
);

-- ─── User Episode Progress ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_episode_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    episode_id uuid REFERENCES podcast_episodes(id) ON DELETE CASCADE,
    listen_time_seconds int DEFAULT 0,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    words_tapped int DEFAULT 0,
    comprehension_score int,
    xp_earned int DEFAULT 0,
    UNIQUE(user_id, episode_id)
);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_episode_progress ENABLE ROW LEVEL SECURITY;

-- Published content: read-only for authenticated
CREATE POLICY "Authenticated read published videos"
    ON videos FOR SELECT TO authenticated
    USING (is_published = true);

CREATE POLICY "Authenticated read podcast shows"
    ON podcast_shows FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Authenticated read published episodes"
    ON podcast_episodes FOR SELECT TO authenticated
    USING (is_published = true);

-- Progress: users own their rows
CREATE POLICY "Users read own video progress"
    ON user_video_progress FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "Users insert own video progress"
    ON user_video_progress FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own video progress"
    ON user_video_progress FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users read own episode progress"
    ON user_episode_progress FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "Users insert own episode progress"
    ON user_episode_progress FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own episode progress"
    ON user_episode_progress FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_videos_lookup ON videos(language_id, cefr_level, is_published);
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_youtube ON videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_episodes_show ON podcast_episodes(show_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_processed ON podcast_episodes(processed, is_published);
CREATE INDEX IF NOT EXISTS idx_user_video_progress ON user_video_progress(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_user_episode_progress ON user_episode_progress(user_id, episode_id);
