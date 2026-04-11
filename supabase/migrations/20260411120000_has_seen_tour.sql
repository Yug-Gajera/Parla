-- ============================================================
-- Parlova — Add has_seen_tour column to users table
-- ============================================================

-- Add has_seen_tour boolean column to track if user has completed onboarding tour
alter table users add column if not exists has_seen_tour boolean default false;