// ============================================================
// FluentLoop — Supabase Database Types
// ============================================================
//
// This is a placeholder that will be replaced with auto-generated
// types once you run:
//   npx supabase gen types typescript --project-id <ref> > types/database.ts
//
// For now it provides the minimal structure so TypeScript is happy.
// ============================================================

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string | null;
                    avatar_url: string | null;
                    native_language: string;
                    guided_scenarios_completed: number;
                    conversation_unlocked: boolean;
                    guided_scenario_progress: Json;
                    has_seen_tour: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    native_language?: string;
                    guided_scenarios_completed?: number;
                    conversation_unlocked?: boolean;
                    guided_scenario_progress?: Json;
                    has_seen_tour?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    native_language?: string;
                    guided_scenarios_completed?: number;
                    conversation_unlocked?: boolean;
                    guided_scenario_progress?: Json;
                    has_seen_tour?: boolean;
                    updated_at?: string;
                };
            };
            user_settings: {
                Row: {
                    id: string;
                    user_id: string;
                    daily_goal_minutes: number;
                    notification_enabled: boolean;
                    preferred_content_types: string[];
                    guided_learning_enabled: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    daily_goal_minutes?: number;
                    notification_enabled?: boolean;
                    preferred_content_types?: string[];
                    guided_learning_enabled?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    daily_goal_minutes?: number;
                    notification_enabled?: boolean;
                    preferred_content_types?: string[];
                    guided_learning_enabled?: boolean;
                    updated_at?: string;
                };
            };
            languages: {
                Row: {
                    id: string;
                    code: string;
                    name: string;
                    flag_emoji: string | null;
                    is_available: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    code: string;
                    name: string;
                    flag_emoji?: string | null;
                    is_available?: boolean;
                    created_at?: string;
                };
                Update: {
                    code?: string;
                    name?: string;
                    flag_emoji?: string | null;
                    is_available?: boolean;
                };
            };
            user_languages: {
                Row: {
                    id: string;
                    user_id: string;
                    language_id: string;
                    current_level: string;
                    level_score: number;
                    total_study_minutes: number;
                    streak_days: number;
                    last_study_date: string | null;
                    started_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    language_id: string;
                    current_level?: string;
                    level_score?: number;
                    total_study_minutes?: number;
                    streak_days?: number;
                    last_study_date?: string | null;
                    started_at?: string;
                };
                Update: {
                    current_level?: string;
                    level_score?: number;
                    total_study_minutes?: number;
                    streak_days?: number;
                    last_study_date?: string | null;
                };
            };
            vocabulary_words: {
                Row: {
                    id: string;
                    language_id: string;
                    word: string;
                    translation: string;
                    pronunciation: string | null;
                    part_of_speech: string | null;
                    frequency_rank: number | null;
                    cefr_level: string | null;
                    example_sentence: string | null;
                    example_translation: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    language_id: string;
                    word: string;
                    translation: string;
                    pronunciation?: string | null;
                    part_of_speech?: string | null;
                    frequency_rank?: number | null;
                    cefr_level?: string | null;
                    example_sentence?: string | null;
                    example_translation?: string | null;
                    created_at?: string;
                };
                Update: {
                    word?: string;
                    translation?: string;
                    pronunciation?: string | null;
                    part_of_speech?: string | null;
                    frequency_rank?: number | null;
                    cefr_level?: string | null;
                    example_sentence?: string | null;
                    example_translation?: string | null;
                };
            };
            user_vocabulary: {
                Row: {
                    id: string;
                    user_id: string;
                    word_id: string;
                    status: string;
                    ease_factor: number;
                    interval_days: number;
                    next_review_date: string;
                    times_seen: number;
                    times_correct: number;
                    added_at: string;
                    last_reviewed_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    word_id: string;
                    status?: string;
                    ease_factor?: number;
                    interval_days?: number;
                    next_review_date?: string;
                    times_seen?: number;
                    times_correct?: number;
                    added_at?: string;
                    last_reviewed_at?: string | null;
                };
                Update: {
                    status?: string;
                    ease_factor?: number;
                    interval_days?: number;
                    next_review_date?: string;
                    times_seen?: number;
                    times_correct?: number;
                    last_reviewed_at?: string | null;
                };
            };
            conversation_sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    language_id: string;
                    scenario_type: string | null;
                    scenario_name: string | null;
                    mode: string | null;
                    duration_seconds: number;
                    messages: Json;
                    pronunciation_score: number | null;
                    grammar_score: number | null;
                    vocabulary_score: number | null;
                    naturalness_score: number | null;
                    goal_completed: boolean;
                    feedback: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    language_id: string;
                    scenario_type?: string | null;
                    scenario_name?: string | null;
                    mode?: string | null;
                    duration_seconds?: number;
                    messages?: Json;
                    pronunciation_score?: number | null;
                    grammar_score?: number | null;
                    vocabulary_score?: number | null;
                    naturalness_score?: number | null;
                    goal_completed?: boolean;
                    feedback?: Json | null;
                    created_at?: string;
                };
                Update: {
                    scenario_type?: string | null;
                    scenario_name?: string | null;
                    mode?: string | null;
                    duration_seconds?: number;
                    messages?: Json;
                    pronunciation_score?: number | null;
                    grammar_score?: number | null;
                    vocabulary_score?: number | null;
                    naturalness_score?: number | null;
                    goal_completed?: boolean;
                    feedback?: Json | null;
                };
            };
            level_tests: {
                Row: {
                    id: string;
                    user_id: string;
                    language_id: string;
                    level_tested: string;
                    reading_score: number | null;
                    listening_score: number | null;
                    speaking_score: number | null;
                    writing_score: number | null;
                    vocabulary_score: number | null;
                    overall_score: number | null;
                    passed: boolean;
                    detailed_results: Json | null;
                    taken_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    language_id: string;
                    level_tested: string;
                    reading_score?: number | null;
                    listening_score?: number | null;
                    speaking_score?: number | null;
                    writing_score?: number | null;
                    vocabulary_score?: number | null;
                    overall_score?: number | null;
                    passed?: boolean;
                    detailed_results?: Json | null;
                    taken_at?: string;
                };
                Update: {
                    level_tested?: string;
                    reading_score?: number | null;
                    listening_score?: number | null;
                    speaking_score?: number | null;
                    writing_score?: number | null;
                    vocabulary_score?: number | null;
                    overall_score?: number | null;
                    passed?: boolean;
                    detailed_results?: Json | null;
                };
            };
            certificates: {
                Row: {
                    id: string;
                    user_id: string;
                    language_id: string;
                    level_achieved: string;
                    verification_code: string;
                    issued_at: string;
                    stripe_payment_id: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    language_id: string;
                    level_achieved: string;
                    verification_code?: string;
                    issued_at?: string;
                    stripe_payment_id?: string | null;
                };
                Update: {
                    level_achieved?: string;
                    stripe_payment_id?: string | null;
                };
            };
            leaderboard_entries: {
                Row: {
                    id: string;
                    user_id: string;
                    language_id: string;
                    level_band: string | null;
                    weekly_score: number;
                    total_score: number;
                    week_start_date: string | null;
                    conversation_count: number;
                    vocabulary_learned: number;
                    content_consumed_minutes: number;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    language_id: string;
                    level_band?: string | null;
                    weekly_score?: number;
                    total_score?: number;
                    week_start_date?: string | null;
                    conversation_count?: number;
                    vocabulary_learned?: number;
                    content_consumed_minutes?: number;
                };
                Update: {
                    level_band?: string | null;
                    weekly_score?: number;
                    total_score?: number;
                    week_start_date?: string | null;
                    conversation_count?: number;
                    vocabulary_learned?: number;
                    content_consumed_minutes?: number;
                };
            };
            study_sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    language_id: string;
                    session_type: string | null;
                    duration_minutes: number;
                    xp_earned: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    language_id: string;
                    session_type?: string | null;
                    duration_minutes?: number;
                    xp_earned?: number;
                    created_at?: string;
                };
                Update: {
                    session_type?: string | null;
                    duration_minutes?: number;
                    xp_earned?: number;
                };
            };
            guided_scenario_attempts: {
                Row: {
                    id: string;
                    user_id: string;
                    scenario_id: string;
                    phase: number;
                    turn_number: number | null;
                    target_text: string | null;
                    spoken_text: string | null;
                    score: number | null;
                    passed: boolean | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    scenario_id: string;
                    phase: number;
                    turn_number?: number | null;
                    target_text?: string | null;
                    spoken_text?: string | null;
                    score?: number | null;
                    passed?: boolean | null;
                    created_at?: string;
                };
                Update: {
                    scenario_id?: string;
                    phase?: number;
                    turn_number?: number | null;
                    target_text?: string | null;
                    spoken_text?: string | null;
                    score?: number | null;
                    passed?: boolean | null;
                };
            };
            guided_phase4_content: {
                Row: {
                    id: string;
                    scenario_id: string;
                    content: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    scenario_id: string;
                    content: Json;
                    created_at?: string;
                };
                Update: {
                    scenario_id?: string;
                    content?: Json;
                };
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
    };
}
