// ============================================================
// Parlova — Dashboard Header (Redesigned)
// ============================================================

import React from 'react';
import { Flame } from 'lucide-react';

interface HeaderProps {
    userName: string;
    languageName: string;
    languageEmoji: string;
    level: string;
    streak: number;
}

export default function Header({ userName, languageName, languageEmoji, level, streak }: HeaderProps) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full pt-8 pb-6 px-4 md:px-10 border-b border-border animate-fade-up">

            {/* ── Greeting & Context ── */}
            <div className="flex flex-col gap-1">
                <h1 className="font-display text-heading-lg ls-display font-semibold text-text-primary">
                    {getGreeting()}, {userName}
                </h1>
                <div className="flex items-center gap-2 text-text-muted mt-1">
                    <span className="text-[16px]" aria-hidden="true">{languageEmoji}</span>
                    <span className="text-caption font-medium">{languageName}</span>
                    <span className="w-1 h-1 rounded-full bg-border-strong" />
                    <span className="badge-level" data-tour="level-indicator">
                        {level}
                    </span>
                </div>
            </div>

            {/* ── Streak ── */}
            <div className={`
                flex items-center gap-3 px-4 py-2.5 rounded-xl border
                ${streak >= 7
                    ? 'bg-[#E8521A]/5 border-[#E8521A]/30 text-[#E8521A] shadow-[0_0_15px_rgba(232,82,26,0.15)]'
                    : 'bg-card border-border text-text-primary'}
            `}>
                <Flame size={18} className={streak > 0 ? 'text-[#E8521A]' : 'text-text-muted'} />
                <div className="flex flex-col">
                    {streak === 0 ? (
                        <span className="text-caption font-medium text-text-muted">Start your streak today</span>
                    ) : (
                        <span className="font-mono-num text-[20px] font-medium leading-none">{streak} <span className="text-caption font-sans font-normal text-text-muted">day{streak !== 1 ? 's' : ''}</span></span>
                    )}
                </div>
            </div>

        </div>
    );
}

// ── SKELETON ──
export function HeaderSkeleton() {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full pt-8 pb-6 px-4 md:px-10 border-b border-border">
            <div className="flex flex-col gap-2">
                <div className="skeleton h-8 w-64" />
                <div className="flex gap-2 items-center">
                    <div className="skeleton h-5 w-5 rounded-full" />
                    <div className="skeleton h-4.5 w-24" />
                    <div className="skeleton h-4.5 w-12" />
                </div>
            </div>
            <div className="skeleton h-11 w-32 rounded-xl" />
        </div>
    );
}
