'use client';

// ============================================================
// FluentLoop — Recent Activity List
// ============================================================

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Mic, Book, PlayCircle, FileCheck, ArrowRight } from 'lucide-react';

interface Session {
    id: string;
    session_type: string;
    duration_minutes: number;
    xp_earned: number;
    created_at: string;
}

interface RecentActivityProps {
    sessions: Session[];
}

export default function RecentActivity({ sessions }: RecentActivityProps) {

    if (!sessions || sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-card border border-border border-dashed rounded-3xl text-center min-h-[250px]">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-4">
                    <Mic size={32} />
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2">No activity yet</h3>
                <p className="text-muted-foreground text-sm max-w-[250px] mb-6">
                    Start your first session to begin earning XP and building your streak.
                </p>
                <Link
                    href="/practice"
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                    Start Practicing
                </Link>
            </div>
        );
    }

    const getIconData = (type: string) => {
        switch (type) {
            case 'conversation': return { Icon: Mic, color: 'text-violet-500', bg: 'bg-violet-500/10' };
            case 'vocabulary': return { Icon: Book, color: 'text-blue-500', bg: 'bg-blue-500/10' };
            case 'content': return { Icon: PlayCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
            case 'test': return { Icon: FileCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' };
            default: return { Icon: Book, color: 'text-foreground', bg: 'bg-secondary' };
        }
    };

    const formatTitle = (type: string) => {
        switch (type) {
            case 'conversation': return 'Conversation Practice';
            case 'vocabulary': return 'Vocabulary Review';
            case 'content': return 'Content Comprehension';
            case 'test': return 'Level Test';
            default: return 'Study Session';
        }
    }

    return (
        <div className="flex flex-col w-full bg-card border border-border rounded-3xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                    Activity history
                </h2>
                <Link href="/profile" className="text-xs font-medium text-primary hover:underline flex items-center gap-1 group">
                    View all
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* List */}
            <div className="flex flex-col divide-y divide-border/30">
                {sessions.slice(0, 5).map((session) => {
                    const { Icon, color, bg } = getIconData(session.session_type);
                    const timeAgo = formatDistanceToNow(new Date(session.created_at), { addSuffix: true });

                    return (
                        <div key={session.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors">

                            {/* Left: Icon & Details */}
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color}`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm md:text-base leading-tight">
                                        {formatTitle(session.session_type)}
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                        <span>{timeAgo}</span>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span>{session.duration_minutes} min</span>
                                    </span>
                                </div>
                            </div>

                            {/* Right: XP */}
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-emerald-500">+{session.xp_earned}</span>
                                <span className="text-xs font-bold text-emerald-500/70">XP</span>
                            </div>

                        </div>
                    );
                })}
            </div>

        </div>
    );
}

// ── SKELETON ──
export function RecentActivitySkeleton() {
    return (
        <div className="flex flex-col w-full bg-card border border-border rounded-3xl overflow-hidden animate-pulse">
            <div className="px-6 py-5 border-b border-border/50 flex justify-between">
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
            </div>
            <div className="flex flex-col divide-y divide-border/30">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-muted" />
                            <div className="flex flex-col gap-2">
                                <div className="h-5 w-40 bg-muted rounded" />
                                <div className="h-3 w-24 bg-muted rounded" />
                            </div>
                        </div>
                        <div className="h-6 w-12 bg-muted rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
