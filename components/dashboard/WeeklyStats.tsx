'use client';

// ============================================================
// Parlova — Weekly Stats Cards (Redesigned)
// ============================================================

import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageSquare, Book, Clock, Flame } from 'lucide-react';

interface WeeklyStatsProps {
    conversations: number;
    wordsLearned: number;
    minutesStudied: number;
    streak: number;
}

export default function WeeklyStats({ conversations, wordsLearned, minutesStudied, streak }: WeeklyStatsProps) {

    const STATS = [
        { icon: MessageSquare, label: 'Conversations', value: conversations },
        { icon: Book, label: 'Words Learned', value: wordsLearned },
        { icon: Clock, label: 'Minutes', value: minutesStudied },
        { icon: Flame, label: 'Day Streak', value: streak },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] w-full">
            {STATS.map((stat, i) => (
                <StatCard key={i} {...stat} index={i} />
            ))}
        </div>
    );
}

// ── Subcomponent ──
function StatCard({ icon: Icon, label, value, index }: any) {
    const [displayValue, setDisplayValue] = useState(0);
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (!isInView) return;

        let startTimestamp: number | null = null;
        const duration = 1000;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setDisplayValue(Math.floor(easeProgress * value));
            if (progress < 1) window.requestAnimationFrame(step);
        };

        window.requestAnimationFrame(step);
    }, [value, isInView]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
            className="parlova-card flex flex-col gap-[4px]"
        >
            <div className="quick-action-icon w-[36px] h-[36px] mb-[12px]">
                <Icon size={16} />
            </div>
            <div className="stat-value">
                {displayValue}
            </div>
            <div className="stat-label">
                {label}
            </div>
        </motion.div>
    )
}

// ── SKELETON ──
export function WeeklyStatsSkeleton() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] w-full">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="parlova-card flex flex-col gap-2">
                    <div className="w-9 h-9 rounded-md bg-surface mb-2 animate-pulse" />
                    <div className="h-7 w-12 bg-surface rounded mb-1 animate-pulse" />
                    <div className="h-3.5 w-20 bg-surface rounded animate-pulse" />
                </div>
            ))}
        </div>
    );
}
