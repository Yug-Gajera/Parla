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
                <Card className="p-6 mb-8 bg-[#0f0f0f] border-[#1e1e1e] rounded-2xl">
                    <p className="text-sm font-serif italic text-[#c9a84c] mb-4 text-center">{dialogue.setting}</p>
                    <div className="flex items-center justify-center gap-8 text-[10px] font-mono tracking-widest uppercase">
                        <span className="flex items-center gap-2 text-[#f0ece4]">
                            <span className="w-2 h-2 rounded-full bg-[#c9a84c]" />
                            {dialogue.characters.a}
                        </span>
                        <span className="flex items-center gap-2 text-[#f0ece4]">
                            <span className="w-2 h-2 rounded-full bg-[#5a5652]" />
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
                                    <span className={`w-1.5 h-1.5 rounded-full ${isA ? 'bg-[#c9a84c]' : 'bg-[#5a5652]'}`} />
                                    <span className="text-[10px] text-[#9a9590] font-mono uppercase tracking-widest">
                                        {isA ? dialogue.characters.a.split('—')[0].trim() : dialogue.characters.b.split('—')[0].trim()}
                                    </span>
                                </div>
                                <div className={`p-5 max-w-[85%] rounded-2xl relative ${isA ? 'bg-[#141414] border border-[#1e1e1e] rounded-tl-sm' : 'bg-[#0f0f0f] border border-[#2a2a2a] rounded-tr-sm'}`}>
                                    <p className="text-lg font-serif text-[#f0ece4] mb-2 leading-relaxed">{line.spanish}</p>
                                    <p className="text-sm text-[#9a9590] italic font-sans">{line.english}</p>
                                    {line.vocabulary.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#1e1e1e]">
                                            {line.vocabulary.map((v, vi) => (
                                                <span
                                                    key={vi}
                                                    className="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase rounded border border-[#c9a84c]/30 text-[#c9a84c] cursor-help transition-colors hover:bg-[#c9a84c]/10"
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
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#080808] via-[#080808]/90 to-transparent">
                    <Button
                        onClick={() => setPhase('questions')}
                        disabled={!hasReadAll}
                        className={`w-full max-w-md mx-auto h-14 text-[10px] font-mono tracking-widest uppercase font-bold rounded-full transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.8)] ${hasReadAll 
                            ? 'bg-[#c9a84c] text-[#080808] hover:bg-[#b98e72] shadow-[0_4px_20px_rgba(201,168,76,0.2)]' 
                            : 'bg-[#141414] text-[#5a5652] opacity-50 cursor-not-allowed border border-[#1e1e1e]'
                            }`}
                    >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Commence Verification
                    </Button>
                    <AnimatePresence>
                        {!hasReadAll && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[9px] font-mono text-center text-[#5a5652] mt-3 uppercase tracking-widest">
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
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-[#5a5652] mb-3">
                        <span>Verification Phase</span>
                        <span className="text-[#c9a84c]">{currentQ + 1} / {dialogue.questions.length}</span>
                    </div>
                    <div className="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#8b7538] to-[#c9a84c] transition-all duration-500 ease-out"
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
                        <h2 className="text-2xl font-serif text-[#f0ece4] text-center mb-10 leading-snug">{q.question}</h2>
                        <div className="flex flex-col gap-4">
                            {q.options.map((opt, idx) => {
                                let cls = 'bg-[#141414] border-[#1e1e1e] hover:border-[#c9a84c]/50 text-[#9a9590] hover:text-[#f0ece4]';
                                if (selected !== null) {
                                    if (idx === q.correct) cls = 'bg-[#c9a84c]/10 border-[#c9a84c] text-[#c9a84c] shadow-[0_0_15px_rgba(201,168,76,0.15)]';
                                    else if (idx === selected) cls = 'bg-red-500/5 border-red-500/50 text-red-400 opacity-90';
                                    else cls = 'opacity-30 border-[#1e1e1e] bg-[#0f0f0f] text-[#5a5652]';
                                }
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={selected !== null}
                                        className={`flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300 text-left group ${cls}`}
                                    >
                                        <span className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center font-mono text-[10px] transition-colors ${selected === null ? 'border-[#2a2a2a] group-hover:border-[#c9a84c]' : 'border-transparent'}`}>
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
                                className="mt-8 p-6 rounded-2xl bg-[#080808] border border-[#2a2a2a] text-center"
                            >
                                <p className="text-sm font-sans text-[#f0ece4] leading-relaxed">{q.explanation}</p>
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
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border transition-all duration-700 ${passed ? 'bg-[#c9a84c]/10 border-[#c9a84c]/30 shadow-[0_0_40px_rgba(201,168,76,0.2)]' : 'bg-red-500/10 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]'
                    }`}>
                    {passed ? (
                        <CheckCircle2 className="w-10 h-10 text-[#c9a84c]" />
                    ) : (
                        <XCircle className="w-10 h-10 text-red-500" />
                    )}
                </div>
            </div>

            <h2 className="text-3xl font-serif text-[#f0ece4] mb-3">
                {passed ? 'Phase 1 Complete' : "Review Required"}
            </h2>
            <div className="flex items-center gap-3 mb-6">
                <p className="font-mono text-xs text-[#5a5652] uppercase tracking-widest">
                    Score metric
                </p>
                <p className="font-mono text-xl text-[#c9a84c]">
                    {scorePercent}%
                </p>
            </div>

            {passed ? (
                <p className="text-sm text-[#9a9590] mb-12 max-w-xs leading-relaxed">
                    Comprehension validated. Proceeding to lexical acquisition phase.
                </p>
            ) : (
                <p className="text-sm text-[#9a9590] mb-12 max-w-xs leading-relaxed">
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
                className={`w-full h-14 text-[10px] font-mono font-bold tracking-widest uppercase rounded-full transition-all duration-300 ${passed ? 'bg-[#c9a84c] text-[#080808] hover:bg-[#b98e72] shadow-[0_4px_20px_rgba(201,168,76,0.2)]' : 'bg-[#141414] text-[#f0ece4] border border-[#2a2a2a] hover:bg-[#1e1e1e]'
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
