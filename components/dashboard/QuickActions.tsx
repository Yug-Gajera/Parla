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
        title: 'Practice Conversation',
        subtitle: '3 scenarios available',
        variant: 'gold' as VariantName,
        hoverStyles: 'group-hover:bg-gold-subtle group-hover:border-gold-border group-hover:text-gold',
        iconColor: 'text-gold'
    },
    {
        href: '/learn',
        icon: Layers,
        title: 'Study Vocabulary',
        subtitle: '12 words due today',
        variant: 'neutral' as VariantName,
        hoverStyles: 'group-hover:bg-accent-subtle group-hover:border-accent-border group-hover:text-accent',
        iconColor: 'text-accent'
    },
    {
        href: '/learn?tab=lessons',
        icon: BookOpen,
        title: 'Take a Lesson',
        subtitle: 'Grammar: Past Tense',
        variant: 'success' as VariantName,
        hoverStyles: 'group-hover:bg-success-subtle group-hover:border-success-border group-hover:text-success',
        iconColor: 'text-success'
    },
    {
        href: '/compete',
        icon: Trophy,
        title: 'Leaderboard',
        subtitle: 'Rank #4 in Silver',
        variant: 'gold' as VariantName,
        hoverStyles: 'group-hover:bg-gold-subtle group-hover:border-gold-border group-hover:text-gold',
        iconColor: 'text-gold'
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
                        className="group flex flex-col p-4 rounded-xl bg-surface border border-border hover:border-border-strong transition-all duration-300 relative overflow-hidden w-full h-full"
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
                <div key={i} className="flex flex-col p-4 rounded-xl bg-surface border border-border animate-pulse">
                    <div className="w-[40px] h-[40px] rounded-[10px] bg-card mb-8" />
                    <div className="h-[16px] w-[140px] bg-border rounded mb-[8px]" />
                    <div className="h-[10px] w-[100px] bg-card rounded" />
                </div>
            ))}
        </div>
    );
}
