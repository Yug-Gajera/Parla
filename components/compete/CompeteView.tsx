"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaderboardTab } from './LeaderboardTab';
import { ChallengesTab } from './ChallengesTab';
import { MyStatsTab } from './MyStatsTab';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Challenge } from '@/lib/data/challenges';

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
        <div className="flex flex-col h-full bg-background pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

            <div className="mb-8">
                <h1 className="text-4xl font-black text-foreground mb-2 tracking-tight">Compete</h1>
                <p className="text-muted-foreground">See how you stack up against the rest of the Parlova community.</p>
            </div>

            <Tabs defaultValue="leaderboard" className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
                    <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                    <TabsTrigger value="challenges">Challenges</TabsTrigger>
                    <TabsTrigger value="stats">My Stats</TabsTrigger>
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
