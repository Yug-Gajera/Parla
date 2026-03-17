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
            <div className="flex flex-col h-full font-sans max-w-3xl mx-auto w-full px-4 sm:px-6 pt-6">
                {/* Scene setter */}
                <Card className="p-6 mb-8 bg-surface border-border rounded-2xl">
                    <p className="text-sm font-serif italic text-[#E8521A] mb-4 text-center">{dialogue.setting}</p>
                    <div className="flex items-center justify-center gap-8 text-[10px] font-mono-num tracking-widest uppercase">
                        <span className="flex items-center gap-2 text-text-primary">
                            <span className="w-2 h-2 rounded-full bg-[#E8521A]" />
                            {dialogue.characters.a}
                        </span>
                        <span className="flex items-center gap-2 text-text-primary">
                            <span className="w-2 h-2 rounded-full bg-text-muted" />
                            {dialogue.characters.b}
                        </span>
                    </div>
                </Card>

                {/* Dialogue lines */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pb-32 custom-scrollbar pr-2">
                    {dialogue.lines.map((line, i) => {
                        const isA = line.speaker === 'a';
                        return (
                            <motion.div
                                key={line.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className={`flex flex-col ${isA ? 'items-start' : 'items-end'}`}
                            >
                                <div className={`flex items-center gap-2 mb-2 ${isA ? 'self-start' : 'self-end flex-row-reverse'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isA ? 'bg-[#E8521A]' : 'bg-text-muted'}`} />
                                    <span className="text-[10px] text-text-secondary font-mono-num uppercase tracking-widest">
                                        {isA ? dialogue.characters.a.split('—')[0].trim() : dialogue.characters.b.split('—')[0].trim()}
                                    </span>
                                </div>
                                <div className={`p-5 max-w-[85%] rounded-2xl relative ${isA ? 'bg-card border border-border rounded-tl-sm' : 'bg-surface border border-border-strong rounded-tr-sm'}`}>
                                    <p className="text-lg font-serif text-text-primary mb-2 leading-relaxed">{line.spanish}</p>
                                    <p className="text-sm text-text-secondary italic font-sans">{line.english}</p>
                                    {line.vocabulary.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                                            {line.vocabulary.map((v, vi) => (
                                                <span
                                                    key={vi}
                                                    className="px-2.5 py-1 text-[10px] font-mono-num tracking-widest uppercase rounded border border-[#E8521A]/30 text-[#E8521A] cursor-help transition-colors hover:bg-[#E8521A]/10"
                                                    title={`${v.translation}${v.note ? ` — ${v.note}` : ''}`}
                                                >
                                                    {v.word}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Check Understanding button */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
                    <Button
                        onClick={() => setPhase('questions')}
                        disabled={!hasReadAll}
                        className={`w-full max-w-md mx-auto h-14 text-[10px] font-mono-num tracking-widest uppercase font-bold rounded-full transition-all duration-500 shadow-md ${hasReadAll 
                            ? 'bg-[#E8521A] text-background hover:brightness-110 shadow-[0_4px_20px_rgba(232,82,26,0.2)]' 
                            : 'bg-card text-text-muted opacity-50 cursor-not-allowed border border-border'
                            }`}
                    >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Commence Verification
                    </Button>
                    <AnimatePresence>
                        {!hasReadAll && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[9px] font-mono-num text-center text-text-muted mt-3 uppercase tracking-widest">
                                Scroll to acknowledge complete dialogue sequence
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    // ── Questions Phase ──
    if (phase === 'questions') {
        const q = dialogue.questions[currentQ];
        return (
            <div className="flex flex-col items-center w-full max-w-xl mx-auto pt-10 px-6 font-sans">
                {/* Progress */}
                <div className="w-full mb-10">
                    <div className="flex justify-between text-[10px] font-mono-num uppercase tracking-widest text-text-muted mb-3">
                        <span>Verification Phase</span>
                        <span className="text-[#E8521A]">{currentQ + 1} / {dialogue.questions.length}</span>
                    </div>
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#E8521A]/50 to-[#E8521A] transition-all duration-500 ease-out"
                            style={{ width: `${((currentQ) / dialogue.questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQ}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="w-full"
                    >
                        <h2 className="text-2xl font-serif text-text-primary text-center mb-10 leading-snug">{q.question}</h2>
                        <div className="flex flex-col gap-4">
                            {q.options.map((opt, idx) => {
                                let cls = 'bg-card border-border hover:border-[#E8521A]/50 text-text-secondary hover:text-text-primary';
                                if (selected !== null) {
                                    if (idx === q.correct) cls = 'bg-[#E8521A]/10 border-[#E8521A] text-[#E8521A] shadow-[0_0_15px_rgba(232,82,26,0.2)]';
                                    else if (idx === selected) cls = 'bg-error/10 border-error/50 text-error opacity-90';
                                    else cls = 'opacity-30 border-border bg-surface text-text-muted';
                                }
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={selected !== null}
                                        className={`flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300 text-left group ${cls}`}
                                    >
                                        <span className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center font-mono-num text-[10px] transition-colors ${selected === null ? 'border-border-strong group-hover:border-[#E8521A]' : 'border-transparent'}`}>
                                            {['A', 'B', 'C', 'D'][idx]}
                                        </span>
                                        <span className="flex-1 font-sans text-[15px]">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {selected !== null && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 p-6 rounded-2xl bg-background border border-border-strong text-center"
                            >
                                <p className="text-sm font-sans text-text-primary leading-relaxed">{q.explanation}</p>
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
            className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto h-full px-6 font-sans"
        >
            <div className="relative mb-8">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border transition-all duration-700 ${passed ? 'bg-[#E8521A]/10 border-[#E8521A]/30 shadow-[0_0_40px_rgba(232,82,26,0.15)]' : 'bg-error/10 border-error/30 shadow-[0_0_40px_rgba(255,0,0,0.05)]'
                    }`}>
                    {passed ? (
                        <CheckCircle2 className="w-10 h-10 text-[#E8521A]" />
                    ) : (
                        <XCircle className="w-10 h-10 text-error" />
                    )}
                </div>
            </div>

            <h2 className="text-3xl font-serif text-text-primary mb-3">
                {passed ? 'Phase 1 Complete' : "Review Required"}
            </h2>
            <div className="flex items-center gap-3 mb-6">
                <p className="font-mono-num text-xs text-text-muted uppercase tracking-widest">
                    Score metric
                </p>
                <p className="font-mono-num text-xl text-[#E8521A]">
                    {scorePercent}%
                </p>
            </div>

            {passed ? (
                <p className="text-sm text-text-secondary mb-12 max-w-xs leading-relaxed">
                    Comprehension validated. Proceeding to lexical acquisition phase.
                </p>
            ) : (
                <p className="text-sm text-text-secondary mb-12 max-w-xs leading-relaxed">
                    Minimum threshold (70%) not met. Diagnostic recalibration required.
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
                className={`w-full h-14 text-[10px] font-mono-num font-bold tracking-widest uppercase rounded-full transition-all duration-300 ${passed ? 'bg-[#E8521A] text-background hover:brightness-110 shadow-[0_4px_20px_rgba(232,82,26,0.2)]' : 'bg-card text-text-primary border border-border-strong hover:bg-surface'
                    }`}
            >
                {passed ? (
                    <>Proceed to Lexicon <ChevronRight className="w-4 h-4 ml-2" /></>
                ) : (
                    <>Re-initialize Dialogue Review</>
                )}
            </Button>
        </motion.div>
    );
}
