"use client";

import React, { useState } from 'react';
import { MiniChallengeContent } from '@/types';
import { Button } from '@/components/ui/button';
import { XCircle, RotateCcw, ArrowRight, BookOpen, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MiniChallengeProps {
    challenge: MiniChallengeContent;
    scenarioName: string;
    onComplete: (score: number) => void;
    onReviewPhrases: () => void;
}

export default function MiniChallenge({ challenge, scenarioName, onComplete, onReviewPhrases }: MiniChallengeProps) {
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [phase, setPhase] = useState<'questions' | 'result'>('questions');

    const handleAnswer = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        const isCorrect = idx === challenge.questions[currentQ].correct;
        if (isCorrect) setCorrectCount(prev => prev + 1);

        setTimeout(() => {
            if (currentQ < challenge.questions.length - 1) {
                setCurrentQ(prev => prev + 1);
                setSelected(null);
            } else {
                setPhase('result');
            }
        }, 1200);
    };

    const scorePercent = Math.round((correctCount / challenge.questions.length) * 100);
    const passed = scorePercent >= 70;

    const handleRetry = () => {
        setCurrentQ(0);
        setSelected(null);
        setCorrectCount(0);
        setPhase('questions');
    };

    // ── Questions ──
    if (phase === 'questions') {
        const q = challenge.questions[currentQ];
        const typeLabel: Record<string, string> = {
            translate_to_spanish: 'Translate to Spanish',
            translate_to_english: 'Translate to English',
            fill_blank: 'Fill in the Blank',
            choose_response: 'Choose the Right Response',
        };

        return (
            <div className="flex flex-col items-center w-full max-w-xl mx-auto pt-4">
                {/* Header */}
                <div className="w-full mb-6">
                    <h2 className="text-xl font-bold mb-1">Quick Readiness Check</h2>
                    <p className="text-sm text-muted-foreground">{challenge.instructions}</p>
                </div>

                {/* Progress */}
                <div className="w-full mb-8">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
                        <span>{typeLabel[q.type] || 'Question'}</span>
                        <span>Question {currentQ + 1} of {challenge.questions.length}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            animate={{ width: `${((currentQ) / challenge.questions.length) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQ}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="w-full"
                    >
                        <h3 className="text-lg font-bold text-center mb-2">{q.prompt}</h3>
                        {q.context && (
                            <p className="text-sm text-muted-foreground text-center mb-6">{q.context}</p>
                        )}

                        <div className="flex flex-col gap-3 mt-4">
                            {q.options.map((opt, idx) => {
                                let cls = 'bg-card border-border hover:border-primary/50';
                                if (selected !== null) {
                                    if (idx === q.correct) cls = 'bg-emerald-500/10 border-emerald-500 text-emerald-500';
                                    else if (idx === selected) cls = 'bg-destructive/10 border-destructive text-destructive opacity-70';
                                    else cls = 'opacity-30 border-border bg-card';
                                }
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={selected !== null}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${cls}`}
                                    >
                                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-sm">
                                            {['A', 'B', 'C', 'D'][idx]}
                                        </span>
                                        <span className="flex-1">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {selected !== null && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 rounded-xl bg-card/80 border border-border"
                            >
                                <p className="text-sm text-muted-foreground">{q.explanation}</p>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    // ── Result ──
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto pt-12"
        >
            {/* Confetti-style dots for pass */}
            {passed && (
                <div className="relative mb-4">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0.5],
                                x: Math.cos(i * Math.PI / 4) * 60,
                                y: Math.sin(i * Math.PI / 4) * 60,
                            }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                            style={{ backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'][i] }}
                        />
                    ))}
                </div>
            )}

            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${passed ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                }`}>
                {passed ? (
                    <PartyPopper className="w-10 h-10 text-emerald-500" />
                ) : (
                    <XCircle className="w-10 h-10 text-amber-500" />
                )}
            </div>

            <h2 className="text-2xl font-bold mb-2">
                {passed ? 'Scenario Unlocked! 🎉' : 'Almost there!'}
            </h2>
            <p className="text-muted-foreground mb-2">
                {correctCount} of {challenge.questions.length} correct ({scorePercent}%)
            </p>

            {passed ? (
                <>
                    <p className="text-sm text-emerald-500 mb-8">
                        You&apos;re ready for the real {scenarioName} conversation!
                    </p>
                    <Button
                        onClick={() => onComplete(scorePercent)}
                        className="w-full h-12 text-base font-bold rounded-xl bg-primary shadow-lg shadow-primary/25"
                    >
                        <ArrowRight className="w-5 h-5 mr-2" />
                        Complete Module
                    </Button>
                </>
            ) : (
                <>
                    <p className="text-sm text-amber-500 mb-8">
                        Review the phrases and try again. You need 70% to unlock the scenario.
                    </p>
                    <div className="flex flex-col gap-3 w-full">
                        <Button
                            onClick={onReviewPhrases}
                            variant="outline"
                            className="w-full h-11 font-semibold"
                        >
                            <BookOpen className="w-4 h-4 mr-2" /> Review Phrases
                        </Button>
                        <Button
                            onClick={handleRetry}
                            className="w-full h-11 font-semibold bg-amber-600 hover:bg-amber-700"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" /> Try Challenge Again
                        </Button>
                    </div>
                </>
            )}
        </motion.div>
    );
}
