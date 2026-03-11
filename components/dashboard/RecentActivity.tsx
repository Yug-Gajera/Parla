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
            <div className="flex flex-col items-center justify-center p-10 bg-[#0f0f0f] border border-[#1e1e1e] border-dashed rounded-3xl text-center min-h-[250px] font-sans">
                <div className="w-16 h-16 rounded-full bg-[#141414] border border-[#2a2a2a] flex items-center justify-center mb-6 shadow-inner">
                    <Activity className="w-6 h-6 text-[#5a5652]" />
                </div>
                <h3 className="text-xl font-serif text-[#f0ece4] mb-3">No activity recorded</h3>
                <p className="text-[#9a9590] text-sm max-w-[280px] mb-8 leading-relaxed">
                    Initiate your first session to begin earning XP and establishing a baseline.
                </p>
                <Link
                    href="/practice"
                    className="px-8 py-3.5 rounded-full bg-[#c9a84c] text-[#080808] font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-[#b98e72] transition-colors shadow-[0_4px_20px_rgba(201,168,76,0.15)]"
                >
                    Deploy Session
                </Link>
            </div>
        );
    }

    const getIconData = (type: string) => {
        switch (type) {
            case 'conversation': return { Icon: Mic2, color: 'text-[#c9a84c]', bg: 'bg-[#c9a84c]/10 border border-[#c9a84c]/20' };
            case 'vocabulary': return { Icon: Book, color: 'text-[#e4c76b]', bg: 'bg-[#e4c76b]/10 border border-[#e4c76b]/20' };
            case 'content': return { Icon: PlayCircle, color: 'text-[#f0ece4]', bg: 'bg-[#1e1e1e] border border-[#2a2a2a]' };
            case 'test': return { Icon: FileCheck, color: 'text-[#9a9590]', bg: 'bg-[#141414] border border-[#1e1e1e]' };
            default: return { Icon: Book, color: 'text-[#5a5652]', bg: 'bg-[#0f0f0f] border border-[#1e1e1e]' };
        }
    };

    const formatTitle = (type: string) => {
        switch (type) {
            case 'conversation': return 'Simulated Dialogue';
            case 'vocabulary': return 'Lexical Reinforcement';
            case 'content': return 'Comprehension Analysis';
            case 'test': return 'Diagnostic Evaluation';
            default: return 'Study Session';
        }
    }

    return (
        <div className="flex flex-col w-full bg-[#141414] border border-[#1e1e1e] rounded-3xl overflow-hidden font-sans">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e1e]">
                <h2 className="font-serif text-[16px] text-[#f0ece4] flex items-center gap-2">
                    Telemetry Stream
                </h2>
                <Link href="/profile" className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#c9a84c] hover:text-[#e4c76b] flex items-center gap-1.5 group transition-colors">
                    View Logs
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* List */}
            <div className="flex flex-col divide-y divide-[#1e1e1e]">
                {sessions.slice(0, 5).map((session) => {
                    const { Icon, color, bg } = getIconData(session.session_type);
                    const timeAgo = formatDistanceToNow(new Date(session.created_at), { addSuffix: true });

                    return (
                        <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-[#171717] transition-colors group">

                            {/* Left: Icon & Details */}
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${bg} ${color}`}>
                                    <Icon size={20} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-serif text-[15px] text-[#f0ece4] mb-0.5">
                                        {formatTitle(session.session_type)}
                                    </span>
                                    <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-[0.1em] flex items-center gap-2">
                                        <span>{timeAgo}</span>
                                        <span className="w-1 h-1 rounded-full bg-[#2a2a2a]" />
                                        <span>{session.duration_minutes} MIN</span>
                                    </span>
                                </div>
                            </div>

                            {/* Right: XP */}
                            <div className="flex items-center gap-1 mt-3 sm:mt-0 ml-16 sm:ml-0 bg-[#0f0f0f] sm:bg-transparent px-3 py-1 sm:p-0 rounded-md sm:rounded-none w-fit">
                                <span className="font-mono text-[13px] font-bold text-[#c9a84c] group-hover:text-[#e4c76b] transition-colors">+{session.xp_earned}</span>
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#c9a84c]/60">XP</span>
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
        <div className="flex flex-col w-full bg-[#141414] border border-[#1e1e1e] rounded-3xl overflow-hidden animate-pulse">
            <div className="px-6 py-5 border-b border-[#1e1e1e] flex justify-between items-center">
                <div className="h-4 w-32 bg-[#1e1e1e] rounded" />
                <div className="h-3 w-16 bg-[#1e1e1e] rounded" />
            </div>
            <div className="flex flex-col divide-y divide-[#1e1e1e]">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-3 sm:gap-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#1e1e1e]" />
                            <div className="flex flex-col gap-2">
                                <div className="h-4 w-40 bg-[#1e1e1e] rounded" />
                                <div className="h-2.5 w-24 bg-[#1e1e1e] rounded" />
                            </div>
                        </div>
                        <div className="h-5 w-12 bg-[#1e1e1e] rounded ml-16 sm:ml-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
