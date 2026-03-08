'use client';

// ============================================================
// Parlova — Level Progress Card
// ============================================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface LevelProgressProps {
    currentLevel: string;
    score: number;
}

export default function LevelProgress({ currentLevel, score }: LevelProgressProps) {
    // Simple mapping to get the next level
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = order.indexOf(currentLevel) >= 0 ? order.indexOf(currentLevel) : 0;
    const nextLevel = currentIndex < order.length - 1 ? order[currentIndex + 1] : 'C2';
    const isMaxLevel = currentLevel === 'C2';

    // Animation state
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Mock days until next test based on score (for UX purposes, normally comes from DB)
    const isTestAvailable = score >= 80;
    const daysUntilTest = isTestAvailable ? 0 : Math.max(1, Math.floor((80 - score) / 5));

    return (
        <div className="flex flex-col p-6 bg-card border border-border rounded-3xl w-full relative overflow-hidden group">

            {/* ── Badges & Bar ── */}
            <div className="flex items-center gap-4 w-full mb-4 mt-2">
                {/* Current */}
                <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-xl border-2 border-primary shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                        {currentLevel}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative">
                        <motion.div
                            className={`h-full absolute left-0 top-0 rounded-full ${isTestAvailable ? 'bg-emerald-500' : 'bg-primary'}`}
                            initial={{ width: '0%' }}
                            animate={{ width: mounted ? `${isMaxLevel ? 100 : score}%` : '0%' }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
                        />
                    </div>
                </div>

                {/* Next */}
                <div className="flex flex-col items-center flex-shrink-0 relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-2 transition-colors ${isTestAvailable ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'bg-secondary text-muted-foreground border-border'
                        }`}>
                        {nextLevel}
                    </div>
                </div>
            </div>

            {/* ── Status Info ── */}
            <div className="flex flex-col text-center w-full">
                <span className="font-semibold text-lg">
                    {isMaxLevel ? 'Mastery Achieved' : `${score} / 100 XP`}
                </span>

                {!isMaxLevel && (
                    <div className="text-sm font-medium mt-1">
                        {isTestAvailable ? (
                            <Link href="/learn?tab=test" className="text-emerald-500 hover:text-emerald-400 flex items-center justify-center gap-1 group-hover:underline">
                                <span className="relative flex h-2 w-2 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Test available now!
                            </Link>
                        ) : (
                            <span className="text-muted-foreground">
                                Next test in about {daysUntilTest} days
                            </span>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}

// ── SKELETON ──
export function LevelProgressSkeleton() {
    return (
        <div className="flex flex-col p-6 bg-card border border-border rounded-3xl w-full animate-pulse min-h-[148px]">
            <div className="flex items-center gap-4 w-full mb-4 mt-2">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 h-3 bg-muted rounded-full" />
                <div className="w-12 h-12 rounded-full bg-muted" />
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
            </div>
        </div>
    );
}
