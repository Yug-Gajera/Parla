import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CompeteView } from '@/components/compete/CompeteView';
import { getLevelBand, getWeekStartDate } from '@/lib/utils/level';
import { getActiveChallengeForWeek } from '@/lib/data/challenges';


export const dynamic = 'force-dynamic';

export default async function CompetePage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // Get primary language exactly like we did in Leaderboard and Home
    const { data: userLanguage } = await supabase
        .from('user_languages')
        .select('*')
        .eq('user_id', user.id)
        .order('last_study_date', { ascending: false })
        .limit(1)
        .single();

    if (!userLanguage) {
        redirect('/onboarding');
    }

    const languageId = (userLanguage as any).language_id;
    const levelStr = (userLanguage as any).current_level || 'A1';
    const levelBand = getLevelBand(levelStr);

    const weekStartIso = getWeekStartDate(new Date()).toISOString().split('T')[0];

    // Get user stats for the CURRENT week to hydrate the challenges and stats quickly
    const { data: currentEntry } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_id', languageId)
        .eq('week_start_date', weekStartIso)
        .single();

    // For MyStats, usually we would aggregate across all time, but the leaderboard_entries
    // table `total_score` carries the running tally.
    const activeChallenge = getActiveChallengeForWeek(new Date());

    return (
        <div className="flex flex-col h-full bg-background overflow-y-auto w-full">
            <main className="flex-1 pb-20 md:pb-0 w-full">
                <CompeteView
                    languageId={languageId}
                    initialLevel={levelBand}
                    activeChallenge={activeChallenge}
                    userStats={currentEntry || null}
                />
            </main>
        </div>
    );
}
