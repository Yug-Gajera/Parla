export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWeekStartDate, getWeekEndDate, getLevelBand } from '@/lib/utils/level';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const language_id = searchParams.get('language_id');
        const level_band = searchParams.get('level_band');
        const weekParam = searchParams.get('week'); // Optional YYYY-MM-DD for week start

        if (!language_id || !level_band) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const weekDate = weekParam ? new Date(weekParam + 'T00:00:00Z') : new Date();
        const weekStartDate = getWeekStartDate(weekDate);
        const weekEndDate = getWeekEndDate(weekStartDate);
        const weekStartIso = weekStartDate.toISOString().split('T')[0]; // simple YYYY-MM-DD

        // Query the leaderboard join with users
        // Since Supabase RPC or view is ideal here, we'll do a direct select with join if possible
        // If the Foreign Key sits on leaderboard_entries (user_id -> users.id) we can join:
        const { data: entriesData, error } = await supabase
            .from('leaderboard_entries')
            .select(`
                id, user_id, weekly_score, total_score,
                users!user_id ( full_name )
            `)
            .eq('language_id', language_id)
            .eq('level_band', level_band)
            .eq('week_start_date', weekStartIso)
            .order('weekly_score', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Leaderboard Fetch Error', error);
            throw error;
        }

        // Map the entries to add ranks and flatten the user relationship
        const entries = (entriesData || []).map((entry: any, index: number) => ({
            rank: index + 1,
            id: entry.id,
            user_id: entry.user_id,
            name: entry.users?.full_name || 'Anonymous',
            avatar: (entry.users?.full_name || 'A').substring(0, 2).toUpperCase(),
            weekly_score: entry.weekly_score,
            total_score: entry.total_score,
            is_current_user: entry.user_id === user.id
        }));

        let currentUserEntry = entries.find(e => e.is_current_user);

        // If the user isn't in the top 100, fetch their specific row
        if (!currentUserEntry) {
            const { data: userRow } = await supabase
                .from('leaderboard_entries')
                .select(`id, user_id, weekly_score, total_score, users!user_id ( full_name )`)
                .eq('language_id', language_id)
                .eq('level_band', level_band)
                .eq('week_start_date', weekStartIso)
                .eq('user_id', user.id)
                .single();

            if (userRow) {
                // Need to find their exact rank by counting users with a strictly higher score
                const { count } = await supabase
                    .from('leaderboard_entries')
                    .select('*', { count: 'exact', head: true })
                    .eq('language_id', language_id)
                    .eq('level_band', level_band)
                    .eq('week_start_date', weekStartIso)
                    .gt('weekly_score', (userRow as any).weekly_score);

                currentUserEntry = {
                    rank: (count || 0) + 1,
                    id: (userRow as any).id,
                    user_id: (userRow as any).user_id,
                    name: (userRow as any).users?.full_name || 'Anonymous',
                    avatar: ((userRow as any).users?.full_name || 'A').substring(0, 2).toUpperCase(),
                    weekly_score: (userRow as any).weekly_score,
                    total_score: (userRow as any).total_score,
                    is_current_user: true
                };
            } else {
                // User has no entry this week at all
                currentUserEntry = {
                    rank: 0,
                    id: 'temp',
                    user_id: user.id,
                    name: 'You',
                    avatar: 'YO',
                    weekly_score: 0,
                    total_score: 0,
                    is_current_user: true
                };
            }
        }

        return NextResponse.json({
            entries,
            current_user_rank: currentUserEntry?.rank,
            current_user_entry: currentUserEntry,
            week_start_date: weekStartDate.toISOString(),
            week_end_date: weekEndDate.toISOString()
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
            }
        });

    } catch (error) {
        console.error('API Error /leaderboard:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
