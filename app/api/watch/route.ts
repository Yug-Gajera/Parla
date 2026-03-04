// GET /api/watch — Browse published videos
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
        const languageId = url.searchParams.get('language_id');
        const level = url.searchParams.get('level');
        const topic = url.searchParams.get('topic');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '12');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('videos')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (languageId) query = query.eq('language_id', languageId);
        if (level) query = query.eq('cefr_level', level);
        if (topic) query = query.contains('topics', [topic]);

        const { data: videos, error } = await query;
        if (error) throw error;

        // Fetch user progress
        const videoIds = (videos || []).map((v: any) => v.id);
        let progressMap: Record<string, any> = {};

        if (videoIds.length > 0) {
            const { data: progress } = await supabase
                .from('user_video_progress')
                .select('*')
                .eq('user_id', user.id)
                .in('video_id', videoIds);

            if (progress) {
                for (const p of progress as any[]) {
                    progressMap[p.video_id] = p;
                }
            }
        }

        return NextResponse.json({
            videos: (videos || []).map((v: any) => ({
                ...v,
                transcript: undefined, // Don't send full transcript in browse
                user_progress: progressMap[v.id] || null,
            })),
            page,
            hasMore: (videos?.length || 0) === limit,
        });
    } catch (error) {
        console.error('[watch] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }
}
