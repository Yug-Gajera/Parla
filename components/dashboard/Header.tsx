// ============================================================
// Parlova — Dashboard Header
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full pt-8 pb-6 px-4 md:px-8 border-b border-border/50">

            {/* ── Greeting & Context ── */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {getGreeting()}, {userName}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <span className="text-lg" aria-hidden="true">{languageEmoji}</span>
                    <span className="font-medium">{languageName}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border">
                        Level {level}
                    </span>
                </div>
            </div>

            {/* ── Streak ── */}
            <div className={`
        flex items-center gap-3 px-4 py-2 rounded-2xl border 
        ${streak >= 7 ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-card border-border text-foreground'}
      `}>
                <div className="p-1.5 rounded-full bg-background/50">
                    <Flame size={20} className={streak > 0 ? 'text-orange-500' : 'text-muted-foreground'} />
                </div>
                <div className="flex flex-col">
                    {streak === 0 ? (
                        <span className="text-sm font-medium text-muted-foreground">Start your streak today</span>
                    ) : (
                        <span className="font-bold text-lg leading-none">{streak} <span className="text-sm font-normal opacity-80">Day{streak !== 1 ? 's' : ''}</span></span>
                    )}
                </div>
            </div>

        </div>
    );
}

// ── SKELETON ──
export function HeaderSkeleton() {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full pt-8 pb-6 px-4 md:px-8 border-b border-border/50 animate-pulse">
            <div className="flex flex-col gap-2">
                <div className="h-8 w-64 bg-muted rounded-md" />
                <div className="flex gap-2 items-center">
                    <div className="h-5 w-5 bg-muted rounded-full" />
                    <div className="h-5 w-24 bg-muted rounded" />
                    <div className="h-5 w-16 bg-muted rounded" />
                </div>
            </div>
            <div className="h-12 w-40 bg-muted rounded-2xl" />
        </div>
    );
}
