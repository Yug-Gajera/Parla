"use client";

import React, { useState } from 'react';
import { MiniChallengeContent } from '@/types';
import { Button } from '@/components/ui/button';
import { XCircle, RotateCcw, ArrowRight, BookOpen, Fingerprint } from 'lucide-react';
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
            translate_to_spanish: 'Translation',
            translate_to_english: 'Translation',
            fill_blank: 'Fill in the blank',
            choose_response: 'Choose a response',
        };

        return (
            <div className="flex flex-col items-center w-full max-w-2xl mx-auto pt-6 px-4 font-sans">
                {/* Header */}
                <div className="w-full mb-8 bg-card border border-border p-6 rounded-[18px] flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-sm font-mono-num text-text-primary uppercase tracking-widest mb-1">Quiz</h2>
                        <p className="text-[10px] text-text-muted uppercase tracking-[0.1em]">{challenge.instructions}</p>
                    </div>
                </div>

                {/* Progress */}
                <div className="w-full mb-10">
                    <div className="flex justify-between text-[10px] font-mono-num uppercase tracking-widest text-text-muted mb-3">
                        <span>{typeLabel[q.type] || 'Quiz'}</span>
                        <span className="text-[#E8521A]">Question {currentQ + 1} / {challenge.questions.length}</span>
                    </div>
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#E8521A]/50 to-[#E8521A]"
                            animate={{ width: `${((currentQ) / challenge.questions.length) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQ}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <div className="text-center mb-10">
                            <h3 className="text-2xl sm:text-3xl font-serif text-text-primary mb-3 leading-snug">{q.prompt}</h3>
                            {q.context && (
                                <p className="text-sm font-mono-num text-text-secondary uppercase tracking-wide opacity-80 border-b border-border-strong inline-block pb-1">{q.context}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            {q.options.map((opt, idx) => {
                                let cls = 'bg-surface border-border-strong hover:border-[#E8521A]/50 hover:bg-card text-text-secondary hover:text-text-primary';
                                if (selected !== null) {
                                    if (idx === q.correct) cls = 'bg-[#E8521A]/10 border-[#E8521A] text-[#E8521A] shadow-[0_0_20px_rgba(232,82,26,0.15)]';
                                    else if (idx === selected) cls = 'bg-error/10 border-error/50 text-error opacity-90';
                                    else cls = 'opacity-30 border-border bg-background text-text-muted';
                                }
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={selected !== null}
                                        className={`flex items-center gap-4 p-5 rounded-[18px] border transition-all duration-300 text-left group ${cls}`}
                                    >
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-sm border flex items-center justify-center font-mono-num text-[9px] transition-colors ${selected === null ? 'border-text-muted group-hover:border-[#E8521A]' : 'border-transparent'}`}>
                                            {['01', '02', '03', '04'][idx]}
                                        </div>
                                        <span className="flex-1 font-sans text-[15px]">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {selected !== null && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 p-6 rounded-[18px] bg-card border border-border shadow-sm"
                            >
                                <p className="text-sm font-sans text-text-primary leading-relaxed"><span className="text-[#E8521A] font-mono-num text-[10px] uppercase tracking-widest block mb-2">Feedback</span>{q.explanation}</p>
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
            className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto h-full px-6 font-sans"
        >
            {/* Subtle Luxury Particles for pass */}
            {passed && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0 opacity-40">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0, y: 0 }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0.5],
                                y: -150 - Math.random() * 100,
                                x: (Math.random() - 0.5) * 200,
                            }}
                            transition={{ duration: 2 + Math.random(), delay: i * 0.1, ease: "easeOut" }}
                            className="absolute bg-[#E8521A] w-1 h-1 rounded-full shadow-[0_0_10px_rgba(232,82,26,0.2)]"
                        />
                    ))}
                </div>
            )}

            <div className="relative z-10 w-full flex flex-col items-center">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center border transition-all duration-700 mb-8 ${passed ? 'bg-[#E8521A]/5 border-[#E8521A]/30 shadow-[0_0_60px_rgba(232,82,26,0.15)]' : 'bg-error/10 border-error/30'
                    }`}>
                    {passed ? (
                        <Fingerprint className="w-12 h-12 text-[#E8521A]" strokeWidth={1} />
                    ) : (
                        <XCircle className="w-12 h-12 text-error" strokeWidth={1} />
                    )}
                </div>

                <h2 className="text-4xl font-serif text-text-primary mb-4">
                    {passed ? 'Lesson complete!' : 'Almost there'}
                </h2>
                
                <div className="flex bg-card border border-border p-4 rounded-[18px] items-center gap-6 mb-8 shadow-sm">
                    <div className="text-left">
                        <p className="text-[9px] font-mono-num text-text-muted uppercase tracking-widest mb-1">Score</p>
                        <p className="text-xl font-mono-num text-text-primary">{correctCount} <span className="text-text-muted text-sm">/ {challenge.questions.length}</span></p>
                    </div>
                    <div className="w-[1px] h-8 bg-border" />
                    <div className="text-left">
                        <p className="text-[9px] font-mono-num text-text-muted uppercase tracking-widest mb-1">Score</p>
                        <div className="pill-score">
                            {scorePercent}%
                        </div>
                    </div>
                </div>

                {passed ? (
                    <>
                        <p className="text-sm text-text-secondary mb-12 max-w-sm leading-relaxed">
                            You\'ve unlocked the `<span className="text-[#E8521A] font-mono-num">{scenarioName}</span>` conversation in the Practice tab.
                        </p>
                        <Button
                            onClick={() => onComplete(scorePercent)}
                            className="btn-action w-full max-w-xs h-14"
                        >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Finish
                        </Button>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-text-secondary mb-12 max-w-sm leading-relaxed">
                            You need a 70% to pass. Review your phrases and try again.
                        </p>
                        <div className="flex flex-col gap-4 w-full max-w-xs">
                            <Button
                                onClick={onReviewPhrases}
                                className="btn-secondary w-full max-w-xs h-12"
                            >
                                <BookOpen className="w-3.5 h-3.5 mr-2" /> Review phrases
                            </Button>
                            <Button
                                onClick={handleRetry}
                                className="w-full h-12 bg-card text-accent border border-accent/20 hover:bg-surface font-mono-num text-[10px] uppercase tracking-widest rounded-full transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-2" /> Try again
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
