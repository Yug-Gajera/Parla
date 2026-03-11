"use client";

import React, { useState, useEffect } from 'react';
import { SCENARIOS } from '@/lib/data/scenarios';
import dynamic from 'next/dynamic';
const ConversationWindow = dynamic(() => import('./ConversationWindow').then(mod => mod.ConversationWindow), {
    loading: () => <div className="fixed inset-0 bg-[#080808] z-[60] flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-[#c9a84c]">Establishing Neural Link...</div>,
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

    const showPreSession = (scenarioId: string) => {
        const scenario = SCENARIOS.find(s => s.id === scenarioId);
        if (!scenario) return;
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

    const handleSurpriseMe = () => {
        const accessibleScenarios = SCENARIOS.filter(s =>
            isAccessible(s.id, s.base_difficulty)
        );
        if (accessibleScenarios.length === 0) return;
        const random = accessibleScenarios[Math.floor(Math.random() * accessibleScenarios.length)];
        showPreSession(random.id);
    };

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

    if (preSession) {
        return (
            <div className="flex flex-col w-full h-full max-w-2xl mx-auto px-4 sm:px-8 py-12 md:py-20 pb-24 font-sans bg-[#080808]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center w-full"
                >
                    <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#5a5652] uppercase mb-4">
                        Simulation Briefing
                    </span>
                    <h1 className="text-3xl md:text-5xl font-serif text-[#f0ece4] tracking-tight mb-8 leading-snug">{preSession.scenarioName}</h1>

                    {preSession.situationTeaser && (
                        <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-6 mb-10 max-w-md w-full shadow-inner relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/5 rounded-bl-full -z-10 group-hover:bg-[#c9a84c]/10 transition-colors duration-700" />
                            <p className="text-[#f0ece4] italic text-lg leading-relaxed font-serif relative z-10">
                                "{preSession.situationTeaser}"
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg mb-12">
                        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 text-center transition-all hover:border-[#2a2a2a]">
                            <span className="text-[9px] font-mono text-[#5a5652] uppercase tracking-[0.2em] block mb-2">Role</span>
                            <span className="font-sans font-medium text-[#f0ece4]">{preSession.userRole}</span>
                        </div>
                        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 text-center transition-all hover:border-[#2a2a2a]">
                            <span className="text-[9px] font-mono text-[#5a5652] uppercase tracking-[0.2em] block mb-2">Objective</span>
                            <span className="font-sans font-medium text-[#f0ece4] text-sm leading-tight">{preSession.goal.length > 40 ? preSession.goal.slice(0, 40) + '...' : preSession.goal}</span>
                        </div>
                        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 text-center transition-all hover:border-[#2a2a2a]">
                            <span className="text-[9px] font-mono text-[#5a5652] uppercase tracking-[0.2em] block mb-2">Duration</span>
                            <span className="font-mono text-lg text-[#f0ece4]">{preSession.estimatedMinutes} <span className="text-xs text-[#5a5652]">MIN</span></span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                        <Button
                            onClick={() => {
                                setActiveScenarioId(preSession.scenarioId);
                                setPreSession(null);
                            }}
                            className="flex-1 bg-[#c9a84c] hover:bg-[#b98e72] text-[#080808] font-mono text-[10px] font-bold h-12 uppercase tracking-widest rounded-full shadow-[0_4px_20px_rgba(201,168,76,0.15)] transition-all"
                        >
                            <Play className="w-4 h-4 mr-2 fill-current" /> Initialize
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => showPreSession(preSession.scenarioId)}
                            className="flex-1 h-12 bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#141414] hover:border-[#2a2a2a] font-mono text-[10px] uppercase tracking-widest rounded-full transition-all"
                        >
                            <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Reroll
                        </Button>
                    </div>

                    <button
                        onClick={() => setPreSession(null)}
                        className="mt-8 text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a5652] hover:text-[#f0ece4] transition-colors flex items-center gap-2"
                    >
                        &larr; Abort Briefing
                    </button>
                </motion.div>
            </div>
        );
    }

    const hasLockedScenarios = isBeginnerLevel && totalUnlocked < SCENARIOS.length;

    return (
        <div className="flex flex-col w-full h-full max-w-7xl mx-auto px-6 sm:px-10 py-10 md:py-14 pb-32 font-sans bg-[#080808]">

            {/* Header Text */}
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-serif text-[#f0ece4] tracking-tight mb-4">Neural Simulations</h1>
                <p className="text-[#9a9590] max-w-2xl leading-relaxed text-[15px]">
                    Engage in context-rich scenarios designed to stress-test your spontaneous linguistic retrieval.
                </p>
            </div>

            {isBeginnerLevel && hasLockedScenarios && !bannerDismissed && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-2xl p-5 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <BookOpen className="w-5 h-5 text-[#c9a84c] flex-shrink-0" />
                        <p className="text-sm text-[#f0ece4] font-medium leading-relaxed">
                            Complete foundational modules to unlock advanced simulations.{' '}
                            <a href="/learn" className="text-[#c9a84c] font-bold hover:underline ml-1">
                                Proceed to Terminal &rarr;
                            </a>
                        </p>
                    </div>
                    <button onClick={dismissBanner} className="p-2 hover:bg-[#1e1e1e] rounded-lg transition-colors flex-shrink-0">
                        <X className="w-4 h-4 text-[#5a5652]" />
                    </button>
                </motion.div>
            )}

            {/* Surprise Me button */}
            <div className="mb-12">
                <Button
                    variant="outline"
                    onClick={handleSurpriseMe}
                    className="h-14 px-8 bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#141414] hover:border-[#c9a84c]/50 font-mono text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-sm"
                >
                    <Shuffle className="w-4 h-4 mr-3 text-[#c9a84c]" /> Randomize Simulation
                </Button>
            </div>

            {/* Recents */}
            <div className="mb-16">
                <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-[#5a5652] font-medium mb-6 flex items-center gap-3">
                    <Star className="w-4 h-4 text-[#c9a84c]" /> Recent Deployments
                </h3>
                {recentSessions && recentSessions.length > 0 ? (
                    <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar px-1">
                        {recentSessions.slice(0, 3).map((session, i) => {
                            const sc = SCENARIOS.find(s => s.id === session.scenario_type);
                            return (
                                <Card key={i} className="min-w-[300px] sm:min-w-[340px] p-6 shrink-0 bg-[#0f0f0f] border-[#1e1e1e] hover:border-[#2a2a2a] rounded-2xl transition-all flex flex-col relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a84c]/5 rounded-bl-full -z-10 group-hover:bg-[#c9a84c]/10 transition-colors" />
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="font-serif text-lg text-[#f0ece4] truncate pr-4">{sc?.name || 'Unknown Protocol'}</div>
                                        <div className={`text-xs font-mono font-bold px-2 py-1 rounded bg-[#141414] border ${
                                            (session as any).overall_score >= 80 
                                            ? 'text-[#c9a84c] border-[#c9a84c]/30' 
                                            : 'text-[#9a9590] border-[#1e1e1e]'
                                        }`}>
                                            {(session as any).overall_score}%
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-mono text-[#5a5652] uppercase tracking-[0.1em] mb-6 flex items-center gap-2">
                                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 bg-[#1e1e1e] rounded-full" />
                                        <span>{session.duration_minutes} MIN</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full mt-auto bg-[#141414] border-[#1e1e1e] text-[#f0ece4] hover:bg-[#1e1e1e] font-mono text-[10px] uppercase tracking-widest h-10 rounded-xl transition-all"
                                        onClick={() => showPreSession(session.scenario_type)}
                                    >
                                        Re-engage
                                    </Button>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="p-10 border-[#1e1e1e] border-dashed bg-[#0f0f0f] rounded-3xl flex flex-col items-center justify-center text-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-[#141414] border border-[#2a2a2a] flex items-center justify-center">
                            <Clock className="w-6 h-6 text-[#5a5652]" />
                        </div>
                        <div>
                            <h4 className="font-serif text-xl text-[#f0ece4] mb-2">No history recorded</h4>
                            <p className="text-sm text-[#9a9590] max-w-sm">
                                Initiate your first simulation to establish baseline metrics.
                            </p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Grid */}
            <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-[#5a5652] font-medium mb-6 flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 text-[#c9a84c]" /> Available Environments
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SCENARIOS.map((scenario) => {
                    const accessible = isAccessible(scenario.id, scenario.base_difficulty);
                    const isLocked = !accessible;
                    const completionCount = getCompletionCount(scenario.id);
                    const completedIds = getCompletedSituationIds(scenario.id);

                    const IconComponent = (LucideIcons as any)[scenario.icon] || LucideIcons.MessageSquare;

                    return (
                        <Card
                            key={scenario.id}
                            className={`flex flex-col relative overflow-hidden transition-all duration-300 rounded-3xl border 
                                ${isLocked 
                                  ? 'bg-[#080808] border-[#1e1e1e] opacity-60 grayscale-[80%]' 
                                  : 'bg-[#0f0f0f] border-[#1e1e1e] hover:border-[#2a2a2a] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]'
                                }`
                            }
                        >
                            {!isLocked && isBeginnerLevel && isUnlocked(scenario.id) && (
                                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent pointer-events-none" />
                            )}

                            <div className="p-8 flex flex-col h-full relative z-10">

                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3.5 rounded-2xl border ${
                                        isLocked 
                                        ? 'bg-[#141414] text-[#5a5652] border-[#2a2a2a]' 
                                        : 'bg-[#141414] text-[#c9a84c] border-[#2a2a2a] shadow-inner'
                                    }`}>
                                        <IconComponent className="w-6 h-6" />
                                    </div>

                                    <div className="flex items-center">
                                        <span className={`px-3 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-[0.2em] ${
                                            isLocked
                                            ? 'bg-[#141414] text-[#5a5652]'
                                            : 'bg-[#1e1e1e] text-[#f0ece4] shadow-inner'
                                            }`}>
                                            {scenario.base_difficulty}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-serif mb-3 text-[#f0ece4]">{scenario.name}</h3>
                                <p className="text-[13px] text-[#9a9590] mb-6 line-clamp-2 leading-relaxed">
                                    {scenario.description}
                                </p>

                                {!isLocked && (
                                    <div className="flex items-center gap-3 mb-8" title="5 unique variations to discover">
                                        <div className="flex gap-2">
                                            {scenario.situations.map((sit) => (
                                                <div
                                                    key={sit.id}
                                                    className={`w-2 h-2 rounded-full transition-colors ${
                                                        completedIds.includes(sit.id)
                                                            ? 'bg-[#c9a84c] shadow-[0_0_5px_rgba(201,168,76,0.5)]'
                                                            : 'bg-[#1e1e1e]'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-[0.2em]">
                                            {completionCount}/5
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-x-6 gap-y-3 mb-8 mt-auto">
                                    <span className="flex items-center gap-2 text-[10px] font-mono text-[#5a5652] uppercase tracking-widest"><Clock className="w-3.5 h-3.5 text-[#c9a84c]/70" /> {scenario.estimated_minutes} MIN</span>
                                    <span className="flex items-center gap-2 text-[10px] font-mono text-[#5a5652] uppercase tracking-widest"><BarChart3 className="w-3.5 h-3.5 text-[#c9a84c]/70" /> {scenario.user_role.slice(0,15)}</span>
                                </div>

                                <div>
                                    {isLocked ? (
                                        <Button
                                            variant="secondary"
                                            className="w-full bg-[#141414] text-[#5a5652] hover:bg-[#1e1e1e] hover:text-[#9a9590] font-mono text-[10px] uppercase tracking-widest h-12 rounded-xl transition-all"
                                            onClick={() => window.location.href = '/learn'}
                                        >
                                            <Lock className="w-3.5 h-3.5 mr-2" /> Locked
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => showPreSession(scenario.id)}
                                            className="w-full bg-[#141414] border border-[#1e1e1e] hover:border-[#c9a84c] text-[#f0ece4] hover:bg-[#c9a84c]/5 font-mono text-[10px] font-bold uppercase tracking-widest h-12 rounded-xl transition-all group"
                                        >
                                            Engage <ArrowRight className="w-3.5 h-3.5 ml-2 text-[#9a9590] group-hover:text-[#c9a84c] group-hover:translate-x-1 transition-all" />
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
