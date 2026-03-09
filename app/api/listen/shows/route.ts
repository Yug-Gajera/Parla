export const dynamic = "force-dynamic";
// GET /api/listen/shows — List all podcast shows
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient(accessToken: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
}

export async function GET() {
    try {
        const { createClient: createServerClient } = await import('@/lib/supabase/server');
        const serverSupabase = await createServerClient();
        const { data: { session } } = await serverSupabase.auth.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseClient(session.access_token);

        const { data: shows, error } = await supabase
            .from('podcast_shows')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;

        // Get episode counts per show
        const showsWithCounts = await Promise.all(
            (shows || []).map(async (show: any) => {
                const { count } = await supabase
                    .from('podcast_episodes')
                    .select('id', { count: 'exact', head: true })
                    .eq('show_id', show.id)
                    .eq('is_published', true);

                return { ...show, episode_count: count || 0 };
            })
        );

        return NextResponse.json({ shows: showsWithCounts });
    } catch (error) {
        console.error('[listen/shows] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 });
    }
}
