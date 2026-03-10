import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileView } from '@/components/profile/ProfileView';
import { computeEarnedBadges } from '@/lib/data/badges';
import { LEVEL_POINTS, getWeekStartDate } from '@/lib/utils/level';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const weekStart = getWeekStartDate(new Date()).toISOString().split('T')[0];

    const [
        { data: userRow },
        { data: userLanguages },
        { data: levelTests },
        { data: certificates },
        { data: studySessions },
        { data: currentWeekEntry },
        { count: vocabCount },
        { data: firstConvo }
    ] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('user_languages').select('*, languages(*)').eq('user_id', user.id).order('started_at', { ascending: false }),
        supabase.from('level_tests').select('*').eq('user_id', user.id).order('taken_at', { ascending: false }),
        supabase.from('certificates').select('*, languages(*)').eq('user_id', user.id).order('issued_at', { ascending: false }),
        supabase.from('study_sessions').select('created_at, duration_minutes, xp_earned').eq('user_id', user.id).gte('created_at', oneYearAgo.toISOString()),
        supabase.from('leaderboard_entries').select('*').eq('user_id', user.id).eq('week_start_date', weekStart).maybeSingle(),
        supabase.from('user_vocabulary').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['learning', 'familiar', 'mastered']),
        supabase.from('conversation_sessions').select('created_at').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).maybeSingle()
    ]);

    const { count: convCount } = await supabase
        .from('conversation_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('grammar_score', 'is', null);

    const primaryLang = Array.isArray(userLanguages) && userLanguages.length > 0 ? userLanguages[0] : null;

    if (!primaryLang) {
        redirect('/onboarding');
    }
    type StudyRow = { duration_minutes?: number };
    const totalMins = (studySessions || []).reduce((acc: number, s: StudyRow) => acc + (s.duration_minutes || 0), 0);
    type SessionRow = { created_at: string; xp_earned?: number };
    const xpLast14 = (studySessions || [])
        .filter((s: SessionRow) => new Date(s.created_at) >= fourteenDaysAgo)
        .reduce((acc: number, s: SessionRow) => acc + (s.xp_earned || 0), 0);
    const avgPointsPerDay = Math.max(0.1, xpLast14 / 14);

    const stats = {
        vocabKnown: vocabCount || 0,
        conversations: convCount || 0,
        streak: (primaryLang as any)?.streak_days ?? 0,
        totalHours: Math.round(totalMins / 60)
    };

    const levelScore = (primaryLang as any)?.level_score ?? 0;
    const currentLevel = (primaryLang as any)?.current_level ?? 'A1';
    const remainingPoints = Math.max(0, LEVEL_POINTS - levelScore);
    const daysToNextLevel = avgPointsPerDay > 0 ? Math.ceil(remainingPoints / avgPointsPerDay) : null;

    type WeekEntry = { vocabulary_learned?: number; conversation_count?: number } | null;
    type FirstConvo = { created_at?: string } | null;
    const earnedBadges = computeEarnedBadges({
        conversationCount: stats.conversations,
        streakDays: stats.streak,
        firstConversationAt: (firstConvo as FirstConvo)?.created_at,
        vocabLearnedThisWeek: (currentWeekEntry as WeekEntry)?.vocabulary_learned,
        conversationCountThisWeek: (currentWeekEntry as WeekEntry)?.conversation_count
    });

    const profileData = {
        user: userRow,
        userLanguage: primaryLang,
        userLanguages: userLanguages || [],
        levelTests: levelTests || [],
        certificates: certificates || [],
        studySessions: studySessions || [],
        stats,
        levelProgress: {
            currentLevel,
            levelScore,
            daysToNextLevel
        },
        earnedBadges
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-y-auto w-full">
            <main className="flex-1 pb-20 md:pb-0 w-full pt-6">
                <ProfileView initialData={profileData} />
            </main>
        </div>
    );
}
