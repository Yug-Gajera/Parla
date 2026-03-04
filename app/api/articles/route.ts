// ============================================================
// FluentLoop — Articles List API (15 per page)
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function getAdjacentLevels(level: string): string[] {
    const idx = LEVEL_ORDER.indexOf(level);
    if (idx < 0) return LEVEL_ORDER;
    const levels = [level];
    if (idx > 0) levels.push(LEVEL_ORDER[idx - 1]);
    return levels;
}

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const languageId = searchParams.get('language_id');
        const levelParam = searchParams.get('level');
        const topic = searchParams.get('topic');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '15');

        if (!languageId) {
            return NextResponse.json({ error: 'Missing language_id' }, { status: 400 });
        }

        // Get user's current level
        const { data: userLang } = await (supabase as any)
            .from('user_languages')
            .select('current_level')
            .eq('user_id', user.id)
            .eq('language_id', languageId)
            .single();
        const userLevel = userLang?.current_level || 'B1';

        // Determine which levels to show
        let targetLevels: string[];
        const level = levelParam || userLevel;

        if (level === 'all') {
            targetLevels = LEVEL_ORDER;
        } else if (level === 'easier') {
            const idx = LEVEL_ORDER.indexOf(userLevel);
            targetLevels = LEVEL_ORDER.slice(0, Math.max(idx, 1));
        } else if (level === 'harder') {
            const idx = LEVEL_ORDER.indexOf(userLevel);
            targetLevels = LEVEL_ORDER.slice(idx + 1);
        } else {
            // User's level + one below
            targetLevels = getAdjacentLevels(level);
        }

        const offset = (page - 1) * limit;

        // Build query — exclude completed articles, order by incomplete first then by date
        let query = (supabase as any)
            .from('articles')
            .select('id, title, summary, source_name, cefr_level, topics, published_at, image_url, estimated_read_minutes, word_count', { count: 'exact' })
            .eq('language_id', languageId)
            .eq('processed', true)
            .in('cefr_level', targetLevels)
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (topic && topic !== 'all') {
            query = query.contains('topics', [topic]);
        }

        const { data: articles, count, error } = await query;

        if (error) {
            console.error('[articles] Query error:', error);
            return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
        }

        // Get user's progress for these articles 
        const articleIds = (articles || []).map((a: { id: string }) => a.id);
        const { data: progressData } = await (supabase as any)
            .from('user_article_progress')
            .select('article_id, completed_at, comprehension_score, started_at')
            .eq('user_id', user.id)
            .in('article_id', articleIds);

        const progressMap = new Map(
            (progressData || []).map((p: Record<string, unknown>) => [p.article_id, p])
        );

        const enrichedArticles = (articles || []).map((a: Record<string, unknown>) => ({
            ...a,
            user_progress: progressMap.get(a.id) || null,
        }));

        return NextResponse.json({
            articles: enrichedArticles,
            total: count || 0,
            page,
            hasMore: offset + limit < (count || 0),
        });
    } catch (error) {
        console.error('[articles] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
