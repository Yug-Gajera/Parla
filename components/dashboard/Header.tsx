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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-[16px] w-full pt-[32px] pb-[24px] px-[16px] md:px-[40px] border-b border-[#1e1e1e] animate-fade-up">

            {/* ── Greeting & Context ── */}
            <div className="flex flex-col gap-[4px]">
                <h1 className="font-display text-heading-lg ls-display font-semibold text-[#f0ece4]">
                    {getGreeting()}, {userName}
                </h1>
                <div className="flex items-center gap-[8px] text-[#9a9590] mt-[4px]">
                    <span className="text-[16px]" aria-hidden="true">{languageEmoji}</span>
                    <span className="text-caption font-medium">{languageName}</span>
                    <span className="w-[3px] h-[3px] rounded-pill bg-[#2a2a2a]" />
                    <span className="badge-level">
                        {level}
                    </span>
                </div>
            </div>

            {/* ── Streak ── */}
            <div className={`
                flex items-center gap-[12px] px-[16px] py-[10px] rounded-lg border
                ${streak >= 7
                    ? 'bg-[#c9a84c]/10 border-[#c9a84c]/20 text-[#e4c76b] shadow-[0_0_15px_rgba(201,168,76,0.1)]'
                    : 'bg-[#141414] border-[#1e1e1e] text-[#f0ece4]'}
            `}>
                <Flame size={18} className={streak > 0 ? 'text-[#c9a84c]' : 'text-[#5a5652]'} />
                <div className="flex flex-col">
                    {streak === 0 ? (
                        <span className="text-caption font-medium text-[#5a5652]">Start your streak today</span>
                    ) : (
                        <span className="font-mono-num text-[20px] font-medium leading-none">{streak} <span className="text-caption font-sans font-normal text-[#9a9590]">day{streak !== 1 ? 's' : ''}</span></span>
                    )}
                </div>
            </div>

        </div>
    );
}

// ── SKELETON ──
export function HeaderSkeleton() {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-[16px] w-full pt-[32px] pb-[24px] px-[16px] md:px-[40px] border-b border-[#1e1e1e]">
            <div className="flex flex-col gap-[8px]">
                <div className="skeleton h-[32px] w-[260px]" />
                <div className="flex gap-[8px] items-center">
                    <div className="skeleton h-[20px] w-[20px] rounded-pill" />
                    <div className="skeleton h-[18px] w-[100px]" />
                    <div className="skeleton h-[18px] w-[48px]" />
                </div>
            </div>
            <div className="skeleton h-[44px] w-[120px] rounded-lg" />
        </div>
    );
}
