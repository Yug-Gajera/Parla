export const dynamic = "force-dynamic";
// ============================================================
// Parlova — Story Progress API (3 questions, 25+10 XP)
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

        const storyId = params.id;
        const body = await req.json();
        const { completed, answers, words_tapped } = body;

        const progressData: Record<string, unknown> = {
            user_id: user.id,
            story_id: storyId,
        };

        if (words_tapped !== undefined) {
            progressData.words_tapped = words_tapped;
        }

        if (completed && answers) {
            const { data: story } = await (supabase as any)
                .from('generated_stories')
                .select('comprehension_questions, language_id')
                .eq('id', storyId)
                .single();

            if (!story) {
                return NextResponse.json({ error: 'Story not found' }, { status: 404 });
            }

            const questions = story.comprehension_questions || [];
            let correct = 0;
            const total = Math.min(answers.length, questions.length);

            for (let i = 0; i < total; i++) {
                if (answers[i] === questions[i].correct) correct++;
            }

            const score = total > 0 ? Math.round((correct / total) * 100) : 0;
            const xpEarned = 25 + (score >= 70 ? 10 : 0);

            progressData.completed_at = new Date().toISOString();
            progressData.comprehension_score = score;
            progressData.xp_earned = xpEarned;

            const { error: progressError } = await (supabase as any)
                .from('user_story_progress')
                .upsert(progressData, { onConflict: 'user_id,story_id' });

            if (progressError) {
                console.error('[story/progress] Upsert error:', progressError);
                return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
            }

            // Study session record
            if (story.language_id) {
                await (supabase as any)
                    .from('study_sessions')
                    .insert({
                        user_id: user.id,
                        language_id: story.language_id,
                        session_type: 'story',
                        duration_seconds: 0,
                        xp_earned: xpEarned,
                        accuracy_score: score,
                    });
            }

            return NextResponse.json({
                score, correct, total, xp_earned: xpEarned,
                message: score >= 70
                    ? '🎉 Great reading! Bonus XP earned!'
                    : '📖 Good effort! Try another story.',
            });
        }

        // Simple progress update
        const { error: progressError } = await (supabase as any)
            .from('user_story_progress')
            .upsert(progressData, { onConflict: 'user_id,story_id' });

        if (progressError) {
            return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[story/progress] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
