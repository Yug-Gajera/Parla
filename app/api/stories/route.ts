// ============================================================
// FluentLoop — Stories Browse API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const languageId = searchParams.get('language_id');
        const topicCategory = searchParams.get('topic_category');
        const contentType = searchParams.get('content_type');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');

        if (!languageId) {
            return NextResponse.json({ error: 'Missing language_id' }, { status: 400 });
        }

        // Get user's level
        const { data: userLang } = await (supabase as any)
            .from('user_languages')
            .select('current_level')
            .eq('user_id', user.id)
            .eq('language_id', languageId)
            .single();
        const userLevel = userLang?.current_level || 'B1';

        const offset = (page - 1) * limit;

        let query = (supabase as any)
            .from('generated_stories')
            .select('id, title, content_type, topic, topic_category, cefr_level, word_count, summary, times_read, generated_at', { count: 'exact' })
            .eq('language_id', languageId)
            .eq('cefr_level', userLevel)
            .order('times_read', { ascending: false })
            .range(offset, offset + limit - 1);

        if (topicCategory && topicCategory !== 'all') {
            query = query.eq('topic_category', topicCategory);
        }
        if (contentType && contentType !== 'all') {
            query = query.eq('content_type', contentType);
        }

        const { data: stories, count, error } = await query;

        if (error) {
            console.error('[stories] Query error:', error);
            return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
        }

        // Get user's progress for these stories
        const storyIds = (stories || []).map((s: { id: string }) => s.id);
        const { data: progressData } = await (supabase as any)
            .from('user_story_progress')
            .select('story_id, completed_at, comprehension_score, started_at')
            .eq('user_id', user.id)
            .in('story_id', storyIds);

        const progressMap = new Map(
            (progressData || []).map((p: Record<string, unknown>) => [p.story_id, p])
        );

        // Exclude completed stories
        const enriched = (stories || [])
            .map((s: Record<string, unknown>) => ({
                ...s,
                user_progress: progressMap.get(s.id) || null,
            }))
            .filter((s: Record<string, unknown>) => {
                const progress = s.user_progress as { completed_at?: string } | null;
                return !progress?.completed_at;
            });

        return NextResponse.json({
            stories: enriched,
            total: count || 0,
            page,
            hasMore: offset + limit < (count || 0),
        });
    } catch (error) {
        console.error('[stories] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
