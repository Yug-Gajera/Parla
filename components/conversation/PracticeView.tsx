"use client";

import React, { useState } from 'react';
import { SCENARIOS } from '@/lib/data/scenarios';
import { ConversationWindow } from './ConversationWindow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, Play, Clock, BarChart3, Star, LayoutGrid } from 'lucide-react';

// Maps lucide icon names from our DB to components
import * as LucideIcons from 'lucide-react';

interface PracticeViewProps {
    languageId: string;
    level: string;
    recentSessions: any[];
}

export default function PracticeView({ languageId, level, recentSessions }: PracticeViewProps) {
    const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

    // Level unlock hierarchy map
    const levelMap: Record<string, number> = {
        'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };
    const userLevelNum = levelMap[level] || 1;

    // Separate active scenario logic
    if (activeScenarioId) {
        return (
            <div className="fixed inset-0 z-50">
                <ConversationWindow
                    scenarioId={activeScenarioId}
                    languageId={languageId}
                    level={level}
                    onClose={() => setActiveScenarioId(null)}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-12 pb-24">

            <div className="mb-10">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Conversation Practice</h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    Choose a scenario, play your part, and improve your spoken fluency with real-time AI characters.
                </p>
            </div>

            {/* Recents */}
            {recentSessions && recentSessions.length > 0 && (
                <div className="mb-12">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Recent Sessions
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                        {recentSessions.slice(0, 3).map((session, i) => {
                            const sc = SCENARIOS.find(s => s.id === session.scenario_type); // Note: schema says scenario_type holds ID
                            return (
                                <Card key={i} className="min-w-[280px] sm:min-w-[320px] p-5 shrink-0 bg-card/60 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="font-semibold text-foreground truncate max-w-[180px]">{sc?.name || 'Scenario'}</div>
                                        <div className={`text-sm font-bold ${(session as any).overall_score >= 80 ? 'text-emerald-500' : 'text-primary'}`}>
                                            {(session as any).overall_score}%
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-4">
                                        {new Date(session.created_at).toLocaleDateString()} • {session.duration_minutes} mins
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full font-semibold"
                                        onClick={() => setActiveScenarioId(session.scenario_type)}
                                    >
                                        Replay Scenario
                                    </Button>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Grid */}
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" /> All Scenarios
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {SCENARIOS.map((scenario) => {
                    const reqLevelNum = levelMap[scenario.difficulty] || 1;
                    const isLocked = reqLevelNum > userLevelNum;

                    // Dynamically resolve icon
                    const IconComponent = (LucideIcons as any)[scenario.icon] || LucideIcons.MessageSquare;

                    return (
                        <Card
                            key={scenario.id}
                            className={`flex flex-col relative overflow-hidden transition-all duration-300 border-2 
                                ${isLocked ? 'bg-card/30 border-border/30 grayscale-[50%]' : 'bg-card border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1'}`
                            }
                        >
                            <div className="p-6 sm:p-8 flex flex-col h-full z-10">

                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                        <IconComponent className="w-6 h-6" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${isLocked
                                            ? 'bg-muted text-muted-foreground'
                                            : scenario.difficulty.startsWith('A') ? 'bg-blue-500/10 text-blue-500'
                                                : scenario.difficulty.startsWith('B') ? 'bg-amber-500/10 text-amber-500'
                                                    : 'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {scenario.difficulty}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-2 text-foreground">{scenario.name}</h3>
                                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                                    {scenario.description}
                                </p>

                                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-8 text-xs font-medium text-muted-foreground/80">
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {scenario.estimated_minutes} mins</span>
                                    <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> {scenario.user_role}</span>
                                </div>

                                <div className="mt-auto">
                                    {isLocked ? (
                                        <Button variant="secondary" className="w-full opacity-50 cursor-not-allowed font-semibold" disabled>
                                            <Lock className="w-4 h-4 mr-2" /> Unlocks at {scenario.difficulty}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setActiveScenarioId(scenario.id)}
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 text-base"
                                        >
                                            <Play className="w-4 h-4 mr-2 fill-current" /> Play Scenario
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
