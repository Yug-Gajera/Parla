'use client';

// ============================================================
// FluentLoop — Goal Progress Ring
// ============================================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GoalProgressProps {
    minutesStudied: number;
    dailyGoal: number;
}

export default function GoalProgress({ minutesStudied, dailyGoal }: GoalProgressProps) {
    // Prevent hydration mismatch by defaulting to 0 then animating up
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const safeGoal = Math.max(1, dailyGoal);
    const rawPercentage = (minutesStudied / safeGoal) * 100;
    // Cap visual circle at 100%
    const percentage = Math.min(100, Math.max(0, rawPercentage));

    let message = 'Ready to start? Even 5 minutes helps.';
    if (percentage >= 100) message = 'Daily goal complete! 🎉';
    else if (percentage >= 67) message = 'Almost done — finish strong';
    else if (percentage >= 34) message = "You're halfway there";
    else if (percentage > 0) message = 'Good start — keep going';

    // Circle Math
    const size = 220;
    const strokeWidth = 16;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    // Dash offset calculations
    const offset = circumference - ((mounted ? percentage : 0) / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-3xl shadow-sm relative overflow-hidden group">

            {/* Subtle glow if complete */}
            {percentage >= 100 && (
                <div className="absolute inset-0 bg-primary/5 opacity-50 transition-opacity duration-1000" />
            )}

            <div className="relative flex items-center justify-center mb-6 mt-2">
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background Track */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                    {/* Progress Ring */}
                    <motion.circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke={percentage >= 100 ? '#34d399' : 'hsl(var(--primary))'}
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
                    <span className="text-4xl font-black tracking-tighter tabular-nums">
                        {Math.floor(rawPercentage)}%
                    </span>
                    <span className="text-sm text-muted-foreground font-medium mt-1">
                        {minutesStudied} / {dailyGoal} min
                    </span>
                </div>
            </div>

            <div className="text-center w-full px-4 mb-2">
                <p className={`font-medium text-sm transition-colors duration-500 ${percentage >= 100 ? 'text-emerald-500' : 'text-foreground'}`}>
                    {message}
                </p>
            </div>

        </div>
    );
}

// ── SKELETON ──
export function GoalProgressSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-3xl animate-pulse min-h-[320px]">
            <div className="w-[188px] h-[188px] rounded-full border-[16px] border-muted mb-6" />
            <div className="h-5 w-48 bg-muted rounded" />
        </div>
    );
}
