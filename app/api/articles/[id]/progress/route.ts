// ============================================================
// Parlova — Article Progress API (3 questions, 30+15 XP)
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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
        const body = await req.json();
        const { words_tapped, completed, answers } = body;

        // Upsert progress
        const progressData: Record<string, unknown> = {
            user_id: user.id,
            article_id: articleId,
        };

        if (words_tapped !== undefined) {
            progressData.words_tapped = words_tapped;
        }

        if (completed && answers) {
            // Get article to check answers
            const { data: article } = await (supabase as any)
                .from('articles')
                .select('comprehension_questions')
                .eq('id', articleId)
                .single();

            if (!article) {
                return NextResponse.json({ error: 'Article not found' }, { status: 404 });
            }

            const questions = article.comprehension_questions || [];
            let correct = 0;
            const total = Math.min(answers.length, questions.length);

            for (let i = 0; i < total; i++) {
                if (answers[i] === questions[i].correct) {
                    correct++;
                }
            }

            const score = total > 0 ? Math.round((correct / total) * 100) : 0;

            // XP: 30 base + 15 bonus if score >= 70%
            const xpEarned = 30 + (score >= 70 ? 15 : 0);

            progressData.completed_at = new Date().toISOString();
            progressData.questions_answered = total;
            progressData.questions_correct = correct;
            progressData.comprehension_score = score;
            progressData.xp_earned = xpEarned;

            // Upsert progress 
            const { error: progressError } = await (supabase as any)
                .from('user_article_progress')
                .upsert(progressData, { onConflict: 'user_id,article_id' });

            if (progressError) {
                console.error('[progress] Upsert error:', progressError);
                return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
            }

            // Create study session record
            // Get language from article
            const { data: fullArticle } = await (supabase as any)
                .from('articles')
                .select('language_id')
                .eq('id', articleId)
                .single();

            if (fullArticle?.language_id) {
                await (supabase as any)
                    .from('study_sessions')
                    .insert({
                        user_id: user.id,
                        language_id: fullArticle.language_id,
                        session_type: 'reading',
                        duration_seconds: 0,
                        xp_earned: xpEarned,
                        accuracy_score: score,
                    });
            }

            return NextResponse.json({
                score,
                correct,
                total,
                xp_earned: xpEarned,
                message: score >= 70
                    ? '🎉 Great comprehension! You earned bonus XP!'
                    : '📚 Good effort! Keep reading to improve.',
            });
        }

        // Simple progress update (no completion)
        const { error: progressError } = await (supabase as any)
            .from('user_article_progress')
            .upsert(progressData, { onConflict: 'user_id,article_id' });

        if (progressError) {
            console.error('[progress] Upsert error:', progressError);
            return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[progress] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
