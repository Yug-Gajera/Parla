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
            translate_to_spanish: 'Translation Protocol',
            translate_to_english: 'Decryption Protocol',
            fill_blank: 'Syntactical Insertion',
            choose_response: 'Contextual Response',
        };

        return (
            <div className="flex flex-col items-center w-full max-w-2xl mx-auto pt-6 px-4 font-sans">
                {/* Header */}
                <div className="w-full mb-8 bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-inner">
                    <div>
                        <h2 className="text-sm font-mono-num text-text-primary uppercase tracking-widest mb-1">Diagnostic System</h2>
                        <p className="text-[10px] text-text-muted uppercase tracking-[0.1em]">{challenge.instructions}</p>
                    </div>
                </div>

                {/* Progress */}
                <div className="w-full mb-10">
                    <div className="flex justify-between text-[10px] font-mono-num uppercase tracking-widest text-text-muted mb-3">
                        <span>{typeLabel[q.type] || 'Verification'}</span>
                        <span className="text-gold">Seq {currentQ + 1} / {challenge.questions.length}</span>
                    </div>
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-gold/50 to-gold"
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
                                let cls = 'bg-surface border-border-strong hover:border-gold/50 hover:bg-card text-text-secondary hover:text-text-primary';
                                if (selected !== null) {
                                    if (idx === q.correct) cls = 'bg-gold/10 border-gold text-gold shadow-[0_0_20px_rgba(201,168,76,0.15)]';
                                    else if (idx === selected) cls = 'bg-error/10 border-error/50 text-error opacity-90';
                                    else cls = 'opacity-30 border-border bg-background text-text-muted';
                                }
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={selected !== null}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 text-left group ${cls}`}
                                    >
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-sm border flex items-center justify-center font-mono-num text-[9px] transition-colors ${selected === null ? 'border-text-muted group-hover:border-gold' : 'border-transparent'}`}>
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
                                className="mt-8 p-6 rounded-2xl bg-card border border-border"
                            >
                                <p className="text-sm font-sans text-text-primary leading-relaxed"><span className="text-gold font-mono-num text-[10px] uppercase tracking-widest block mb-2">System Output</span>{q.explanation}</p>
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
                            className="absolute bg-gold w-1 h-1 rounded-full shadow-[0_0_10px_rgba(201,168,76,0.2)]"
                        />
                    ))}
                </div>
            )}

            <div className="relative z-10 w-full flex flex-col items-center">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center border transition-all duration-700 mb-8 ${passed ? 'bg-gold/5 border-gold/30 shadow-[0_0_60px_rgba(201,168,76,0.15)]' : 'bg-error/10 border-error/30'
                    }`}>
                    {passed ? (
                        <Fingerprint className="w-12 h-12 text-gold" strokeWidth={1} />
                    ) : (
                        <XCircle className="w-12 h-12 text-error" strokeWidth={1} />
                    )}
                </div>

                <h2 className="text-4xl font-serif text-text-primary mb-4">
                    {passed ? 'Authorization Granted' : 'Diagnostics Failed'}
                </h2>
                
                <div className="flex bg-card border border-border p-4 rounded-xl items-center gap-6 mb-8">
                    <div className="text-left">
                        <p className="text-[9px] font-mono-num text-text-muted uppercase tracking-widest mb-1">Success Rate</p>
                        <p className="text-xl font-mono-num text-text-primary">{correctCount} <span className="text-text-muted text-sm">/ {challenge.questions.length}</span></p>
                    </div>
                    <div className="w-[1px] h-8 bg-border-strong" />
                    <div className="text-left">
                        <p className="text-[9px] font-mono-num text-text-muted uppercase tracking-widest mb-1">Index</p>
                        <p className={`text-xl font-mono-num ${passed ? 'text-gold' : 'text-error'}`}>{scorePercent}%</p>
                    </div>
                </div>

                {passed ? (
                    <>
                        <p className="text-sm text-text-secondary mb-12 max-w-sm leading-relaxed">
                            Simulation module `<span className="text-gold font-mono-num">{scenarioName}</span>` is now accessible in the Practice sector.
                        </p>
                        <Button
                            onClick={() => onComplete(scorePercent)}
                            className="w-full max-w-xs h-14 text-[10px] font-mono-num tracking-widest uppercase font-bold rounded-full bg-gold text-background hover:brightness-110 shadow-[0_4px_20px_rgba(201,168,76,0.2)]"
                        >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Finalize Module
                        </Button>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-text-secondary mb-12 max-w-sm leading-relaxed">
                            Threshold criteria not met. Recommend revisiting phrase lexicon before re-attempting.
                        </p>
                        <div className="flex flex-col gap-4 w-full max-w-xs">
                            <Button
                                onClick={onReviewPhrases}
                                variant="outline"
                                className="w-full h-12 bg-transparent border-border text-text-primary hover:bg-card font-mono-num text-[10px] uppercase tracking-widest rounded-full"
                            >
                                <BookOpen className="w-3.5 h-3.5 mr-2" /> Lexicon Review
                            </Button>
                            <Button
                                onClick={handleRetry}
                                className="w-full h-12 bg-card text-error border border-error/20 hover:bg-error/10 font-mono-num text-[10px] uppercase tracking-widest rounded-full transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-2" /> Re-execute Diagnostic
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
