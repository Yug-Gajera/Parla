-- ============================================================
-- Parlai — Books & Chapter Reader
-- ============================================================

-- ─── Books ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id uuid REFERENCES languages(id) ON DELETE CASCADE,
    title text NOT NULL,
    author text,
    book_type text NOT NULL CHECK (book_type IN ('classic', 'graded_reader')),
    cefr_level text NOT NULL,
    description text,
    cover_color text DEFAULT '#7c3aed',
    total_chapters int DEFAULT 0,
    gutenberg_id int,
    gutenberg_url text,
    is_available boolean DEFAULT false,
    word_count_total int DEFAULT 0,
    estimated_hours decimal,
    topics text[],
    generated_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- ─── Book Chapters ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS book_chapters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id uuid REFERENCES books(id) ON DELETE CASCADE,
    chapter_number int NOT NULL,
    title text,
    content text NOT NULL,
    word_count int,
    cefr_level text,
    vocabulary_items jsonb,
    comprehension_questions jsonb,
    summary text,
    processed boolean DEFAULT false,
    processed_at timestamptz,
    UNIQUE(book_id, chapter_number)
);

-- ─── User Book Progress ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_book_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    book_id uuid REFERENCES books(id) ON DELETE CASCADE,
    current_chapter int DEFAULT 1,
    chapters_completed int DEFAULT 0,
    total_words_read int DEFAULT 0,
    total_words_tapped int DEFAULT 0,
    started_at timestamptz DEFAULT now(),
    last_read_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    UNIQUE(user_id, book_id)
);

-- ─── User Chapter Progress ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_chapter_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    chapter_id uuid REFERENCES book_chapters(id) ON DELETE CASCADE,
    book_id uuid REFERENCES books(id) ON DELETE CASCADE,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    words_tapped int DEFAULT 0,
    comprehension_score int,
    xp_earned int DEFAULT 0,
    UNIQUE(user_id, chapter_id)
);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_book_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chapter_progress ENABLE ROW LEVEL SECURITY;

-- Books & chapters: read-only for authenticated
CREATE POLICY "Authenticated read books"
    ON books FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read chapters"
    ON book_chapters FOR SELECT TO authenticated USING (true);

-- Progress: users own their rows
CREATE POLICY "Users read own book progress"
    ON user_book_progress FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own book progress"
    ON user_book_progress FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own book progress"
    ON user_book_progress FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users read own chapter progress"
    ON user_chapter_progress FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own chapter progress"
    ON user_chapter_progress FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own chapter progress"
    ON user_chapter_progress FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_books_lookup ON books(language_id, cefr_level, book_type);
CREATE INDEX IF NOT EXISTS idx_books_gutenberg ON books(gutenberg_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book ON book_chapters(book_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_chapters_processed ON book_chapters(processed);
CREATE INDEX IF NOT EXISTS idx_user_book_progress ON user_book_progress(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_user_chapter_progress ON user_chapter_progress(user_id, chapter_id);
