-- Migration to create guided_phase4_content caching table

CREATE TABLE IF NOT EXISTS public.guided_phase4_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.guided_phase4_content ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and insert
CREATE POLICY "Authenticated users can read phase4 content"
  ON public.guided_phase4_content
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert phase4 content"
  ON public.guided_phase4_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role can manage phase4 content"
  ON public.guided_phase4_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
