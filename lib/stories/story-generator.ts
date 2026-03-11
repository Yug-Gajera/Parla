// ============================================================
// Parlova — Story Generation Service (Cost-Optimized)
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { STORY_GENERATION_PROMPT } from '@/lib/claude/prompts';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const DAILY_LIMIT = 3;

function getServiceClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export interface GeneratedStory {
    id: string;
    language_id: string;
    content_type: string;
    topic: string;
    topic_category: string;
    title: string;
    content: string;
    word_count: number;
    cefr_level: string;
    vocabulary_items: unknown[];
    comprehension_questions: unknown[];
    summary: string;
    generated_at: string;
    times_read: number;
}

/**
 * Check if user has reached daily generation limit (3/day).
 * Enforced SERVER SIDE — cannot be bypassed by client.
 */
export async function checkDailyLimit(userId: string): Promise<{ canGenerate: boolean; count: number }> {
    const supabase = getServiceClient();
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
        .from('user_daily_generation_count')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    const count = data?.count || 0;
    return { canGenerate: count < DAILY_LIMIT, count };
}

/**
 * Increment daily generation count.
 * Uses service role (RLS blocks client writes on this table).
 */
export async function incrementDailyCount(userId: string): Promise<void> {
    const supabase = getServiceClient();
    const today = new Date().toISOString().split('T')[0];

    // Try update first
    const { data: existing } = await supabase
        .from('user_daily_generation_count')
        .select('id, count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    if (existing) {
        await supabase
            .from('user_daily_generation_count')
            .update({ count: existing.count + 1 })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('user_daily_generation_count')
            .insert({ user_id: userId, date: today, count: 1 });
    }
}

/**
 * Find an existing story matching the criteria.
 * Uses the compound index: (language_id, cefr_level, topic_category, content_type).
 *
 * Strategy:
 * 1. Exact match on all 5 params → return it
 * 2. Same category + level + type (different topic) → return it
 *    (close enough — user gets a valid story for free)
 * 3. Nothing → return null (needs generation)
 */
export async function findExistingStory(
    languageId: string,
    level: string,
    topicCategory: string,
    topic: string,
    contentType: string
): Promise<GeneratedStory | null> {
    const supabase = getServiceClient();

    // Try exact match first
    const { data: exact } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('language_id', languageId)
        .eq('cefr_level', level)
        .eq('topic_category', topicCategory)
        .eq('topic', topic)
        .eq('content_type', contentType)
        .limit(1)
        .single();

    if (exact) return exact as GeneratedStory;

    // Fallback: same category + level + type, different topic
    const { data: similar } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('language_id', languageId)
        .eq('cefr_level', level)
        .eq('topic_category', topicCategory)
        .eq('content_type', contentType)
        .order('times_read', { ascending: false })
        .limit(1)
        .single();

    if (similar) return similar as GeneratedStory;

    return null;
}

/**
 * Generate a new story using Claude Haiku.
 * max_tokens: 1200 (enough for 400-word story + JSON structure).
 */
export async function generateNewStory(
    languageId: string,
    level: string,
    topic: string,
    topicCategory: string,
    contentType: string
): Promise<GeneratedStory> {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const typeLabels: Record<string, string> = {
        short_story: 'short story',
        dialogue: 'dialogue between 2 people',
        letter: 'personal letter or email',
        journal: 'diary/journal entry',
    };

    const userMessage = `Write a ${typeLabels[contentType] || contentType} in Spanish at ${level} level about: ${topic} (category: ${topicCategory}). Maximum 400 words.`;

    const response = await anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 2500,
        system: STORY_GENERATION_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text in Claude response');
    }

    let rawText = textBlock.text;
    rawText = rawText.replace(/```json\n?|\n?```/g, '').trim();

    let analysis;
    try {
        analysis = JSON.parse(rawText);
    } catch {
        console.error('[StoryGen] JSON parse failed:', rawText.slice(0, 300));
        throw new Error('Claude returned invalid JSON — story generation failed');
    }

    const supabase = getServiceClient();

    const storyData = {
        language_id: languageId,
        content_type: contentType,
        topic,
        topic_category: topicCategory,
        title: analysis.title || 'Sin título',
        content: analysis.content || '',
        word_count: analysis.word_count || analysis.content?.split(/\s+/).length || 0,
        cefr_level: level,
        vocabulary_items: (analysis.vocabulary_items || []).slice(0, 5),
        comprehension_questions: (analysis.comprehension_questions || []).slice(0, 3),
        summary: analysis.summary || '',
        times_read: 0,
    };

    const { data: inserted, error } = await supabase
        .from('generated_stories')
        .insert(storyData)
        .select()
        .single();

    if (error) {
        console.error('[StoryGen] Insert error:', error);
        throw new Error('Failed to store generated story');
    }

    return inserted as GeneratedStory;
}

/**
 * Main entry point: get a story (existing or newly generated).
 * Enforces daily limit server-side.
 */
export async function getStory(
    userId: string,
    languageId: string,
    level: string,
    topic: string,
    topicCategory: string,
    contentType: string
): Promise<{ story: GeneratedStory; wasGenerated: boolean; dailyRemaining: number }> {
    const supabase = getServiceClient();

    // 1. Try to find existing story first (free — no Claude call)
    const existing = await findExistingStory(languageId, level, topicCategory, topic, contentType);

    if (existing) {
        // Increment times_read
        await supabase
            .from('generated_stories')
            .update({ times_read: existing.times_read + 1 })
            .eq('id', existing.id);

        const { count } = await checkDailyLimit(userId);
        return {
            story: { ...existing, times_read: existing.times_read + 1 },
            wasGenerated: false,
            dailyRemaining: DAILY_LIMIT - count,
        };
    }

    // 2. No existing story — need to generate. Check daily limit.
    const { canGenerate, count } = await checkDailyLimit(userId);

    if (!canGenerate) {
        throw new Error('DAILY_LIMIT_REACHED');
    }

    // 3. Generate new story
    const story = await generateNewStory(languageId, level, topic, topicCategory, contentType);

    // 4. Increment daily count
    await incrementDailyCount(userId);

    return {
        story,
        wasGenerated: true,
        dailyRemaining: DAILY_LIMIT - (count + 1),
    };
}
