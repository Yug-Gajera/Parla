-- Guided Phrase Learning Schema Additions

-- Update users table
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS guided_scenarios_completed INTEGER DEFAULT 0;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS conversation_unlocked BOOLEAN DEFAULT false;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS guided_scenario_progress JSONB DEFAULT '{}'::jsonb;

-- Or if the app uses a custom public.users table (looks like it does based on types):
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS guided_scenarios_completed INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS conversation_unlocked BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS guided_scenario_progress JSONB DEFAULT '{}'::jsonb;

-- Add setting to user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS guided_learning_enabled BOOLEAN DEFAULT true;

-- Create guided_scenario_attempts table
CREATE TABLE IF NOT EXISTS public.guided_scenario_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    scenario_id TEXT NOT NULL,
    phase INTEGER NOT NULL,
    turn_number INTEGER,
    target_text TEXT,
    spoken_text TEXT,
    score INTEGER,
    passed BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new table
ALTER TABLE public.guided_scenario_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own scenario attempts." ON public.guided_scenario_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own scenario attempts." ON public.guided_scenario_attempts
    FOR SELECT USING (auth.uid() = user_id);
