"use client";

// ============================================================
// Parlova — Quick Actions Grid (Redesigned)
// ============================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { Mic2, Layers, BookOpen, Trophy, ArrowRight } from 'lucide-react';

type VariantName = 'gold' | 'success' | 'warning' | 'error' | 'neutral';

const ACTIONS = [
    {
        href: '/practice',
        icon: Mic2,
        title: 'Talk',
        subtitle: '3 topics ready',
        variant: 'gold' as VariantName, // kept variant name for logic but updated styles
        hoverStyles: 'group-hover:bg-[#E8521A]/10 group-hover:border-[#E8521A]/20 group-hover:text-[#E8521A]',
        iconColor: 'text-[#E8521A]',
        tourId: 'start-conversation',
    },
    {
        href: '/learn',
        icon: Layers,
        title: 'Review words',
        subtitle: '12 words to review',
        variant: 'neutral' as VariantName,
        hoverStyles: 'group-hover:bg-accent-subtle group-hover:border-accent-border group-hover:text-accent',
        iconColor: 'text-accent',
        tourId: 'vocabulary-section',
    },
    {
        href: '/learn?tab=lessons',
        icon: BookOpen,
        title: 'Learn grammar',
        subtitle: 'Today: Past Tense',
        variant: 'success' as VariantName,
        hoverStyles: 'group-hover:bg-success-subtle group-hover:border-success-border group-hover:text-success',
        iconColor: 'text-success',
        tourId: null,
    },
    {
        href: '/compete',
        icon: Trophy,
        title: 'Leaderboard',
        subtitle: 'Rank #4 in Silver',
        variant: 'gold' as VariantName,
        hoverStyles: 'group-hover:bg-[#E8521A]/10 group-hover:border-[#E8521A]/20 group-hover:text-[#E8521A]',
        iconColor: 'text-[#E8521A]',
        tourId: null,
    }
];

export default function QuickActions() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            {ACTIONS.map((action, i) => {
                const Icon = action.icon;
                
                return (
                    <Link
                        key={i}
                        href={action.href}
                        data-tour={action.tourId || undefined}
                        className="group flex flex-col p-4 rounded-[18px] bg-card border border-border hover:border-accent-border hover:shadow-md transition-all duration-300 relative overflow-hidden w-full h-full"
                    >
                        <div className="flex items-center justify-between mb-8 w-full">
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 
                                border border-transparent bg-transparent
                                ${action.hoverStyles}
                            `}>
                                <Icon size={18} strokeWidth={1.5} className="text-text-muted group-hover:text-inherit transition-colors duration-300" />
                            </div>

                            <div className={`
                                text-transparent flex items-center justify-center -mr-2 group-hover:mr-0 
                                transition-all duration-300 opacity-0 group-hover:opacity-100 
                                transform translate-x-2 group-hover:translate-x-0 ${action.iconColor}
                            `}>
                                <ArrowRight size={14} strokeWidth={2} />
                            </div>
                        </div>

                        <div>
                            <div className="font-display text-text-primary text-base mb-1 transition-colors">{action.title}</div>
                            <div className="font-mono-num text-[10px] uppercase tracking-widest text-text-muted">{action.subtitle}</div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

// ── SKELETON ──
export function QuickActionsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[12px] w-full">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col p-4 rounded-[18px] bg-card border border-border animate-pulse">
                    <div className="w-[40px] h-10 rounded-xl bg-surface mb-8" />
                    <div className="h-4 w-[140px] bg-surface rounded mb-2" />
                    <div className="h-2.5 w-[100px] bg-surface rounded" />
                </div>
            ))}
        </div>
    );
}
