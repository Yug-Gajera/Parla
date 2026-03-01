// ============================================================
// FluentLoop — Type Definitions
// ============================================================

// ─── Enums ──────────────────────────────────────────────────

export enum CEFRLevel {
    A1 = 'A1',
    A2 = 'A2',
    B1 = 'B1',
    B2 = 'B2',
    C1 = 'C1',
    C2 = 'C2',
}

export enum LanguageCode {
    ES = 'es',
    FR = 'fr',
    ZH = 'zh',
    JA = 'ja',
    PT = 'pt',
    DE = 'de',
}

export enum VocabularyStatus {
    New = 'new',
    Learning = 'learning',
    Familiar = 'familiar',
    Mastered = 'mastered',
}

export enum SessionType {
    Conversation = 'conversation',
    Vocabulary = 'vocabulary',
    Content = 'content',
    Test = 'test',
}

export enum ConversationMode {
    Voice = 'voice',
    Text = 'text',
}

export enum ScenarioType {
    Restaurant = 'restaurant',
    Market = 'market',
    CustomerService = 'customer_service',
    JobInterview = 'job_interview',
    Neighbor = 'neighbor',
    Date = 'date',
    Doctor = 'doctor',
    FreeTalk = 'free_talk',
}

// ─── Entity Types (mirror database schema) ──────────────────

export interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    native_language: string;
    created_at: string;
    updated_at: string;
}

export interface UserSettings {
    id: string;
    user_id: string;
    daily_goal_minutes: number;
    notification_enabled: boolean;
    preferred_content_types: string[];
    created_at: string;
    updated_at: string;
}

export interface Language {
    id: string;
    code: string;
    name: string;
    flag_emoji: string | null;
    is_available: boolean;
    created_at: string;
}

export interface UserLanguage {
    id: string;
    user_id: string;
    language_id: string;
    current_level: CEFRLevel;
    level_score: number;
    total_study_minutes: number;
    streak_days: number;
    last_study_date: string | null;
    started_at: string;
}

export interface VocabularyWord {
    id: string;
    language_id: string;
    word: string;
    translation: string;
    pronunciation: string | null;
    part_of_speech: string | null;
    frequency_rank: number | null;
    cefr_level: CEFRLevel | null;
    example_sentence: string | null;
    example_translation: string | null;
    created_at: string;
}

export interface UserVocabulary {
    id: string;
    user_id: string;
    word_id: string;
    status: VocabularyStatus;
    ease_factor: number;
    interval_days: number;
    next_review_date: string;
    times_seen: number;
    times_correct: number;
    added_at: string;
    last_reviewed_at: string | null;
}

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    audio_url?: string;
}

export interface ConversationFeedback {
    summary: string;
    strengths: string[];
    improvements: string[];
    suggested_vocabulary: string[];
    grammar_notes: string[];
}

export interface ConversationSession {
    id: string;
    user_id: string;
    language_id: string;
    scenario_type: ScenarioType | null;
    scenario_name: string | null;
    mode: ConversationMode | null;
    duration_seconds: number;
    messages: ConversationMessage[];
    pronunciation_score: number | null;
    grammar_score: number | null;
    vocabulary_score: number | null;
    naturalness_score: number | null;
    goal_completed: boolean;
    feedback: ConversationFeedback | null;
    created_at: string;
}

export interface LevelTest {
    id: string;
    user_id: string;
    language_id: string;
    level_tested: CEFRLevel;
    reading_score: number | null;
    listening_score: number | null;
    speaking_score: number | null;
    writing_score: number | null;
    vocabulary_score: number | null;
    overall_score: number | null;
    passed: boolean;
    detailed_results: Record<string, unknown> | null;
    taken_at: string;
}

export interface Certificate {
    id: string;
    user_id: string;
    language_id: string;
    level_achieved: CEFRLevel;
    verification_code: string;
    issued_at: string;
    stripe_payment_id: string | null;
}

export interface LeaderboardEntry {
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
}

export interface StudySession {
    id: string;
    user_id: string;
    language_id: string;
    session_type: SessionType | null;
    duration_minutes: number;
    xp_earned: number;
    created_at: string;
}

// ─── API Response Types ─────────────────────────────────────

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}

export interface DiagnosticQuestion {
    id: string;
    question: string;
    options: string[];
    correct_answer: string;
    level: CEFRLevel;
    explanation: string;
}

export interface DiagnosticResult {
    assessed_level: CEFRLevel;
    score: number;
    breakdown: Record<CEFRLevel, number>;
}

export interface ConversationScore {
    pronunciation: number;
    grammar: number;
    vocabulary: number;
    naturalness: number;
    goal_completed: boolean;
    overall: number;
}

export interface WeeklyStats {
    sessions: number;
    words_learned: number;
    minutes_studied: number;
    streak: number;
}

// ─── Component Prop Types ───────────────────────────────────

export interface LevelBadgeProps {
    level: CEFRLevel;
    size?: 'sm' | 'md' | 'lg';
}

export interface LanguageBadgeProps {
    language: Language;
    showName?: boolean;
}

export interface GoalProgressProps {
    current: number;
    goal: number;
    label?: string;
}

export interface WeeklyStatsProps {
    stats: WeeklyStats;
    loading?: boolean;
}

export interface QuickActionProps {
    icon: React.ReactNode;
    label: string;
    description?: string;
    onClick: () => void;
    disabled?: boolean;
}
