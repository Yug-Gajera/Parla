'use client';

// ============================================================
// Parlova — Goal Progress Ring (Redesigned)
// ============================================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GoalProgressProps {
    minutesStudied: number;
    dailyGoal: number;
}

export default function GoalProgress({ minutesStudied, dailyGoal }: GoalProgressProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const safeGoal = Math.max(1, dailyGoal);
    const rawPercentage = (minutesStudied / safeGoal) * 100;
    const percentage = Math.min(100, Math.max(0, rawPercentage));

    let message = 'Ready to start? Even 5 minutes helps.';
    if (percentage >= 100) message = 'Daily goal complete! 🎉';
    else if (percentage >= 67) message = 'Almost done — finish strong';
    else if (percentage >= 34) message = "You're halfway there";
    else if (percentage > 0) message = 'Good start — keep going';

    const size = 200;
    const strokeWidth = 14;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - ((mounted ? percentage : 0) / 100) * circumference;

    return (
        <div className="parlova-card flex flex-col items-center justify-center relative overflow-hidden group h-full">

            {/* Subtle glow if complete */}
            {percentage >= 100 && (
                <div className="absolute inset-0 bg-[#E8521A]/4 transition-opacity duration-1000 p-0 m-0" />
            )}

            <div className="relative flex items-center justify-center mb-[24px] mt-[8px]">
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background Track */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="var(--color-border-strong)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                    {/* Progress Ring */}
                    <motion.circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="#E8521A"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-mono-num text-[36px] font-medium tracking-tighter text-text-primary">
                        {Math.floor(rawPercentage)}%
                    </span>
                    <span className="text-[12px] text-text-muted mt-[2px]">
                        {minutesStudied} / {dailyGoal} min
                    </span>
                </div>
            </div>

            <div className="text-center w-full px-[16px]">
                <p className={`text-[13px] font-medium transition-colors duration-500 ${percentage >= 100 ? 'text-[#E8521A]' : 'text-text-primary'}`}>
                    {message}
                </p>
            </div>

        </div>
    );
}

// ── SKELETON ──
export function GoalProgressSkeleton() {
    return (
        <div className="parlova-card flex flex-col items-center justify-center min-h-[300px]">
            <div className="skeleton w-[172px] h-[172px] rounded-pill mb-[24px]" />
            <div className="skeleton h-[18px] w-[200px]" />
        </div>
    );
}
