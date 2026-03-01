"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { LeaderboardEntry } from '@/hooks/useLeaderboard';

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

        return (
            <motion.div
                variants={isPinned ? undefined : rowV}
                key={isPinned ? 'pinned' : entry.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all
                    ${isPinned ? 'bg-primary/10 border border-primary shadow-lg sticky top-0 z-10 backdrop-blur-md' : 'bg-card border border-border hover:bg-muted/50'}
                    ${entry.is_current_user && !isPinned ? 'ring-1 ring-primary/50' : ''}
                `}
            >
                {/* Rank / Trophy */}
                <div className="w-10 h-10 shrink-0 flex items-center justify-center font-bold text-lg">
                    {entry.rank === 1 ? <Trophy className="w-6 h-6 text-amber-400 fill-amber-400" /> :
                        entry.rank === 2 ? <Trophy className="w-6 h-6 text-gray-400 fill-gray-400" /> :
                            entry.rank === 3 ? <Trophy className="w-6 h-6 text-amber-600 fill-amber-600" /> :
                                <span className="text-muted-foreground"><Hash className="w-4 h-4 inline mr-0.5" />{entry.rank}</span>}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                    ${entry.is_current_user ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}
                `}>
                    {entry.avatar}
                </div>

                {/* Name */}
                <div className="flex-1 truncate">
                    <div className="font-bold flex items-center gap-2">
                        {entry.name}
                        {entry.is_current_user && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase">You</span>}
                    </div>
                    {isPinned && <div className="text-xs text-muted-foreground mt-0.5">Current Rank</div>}
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                    <div className={`font-black tracking-tight text-xl ${isTop3 ? 'text-amber-500' : 'text-foreground'}`}>
                        {entry.weekly_score}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">XP</div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col w-full max-w-3xl mx-auto gap-8 pb-12">

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-3xl border border-border">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={onPrevWeek}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col items-center min-w-[160px]">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Week Of</span>
                        <span className="font-semibold text-foreground">{weekStr}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={onNextWeek} disabled={isCurrentWeek}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex overflow-x-auto gap-2 hide-scrollbar w-full sm:w-auto">
                    {['Beginner (A1-A2)', 'Intermediate (B1-B2)', 'Advanced (C1-C2)'].map(lvl => (
                        <Button
                            key={lvl}
                            variant={selectedLevel === lvl ? 'default' : 'secondary'}
                            size="sm"
                            className="rounded-full shrink-0"
                            onClick={() => onLevelChange(lvl)}
                        >
                            {lvl.split(' ')[0]}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Pinned User Entry */}
            {userEntry && renderRow(userEntry, true)}

            {/* Leaderboard List */}
            {isLoading ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                </div>
            ) : entries.length === 0 ? (
                <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="w-8 h-8 text-primary opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No scores this week... yet</h3>
                    <p className="text-muted-foreground max-w-md">
                        Be the first to claim the #1 spot! Complete a conversation or learn new words to gain XP.
                    </p>
                </Card>
            ) : (
                <motion.div variants={listV} initial="hidden" animate="show" className="flex flex-col gap-3 relative">
                    {entries.map(e => renderRow(e))}

                    {/* User is outside top 100 but has points */}
                    {userEntry && typeof userEntry.rank === 'number' && userEntry.rank > 100 && (
                        <>
                            <div className="flex justify-center py-2 text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-border mx-1" />
                                <span className="w-1.5 h-1.5 rounded-full bg-border mx-1" />
                                <span className="w-1.5 h-1.5 rounded-full bg-border mx-1" />
                            </div>
                            {renderRow(userEntry)}
                        </>
                    )}
                </motion.div>
            )}

        </div>
    );
}
