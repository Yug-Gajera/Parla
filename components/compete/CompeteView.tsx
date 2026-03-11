"use client";

// ============================================================
// Parlova — Compete View (Redesigned)
// ============================================================

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaderboardTab } from './LeaderboardTab';
import { ChallengesTab } from './ChallengesTab';
import { MyStatsTab } from './MyStatsTab';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Challenge } from '@/lib/data/challenges';
import { Trophy } from 'lucide-react';

interface CompeteViewProps {
    languageId: string;
    initialLevel: string;
    activeChallenge: Challenge;
    userStats: any;
}

export function CompeteView({ languageId, initialLevel, activeChallenge, userStats }: CompeteViewProps) {

    // Fetch live leaderboard data
    const {
        entries, userEntry, isLoading,
        selectedLevel, selectedWeek,
        setLevelFilter, goToNextWeek, goToPreviousWeek
    } = useLeaderboard(languageId, initialLevel);

    // Calculate progression based on active challenge type
    let userChallengeProgress = 0;
    if (userStats) {
        if (activeChallenge.completion_criteria === 'conversation_count') {
            userChallengeProgress = userStats.conversation_count || 0;
        } else if (activeChallenge.completion_criteria === 'vocabulary_learned') {
            userChallengeProgress = userStats.vocabulary_learned || 0;
        } else if (activeChallenge.completion_criteria === 'consistency') {
            userChallengeProgress = userStats.consistency_days || 1; // Assuming a fallback of 1
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#080808] pt-12 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto font-sans">

            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl sm:text-5xl text-[#f0ece4] mb-3 tracking-tight font-serif">Compete</h1>
                    <p className="text-[#9a9590] text-lg font-light max-w-xl leading-relaxed">
                        Measure your language acquisition against the Parlova community.
                    </p>
                </div>
                <div className="hidden sm:flex h-16 w-16 rounded-full bg-[#141414] border border-[#1e1e1e] items-center justify-center">
                    <Trophy className="w-8 h-8 text-[#c9a84c]" />
                </div>
            </div>

            <Tabs defaultValue="leaderboard" className="w-full flex-1 flex flex-col">
                <TabsList className="flex w-full max-w-[400px] mb-10 bg-[#0f0f0f] border border-[#1e1e1e] p-1 rounded-full">
                    <TabsTrigger 
                        value="leaderboard" 
                        className="flex-1 rounded-full data-[state=active]:bg-[#141414] data-[state=active]:text-[#c9a84c] text-[#5a5652] data-[state=active]:border data-[state=active]:border-[#2a2a2a] data-[state=active]:shadow-sm transition-all"
                    >
                        Leaderboard
                    </TabsTrigger>
                    <TabsTrigger 
                        value="challenges" 
                        className="flex-1 rounded-full data-[state=active]:bg-[#141414] data-[state=active]:text-[#c9a84c] text-[#5a5652] data-[state=active]:border data-[state=active]:border-[#2a2a2a] data-[state=active]:shadow-sm transition-all"
                    >
                        Challenges
                    </TabsTrigger>
                    <TabsTrigger 
                        value="stats" 
                        className="flex-1 rounded-full data-[state=active]:bg-[#141414] data-[state=active]:text-[#c9a84c] text-[#5a5652] data-[state=active]:border data-[state=active]:border-[#2a2a2a] data-[state=active]:shadow-sm transition-all"
                    >
                        My Stats
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="leaderboard" className="flex-1 mt-0">
                    <LeaderboardTab
                        entries={entries}
                        userEntry={userEntry}
                        isLoading={isLoading}
                        selectedWeek={selectedWeek}
                        selectedLevel={selectedLevel}
                        onPrevWeek={goToPreviousWeek}
                        onNextWeek={goToNextWeek}
                        onLevelChange={setLevelFilter}
                    />
                </TabsContent>

                <TabsContent value="challenges" className="flex-1 mt-0">
                    <ChallengesTab
                        activeChallenge={activeChallenge}
                        userProgress={userChallengeProgress}
                        pastChallenges={[]} // Mock past challenges for MVP
                    />
                </TabsContent>

                <TabsContent value="stats" className="flex-1 mt-0">
                    <MyStatsTab stats={userStats} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
