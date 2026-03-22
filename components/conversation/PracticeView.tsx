"use client";

import React, { useState, useEffect } from 'react';
import { SCENARIOS } from '@/lib/data/scenarios';
import dynamic from 'next/dynamic';
const ConversationWindow = dynamic(() => import('./ConversationWindow').then(mod => mod.ConversationWindow), {
    loading: () => <div className="fixed inset-0 bg-background z-[60] flex items-center justify-center font-mono-num text-[10px] uppercase tracking-widest text-[#E8521A]">Loading your partner...</div>,
    ssr: false
});
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, Play, Clock, BarChart3, Star, LayoutGrid, BookOpen, X, Shuffle, ArrowRight, RefreshCcw } from 'lucide-react';
import { useModules } from '@/hooks/useModules';
import { useSituationHistory } from '@/hooks/useSituationHistory';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { PaywallModal } from '@/components/shared/PaywallModal';
import { trackEvent } from '@/lib/posthog';

// Maps lucide icon names from our DB to components
import * as LucideIcons from 'lucide-react';

interface PracticeViewProps {
    languageId: string;
    level: string;
    recentSessions: any[];
    conversationUnlocked?: boolean;
    guidedScenariosCompleted?: number;
}

interface PreSessionData {
    scenarioId: string;
    scenarioName: string;
    userRole: string;
    goal: string;
    estimatedMinutes: number;
    situationTeaser?: string;
}

import { createClient } from '@/lib/supabase/client';

