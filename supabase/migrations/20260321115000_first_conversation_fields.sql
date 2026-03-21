-- Migration to add first conversation tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_first_conversation BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_conversation_completed_at TIMESTAMPTZ NULL;
