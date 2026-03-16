-- 012_dashboard_vocab_import.sql
-- Adds timestamp to track the last time a user imported vocabulary from the dashboard

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_vocabulary_import TIMESTAMPTZ NULL;
