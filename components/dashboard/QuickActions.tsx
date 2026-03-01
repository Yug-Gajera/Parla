// ============================================================
// FluentLoop — Quick Actions Grid
// ============================================================

import React from 'react';
import Link from 'next/link';
import { Mic, Layers, BookOpen, Trophy, ArrowRight } from 'lucide-react';

const ACTIONS = [
    {
        href: '/practice',
        icon: Mic,
        title: 'Practice Conversation',
        subtitle: '3 scenarios available',
        grad: 'from-violet-500/20 to-violet-500/5',
        iconColor: 'text-violet-500',
        border: 'hover:border-violet-500/50',
    },
    {
        href: '/learn',
        icon: Layers,
        title: 'Study Vocabulary',
        subtitle: '12 words due today',
        grad: 'from-blue-500/20 to-blue-500/5',
        iconColor: 'text-blue-500',
        border: 'hover:border-blue-500/50',
    },
    {
        href: '/learn?tab=lessons',
        icon: BookOpen,
        title: 'Take a Lesson',
        subtitle: 'Grammar: Past Tense',
        grad: 'from-emerald-500/20 to-emerald-500/5',
        iconColor: 'text-emerald-500',
        border: 'hover:border-emerald-500/50',
    },
    {
        href: '/compete',
        icon: Trophy,
        title: 'Leaderboard',
        subtitle: 'Rank #4 in Silver',
        grad: 'from-amber-500/20 to-amber-500/5',
        iconColor: 'text-amber-500',
        border: 'hover:border-amber-500/50',
    }
];

export default function QuickActions() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                    <Link
                        key={i}
                        href={action.href}
                        className={`
              relative flex flex-col justify-between p-5 rounded-3xl bg-card border border-border 
              transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:bg-gradient-to-br ${action.grad} ${action.border}
              group overflow-hidden
            `}
                    >
                        {/* Top Row */}
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-2xl bg-background ${action.iconColor} shadow-inner`}>
                                <Icon size={24} />
                            </div>
                            <ArrowRight size={20} className="text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:-rotate-45 transition-all duration-300" />
                        </div>

                        {/* Bottom Row */}
                        <div>
                            <h3 className="font-bold text-lg leading-tight mb-1">{action.title}</h3>
                            <p className="text-sm text-muted-foreground font-medium">{action.subtitle}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-5 rounded-3xl bg-card border border-border animate-pulse h-[160px] flex flex-col justify-between">
                    <div className="flex justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-muted" />
                        <div className="w-6 h-6 rounded bg-muted" />
                    </div>
                    <div>
                        <div className="h-5 w-32 bg-muted rounded mb-2" />
                        <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}
