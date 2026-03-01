"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Flame, Brain, MessageSquare, Clock, Trophy, BarChart3 } from 'lucide-react';

interface MyStatsTabProps {
    stats: any; // User stats from the server
}

export function MyStatsTab({ stats }: MyStatsTabProps) {

    // Fallback zero state if stats object isn't fully hydrated yet
    const safeStats = {
        total_xp: stats?.total_score || 0,
        conversations: stats?.conversation_count || 0,
        vocab: stats?.vocabulary_learned || 0,
        streak: 1, // Mock streak for MVP
        highest_score: 94, // Mock
        minutes: stats?.content_consumed_minutes || 0
    };

    // Mock weekly graph data for the SVG 8-week chart
    const weeklyData = [450, 600, 300, 800, 1200, 950, 1500, safeStats.total_xp % 2000];
    const maxVal = Math.max(...weeklyData, 100);

    return (
        <div className="flex flex-col w-full max-w-4xl mx-auto gap-8 pb-12">

            {/* Top Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col items-center justify-center text-center border-border/50 bg-card/50">
                    <Trophy className="w-6 h-6 text-amber-500 mb-2" />
                    <span className="text-3xl font-black tracking-tighter text-foreground mb-1">{safeStats.total_xp}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total XP</span>
                </Card>
                <Card className="p-5 flex flex-col items-center justify-center text-center border-border/50 bg-card/50">
                    <Flame className="w-6 h-6 text-orange-500 mb-2" />
                    <span className="text-3xl font-black tracking-tighter text-foreground mb-1">{safeStats.streak}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Day Streak</span>
                </Card>
                <Card className="p-5 flex flex-col items-center justify-center text-center border-border/50 bg-card/50">
                    <MessageSquare className="w-6 h-6 text-violet-500 mb-2" />
                    <span className="text-3xl font-black tracking-tighter text-foreground mb-1">{safeStats.conversations}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Chats</span>
                </Card>
                <Card className="p-5 flex flex-col items-center justify-center text-center border-border/50 bg-card/50">
                    <Brain className="w-6 h-6 text-emerald-500 mb-2" />
                    <span className="text-3xl font-black tracking-tighter text-foreground mb-1">{safeStats.vocab}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Words</span>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 8-Week XP Chart */}
                <Card className="p-6 border-border/50 bg-card flex flex-col h-72">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <h3 className="font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Weekly XP</h3>
                    </div>

                    {/* SVG Bar Chart */}
                    <div className="flex-1 w-full flex items-end justify-between gap-2 overflow-hidden px-2 pb-2">
                        {weeklyData.map((val, i) => {
                            const isCurrent = i === weeklyData.length - 1;
                            const heightPct = Math.max((val / maxVal) * 100, 5); // 5% minimum height for visibility

                            return (
                                <div key={i} className="flex flex-col items-center w-full h-full justify-end group">
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-muted-foreground mb-2 absolute -mt-6">
                                        {val}
                                    </span>
                                    <div
                                        className={`w-full rounded-t-md transition-all duration-500 ${isCurrent ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'}`}
                                        style={{ height: `${heightPct}%` }}
                                    ></div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Additional Stats & Badges */}
                <Card className="p-6 border-border/50 bg-card flex flex-col min-h-72">
                    <h3 className="font-bold flex items-center gap-2 mb-6"><Trophy className="w-5 h-5 text-amber-500" /> Achievements</h3>

                    <div className="grid grid-cols-3 gap-4 auto-rows-max">
                        {/* Mock rendering a few badges */}
                        {['Conversationalist', 'Word Collector', 'Early Bird', 'Night Owl', 'Perfect Score', 'Marathon'].map((badge, i) => {
                            const earned = i < 2; // user earned first 2
                            return (
                                <div key={i} className={`flex flex-col items-center gap-2 text-center p-3 rounded-2xl border ${earned ? 'bg-amber-500/10 border-amber-500/20' : 'bg-muted/30 border-border opacity-50 grayscale'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${earned ? 'bg-amber-500 text-amber-950' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold leading-tight uppercase tracking-wider">{badge}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

        </div>
    );
}
