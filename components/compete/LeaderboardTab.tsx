"use client";

// ============================================================
// Parlova — Leaderboard Tab (Redesigned)
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { LeaderboardEntry } from '@/hooks/useLeaderboard';
import Link from 'next/link';

interface LeaderboardTabProps {
    entries: LeaderboardEntry[];
    userEntry: LeaderboardEntry | null;
    isLoading: boolean;
    selectedWeek: Date;
    selectedLevel: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onLevelChange: (level: string) => void;
}

export function LeaderboardTab({
    entries, userEntry, isLoading,
    selectedWeek, selectedLevel,
    onPrevWeek, onNextWeek, onLevelChange
}: LeaderboardTabProps) {

    // Format week
    const weekEnd = new Date(selectedWeek);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekStr = `${selectedWeek.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;

    const isCurrentWeek = new Date().getTime() - selectedWeek.getTime() < 7 * 24 * 60 * 60 * 1000;

    const listV = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const rowV = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    const renderRow = (entry: LeaderboardEntry, isPinned = false) => {
        const isTop3 = typeof entry.rank === 'number' && entry.rank <= 3;
        
        let rankColor = 'text-text-muted';
        if (entry.rank === 1) rankColor = 'text-gold'; // Gold
        if (entry.rank === 2) rankColor = 'text-text-secondary'; // Silver
        if (entry.rank === 3) rankColor = 'text-text-secondary'; // Bronze

        return (
            <motion.div
                variants={isPinned ? undefined : rowV}
                key={isPinned ? 'pinned' : entry.id}
                className={`flex items-center gap-5 p-5 rounded-[18px] transition-all border
                    ${isPinned ? 'bg-surface/90 border-accent-border shadow-lg sticky top-0 z-10 backdrop-blur-md' : 'bg-card border-border hover:border-accent-border'}
                    ${entry.is_current_user && !isPinned ? 'border-accent-border shadow-sm' : ''}
                `}
            >
                {/* Rank / Trophy */}
                <div className={`w-10 h-10 shrink-0 flex items-center justify-center font-mono-num font-light text-lg ${rankColor}`}>
                    {entry.rank === 1 ? <Trophy className="w-5 h-5 text-gold" /> :
                        entry.rank === 2 ? <Trophy className="w-5 h-5 text-text-muted" /> :
                            entry.rank === 3 ? <Trophy className="w-5 h-5 text-text-muted" /> :
                                <span className="flex items-center text-sm"><Hash className="w-3 h-3 mr-0.5 opacity-50" />{entry.rank}</span>}
                </div>

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono-num text-sm shrink-0 border
                    ${entry.is_current_user 
                        ? 'bg-gold-subtle text-gold border-accent-border' 
                        : 'bg-card text-text-muted border-border'}
                `}>
                    {entry.avatar}
                </div>

                {/* Name */}
                <div className="flex-1 truncate">
                    <div className={`font-medium text-base flex items-center gap-3 ${entry.is_current_user ? 'text-accent' : 'text-text-primary'}`}>
                        {entry.name}
                        {entry.is_current_user && (
                            <span className="pill-score py-0.5 px-3">You</span>
                        )}
                    </div>
                    {isPinned && <div className="text-[10px] font-mono-num text-text-muted mt-1 uppercase tracking-widest">Current Position</div>}
                </div>

                {/* Score */}
                <div className="text-right shrink-0 flex flex-col items-end">
                    <div className="pill-score w-fit mb-1">
                        {entry.weekly_score} XP
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col w-full max-w-3xl mx-auto gap-8 pb-16 font-sans">

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-[18px] border border-border shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-card text-text-muted" onClick={onPrevWeek}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex flex-col items-center min-w-[160px]">
                        <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1">Week Of</span>
                        <span className="font-mono-num text-sm text-text-primary">{weekStr}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-card text-text-muted" onClick={onNextWeek} disabled={isCurrentWeek}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full sm:w-auto">
                    {['Beginner', 'Intermediate', 'Advanced'].map(lvl => {
                        const isMatch = selectedLevel.startsWith(lvl);
                        return (
                            <Button
                                key={lvl}
                                variant="ghost"
                                size="sm"
                                className={`rounded-full shrink-0 text-xs px-5 border transition-all ${
                                    isMatch 
                                        ? 'bg-card text-gold border-border-strong' 
                                        : 'bg-transparent text-text-muted border-transparent hover:text-text-primary hover:bg-card'
                                }`}
                                onClick={() => {
                                    if(lvl === 'Beginner') onLevelChange('Beginner (A1-A2)');
                                    if(lvl === 'Intermediate') onLevelChange('Intermediate (B1-B2)');
                                    if(lvl === 'Advanced') onLevelChange('Advanced (C1-C2)');
                                }}
                            >
                                {lvl}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Pinned User Entry */}
            {userEntry && renderRow(userEntry, true)}

            {/* Leaderboard List */}
            {isLoading ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-[#0f0f0f]" />)}
                </div>
            ) : entries.length === 0 ? (
                <Card className="p-16 flex flex-col items-center justify-center text-center border border-border border-dashed bg-card rounded-[18px] shadow-sm">
                    <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mb-6">
                        <Trophy className="w-6 h-6 text-text-muted" />
                    </div>
                    <h3 className="text-xl text-text-primary font-display mb-3">Leaderboard Empty</h3>
                    <p className="text-text-secondary text-sm max-w-sm mb-8 leading-relaxed">
                        No activity recorded for this level in the selected week. Start practicing to claim the top spot.
                    </p>
                    <Button asChild className="btn-action w-fit px-8 h-12">
                        <Link href="/practice">Begin Practice</Link>
                    </Button>
                </Card>
            ) : (
                <motion.div variants={listV} initial="hidden" animate="show" className="flex flex-col gap-3 relative">
                    {entries.map(e => renderRow(e))}

                    {/* User is outside top 100 but has points */}
                    {userEntry && typeof userEntry.rank === 'number' && userEntry.rank > 100 && (
                        <>
                            <div className="flex justify-center py-4 text-text-muted">
                                <span className="w-1 h-1 rounded-full bg-border-strong mx-1" />
                                <span className="w-1 h-1 rounded-full bg-border-strong mx-1" />
                                <span className="w-1 h-1 rounded-full bg-border-strong mx-1" />
                            </div>
                            {renderRow(userEntry)}
                        </>
                    )}
                </motion.div>
            )}

        </div>
    );
}
