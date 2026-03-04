// POST /api/listen/[id]/progress — Episode completion + XP
// GET /api/listen/[id]/progress — Fetch single episode with transcript
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
        const episodeId = params.id;
        const { listen_time_seconds, completed, answers, words_tapped } = await req.json();

        // Fetch episode
        const { data: episode } = await supabase
            .from('podcast_episodes')
            .select('comprehension_questions')
            .eq('id', episodeId)
            .single();

        // Score comprehension
        const questions = ((episode as any)?.comprehension_questions || []) as { correct: number }[];
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

        await supabase
            .from('user_episode_progress')
            .upsert({
                user_id: user.id,
                episode_id: episodeId,
                listen_time_seconds: listen_time_seconds || 0,
                completed: completed || false,
                completed_at: completed ? new Date().toISOString() : null,
                words_tapped: words_tapped || 0,
                comprehension_score: score,
                xp_earned: xpEarned,
            } as any, { onConflict: 'user_id,episode_id' });

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
                session_type: 'podcast_listening',
                xp_earned: xpEarned,
                duration_seconds: listen_time_seconds || 0,
                metadata: { episode_id: episodeId, score, words_tapped: words_tapped || 0 },
            } as any);
        }

        return NextResponse.json({
            score, correct, total, xp_earned: xpEarned,
            message: score >= 70 ? `Great comprehension! +${xpEarned} XP` : `Episode done. +${xpEarned} XP`,
        });
    } catch (error) {
        console.error('[listen progress] Error:', error);
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }
}

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
        const { data: episode } = await supabase
            .from('podcast_episodes')
            .select('*')
            .eq('id', params.id)
            .single();

        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }

        // Get show info
        const { data: show } = await supabase
            .from('podcast_shows')
            .select('name, cover_color')
            .eq('id', (episode as any).show_id)
            .single();

        // User progress
        const { data: progress } = await supabase
            .from('user_episode_progress')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('episode_id', params.id)
            .single();

        return NextResponse.json({
            episode,
            show: show || null,
            user_progress: progress || null,
        });
    } catch (error) {
        console.error('[listen/id] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch episode' }, { status: 500 });
    }
}
