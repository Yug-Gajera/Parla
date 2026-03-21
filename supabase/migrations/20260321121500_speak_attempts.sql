CREATE TABLE IF NOT EXISTS speak_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  target_text TEXT NOT NULL,
  spoken_text TEXT,
  score INTEGER,
  feedback_level TEXT,
  attempt_number INTEGER DEFAULT 1,
  skipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for speak_attempts
ALTER TABLE speak_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own speak attempts"
    ON speak_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own speak attempts"
    ON speak_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own speak attempts"
    ON speak_attempts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own speak attempts"
    ON speak_attempts FOR DELETE
    USING (auth.uid() = user_id);

-- Add speak_to_reply to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS speak_to_reply BOOLEAN DEFAULT true;
