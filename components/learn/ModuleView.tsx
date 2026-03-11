"use client";

import React, { useState, useEffect } from 'react';
import { ScenarioModule, UserModuleProgress } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, LibrarySquare } from 'lucide-react';
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
            className="fixed inset-0 z-[60] bg-[#080808] flex flex-col font-sans"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e] bg-[#141414] shrink-0">
                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 text-[#9a9590] hover:bg-[#1e1e1e] hover:text-[#f0ece4] rounded-full h-9 px-4 uppercase text-[10px] tracking-widest font-mono">
                    <ArrowLeft className="w-4 h-4" /> Terminate
                </Button>

                <div className="flex flex-col items-center mx-4">
                    <h2 className="text-xl font-serif text-[#f0ece4] truncate max-w-[200px] sm:max-w-md">
                        {scenarioName}
                    </h2>
                    <p className="text-[9px] text-[#c9a84c] font-mono tracking-[0.2em] uppercase mt-0.5">Active Sequence</p>
                </div>

                {/* Step indicator dots */}
                <div className="flex items-center gap-2">
                    {stepConfig.map((s, i) => (
                        <div key={s.key} className="flex items-center gap-1.5 text-center">
                            <div
                                className={`rounded-full transition-all duration-300 ${s.completed
                                    ? 'w-2 h-2 bg-[#141414] border border-[#c9a84c]'
                                    : i === stepIndex
                                        ? 'w-2.5 h-2.5 bg-[#c9a84c] shadow-[0_0_10px_rgba(201,168,76,0.5)]'
                                        : 'w-2 h-2 bg-[#0f0f0f] border border-[#2a2a2a]'
                                    }`}
                            />
                            {i < 2 && <div className={`w-3 h-[1px] ${s.completed ? 'bg-[#c9a84c]/50' : 'bg-[#1e1e1e]'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-5 bg-[#080808]">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center shadow-lg"
                        >
                            <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
                        </motion.div>
                        <div className="text-center">
                            <p className="text-[#f0ece4] font-serif text-xl mb-1">Compiling Module Data</p>
                            <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#5a5652]">Fetching structural parameters</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-6 bg-[#080808]">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <LibrarySquare className="w-6 h-6 text-red-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-[#f0ece4] font-serif text-xl mb-1">Module Sync Failure</p>
                            <p className="text-xs text-red-400 font-mono tracking-wider">{error}</p>
                        </div>
                        <Button onClick={onClose} variant="outline" className="rounded-full bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#141414] uppercase text-[10px] tracking-widest px-8">Return</Button>
                    </div>
                ) : module ? (
                    <div className="h-full relative custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                                className="h-full absolute inset-0 overflow-y-auto"
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
                    </div>
                ) : null}
            </div>

            {/* Exit confirmation */}
            <AnimatePresence>
                {showExitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-[#080808]/80 backdrop-blur-md flex items-center justify-center p-4 font-sans"
                        onClick={() => setShowExitConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#141414] rounded-3xl p-8 max-w-sm w-full border border-[#1e1e1e] shadow-2xl text-center"
                        >
                            <h3 className="text-2xl font-serif text-[#f0ece4] mb-3">Terminate Lesson?</h3>
                            <p className="text-sm text-[#9a9590] mb-8 leading-relaxed">
                                Partial completion data is preserved, but current phase metrics will be purged from memory.
                            </p>
                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1 bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#1e1e1e] font-mono text-[10px] uppercase tracking-widest rounded-full h-11" onClick={() => setShowExitConfirm(false)}>
                                    Remain
                                </Button>
                                <Button variant="destructive" className="flex-1 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border border-[#ef4444]/20 font-mono text-[10px] uppercase tracking-widest rounded-full h-11 transition-colors" onClick={onClose}>
                                    Terminate
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
