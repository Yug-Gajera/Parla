import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Server-side profile data fetch - used when we need profile in API form */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const [
            { data: userRow },
            { data: userLanguage },
            { data: levelTests },
            { data: certificates },
            { data: studySessions },
            { data: leaderboardEntries },
            { count: vocabCount }
        ] = await Promise.all([
            supabase.from('users').select('*').eq('id', user.id).single(),
            supabase.from('user_languages').select('*, languages(*)').eq('user_id', user.id).order('started_at', { ascending: false }),
            supabase.from('level_tests').select('*').eq('user_id', user.id).order('taken_at', { ascending: false }),
            supabase.from('certificates').select('*, languages(*)').eq('user_id', user.id).order('issued_at', { ascending: false }),
            supabase.from('study_sessions').select('created_at, duration_minutes').eq('user_id', user.id).gte('created_at', oneYearAgo.toISOString()),
            supabase.from('leaderboard_entries').select('*').eq('user_id', user.id),
            supabase.from('user_vocabulary').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['learning', 'familiar', 'mastered'])
        ]);

        const convCount = await supabase.from('conversation_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

        const primaryLang = Array.isArray(userLanguage) ? userLanguage[0] : userLanguage;
        const totalMins = (studySessions || []).reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0);

        // XP earned in last 14 days for "days to next level" estimate
        const { data: recentSessions } = await supabase
            .from('study_sessions')
            .select('xp_earned')
            .eq('user_id', user.id)
            .gte('created_at', fourteenDaysAgo.toISOString());
        const xpLast14 = (recentSessions || []).reduce((acc: number, s: any) => acc + (s.xp_earned || 0), 0);
        const avgPointsPerDay = Math.max(0.1, xpLast14 / 14);

        return NextResponse.json({
            user: userRow,
            userLanguage: primaryLang,
            userLanguages: userLanguage || [],
            levelTests: levelTests || [],
            certificates: certificates || [],
            studySessions: studySessions || [],
            leaderboardEntries: leaderboardEntries || [],
            stats: {
                vocabKnown: vocabCount || 0,
                conversations: convCount.count || 0,
                streak: primaryLang?.streak_days ?? 0,
                totalHours: Math.round(totalMins / 60)
            },
            avgPointsPerDay
        });
    } catch (error) {
        console.error('Profile data API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
