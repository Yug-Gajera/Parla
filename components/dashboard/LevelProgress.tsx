'use client';

// ============================================================
// Parlova — Level Progress Card (Redesigned)
// ============================================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface LevelProgressProps {
    currentLevel: string;
    score: number;
}

export default function LevelProgress({ currentLevel, score }: LevelProgressProps) {
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = order.indexOf(currentLevel) >= 0 ? order.indexOf(currentLevel) : 0;
    const nextLevel = currentIndex < order.length - 1 ? order[currentIndex + 1] : 'C2';
    const isMaxLevel = currentLevel === 'C2';

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const isTestAvailable = score >= 80;
    const daysUntilTest = isTestAvailable ? 0 : Math.max(1, Math.floor((80 - score) / 5));

    return (
        <div className="parlova-card w-full relative overflow-hidden group">
            
            {/* ── Badges & Bar ── */}
            <div className="flex items-center gap-[16px] w-full mb-[24px]">
                {/* Current */}
                <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-[44px] h-[44px] rounded-pill bg-[#E8521A]/15 text-[#E8521A] flex items-center justify-center font-mono-num font-medium text-[16px] border border-[#E8521A]/22 shadow-md shadow-[#E8521A]/10">
                        {currentLevel}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="progress-track w-full">
                        <motion.div
                            className={`progress-fill left-0 top-0 absolute ${isTestAvailable ? 'shadow-[0_0_10px_#E8521A]' : ''}`}
                            initial={{ width: '0%' }}
                            animate={{ width: mounted ? `${isMaxLevel ? 100 : score}%` : '0%' }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                        />
                    </div>
                </div>

                {/* Next */}
                <div className="flex flex-col items-center flex-shrink-0 relative">
                    <div className={`w-[44px] h-[44px] rounded-pill flex items-center justify-center font-mono-num font-medium text-[16px] border transition-colors ${
                        isTestAvailable 
                        ? 'bg-[#E8521A]/15 text-[#E8521A] border border-[#E8521A]/22 shadow-md shadow-[#E8521A]/20' 
                        : 'bg-transparent text-text-muted border-border-strong'
                    }`}>
                        {nextLevel}
                    </div>
                </div>
            </div>

            {/* ── Status Info ── */}
            <div className="flex flex-col text-center w-full">
                <span className="font-mono-num font-medium text-[16px] text-text-primary">
                    {isMaxLevel ? 'Mastery Achieved' : `${score} / 100 XP`}
                </span>

                {!isMaxLevel && (
                    <div className="text-[13px] mt-[4px]">
                        {isTestAvailable ? (
                            <Link href="/learn?tab=test" className="text-[#E8521A] hover:text-[#D94A15] flex items-center justify-center gap-[6px] group-hover:underline transition-colors mt-[4px]">
                                <span className="relative flex h-[8px] w-[8px]">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-pill bg-[#E8521A] opacity-75"></span>
                                    <span className="relative inline-flex rounded-pill h-[8px] w-[8px] bg-[#E8521A]"></span>
                                </span>
                                Diagnostic ready
                            </Link>
                        ) : (
                            <span className="text-text-secondary">
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
        <div className="parlova-card w-full flex flex-col justify-center min-h-[156px]">
            <div className="flex items-center gap-[16px] w-full mb-[24px]">
                <div className="skeleton w-[44px] h-[44px] rounded-pill flex-shrink-0" />
                <div className="skeleton h-[4px] w-full rounded-pill" />
                <div className="skeleton w-[44px] h-[44px] rounded-pill flex-shrink-0" />
            </div>
            <div className="flex flex-col items-center gap-[8px]">
                <div className="skeleton h-[20px] w-[140px]" />
                <div className="skeleton h-[16px] w-[180px]" />
            </div>
        </div>
    );
}
