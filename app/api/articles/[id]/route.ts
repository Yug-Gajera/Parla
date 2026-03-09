export const dynamic = "force-dynamic";
// ============================================================
// Parlova — Single Article API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const articleId = params.id;

        // Fetch full article
        const { data: article, error } = await (supabase as any)
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single();

        if (error || !article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Fetch user's progress
        const { data: progress } = await (supabase as any)
            .from('user_article_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('article_id', articleId)
            .maybeSingle();

        // Fetch user's vocabulary (to highlight known words)
        const { data: userVocab } = await (supabase as any)
            .from('user_vocabulary')
            .select('vocabulary_words(word, translation)')
            .eq('user_id', user.id)
            .eq('language_id', article.language_id);

        const knownWords = new Set(
            (userVocab || []).map((v: Record<string, unknown>) => {
                const vw = v.vocabulary_words as Record<string, unknown> | null;
                return vw?.word ? String(vw.word).toLowerCase() : '';
            }).filter(Boolean)
        );

        return NextResponse.json({
            success: true,
            article,
            progress: progress || null,
            known_words: Array.from(knownWords),
        });
    } catch (error) {
        console.error('[articles/id] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
