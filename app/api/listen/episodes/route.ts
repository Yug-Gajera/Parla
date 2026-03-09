export const dynamic = "force-dynamic";
// GET /api/listen/episodes — Browse podcast episodes
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient(accessToken: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
}

export async function GET(req: Request) {
    try {
        const { createClient: createServerClient } = await import('@/lib/supabase/server');
        const serverSupabase = await createServerClient();
        const { data: { session } } = await serverSupabase.auth.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user;
        const supabase = getSupabaseClient(session.access_token);
        const url = new URL(req.url);
        const showId = url.searchParams.get('show_id');
        const level = url.searchParams.get('level');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '12');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('podcast_episodes')
            .select('id, show_id, title, description, audio_url, duration_seconds, published_at, cefr_level, topics, processed, is_published, episode_number, season_number, created_at')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (showId) query = query.eq('show_id', showId);
        if (level) query = query.eq('cefr_level', level);

        const { data: episodes, error } = await query;
        if (error) throw error;

        // User progress
        const epIds = (episodes || []).map((e: any) => e.id);
        let progressMap: Record<string, any> = {};

        if (epIds.length > 0) {
            const { data: progress } = await supabase
                .from('user_episode_progress')
                .select('*')
                .eq('user_id', user.id)
                .in('episode_id', epIds);

            if (progress) {
                for (const p of progress as any[]) {
                    progressMap[p.episode_id] = p;
                }
            }
        }

        // Get show names for display
        const showIds = Array.from(new Set((episodes || []).map((e: any) => e.show_id)));
        let showMap: Record<string, any> = {};
        if (showIds.length > 0) {
            const { data: shows } = await supabase
                .from('podcast_shows')
                .select('id, name, cover_color')
                .in('id', showIds);

            if (shows) {
                for (const s of shows as any[]) {
                    showMap[s.id] = s;
                }
            }
        }

        return NextResponse.json({
            episodes: (episodes || []).map((e: any) => ({
                ...e,
                show: showMap[e.show_id] || null,
                user_progress: progressMap[e.id] || null,
            })),
            page,
            hasMore: (episodes?.length || 0) === limit,
        });
    } catch (error) {
        console.error('[listen/episodes] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
    }
}
