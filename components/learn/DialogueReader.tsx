"use client";

import React, { useState, useRef, useEffect } from 'react';
import { DialogueContent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DialogueReaderProps {
    dialogue: DialogueContent;
    onComplete: (score: number) => void;
}

export default function DialogueReader({ dialogue, onComplete }: DialogueReaderProps) {
    const [phase, setPhase] = useState<'reading' | 'questions' | 'result'>('reading');
    const [hasReadAll, setHasReadAll] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Track scroll to detect when user has read all lines
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const handleScroll = () => {
            const threshold = el.scrollHeight - el.clientHeight - 60;
            if (el.scrollTop >= threshold) setHasReadAll(true);
        };
        el.addEventListener('scroll', handleScroll);
        // If content fits without scroll, mark as read
        if (el.scrollHeight <= el.clientHeight + 60) setHasReadAll(true);
        return () => el.removeEventListener('scroll', handleScroll);
    }, []);

    const handleAnswer = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        const isCorrect = idx === dialogue.questions[currentQ].correct;
        if (isCorrect) setCorrectCount(prev => prev + 1);

        setTimeout(() => {
            if (currentQ < dialogue.questions.length - 1) {
                setCurrentQ(prev => prev + 1);
                setSelected(null);
            } else {
                setPhase('result');
            }
        }, 1500);
    };

    const scorePercent = Math.round((correctCount / dialogue.questions.length) * 100);
    const passed = scorePercent >= 70;

    // ── Reading Phase ──
    if (phase === 'reading') {
        return (
            <div className="flex flex-col h-full">
                {/* Scene setter */}
                <Card className="p-5 mb-6 bg-card/60 border-border/50">
                    <p className="text-sm italic text-muted-foreground mb-3">{dialogue.setting}</p>
                    <div className="flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-primary" />
                            {dialogue.characters.a}
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500" />
                            {dialogue.characters.b}
                        </span>
                    </div>
                </Card>

                {/* Dialogue lines */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-24">
                    {dialogue.lines.map((line, i) => {
                        const isA = line.speaker === 'a';
                        return (
                            <motion.div
                                key={line.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className={`flex flex-col ${isA ? 'items-start' : 'items-start pl-6 sm:pl-10'}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2.5 h-2.5 rounded-full ${isA ? 'bg-primary' : 'bg-blue-500'}`} />
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {isA ? dialogue.characters.a.split('—')[0].trim() : dialogue.characters.b.split('—')[0].trim()}
                                    </span>
                                </div>
                                <Card className={`p-4 max-w-[90%] ${isA ? 'border-l-2 border-l-primary' : 'border-l-2 border-l-blue-500'}`}>
                                    <p className="text-lg font-medium text-foreground mb-1">{line.spanish}</p>
                                    <p className="text-sm text-muted-foreground italic">{line.english}</p>
                                    {line.vocabulary.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {line.vocabulary.map((v, vi) => (
                                                <span
                                                    key={vi}
                                                    className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium cursor-help"
                                                    title={`${v.translation}${v.note ? ` — ${v.note}` : ''}`}
                                                >
                                                    {v.word}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Check Understanding button */}
                <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-background via-background to-transparent">
                    <Button
                        onClick={() => setPhase('questions')}
                        disabled={!hasReadAll}
                        className={`w-full h-12 text-base font-bold rounded-xl transition-all ${hasReadAll ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'opacity-50'
                            }`}
                    >
                        <BookOpen className="w-5 h-5 mr-2" />
                        Check Understanding
                    </Button>
                    {!hasReadAll && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            Read through the entire dialogue to continue
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ── Questions Phase ──
    if (phase === 'questions') {
        const q = dialogue.questions[currentQ];
        return (
            <div className="flex flex-col items-center w-full max-w-xl mx-auto pt-8">
                {/* Progress */}
                <div className="w-full mb-8">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
                        <span>Comprehension Check</span>
                        <span>{currentQ + 1} of {dialogue.questions.length}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${((currentQ) / dialogue.questions.length) * 100}%` }}
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
                        <h2 className="text-xl font-bold text-center mb-8">{q.question}</h2>
                        <div className="flex flex-col gap-3">
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

    // ── Result Phase ──
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto pt-12"
        >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${passed ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                }`}>
                {passed ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                ) : (
                    <XCircle className="w-10 h-10 text-amber-500" />
                )}
            </div>

            <h2 className="text-2xl font-bold mb-2">
                {passed ? 'Great job! Step 1 complete' : "Let\u0027s review"}
            </h2>
            <p className="text-muted-foreground mb-2">
                {correctCount} of {dialogue.questions.length} correct ({scorePercent}%)
            </p>

            {passed ? (
                <p className="text-sm text-emerald-500 mb-8">
                    You understood the dialogue well. Time to learn the key phrases!
                </p>
            ) : (
                <p className="text-sm text-amber-500 mb-8">
                    Review the dialogue and try again. You need 70% to continue.
                </p>
            )}

            <Button
                onClick={() => {
                    if (passed) {
                        onComplete(scorePercent);
                    } else {
                        setPhase('reading');
                        setCurrentQ(0);
                        setSelected(null);
                        setCorrectCount(0);
                    }
                }}
                className={`w-full h-12 text-base font-bold rounded-xl ${passed ? 'bg-primary' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
            >
                {passed ? (
                    <>Continue to Phrases <ChevronRight className="w-5 h-5 ml-1" /></>
                ) : (
                    <>Review Dialogue</>
                )}
            </Button>
        </motion.div>
    );
}
