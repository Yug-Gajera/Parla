"use client";

// ============================================================
// Parlova — My Stats Tab (Redesigned)
// ============================================================

import React from 'react';
import { Card } from '@/components/ui/card';
import { Flame, Brain, MessageSquare, Trophy, BarChart3 } from 'lucide-react';

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
        <div className="flex flex-col w-full max-w-4xl mx-auto gap-8 pb-16 font-sans">

            {/* Top Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-8 flex flex-col items-center justify-center text-center border-[#1e1e1e] bg-[#141414] hover:border-[#2a2a2a] transition-colors rounded-2xl">
                    <Trophy className="w-5 h-5 text-[#c9a84c] mb-4" />
                    <span className="text-4xl font-mono text-[#f0ece4] mb-2">{safeStats.total_xp}</span>
                    <span className="text-[10px] text-[#5a5652] uppercase tracking-[0.2em]">Total XP</span>
                </Card>
                <Card className="p-8 flex flex-col items-center justify-center text-center border-[#1e1e1e] bg-[#141414] hover:border-[#2a2a2a] transition-colors rounded-2xl">
                    <Flame className="w-5 h-5 text-[#c9a84c] mb-4" />
                    <span className="text-4xl font-mono text-[#f0ece4] mb-2">{safeStats.streak}</span>
                    <span className="text-[10px] text-[#5a5652] uppercase tracking-[0.2em]">Day Streak</span>
                </Card>
                <Card className="p-8 flex flex-col items-center justify-center text-center border-[#1e1e1e] bg-[#141414] hover:border-[#2a2a2a] transition-colors rounded-2xl">
                    <MessageSquare className="w-5 h-5 text-[#c9a84c] mb-4" />
                    <span className="text-4xl font-mono text-[#f0ece4] mb-2">{safeStats.conversations}</span>
                    <span className="text-[10px] text-[#5a5652] uppercase tracking-[0.2em]">Chats</span>
                </Card>
                <Card className="p-8 flex flex-col items-center justify-center text-center border-[#1e1e1e] bg-[#141414] hover:border-[#2a2a2a] transition-colors rounded-2xl">
                    <Brain className="w-5 h-5 text-[#c9a84c] mb-4" />
                    <span className="text-4xl font-mono text-[#f0ece4] mb-2">{safeStats.vocab}</span>
                    <span className="text-[10px] text-[#5a5652] uppercase tracking-[0.2em]">Words</span>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 8-Week XP Chart */}
                <Card className="p-8 border-[#1e1e1e] bg-[#141414] rounded-2xl flex flex-col h-80">
                    <div className="flex items-center justify-between mb-8 shrink-0">
                        <h3 className="text-sm uppercase tracking-[0.2em] text-[#9a9590] flex items-center gap-3">
                            <BarChart3 className="w-4 h-4 text-[#c9a84c]" /> Weekly Activity
                        </h3>
                    </div>

                    {/* SVG Bar Chart */}
                    <div className="flex-1 w-full flex items-end justify-between gap-3 overflow-hidden px-1 pb-1">
                        {weeklyData.map((val, i) => {
                            const isCurrent = i === weeklyData.length - 1;
                            const heightPct = Math.max((val / maxVal) * 100, 5); // 5% minimum height for visibility

                            return (
                                <div key={i} className="flex flex-col items-center w-full h-full justify-end group pl-1 pr-1">
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-[#9a9590] mb-3 absolute -mt-8">
                                        {val}
                                    </span>
                                    <div
                                        className={`w-full rounded-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                            isCurrent ? 'bg-[#c9a84c]' : 'bg-[#1e1e1e] group-hover:bg-[#2a2a2a]'
                                        }`}
                                        style={{ height: `${heightPct}%` }}
                                    ></div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Additional Stats & Badges */}
                <Card className="p-8 border-[#1e1e1e] bg-[#141414] rounded-2xl flex flex-col h-80">
                    <h3 className="text-sm uppercase tracking-[0.2em] text-[#9a9590] flex items-center gap-3 mb-8">
                        <Trophy className="w-4 h-4 text-[#c9a84c]" /> Achievements
                    </h3>

                    <div className="grid grid-cols-3 gap-5 auto-rows-max overflow-y-auto pr-2 custom-scrollbar">
                        {/* Mock rendering a few badges */}
                        {['Communicator', 'Fast Learner', 'Persistent', 'Scholar', 'Bilingual', 'Native'].map((badge, i) => {
                            const earned = i < 2; // user earned first 2
                            return (
                                <div key={i} className={`flex flex-col items-center gap-3 text-center p-4 rounded-xl border transition-colors ${
                                    earned 
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] hover:border-[#c9a84c]/50' 
                                        : 'bg-[#080808] border-[#1e1e1e] opacity-40 grayscale'
                                }`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                                        earned 
                                            ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30' 
                                            : 'bg-[#141414] text-[#5a5652] border-[#1e1e1e]'
                                    }`}>
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                    <span className={`text-[9px] font-mono uppercase tracking-[0.1em] leading-tight ${
                                        earned ? 'text-[#f0ece4]' : 'text-[#5a5652]'
                                    }`}>
                                        {badge}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

        </div>
    );
}
