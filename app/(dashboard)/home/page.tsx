export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardView from '@/components/dashboard/DashboardView';
import { Suspense } from 'react';
import { HeaderSkeleton } from '@/components/dashboard/Header';
import { GoalProgressSkeleton } from '@/components/dashboard/GoalProgress';
import { QuickActionsSkeleton } from '@/components/dashboard/QuickActions';
import { WeeklyStatsSkeleton } from '@/components/dashboard/WeeklyStats';
import { LevelProgressSkeleton } from '@/components/dashboard/LevelProgress';
import { RecentActivitySkeleton } from '@/components/dashboard/RecentActivity';
import { getUserPlan } from '@/lib/planLimits';

// Helper to get start of current week (Monday)
function getStartOfWeek() {
    const d = new Date();
    const day = d.getDay() || 7; // Get current day number, converting Sun. to 7
    d.setHours(-24 * (day - 1)); // Set to Monday
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

// Helper to get date 7 days ago
function getSevenDaysAgo() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
}

// Helper to get today midnight
function getStartOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

// ── SKELETON LAYOUT ──
function DashboardSkeleton() {
    return (
        <div className="flex flex-col w-full">
            <HeaderSkeleton />
            <div className="w-full flex justify-center p-4 md:p-8">
                <div className="w-full max-w-[1000px] flex flex-col gap-6 lg:gap-8">
                    <div className="flex flex-col lg:flex-row gap-6 w-full">
                        <div className="w-full lg:w-1/3"><GoalProgressSkeleton /></div>
                        <div className="w-full lg:w-2/3 flex flex-col"><QuickActionsSkeleton /></div>
                    </div>
                    <div className="w-full"><WeeklyStatsSkeleton /></div>
                    <div className="flex flex-col lg:flex-row gap-6 w-full">
                        <div className="w-full lg:w-1/3 flex flex-col gap-6"><LevelProgressSkeleton /></div>
                        <div className="w-full lg:w-2/3"><RecentActivitySkeleton /></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── DATA PREPARATION & PAGE ──
async function DashboardData() {
    const supabase = await createClient();

    // 1. Get Session/User
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        redirect('/login');
    }

    // Common Timestamps
    const startOfWeek = getStartOfWeek();
    const sevenDaysAgo = getSevenDaysAgo();
    const startOfToday = getStartOfToday();

    // 2. Parallel Fetching
    const [
        { data: userLanguage },
        { data: userSettings },
        { data: sessions },
        { count: weeklyWordsCount },
        { count: weeklyConversationsCount },
        { data: todaySessions },
        { data: dailyUsageRows }
    ] = await Promise.all([

        // Active Language Data (Level, Streak, Score)
        supabase.from('user_languages')
            .select('streak_days, level_score, current_level, language_id, languages(name)')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle(),

        // User Settings (Daily Goal)
        supabase.from('user_settings')
            .select('daily_goal_minutes')
            .eq('user_id', user.id)
            .single(),

        // Recent Study Sessions (last 7 days)
        supabase.from('study_sessions')
            .select('id, session_type, duration_minutes, xp_earned, created_at')
            .eq('user_id', user.id)
            .gte('created_at', sevenDaysAgo)
            .order('created_at', { ascending: false })
            .limit(10),

        // Words learned this week
        supabase.from('user_vocabulary')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('added_at', startOfWeek),

        // Conversations this week
        supabase.from('conversation_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', startOfWeek),

        // Sessions today (to calculate minutes studied today for GoalProgress)
        supabase.from('study_sessions')
            .select('duration_minutes')
            .eq('user_id', user.id)
            .gte('created_at', startOfToday),

        // Daily rate-limit usage rows for dashboard indicators
        (supabase as any).from('rate_limits')
            .select('operation, count')
            .eq('user_id', user.id)
            .eq('date', new Date().toISOString().split('T')[0])
    ]);

    // If no language set up, redirect to onboarding
    if (!userLanguage) {
        redirect('/onboarding');
    }

    // Calculations
    const streak = (userLanguage as any)?.streak_days || 0;
    const levelScore = (userLanguage as any)?.level_score || 0;
    const currentLevel = (userLanguage as any)?.current_level || 'A1';

    const dailyGoal = (userSettings as any)?.daily_goal_minutes || 20;
    const plan = await getUserPlan(user.id);
    const usageMap = (dailyUsageRows || []).reduce((acc: any, row: any) => {
        acc[row.operation] = row.count;
        return acc;
    }, {} as Record<string, number>);

    // Calculate minutes studied today
    const minutesStudiedToday = (todaySessions || []).reduce(
        (acc: number, session: any) => acc + (session.duration_minutes || 0), 0
    );

    // Use study sessions to get total minutes this week
    const minutesStudiedWeek = (sessions || []).reduce(
        (acc: number, session: any) => {
            // Only include if created after startOfWeek
            if (new Date(session.created_at) >= new Date(startOfWeek)) {
                return acc + (session.duration_minutes || 0);
            }
            return acc;
        }, 0
    );

    return (
        <DashboardView
            user={user}
            userLanguage={userLanguage}
            sessions={sessions || []}
            streak={streak}
            minutesStudied={minutesStudiedToday} // Passing today's minutes for the radial dial
            dailyGoal={dailyGoal}
            wordsLearned={weeklyWordsCount || 0}
            conversations={weeklyConversationsCount || 0}
            levelScore={levelScore}
            currentLevel={currentLevel}
            plan={plan}
            dailyUsage={{
                conversation: usageMap.conversation || 0,
                word_lookup: usageMap.word_lookup || 0,
            }}
        />
    );
}

// ── EXPORTED PAGE COMPONENT ──
export default function HomePage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardData />
        </Suspense>
    );
}
