// ============================================================
// FluentLoop — Test Availability Check API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// CEFR level order for progression
const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type CEFRLevel = typeof CEFR_ORDER[number];

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's language progress
        const { data: userLanguage, error: langError } = await (supabase as any)
            .from('user_languages')
            .select(`
                id,
                language_id,
                current_level,
                level_score,
                languages (code, name, flag_emoji)
            `)
            .eq('user_id', user.id)
            .single();

        if (langError || !userLanguage) {
            return NextResponse.json({
                is_available: false,
                reason: 'No active language found. Please select a language to learn.',
            });
        }

        const currentLevel = userLanguage.current_level as CEFRLevel;
        const levelIndex = CEFR_ORDER.indexOf(currentLevel);

        // Can't test beyond C2
        if (levelIndex >= CEFR_ORDER.length - 1) {
            return NextResponse.json({
                is_available: false,
                reason: 'You have already reached the highest level (C2). Congratulations!',
                current_level: currentLevel,
            });
        }

        const nextLevel = CEFR_ORDER[levelIndex + 1];

        // Check level_score requirement (>= 70)
        if (userLanguage.level_score < 70) {
            return NextResponse.json({
                is_available: false,
                reason: `You need at least 70 points in your current level to attempt the ${nextLevel} test. Current: ${userLanguage.level_score}/100`,
                current_level: currentLevel,
                level_score: userLanguage.level_score,
                required_score: 70,
            });
        }

        // Check study time in last 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const { data: recentSessions, error: sessionsError } = await (supabase as any)
            .from('study_sessions')
            .select('duration_minutes')
            .eq('user_id', user.id)
            .eq('language_id', userLanguage.language_id)
            .gte('created_at', fourteenDaysAgo.toISOString());

        if (sessionsError) {
            console.error('Error fetching study sessions:', sessionsError);
            return NextResponse.json({ error: 'Failed to check study time' }, { status: 500 });
        }

        const totalStudyMinutes = (recentSessions || []).reduce(
            (sum: number, session: { duration_minutes: number }) => sum + (session.duration_minutes || 0),
            0
        );

        if (totalStudyMinutes < 60) {
            return NextResponse.json({
                is_available: false,
                reason: `You need at least 60 minutes of study in the last 14 days. Current: ${totalStudyMinutes} minutes`,
                current_level: currentLevel,
                study_minutes: totalStudyMinutes,
                required_minutes: 60,
            });
        }

        // Check last test attempt for this level
        const { data: lastTest, error: testError } = await (supabase as any)
            .from('level_tests')
            .select('id, taken_at, passed, overall_score')
            .eq('user_id', user.id)
            .eq('language_id', userLanguage.language_id)
            .eq('level_tested', nextLevel)
            .order('taken_at', { ascending: false })
            .limit(1)
            .single();

        if (testError && testError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error fetching last test:', testError);
            return NextResponse.json({ error: 'Failed to check test history' }, { status: 500 });
        }

        // If there's a previous test, check if 14 days have passed
        if (lastTest) {
            const lastTestDate = new Date(lastTest.taken_at);
            const now = new Date();
            const daysSinceLastTest = Math.floor((now.getTime() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysSinceLastTest < 14) {
                const nextAvailableDate = new Date(lastTestDate);
                nextAvailableDate.setDate(nextAvailableDate.getDate() + 14);

                return NextResponse.json({
                    is_available: false,
                    reason: `You must wait 14 days between test attempts. Next available: ${nextAvailableDate.toLocaleDateString()}`,
                    current_level: currentLevel,
                    next_level: nextLevel,
                    last_test: {
                        taken_at: lastTest.taken_at,
                        passed: lastTest.passed,
                        score: lastTest.overall_score,
                    },
                    next_available_date: nextAvailableDate.toISOString(),
                    days_remaining: 14 - daysSinceLastTest,
                });
            }
        }

        // All checks passed - test is available
        return NextResponse.json({
            is_available: true,
            current_level: currentLevel,
            next_level: nextLevel,
            level_score: userLanguage.level_score,
            study_minutes: totalStudyMinutes,
            last_test: lastTest ? {
                taken_at: lastTest.taken_at,
                passed: lastTest.passed,
                score: lastTest.overall_score,
            } : null,
            language: userLanguage.languages,
        });

    } catch (error) {
        console.error('Test availability error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}