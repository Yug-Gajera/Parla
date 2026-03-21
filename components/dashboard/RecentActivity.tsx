'use client';

// ============================================================
// Parlova — Recent Activity List (Redesigned)
// ============================================================

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Mic2, Book, PlayCircle, FileCheck, ArrowRight, Activity } from 'lucide-react';

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
            <div className="flex flex-col items-center justify-center p-10 bg-surface border border-border border-dashed rounded-3xl text-center min-h-[250px] font-sans">
                <div className="w-16 h-16 rounded-full bg-card border border-border-strong flex items-center justify-center mb-6 shadow-inner">
                    <Activity className="w-6 h-6 text-text-muted" />
                </div>
                <h3 className="text-xl font-display text-text-primary mb-3">Nothing here yet</h3>
                <p className="text-text-secondary text-sm max-w-[280px] mb-8 leading-relaxed">
                    Do a quick lesson or review some words to get started.
                </p>
                <div className="w-full max-w-[200px]">
                    <Link
                        href="/practice"
                        className="btn-action"
                    >
                        Start learning
                    </Link>
                </div>
            </div>
        );
    }

    const getIconData = (type: string) => {
        switch (type) {
            case 'conversation': return { Icon: Mic2, color: 'text-[#E8521A]', bg: 'bg-[#E8521A]/10 border border-[#E8521A]/20' };
            case 'vocabulary': return { Icon: Book, color: 'text-[#E8521A]', bg: 'bg-[#E8521A]/10 border border-[#E8521A]/20' };
            case 'content': return { Icon: PlayCircle, color: 'text-text-primary', bg: 'bg-border border border-border-strong' };
            case 'test': return { Icon: FileCheck, color: 'text-text-secondary', bg: 'bg-card border border-border' };
            default: return { Icon: Book, color: 'text-text-muted', bg: 'bg-surface border border-border' };
        }
    };

    const formatTitle = (type: string) => {
        switch (type) {
            case 'conversation': return 'Conversation';
            case 'vocabulary': return 'Word Review';
            case 'content': return 'Reading';
            case 'test': return 'Level Test';
            default: return 'Study Time';
        }
    }

    return (
        <div className="flex flex-col w-full bg-card border border-border rounded-[18px] shadow-sm overflow-hidden font-sans">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h2 className="font-display font-medium text-[16px] text-text-primary flex items-center gap-2">
                    Recent Activity
                </h2>
                <Link href="/profile" className="text-[10px] font-mono-num font-bold uppercase tracking-widest text-[#E8521A] hover:text-[#D94A15] flex items-center gap-1.5 group transition-colors">
                    View all
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* List */}
            <div className="flex flex-col divide-y divide-border">
                {sessions.slice(0, 5).map((session) => {
                    const { Icon, color, bg } = getIconData(session.session_type);
                    const timeAgo = formatDistanceToNow(new Date(session.created_at), { addSuffix: true });

                    return (
                        <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-card-hover transition-colors group">

                            {/* Left: Icon & Details */}
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${bg} ${color}`}>
                                    <Icon size={20} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-display font-medium text-[15px] text-text-primary mb-0.5">
                                        {formatTitle(session.session_type)}
                                    </span>
                                    <span className="text-[10px] font-mono-num text-text-muted uppercase tracking-[0.1em] flex items-center gap-2">
                                        <span>{timeAgo}</span>
                                        <span className="w-1 h-1 rounded-full bg-border-strong" />
                                        <span>{session.duration_minutes} MIN</span>
                                    </span>
                                </div>
                            </div>

                            {/* Right: XP */}
                            <div className="flex items-center gap-1 mt-3 sm:mt-0 ml-16 sm:ml-0 bg-surface sm:bg-transparent px-3 py-1 sm:p-0 rounded-md sm:rounded-none w-fit">
                                <span className="font-mono-num text-[13px] font-bold text-[#E8521A] group-hover:text-[#D94A15] transition-colors">+{session.xp_earned}</span>
                                <span className="text-[9px] font-mono-num font-bold uppercase tracking-widest text-[#E8521A]/60">XP</span>
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
            <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <div className="h-4 w-32 bg-border rounded" />
                <div className="h-3 w-16 bg-border rounded" />
            </div>
            <div className="flex flex-col divide-y divide-border">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-3 sm:gap-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-border" />
                            <div className="flex flex-col gap-2">
                                <div className="h-4 w-40 bg-border rounded" />
                                <div className="h-2.5 w-24 bg-border rounded" />
                            </div>
                        </div>
                        <div className="h-5 w-12 bg-border rounded ml-16 sm:ml-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
