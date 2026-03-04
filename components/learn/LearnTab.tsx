"use client";

import React, { useState } from 'react';
import { SCENARIOS } from '@/lib/data/scenarios';
import { useModules } from '@/hooks/useModules';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, ChevronRight, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import dynamic from 'next/dynamic';

const ModuleView = dynamic(() => import('./ModuleView'), { ssr: false });

interface LearnTabProps {
    languageId: string;
    languageName: string;
    level: string;
}

export default function LearnTab({ languageId }: LearnTabProps) {
    const { progress, isLoading, totalUnlocked, updateProgress, getProgress, fetchModule } = useModules(languageId);
    const [activeModule, setActiveModule] = useState<{ type: string; name: string } | null>(null);

    // Only show beginner-relevant scenarios (A1 and A2 for now, first 2)
    // but expose all 8 to show the full pathway
    const totalScenarios = SCENARIOS.length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const allUnlocked = totalUnlocked >= totalScenarios;

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            {/* Active module overlay */}
            <AnimatePresence>
                {activeModule && (
                    <ModuleView
                        scenarioType={activeModule.type}
                        scenarioName={activeModule.name}
                        languageId={languageId}
                        progress={getProgress(activeModule.type)}
                        onClose={() => setActiveModule(null)}
                        onStepComplete={updateProgress}
                        fetchModule={fetchModule}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold mb-1">Build Your Foundation</h2>
                <p className="text-sm text-muted-foreground">
                    Complete each module to unlock conversation practice
                </p>
            </div>

            {/* Progress bar */}
            {allUnlocked ? (
                <Card className="p-6 bg-gradient-to-r from-emerald-500/10 to-primary/10 border-emerald-500/30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-emerald-500/20">
                            <Sparkles className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">You&apos;ve unlocked all scenarios! 🎉</h3>
                            <p className="text-sm text-muted-foreground">Head to Practice to keep improving</p>
                        </div>
                        <Button
                            onClick={() => window.location.href = '/practice'}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            Go to Practice
                        </Button>
                    </div>
                </Card>
            ) : (
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{totalUnlocked} of {totalScenarios} scenarios unlocked</span>
                        <span className="text-muted-foreground">{Math.round((totalUnlocked / totalScenarios) * 100)}%</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                            animate={{ width: `${(totalUnlocked / totalScenarios) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        />
                    </div>
                </div>
            )}

            {/* First-time welcome */}
            {totalUnlocked === 0 && progress.length === 0 && (
                <Card className="p-6 bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/30">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/20 mt-1">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1">Start with your first module</h3>
                            <p className="text-sm text-muted-foreground">
                                Each module takes about 10 minutes and unlocks a real conversation scenario.
                                Read a dialogue, learn key phrases, then prove you&apos;re ready!
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Scenario cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SCENARIOS.map((scenario, i) => {
                    const prog = getProgress(scenario.id);
                    const isUnlocked = prog?.scenario_unlocked || false;
                    const isStarted = !!prog;
                    const isFirst = i === 0 && !isStarted && totalUnlocked === 0;

                    // Step completion flags
                    const dialogueDone = prog?.dialogue_completed || false;
                    const phrasesDone = prog?.phrases_completed || false;
                    const challengeDone = prog?.challenge_completed || false;

                    // Status
                    let status: 'locked' | 'in_progress' | 'unlocked' = 'locked';
                    if (isUnlocked) status = 'unlocked';
                    else if (isStarted) status = 'in_progress';

                    // Icon
                    const IconComponent = (LucideIcons as any)[scenario.icon] || LucideIcons.MessageSquare;

                    return (
                        <motion.div
                            key={scenario.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card
                                className={`p-5 relative overflow-hidden transition-all border-2 ${isUnlocked
                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                    : isFirst
                                        ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/10'
                                        : 'border-border hover:border-primary/30'
                                    }`}
                            >
                                {/* Unlocked checkmark */}
                                {isUnlocked && (
                                    <div className="absolute top-3 right-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                )}

                                {/* First badge */}
                                {isFirst && (
                                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                        START HERE
                                    </div>
                                )}

                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`p-2.5 rounded-xl ${isUnlocked ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                                        }`}>
                                        <IconComponent className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-foreground truncate">{scenario.name}</h3>
                                        <p className="text-xs text-muted-foreground truncate">{scenario.description}</p>
                                    </div>
                                </div>

                                {/* Step indicators */}
                                <div className="flex items-center gap-1 mb-4">
                                    {/* Dialogue */}
                                    <StepCircle done={dialogueDone} active={isStarted && !dialogueDone} label="Read" />
                                    <div className="flex-1 h-[2px] bg-border" />
                                    {/* Phrases */}
                                    <StepCircle done={phrasesDone} active={dialogueDone && !phrasesDone} label="Learn" />
                                    <div className="flex-1 h-[2px] bg-border" />
                                    {/* Challenge */}
                                    <StepCircle done={challengeDone} active={phrasesDone && !challengeDone} label="Test" />
                                </div>

                                {/* Status + Action */}
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status === 'unlocked'
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : status === 'in_progress'
                                            ? 'bg-amber-500/10 text-amber-500'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {status === 'unlocked' ? 'Unlocked' : status === 'in_progress' ? 'In Progress' : 'Locked'}
                                    </span>

                                    <Button
                                        size="sm"
                                        onClick={() => setActiveModule({ type: scenario.id, name: scenario.name })}
                                        className={`text-xs font-bold ${isUnlocked
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : 'bg-primary hover:bg-primary/90'
                                            }`}
                                    >
                                        {isUnlocked ? (
                                            <><Play className="w-3.5 h-3.5 mr-1 fill-current" /> Practice Now</>
                                        ) : isStarted ? (
                                            <><ChevronRight className="w-3.5 h-3.5 mr-1" /> Continue</>
                                        ) : (
                                            <>Start Learning</>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Step Circle component ──
function StepCircle({ done, active, label }: { done: boolean; active: boolean; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${done
                    ? 'bg-emerald-500 text-white'
                    : active
                        ? 'border-2 border-primary animate-pulse'
                        : 'border-2 border-muted'
                    }`}
            >
                {done && <CheckCircle2 className="w-4 h-4" />}
            </div>
            <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
    );
}
