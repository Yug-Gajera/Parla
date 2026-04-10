'use client';

// ============================================================
// Parlova — Main Dashboard View (Redesigned)
// ============================================================

import React from 'react';

import Header from '@/components/dashboard/Header';
import GoalProgress from '@/components/dashboard/GoalProgress';
import QuickActions from '@/components/dashboard/QuickActions';
import WeeklyStats from '@/components/dashboard/WeeklyStats';
import LevelProgress from '@/components/dashboard/LevelProgress';
import RecentActivity from '@/components/dashboard/RecentActivity';

interface DashboardViewProps {
    user: any;
    userLanguage: any;
    sessions: any[];
    streak: number;
    minutesStudied: number;
    dailyGoal: number;
    wordsLearned: number;
    conversations: number;
    levelScore: number;
    currentLevel: string;
    plan: string;
    dailyUsage: {
        conversation: number;
        word_lookup: number;
    };
}

export default function DashboardView({
    user,
    userLanguage,
    sessions,
    streak,
    minutesStudied,
    dailyGoal,
    wordsLearned,
    conversations,
    levelScore,
    currentLevel,
    plan,
    dailyUsage,
}: DashboardViewProps) {

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Learner';
    const langName = userLanguage?.languages?.name || 'Spanish';
    const langEmoji = userLanguage?.languages?.emoji || '🌍';
    const isPaidPlan = plan === 'pro' || plan === 'pro_plus';
    const convLimit = plan === 'pro_plus' ? 20 : (plan === 'pro' ? 10 : 1);
    const lookupLimit = plan === 'pro_plus' ? 200 : (plan === 'pro' ? 100 : 10);

    const renderUsageBar = (value: number, limit: number) => {
        const pct = Math.min(100, Math.round((value / Math.max(1, limit)) * 100));
        const fill = pct >= 95 ? '#ef4444' : pct >= 80 ? '#f59e0b' : 'var(--color-accent)';
        return (
            <div className="flex items-center gap-3">
                <div
                    style={{
                        width: '120px',
                        height: '4px',
                        borderRadius: '9999px',
                        background: 'var(--color-border)',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: `${pct}%`,
                            height: '100%',
                            borderRadius: '9999px',
                            background: fill,
                        }}
                    />
                </div>
                <span className="text-[12px] text-text-muted">{value}/{limit}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full h-full">
            {/* ── Header ── */}
            <Header
                userName={userName}
                languageName={langName}
                languageEmoji={langEmoji}
                level={currentLevel}
                streak={streak}
            />

            {/* ── Dashboard Grid ── */}
            <div className="w-full flex justify-center py-[40px] px-[24px] md:px-[40px]">
                <div className="w-full max-w-[900px] flex flex-col gap-[40px]">

                    {/* Top Section: Welcome & Quick Stats */}
                    <div className="flex flex-col w-full animate-fade-up-1">
                        <WeeklyStats
                            conversations={conversations}
                            wordsLearned={wordsLearned}
                            minutesStudied={minutesStudied}
                            streak={streak}
                        />
                        {isPaidPlan && (
                            <div className="mt-4 rounded-[14px] border border-border bg-card p-3">
                                <p className="text-[12px] text-text-muted mb-2">Today&apos;s usage:</p>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[12px] text-text-muted">Conversations</span>
                                    {renderUsageBar(dailyUsage.conversation, convLimit)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-text-muted">Word lookups</span>
                                    {renderUsageBar(dailyUsage.word_lookup, lookupLimit)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Middle Section: Quick Actions & Goal */}
                    <div className="flex flex-col lg:flex-row gap-[16px] w-full animate-fade-up-2">
                        <div className="w-full lg:w-[30%]">
                            <GoalProgress minutesStudied={minutesStudied} dailyGoal={dailyGoal} />
                        </div>
                        <div className="w-full lg:w-[70%]">
                            <QuickActions />
                        </div>
                    </div>

                    {/* Bottom Section: Level & Activity */}
                    <div className="flex flex-col lg:flex-row gap-[16px] w-full animate-fade-up-3">
                        <div className="w-full lg:w-[30%] flex flex-col gap-[16px]">
                            <LevelProgress currentLevel={currentLevel} score={levelScore} />

                            <div className="hidden lg:flex flex-1 rounded-[18px] border border-border bg-card items-center justify-center p-6 text-center">
                                <p className="text-[13px] text-text-muted leading-relaxed">
                                    Keep practicing entirely in <span className="text-text-primary font-medium">{langName}</span> to level up faster.
                                </p>
                            </div>
                        </div>

                        <div className="w-full lg:w-[70%]">
                            <RecentActivity sessions={sessions} />
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
