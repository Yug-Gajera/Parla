-- ============================================================
-- Migration 009: Voice Conversations
-- Adds voice input support to conversation sessions
-- ============================================================

-- Add voice-related columns to conversation_sessions
ALTER TABLE conversation_sessions
ADD COLUMN IF NOT EXISTS input_mode text DEFAULT 'voice',
ADD COLUMN IF NOT EXISTS pronunciation_score int,
ADD COLUMN IF NOT EXISTS transcription_data jsonb DEFAULT '[]'::jsonb;

-- transcription_data stores per-message voice metadata:
-- [
--   {
--     "message_index": 0,
--     "spoken_text": "Quiero un café",
--     "transcription_confidence": 0.92,
--     "low_confidence_words": ["café"],
--     "used_whisper": false,
--     "recording_duration_seconds": 4.2
--   }
-- ]