export default function PracticeView({ languageId, level, recentSessions, conversationUnlocked = false, guidedScenariosCompleted = 0 }: PracticeViewProps) {
    const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
    const [preSession, setPreSession] = useState<PreSessionData | null>(null);
    const { isUnlocked, totalUnlocked, isLoading: modulesLoading } = useModules(languageId);
    const { getCompletionCount, getCompletedSituationIds } = useSituationHistory(languageId);
    const [bannerDismissed, setBannerDismissed] = useState(false);
    const { plan, limits, isPro, isLoading: limitsLoading } = usePlanLimits();
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);
    const [paywallMetric, setPaywallMetric] = useState<'conversation' | 'article' | 'story' | 'word_lookup'>('conversation');

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

    const [unlockedLocally, setUnlockedLocally] = useState(conversationUnlocked);
    const [unlocking, setUnlocking] = useState(false);
    const supabase = createClient();

    const handleUnlock = async () => {
        setUnlocking(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // @ts-ignore
            await supabase.from('users').update({ conversation_unlocked: true }).eq('id', user.id);
            trackEvent('conversation_unlocked_manually', {
                user_id: user.id,
                scenarios_completed: guidedScenariosCompleted
            });
            setUnlockedLocally(true);
        }
        setUnlocking(false);
    };

    const isAccessible = (scenarioId: string, scenarioDifficulty: string) => {
        if (isBeginnerLevel && !unlockedLocally) return false;
        
        if (!isBeginnerLevel) {
            const reqLevelNum = levelMap[scenarioDifficulty] || 1;
            return reqLevelNum <= userLevelNum;
        }
        return isUnlocked(scenarioId);
    };

    const isSoftLocked = isBeginnerLevel && !unlockedLocally;

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
            <div className="flex flex-col w-full h-full max-w-2xl mx-auto px-4 sm:px-8 py-12 md:py-20 pb-32 font-sans bg-background">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center w-full"
                >
                    <span className="text-[10px] font-mono-num font-bold tracking-widest text-text-muted uppercase mb-4">
                        Before we start
                    </span>
                    <h1 className="text-3xl md:text-5xl font-display text-text-primary tracking-tight mb-8 leading-snug">{preSession.scenarioName}</h1>

                    {preSession.situationTeaser && (
                        <div className="bg-card border border-border rounded-2xl p-6 mb-10 max-w-md w-full shadow-inner relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8521A]/5 rounded-bl-full -z-10 group-hover:bg-[#E8521A]/10 transition-colors duration-700" />
                            <p className="text-text-primary italic text-lg leading-relaxed font-display relative z-10">
                                "{preSession.situationTeaser}"
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg mb-12">
                        <div className="bg-card border border-border rounded-[18px] p-5 text-center transition-all hover:border-accent-border">
                            <span className="text-[9px] font-mono-num text-text-muted uppercase tracking-widest block mb-2">Role</span>
                            <span className="font-sans font-medium text-text-primary">{preSession.userRole}</span>
                        </div>
                        <div className="bg-card border border-border rounded-[18px] p-5 text-center transition-all hover:border-accent-border">
                            <span className="text-[9px] font-mono-num text-text-muted uppercase tracking-widest block mb-2">Goal</span>
                            <span className="font-sans font-medium text-text-primary text-sm leading-tight">{preSession.goal.length > 40 ? preSession.goal.slice(0, 40) + '...' : preSession.goal}</span>
                        </div>
                        <div className="bg-card border border-border rounded-[18px] p-5 text-center transition-all hover:border-accent-border">
                            <span className="text-[9px] font-mono-num text-text-muted uppercase tracking-widest block mb-2">Time</span>
                            <span className="font-mono-num text-lg text-text-primary">{preSession.estimatedMinutes} <span className="text-xs text-text-muted">MIN</span></span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                        <Button
                            onClick={() => {
                                if (limits && !limits.conversation.allowed) {
                                    setPaywallMetric('conversation');
                                    setIsPaywallOpen(true);
                                    return;
                                }
                                setActiveScenarioId(preSession.scenarioId);
                                setPreSession(null);
                            }}
                            className="btn-action flex-1"
                        >
                            <Play className="w-4 h-4 mr-2" /> Start
                        </Button>
                        <Button
                            onClick={() => showPreSession(preSession.scenarioId)}
                            className="btn-secondary h-12 flex-1 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                        >
                            <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Change
                        </Button>
                    </div>

                    <button
                        onClick={() => setPreSession(null)}
                        className="mt-8 text-[11px] font-mono-num font-bold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
                    >
                        &larr; Go back
                    </button>
                </motion.div>
            </div>
        );
    }

    const hasLockedScenarios = isBeginnerLevel && totalUnlocked < SCENARIOS.length;

    return (
        <div className="flex flex-col w-full h-full max-w-7xl mx-auto px-6 sm:px-10 py-10 md:py-14 pb-32 font-sans bg-background">

            {/* Header Text */}
            <div className="mb-14">
                <h1 className="text-4xl md:text-6xl font-display text-text-primary tracking-tight mb-4">Practice Conversations</h1>
                <p className="text-text-secondary max-w-2xl leading-relaxed text-base">
                    Chat in real-life situations to get comfortable speaking.
                </p>
            </div>

            {isBeginnerLevel && hasLockedScenarios && !bannerDismissed && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 bg-[#E8521A]/5 border border-[#E8521A]/30 rounded-2xl p-6 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <BookOpen className="w-5 h-5 text-gold flex-shrink-0" />
                        <p className="text-sm text-text-primary font-medium leading-relaxed">
                            Finish beginner lessons to unlock more topics.{' '}
                            <a href="/learn" className="text-[#E8521A] font-bold hover:underline ml-1">
                                Go to lessons &rarr;
                            </a>
                        </p>
                    </div>
                    <button onClick={dismissBanner} className="p-2 hover:bg-surface rounded-lg transition-colors flex-shrink-0">
                        <X className="w-4 h-4 text-text-muted" />
                    </button>
                </motion.div>
            )}

            {isSoftLocked ? (
                <div className="mb-14 relative overflow-hidden bg-card border border-[#E8521A]/30 rounded-3xl p-8 sm:p-10 shadow-sm text-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8521A]/10 rounded-bl-full -z-10 blur-2xl" />
                    <div className="w-16 h-16 rounded-full bg-surface border border-[#E8521A]/20 flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-[#E8521A]" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-display text-text-primary mb-3">
                        Unlock Open Conversations
                    </h2>
                    <p className="text-text-secondary max-w-lg mx-auto mb-8 leading-relaxed">
                        To ensure you have the best experience, free conversation practice unlocks after you reach A2 level or complete 3 Guided Scenarios in the Learn tab.
                    </p>
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono-num font-bold uppercase tracking-widest bg-surface border border-border px-3 py-1 rounded-full shadow-inner">
                                <span className="text-[#E8521A]">{guidedScenariosCompleted}</span> / 3 Scenarios Completed
                            </span>
                        </div>
                        {guidedScenariosCompleted >= 3 && (
                            <Button 
                                onClick={handleUnlock}
                                disabled={unlocking}
                                className="bg-[#E8521A] text-background hover:brightness-110 font-mono text-[11px] uppercase tracking-widest font-bold h-12 px-8 rounded-full shadow-[0_4px_20px_rgba(232,82,26,0.2)] transition-all mt-4"
                            >
                                {unlocking ? 'Unlocking...' : 'I feel ready'}
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Surprise Me button */}
                    <div className="mb-14">
                        <Button
                            variant="outline"
                            onClick={handleSurpriseMe}
                            className="btn-action w-fit h-14 px-8 rounded-[18px]"
                        >
                            <Shuffle className="w-4 h-4 mr-3" /> Random Topic
                        </Button>
                    </div>

                    {/* Recents */}
                    <div className="mb-20">
                        <h3 className="text-xs font-mono-num uppercase tracking-widest text-text-muted font-bold mb-8 flex items-center gap-3">
                            <Star className="w-4 h-4 text-[#E8521A]" /> Recent Chats
                        </h3>
                        {recentSessions && recentSessions.length > 0 ? (
                            <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar px-1">
                                {recentSessions.slice(0, 3).map((session, i) => {
                                    const sc = SCENARIOS.find(s => s.id === session.scenario_type);
                                    return (
                                        <Card key={i} className="min-w-[300px] sm:min-w-[360px] p-8 shrink-0 bg-card border-border hover:border-accent-border rounded-[18px] transition-all flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E8521A]/5 rounded-bl-full -z-10 group-hover:bg-[#E8521A]/10 transition-colors" />
                                            
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="font-display text-xl text-text-primary pr-4">{sc?.name || 'Unknown Topic'}</div>
                                                <div className="pill-score mr-2">
                                                    {(session as any).overall_score}%
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-mono-num font-bold text-text-muted uppercase tracking-wider mb-10 flex items-center gap-2">
                                                <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                                <span className="w-1 h-1 bg-border rounded-full" />
                                                <span>{session.duration_minutes} MIN</span>
                                            </div>
                                            <Button
                                                className="btn-action"
                                                onClick={() => showPreSession(session.scenario_type)}
                                            >
                                                Chat again
                                            </Button>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="p-14 border-border border-dashed bg-card rounded-[40px] flex flex-col items-center justify-center text-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center shadow-inner">
                                    <Clock className="w-8 h-8 text-text-muted" />
                                </div>
                                <div>
                                    <h4 className="font-display text-2xl text-text-primary mb-3">No chats yet</h4>
                                    <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
                                        Start your first conversation to practice speaking.
                                    </p>
                                </div>
                            </Card>
                        )}
                    </div>
                </>
            )}

            {/* Grid */}
            <h3 className="text-xs font-mono-num uppercase tracking-widest text-text-muted font-bold mb-8 flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 text-[#E8521A]" /> Choose a Topic
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {SCENARIOS.map((scenario) => {
                    const accessible = isAccessible(scenario.id, scenario.base_difficulty);
                    const isLocked = !accessible;
                    const completionCount = getCompletionCount(scenario.id);
                    const completedIds = getCompletedSituationIds(scenario.id);

                    const IconComponent = (LucideIcons as any)[scenario.icon] || LucideIcons.MessageSquare;

                    return (
                        <Card
                            key={scenario.id}
                            className={`flex flex-col relative overflow-hidden transition-all duration-300 rounded-[18px] border 
                                ${isLocked 
                                  ? 'bg-background border-border opacity-70 grayscale-[80%]' 
                                  : 'bg-card border-border hover:border-accent-border hover:-translate-y-1 hover:shadow-md'
                                }`
                            }
                        >
                            {!isLocked && isBeginnerLevel && isUnlocked(scenario.id) && (
                                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#E8521A] to-transparent pointer-events-none opacity-40" />
                            )}

                            <div className="p-10 flex flex-col h-full relative z-10">

                                <div className="flex justify-between items-start mb-8">
                                    <div className={`p-4 rounded-2xl border ${
                                        isLocked 
                                        ? 'bg-surface text-text-muted border-border' 
                                        : 'bg-[#E8521A]/5 text-[#E8521A] border-[#E8521A]/20 shadow-inner'
                                    }`}>
                                        <IconComponent className="w-7 h-7" />
                                    </div>

                                    <div className="flex items-center">
                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-mono-num font-bold uppercase tracking-widest ${
                                            isLocked
                                            ? 'bg-surface text-text-muted'
                                            : 'bg-surface border border-[#E8521A]/20 text-[#E8521A] shadow-sm'
                                            }`}>
                                            {scenario.base_difficulty}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-display mb-3 text-text-primary tracking-tight">{scenario.name}</h3>
                                <p className="text-sm text-text-secondary mb-8 line-clamp-2 leading-relaxed h-11">
                                    {scenario.description}
                                </p>

                                {!isLocked && (
                                    <div className="flex items-center gap-3 mb-10" title="Progress variations">
                                        <div className="flex gap-2">
                                            {scenario.situations.map((sit) => (
                                                <div
                                                    key={sit.id}
                                                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                                                        completedIds.includes(sit.id)
                                                            ? 'bg-[#E8521A] shadow-[0_0_8px_rgba(232,82,26,0.4)] scale-110'
                                                            : 'bg-border'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[11px] font-mono-num font-bold text-text-muted uppercase tracking-widest">
                                            {completionCount}/5
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-x-6 gap-y-3 mb-10 mt-auto">
                                    <span className="flex items-center gap-2 text-[10px] font-mono-num font-bold text-text-muted uppercase tracking-widest"><Clock className="w-4 h-4 text-[#E8521A]/60" /> {scenario.estimated_minutes} MIN</span>
                                    <span className="flex items-center gap-2 text-[10px] font-mono-num font-bold text-text-muted uppercase tracking-widest"><BarChart3 className="w-4 h-4 text-[#E8521A]/60" /> {scenario.user_role.slice(0,18)}</span>
                                </div>

                                 <div>
                                    {isLocked ? (
                                        <Button
                                            variant="secondary"
                                            className="w-full bg-surface text-text-muted hover:bg-border hover:text-text-secondary font-mono-num text-[10px] font-bold uppercase tracking-widest h-11 rounded-xl transition-all border border-border"
                                            onClick={() => window.location.href = '/learn'}
                                        >
                                            <Lock className="w-3.5 h-3.5 mr-2" /> Locked
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                onClick={() => {
                                                    if (limits && !limits.conversation.allowed) {
                                                        setPaywallMetric('conversation');
                                                        setIsPaywallOpen(true);
                                                        return;
                                                    }
                                                    showPreSession(scenario.id);
                                                }}
                                                className="btn-action group"
                                            >
                                                Start <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-all" />
                                            </Button>
                                            {!isPro && limits && (
                                                <span className="text-[9px] font-mono-num font-bold text-orange-500/80 uppercase tracking-widest text-center">
                                                    {limits.conversation.remaining} chats left this week
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <PaywallModal
                isOpen={isPaywallOpen}
                onClose={() => setIsPaywallOpen(false)}
                metric={paywallMetric}
                plan={plan}
            />
        </div>
    );
}
