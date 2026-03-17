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

    const totalScenarios = SCENARIOS.length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#E8521A] animate-spin" />
            </div>
        );
    }

    const allUnlocked = totalUnlocked >= totalScenarios;

    return (
        <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full font-sans">
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
                <h2 className="text-3xl font-display text-text-primary tracking-tight mb-2">Foundation Blueprint</h2>
                <p className="text-sm text-text-secondary max-w-xl leading-relaxed">
                    Satisfy module requisites to authorize conversation access.
                </p>
            </div>

            {/* Progress bar */}
            {allUnlocked ? (
                <Card className="p-8 bg-card border-[#E8521A]/20 shadow-[0_0_30px_rgba(232,82,26,0.1)] rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E8521A] to-transparent opacity-50" />
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-6">
                        <div className="p-4 rounded-full bg-surface border border-border-strong relative z-10 shadow-inner">
                            <Sparkles className="w-8 h-8 text-[#E8521A]" />
                        </div>
                        <div className="flex-1 text-center md:text-left relative z-10">
                            <h3 className="font-display text-2xl text-text-primary mb-2">All Clearances Attained</h3>
                            <p className="text-sm text-text-secondary">Proceed to the Practice sector for unscripted immersion.</p>
                        </div>
                        <Button
                            onClick={() => window.location.href = '/practice'}
                            className="w-full md:w-auto bg-text-primary text-bg font-mono-num text-[10px] uppercase font-bold tracking-widest px-8 h-12 hover:bg-[#E8521A] transition-colors rounded-full"
                        >
                            Initiate Practice
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="bg-surface p-6 rounded-2xl border border-border">
                    <div className="flex justify-between items-end mb-4">
                        <span className="font-mono-num text-[10px] uppercase tracking-widest text-text-muted">{totalUnlocked} / {totalScenarios} Clearances</span>
                        <span className="font-mono-num text-xl text-text-primary">{Math.round((totalUnlocked / totalScenarios) * 100)}<span className="text-text-muted text-sm">%</span></span>
                    </div>
                    <div className="h-1.5 bg-background rounded-full overflow-hidden border border-border">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#E8521A]/70 to-[#E8521A] rounded-full shadow-[0_0_10px_rgba(232,82,26,0.2)]"
                            animate={{ width: `${(totalUnlocked / totalScenarios) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        />
                    </div>
                </div>
            )}

            {/* First-time welcome */}
            {totalUnlocked === 0 && progress.length === 0 && (
                <Card className="p-8 bg-card border-border rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="p-4 rounded-full bg-surface border border-border-strong shrink-0">
                            <LucideIcons.Key className="w-6 h-6 text-[#E8521A]" />
                        </div>
                        <div>
                            <h3 className="font-display text-xl text-text-primary mb-2">Initial Acquisition Module</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Establish your baseline. Decode the dialogue, acquire the lexicon, and pass the diagnostic to unlock real-time simulated scenarios.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Scenario cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                className={`p-6 relative overflow-hidden transition-all duration-500 rounded-2xl flex flex-col h-full border ${isUnlocked
                                    ? 'border-[#E8521A]/20 bg-surface shadow-[0_4px_20px_rgba(232,82,26,0.1)]'
                                    : isFirst
                                        ? 'border-[#E8521A]/50 bg-surface shadow-[0_4px_30px_rgba(232,82,26,0.15)]'
                                        : 'border-border bg-card hover:border-border-strong'
                                    }`}
                            >
                                {/* Unlocked checkmark */}
                                {isUnlocked && (
                                    <div className="absolute top-4 right-4 bg-background border border-[#E8521A] rounded-full p-1 shadow-md">
                                        <CheckCircle2 className="w-3 h-3 text-[#E8521A]" />
                                    </div>
                                )}

                                {/* First badge */}
                                {isFirst && (
                                    <div className="absolute top-4 right-4 bg-[#E8521A]/10 text-[#E8521A] border border-[#E8521A]/30 text-[9px] font-mono-num tracking-widest px-2 py-1 rounded">
                                        PRIORITY
                                    </div>
                                )}

                                <div className="flex items-start gap-4 mb-6">
                                    <div className={`p-3 rounded-lg border ${isUnlocked 
                                        ? 'bg-background border-border-strong text-[#E8521A]' 
                                        : isFirst 
                                            ? 'bg-[#E8521A] border-[#E8521A] text-bg' 
                                            : 'bg-surface border-border text-text-muted'
                                        }`}>
                                        <IconComponent className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className={`font-display text-lg leading-tight truncate mb-1 ${isUnlocked || isFirst ? 'text-text-primary' : 'text-text-secondary'}`}>{scenario.name}</h3>
                                        <p className="text-xs text-text-muted truncate font-sans">{scenario.description}</p>
                                    </div>
                                </div>

                                {/* Step indicators */}
                                <div className="flex items-center gap-1 mb-6 mt-auto">
                                    {/* Dialogue */}
                                    <StepCircle done={dialogueDone} active={isStarted && !dialogueDone} label="Decode" />
                                    <div className="flex-1 h-[1px] bg-border" />
                                    {/* Phrases */}
                                    <StepCircle done={phrasesDone} active={dialogueDone && !phrasesDone} label="Acquire" />
                                    <div className="flex-1 h-[1px] bg-border" />
                                    {/* Challenge */}
                                    <StepCircle done={challengeDone} active={phrasesDone && !challengeDone} label="Verify" />
                                </div>

                                {/* Status + Action */}
                                <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                                    <span className={`px-2 py-1 rounded text-[9px] font-mono-num font-bold uppercase tracking-widest border ${
                                        status === 'unlocked'
                                        ? 'bg-[#E8521A]/10 text-[#E8521A] border-[#E8521A]/20'
                                        : status === 'in_progress'
                                            ? 'bg-transparent border-border-strong text-text-primary'
                                            : 'bg-transparent border-transparent text-text-muted'
                                        }`}>
                                        {status === 'unlocked' ? 'Authorized' : status === 'in_progress' ? 'Active' : 'Restricted'}
                                    </span>

                                    <Button
                                        size="sm"
                                        onClick={() => setActiveModule({ type: scenario.id, name: scenario.name })}
                                        className={`rounded-full h-8 px-4 text-[9px] font-mono-num tracking-widest uppercase font-bold transition-all ${
                                            isUnlocked
                                            ? 'bg-surface text-[#E8521A] border border-[#E8521A] hover:bg-[#E8521A] hover:text-bg'
                                            : isFirst || isStarted
                                                ? 'bg-[#E8521A] text-bg hover:brightness-110'
                                                : 'bg-surface text-text-muted cursor-not-allowed opacity-50 border border-border'
                                            }`}
                                        disabled={!isUnlocked && !isStarted && !isFirst}
                                    >
                                        {isUnlocked ? (
                                            <><LucideIcons.Radio className="w-3 h-3 mr-1.5" /> Simulation</>
                                        ) : isStarted ? (
                                            <><ChevronRight className="w-3 h-3 mr-1" /> Resume</>
                                        ) : (
                                            <>Access Log</>
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
        <div className="flex flex-col items-center gap-2">
            <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${done
                    ? 'bg-surface border border-[#E8521A] text-[#E8521A]'
                    : active
                        ? 'border border-text-primary bg-text-primary shadow-[0_0_10px_rgba(30,30,30,0.1)]'
                        : 'border border-border-strong bg-card'
                    }`}
            >
                {done && <CheckCircle2 className="w-3 h-3" />}
                {active && <div className="w-1.5 h-1.5 rounded-full bg-bg" />}
            </div>
            <span className={`text-[9px] font-mono-num uppercase tracking-widest ${active ? 'text-text-primary' : done ? 'text-[#E8521A]' : 'text-text-muted'}`}>{label}</span>
        </div>
    );
}
