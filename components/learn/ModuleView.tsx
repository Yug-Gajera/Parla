"use client";

import React, { useState, useEffect } from 'react';
import { ScenarioModule, UserModuleProgress } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DialogueReader from './DialogueReader';
import PhraseBuilder from './PhraseBuilder';
import MiniChallenge from './MiniChallenge';

interface ModuleViewProps {
    scenarioType: string;
    scenarioName: string;
    languageId: string;
    progress: UserModuleProgress | undefined;
    onClose: () => void;
    onStepComplete: (
        scenarioType: string,
        step: 'dialogue' | 'phrases' | 'challenge',
        score?: number,
        phrasesLearned?: number,
        learnedPhrases?: any[]
    ) => Promise<UserModuleProgress | null>;
    fetchModule: (scenarioType: string) => Promise<ScenarioModule | null>;
}

type Step = 'dialogue' | 'phrases' | 'challenge';

export default function ModuleView({
    scenarioType,
    scenarioName,
    progress,
    onClose,
    onStepComplete,
    fetchModule,
}: ModuleViewProps) {
    const [module, setModule] = useState<ScenarioModule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Determine current step based on progress
    const getInitialStep = (): Step => {
        if (!progress) return 'dialogue';
        if (!progress.dialogue_completed) return 'dialogue';
        if (!progress.phrases_completed) return 'phrases';
        if (!progress.challenge_completed) return 'challenge';
        return 'dialogue'; // All done, let them review
    };

    const [currentStep, setCurrentStep] = useState<Step>(getInitialStep());

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchModule(scenarioType);
                if (data) {
                    setModule(data);
                } else {
                    setError('Failed to load module content');
                }
            } catch {
                setError('Failed to load module content');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [scenarioType, fetchModule]);

    const handleBack = () => {
        setShowExitConfirm(true);
    };

    const stepIndex = ['dialogue', 'phrases', 'challenge'].indexOf(currentStep);

    const stepConfig = [
        { key: 'dialogue', label: 'Dialogue', completed: progress?.dialogue_completed },
        { key: 'phrases', label: 'Phrases', completed: progress?.phrases_completed },
        { key: 'challenge', label: 'Challenge', completed: progress?.challenge_completed },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Exit
                </Button>

                <h2 className="text-sm font-bold truncate max-w-[200px] sm:max-w-none">
                    {scenarioName}
                </h2>

                {/* Step indicator dots */}
                <div className="flex items-center gap-2">
                    {stepConfig.map((s, i) => (
                        <div key={s.key} className="flex items-center gap-1">
                            <div
                                className={`rounded-full transition-all ${s.completed
                                    ? 'w-3 h-3 bg-emerald-500'
                                    : i === stepIndex
                                        ? 'w-4 h-4 bg-primary animate-pulse'
                                        : 'w-3 h-3 bg-muted border border-border'
                                    }`}
                            />
                            {i < 2 && <div className="w-3 h-[2px] bg-border" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden px-4 sm:px-6 py-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="p-6 rounded-2xl bg-primary/10"
                        >
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </motion.div>
                        <p className="text-muted-foreground font-medium">Preparing your lesson...</p>
                        <p className="text-xs text-muted-foreground">This may take a moment the first time</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <p className="text-destructive font-medium">{error}</p>
                        <Button onClick={onClose} variant="outline">Go Back</Button>
                    </div>
                ) : module ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="h-full"
                        >
                            {currentStep === 'dialogue' && module.dialogue_content && (
                                <DialogueReader
                                    dialogue={module.dialogue_content}
                                    onComplete={async (score) => {
                                        await onStepComplete(scenarioType, 'dialogue', score);
                                        setCurrentStep('phrases');
                                    }}
                                />
                            )}
                            {currentStep === 'phrases' && module.phrase_set && (
                                <PhraseBuilder
                                    phraseSet={module.phrase_set}
                                    onComplete={async (learned, learnedPhrases) => {
                                        await onStepComplete(scenarioType, 'phrases', undefined, learned, learnedPhrases);
                                        setCurrentStep('challenge');
                                    }}
                                />
                            )}
                            {currentStep === 'challenge' && module.challenge_content && (
                                <MiniChallenge
                                    challenge={module.challenge_content}
                                    scenarioName={scenarioName}
                                    onComplete={async (score) => {
                                        await onStepComplete(scenarioType, 'challenge', score);
                                        onClose();
                                    }}
                                    onReviewPhrases={() => setCurrentStep('phrases')}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                ) : null}
            </div>

            {/* Exit confirmation */}
            <AnimatePresence>
                {showExitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
                        onClick={() => setShowExitConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border shadow-xl"
                        >
                            <h3 className="text-lg font-bold mb-2">Exit module?</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Your progress on completed steps is saved, but the current step will reset.
                            </p>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowExitConfirm(false)}>
                                    Stay
                                </Button>
                                <Button variant="destructive" className="flex-1" onClick={onClose}>
                                    Exit
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
