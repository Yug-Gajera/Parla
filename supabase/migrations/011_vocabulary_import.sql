-- 011_vocabulary_import.sql
-- Adds columns to track vocabulary import sources, intervals, and seed logic

-- Add check constraint for import_source on user_vocabulary if it doesn't exist
ALTER TABLE user_vocabulary 
ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'content_encounter',
ADD COLUMN IF NOT EXISTS anki_interval INTEGER NULL,
ADD COLUMN IF NOT EXISTS is_frequency_seeded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ NULL;

-- Make sure the constraint exists properly
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_import_source' AND conrelid = 'user_vocabulary'::regclass
    ) THEN
        ALTER TABLE user_vocabulary 
        ADD CONSTRAINT valid_import_source CHECK (import_source IN (
            'manual',
            'anki_import', 
            'paste_import',
            'frequency_seed',
            'content_encounter'
        ));
    END IF;
END $$;

-- Add tracking columns to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS vocabulary_import_method TEXT NULL,
ADD COLUMN IF NOT EXISTS vocabulary_import_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_level_from_import TEXT NULL;
