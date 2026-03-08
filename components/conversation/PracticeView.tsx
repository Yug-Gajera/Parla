"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SCENARIOS } from '@/lib/data/scenarios';
import dynamic from 'next/dynamic';
const ConversationWindow = dynamic(() => import('./ConversationWindow').then(mod => mod.ConversationWindow), {
    loading: () => <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center">Connecting to AI...</div>,
    ssr: false
});
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, Play, Clock, BarChart3, Star, LayoutGrid, BookOpen, X, Shuffle, ArrowRight, RefreshCcw } from 'lucide-react';
import { useModules } from '@/hooks/useModules';
import { useSituationHistory } from '@/hooks/useSituationHistory';
import { motion, AnimatePresence } from 'framer-motion';

// Maps lucide icon names from our DB to components
import * as LucideIcons from 'lucide-react';

interface PracticeViewProps {
    languageId: string;
    level: string;
    recentSessions: any[];
}

interface PreSessionData {
    scenarioId: string;
    scenarioName: string;
    userRole: string;
    goal: string;
    estimatedMinutes: number;
    situationTeaser?: string;
}

export default function PracticeView({ languageId, level, recentSessions }: PracticeViewProps) {
    const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
    const [preSession, setPreSession] = useState<PreSessionData | null>(null);
    const { isUnlocked, totalUnlocked, isLoading: modulesLoading } = useModules(languageId);
    const { getCompletionCount, getCompletedSituationIds } = useSituationHistory(languageId);
    const [bannerDismissed, setBannerDismissed] = useState(false);

    const isBeginnerLevel = level === 'A1' || level === 'A2';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBannerDismissed(localStorage.getItem('parlova_learn_banner_dismissed') === 'true');
        }
    }, []);

    const dismissBanner = () => {
        setBannerDismissed(true);
        localStorage.setItem('parlova_learn_banner_dismissed', 'true');
    };

    const levelMap: Record<string, number> = {
        'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };
    const userLevelNum = levelMap[level] || 1;

    const isAccessible = (scenarioId: string, scenarioDifficulty: string) => {
        if (!isBeginnerLevel) {
            const reqLevelNum = levelMap[scenarioDifficulty] || 1;
            return reqLevelNum <= userLevelNum;
        }
        return isUnlocked(scenarioId);
    };

    // Show pre-session card for a scenario
    const showPreSession = (scenarioId: string) => {
        const scenario = SCENARIOS.find(s => s.id === scenarioId);
        if (!scenario) return;
        // Pick a random teaser from the situations
        const completedIds = getCompletedSituationIds(scenarioId);
        const freshSituations = scenario.situations.filter(s => !completedIds.includes(s.id));
        const pool = freshSituations.length > 0 ? freshSituations : scenario.situations;
        const randomSituation = pool[Math.floor(Math.random() * pool.length)];
        setPreSession({
            scenarioId,
            scenarioName: scenario.name,
            userRole: scenario.user_role,
            goal: scenario.goal,
            estimatedMinutes: scenario.estimated_minutes,
            situationTeaser: randomSituation.teaser,
        });
    };

    // Surprise me: random accessible scenario
    const handleSurpriseMe = () => {
        const accessibleScenarios = SCENARIOS.filter(s =>
            isAccessible(s.id, s.base_difficulty)
        );
        if (accessibleScenarios.length === 0) return;
        const random = accessibleScenarios[Math.floor(Math.random() * accessibleScenarios.length)];
        showPreSession(random.id);
    };

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

    // Pre-session preparation card
    if (preSession) {
        return (
            <div className="flex flex-col w-full h-full max-w-2xl mx-auto px-4 sm:px-8 py-12 md:py-20 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center"
                >
                    <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-4">
                        Get Ready
                    </span>
                    <h1 className="text-3xl md:text-4xl font-bold mb-6">{preSession.scenarioName}</h1>

                    {preSession.situationTeaser && (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-8 max-w-md">
                            <p className="text-primary/90 italic text-lg leading-relaxed">
                                "{preSession.situationTeaser}"
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg mb-10">
                        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">You Play</span>
                            <span className="font-bold text-foreground">{preSession.userRole}</span>
                        </div>
                        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Goal</span>
                            <span className="font-bold text-foreground text-sm">{preSession.goal.length > 40 ? preSession.goal.slice(0, 40) + '...' : preSession.goal}</span>
                        </div>
                        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Time</span>
                            <span className="font-bold text-foreground">{preSession.estimatedMinutes} min</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                        <Button
                            onClick={() => {
                                setActiveScenarioId(preSession.scenarioId);
                                setPreSession(null);
                            }}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-base"
                        >
                            <Play className="w-4 h-4 mr-2 fill-current" /> Start Conversation
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => showPreSession(preSession.scenarioId)}
                            className="flex-1 h-12 border-primary/20 text-primary hover:bg-primary/5"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" /> Different Variation
                        </Button>
                    </div>

                    <button
                        onClick={() => setPreSession(null)}
                        className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back to scenarios
                    </button>
                </motion.div>
            </div>
        );
    }

    const hasLockedScenarios = isBeginnerLevel && totalUnlocked < SCENARIOS.length;

    return (
        <div className="flex flex-col w-full h-full max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-12 pb-24">

            <div className="mb-10">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Conversation Practice</h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    Choose a scenario, play your part, and improve your spoken fluency with real-time AI characters.
                </p>
            </div>

            {/* Learn banner for A1/A2 users */}
            {isBeginnerLevel && hasLockedScenarios && !bannerDismissed && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-sm text-amber-500 font-medium">
                            Complete learning modules to unlock all scenarios.{' '}
                            <a href="/learn" className="underline font-bold hover:text-amber-400">
                                Go to Learn →
                            </a>
                        </p>
                    </div>
                    <button onClick={dismissBanner} className="p-1 hover:bg-amber-500/20 rounded-lg flex-shrink-0">
                        <X className="w-4 h-4 text-amber-500" />
                    </button>
                </motion.div>
            )}

            {/* Surprise Me button */}
            <div className="mb-8">
                <Button
                    variant="outline"
                    onClick={handleSurpriseMe}
                    className="h-12 px-6 border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 font-semibold rounded-xl"
                >
                    <Shuffle className="w-5 h-5 mr-2" /> Surprise Me — Random Scenario
                </Button>
            </div>

            {/* Recents */}
            <div className="mb-12">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Recent Sessions
                </h3>
                {recentSessions && recentSessions.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                        {recentSessions.slice(0, 3).map((session, i) => {
                            const sc = SCENARIOS.find(s => s.id === session.scenario_type);
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
                                        onClick={() => showPreSession(session.scenario_type)}
                                    >
                                        Replay Scenario
                                    </Button>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="p-8 border-border/50 bg-card/30 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                            <Clock className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-foreground">No conversations yet</h4>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Start your first practice session to see your history here.
                            </p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Grid */}
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" /> All Scenarios
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {SCENARIOS.map((scenario) => {
                    const accessible = isAccessible(scenario.id, scenario.base_difficulty);
                    const isLocked = !accessible;
                    const completionCount = getCompletionCount(scenario.id);
                    const completedIds = getCompletedSituationIds(scenario.id);

                    // Dynamically resolve icon
                    const IconComponent = (LucideIcons as any)[scenario.icon] || LucideIcons.MessageSquare;

                    return (
                        <Card
                            key={scenario.id}
                            className={`flex flex-col relative overflow-hidden transition-all duration-300 border-2 
                                ${isLocked ? 'bg-card/30 border-border/30 grayscale-[50%]' : 'bg-card border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1'}`
                            }
                        >
                            {/* Unlocked glow */}
                            {!isLocked && isBeginnerLevel && isUnlocked(scenario.id) && (
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                            )}

                            <div className="p-6 sm:p-8 flex flex-col h-full z-10">

                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                        <IconComponent className="w-6 h-6" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${isLocked
                                            ? 'bg-muted text-muted-foreground'
                                            : scenario.base_difficulty.startsWith('A') ? 'bg-blue-500/10 text-blue-500'
                                                : scenario.base_difficulty.startsWith('B') ? 'bg-amber-500/10 text-amber-500'
                                                    : 'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {scenario.base_difficulty}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-2 text-foreground">{scenario.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                                    {scenario.description}
                                </p>

                                {/* Situation progress dots */}
                                {!isLocked && (
                                    <div className="flex items-center gap-2 mb-6" title="5 unique variations to discover">
                                        <div className="flex gap-1.5">
                                            {scenario.situations.map((sit) => (
                                                <div
                                                    key={sit.id}
                                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${completedIds.includes(sit.id)
                                                            ? 'bg-primary'
                                                            : 'bg-border/60'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground ml-1">
                                            {completionCount}/5
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-8 text-xs font-medium text-muted-foreground/80">
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {scenario.estimated_minutes} mins</span>
                                    <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> {scenario.user_role}</span>
                                </div>

                                <div className="mt-auto">
                                    {isLocked ? (
                                        <Button
                                            variant="secondary"
                                            className="w-full font-semibold"
                                            onClick={() => window.location.href = '/learn'}
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" /> Learn First
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => showPreSession(scenario.id)}
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
