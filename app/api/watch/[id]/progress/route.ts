// POST /api/watch/[id]/progress — Video completion + XP
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient(accessToken: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { createClient: createServerClient } = await import('@/lib/supabase/server');
        const serverSupabase = await createServerClient();
        const { data: { session } } = await serverSupabase.auth.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user;
        const supabase = getSupabaseClient(session.access_token);
        const videoId = params.id;
        const { watch_time_seconds, completed, answers, words_tapped } = await req.json();

        // Fetch video for comprehension questions
        const { data: video } = await supabase
            .from('videos')
            .select('comprehension_questions')
            .eq('id', videoId)
            .single();

        // Score comprehension
        const questions = ((video as any)?.comprehension_questions || []) as { correct: number }[];
        let correct = 0;
        const total = questions.length;

        if (answers?.length > 0) {
            for (let i = 0; i < Math.min(answers.length, total); i++) {
                if (answers[i] === questions[i]?.correct) correct++;
            }
        }

        const score = total > 0 ? Math.round((correct / total) * 100) : 0;
        let xpEarned = 40;
        if (score >= 70) xpEarned += 20;

        // Upsert progress
        await supabase
            .from('user_video_progress')
            .upsert({
                user_id: user.id,
                video_id: videoId,
                watch_time_seconds: watch_time_seconds || 0,
                completed: completed || false,
                completed_at: completed ? new Date().toISOString() : null,
                words_tapped: words_tapped || 0,
                comprehension_score: score,
                xp_earned: xpEarned,
            } as any, { onConflict: 'user_id,video_id' });

        // Study session
        const { data: userLang } = await supabase
            .from('user_languages')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (userLang) {
            await supabase.from('study_sessions').insert({
                user_id: user.id,
                user_language_id: (userLang as any).id,
                session_type: 'video_watching',
                xp_earned: xpEarned,
                duration_seconds: watch_time_seconds || 0,
                metadata: { video_id: videoId, score, words_tapped: words_tapped || 0 },
            } as any);
        }

        return NextResponse.json({
            score, correct, total, xp_earned: xpEarned,
            message: score >= 70 ? `Great comprehension! +${xpEarned} XP` : `Video done. +${xpEarned} XP`,
        });
    } catch (error) {
        console.error('[watch progress] Error:', error);
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }
}

// GET: fetch single video with transcript
export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { createClient: createServerClient } = await import('@/lib/supabase/server');
        const serverSupabase = await createServerClient();
        const { data: { session } } = await serverSupabase.auth.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseClient(session.access_token);
        const { data: video } = await supabase
            .from('videos')
            .select('*')
            .eq('id', params.id)
            .single();

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        // Increment views
        await supabase
            .from('videos')
            .update({ total_views: ((video as any).total_views || 0) + 1 } as any)
            .eq('id', params.id);

        // User progress
        const { data: progress } = await supabase
            .from('user_video_progress')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('video_id', params.id)
            .single();

        return NextResponse.json({ video, user_progress: progress || null });
    } catch (error) {
        console.error('[watch/id] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
    }
}
