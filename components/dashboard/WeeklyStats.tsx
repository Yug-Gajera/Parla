'use client';

// ============================================================
// FluentLoop — Weekly Stats Cards
// ============================================================

import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { MessageSquare, Book, Clock, Flame } from 'lucide-react';

interface WeeklyStatsProps {
    conversations: number;
    wordsLearned: number;
    minutesStudied: number;
    streak: number;
}

export default function WeeklyStats({ conversations, wordsLearned, minutesStudied, streak }: WeeklyStatsProps) {

    const STATS = [
        { icon: MessageSquare, label: 'Conversations', value: conversations, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        { icon: Book, label: 'Words Learned', value: wordsLearned, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { icon: Clock, label: 'Min. Studied', value: minutesStudied, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { icon: Flame, label: 'Day Streak', value: streak, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {STATS.map((stat, i) => (
                <StatCard key={i} {...stat} index={i} />
            ))}
        </div>
    );
}

// ── Subcomponent ──
function StatCard({ icon: Icon, label, value, color, bg, index }: any) {
    const [displayValue, setDisplayValue] = useState(0);
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (!isInView) return;

        let startTimestamp: number | null = null;
        const duration = 1500; // 1.5s animation

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // easeOutExpo curve
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            setDisplayValue(Math.floor(easeProgress * value));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [value, isInView]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex flex-col p-5 bg-card border border-border rounded-3xl"
        >
            <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center mb-4`}>
                <Icon size={20} />
            </div>
            <div className="text-3xl font-black tabular-nums tracking-tighter mb-1">
                {displayValue}
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
            </div>
        </motion.div>
    )
}

// ── SKELETON ──
export function WeeklyStatsSkeleton() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col p-5 bg-card border border-border rounded-3xl animate-pulse h-[140px]">
                    <div className="w-10 h-10 rounded-xl bg-muted mb-4" />
                    <div className="h-8 w-16 bg-muted rounded mb-2" />
                    <div className="h-4 w-24 bg-muted rounded" />
                </div>
            ))}
        </div>
    );
}
