'use client';

// ============================================================
// Parlova — Main Dashboard View 
// ============================================================

import React from 'react';
import { motion, Variants } from 'framer-motion';

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
}

// Helper animation variant for staggered fade-up children
const containerV: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemV: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
    currentLevel
}: DashboardViewProps) {

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Learner';
    const langName = userLanguage?.languages?.name || 'Spanish';
    const langEmoji = userLanguage?.languages?.emoji || '🌍';

    return (
        <div className="flex flex-col w-full">
            {/* ── Header ── */}
            <Header
                userName={userName}
                languageName={langName}
                languageEmoji={langEmoji}
                level={currentLevel}
                streak={streak}
            />

            {/* ── Dashboard Grid ── */}
            <motion.div
                variants={containerV}
                initial="hidden"
                animate="show"
                className="w-full flex justify-center p-4 md:p-8"
            >
                <div className="w-full max-w-[1000px] flex flex-col gap-6 lg:gap-8">

                    {/* Top Row: Goal (1/3) + Quick Actions (2/3) */}
                    <div className="flex flex-col lg:flex-row gap-6 w-full">
                        <motion.div variants={itemV} className="w-full lg:w-1/3">
                            <GoalProgress minutesStudied={minutesStudied} dailyGoal={dailyGoal} />
                        </motion.div>

                        <motion.div variants={itemV} className="w-full lg:w-2/3 flex flex-col">
                            <QuickActions />
                        </motion.div>
                    </div>

                    {/* Middle Row: Stats */}
                    <motion.div variants={itemV} className="w-full">
                        <WeeklyStats
                            conversations={conversations}
                            wordsLearned={wordsLearned}
                            minutesStudied={minutesStudied}
                            streak={streak}
                        />
                    </motion.div>

                    {/* Bottom Row: Level (1/3) + Activity (2/3) */}
                    <div className="flex flex-col lg:flex-row gap-6 w-full">
                        <motion.div variants={itemV} className="w-full lg:w-1/3 flex flex-col gap-6">
                            {/* Stack level progress and anything else that might fit here */}
                            <LevelProgress currentLevel={currentLevel} score={levelScore} />

                            {/* Decorative filler if needed on desktop */}
                            <div className="hidden lg:flex flex-1 rounded-3xl bg-secondary/30 border border-border/30 items-center justify-center p-6 text-center shadow-inner">
                                <p className="text-sm font-medium text-muted-foreground/60">
                                    Keep practicing entirely in {langName} to level up faster.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div variants={itemV} className="w-full lg:w-2/3">
                            <RecentActivity sessions={sessions} />
                        </motion.div>
                    </div>

                </div>
            </motion.div>

        </div>
    );
}
