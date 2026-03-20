    -- ============================================================
    -- 010: Language Waitlist
    -- ============================================================

    CREATE TABLE IF NOT EXISTS language_waitlist (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        language TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(email, language)
    );

    -- Allow anonymous inserts (no auth needed — this is on the landing page)
    ALTER TABLE language_waitlist ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Anyone can join the waitlist"
        ON language_waitlist
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);

    -- Only service role can read waitlist entries
    CREATE POLICY "Service role can read waitlist"
        ON language_waitlist
        FOR SELECT
        TO service_role
        USING (true);
