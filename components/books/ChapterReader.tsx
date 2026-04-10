"use client";

// ============================================================
// Parlai — Chapter Reader (Full-Screen Book Reading)
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useChapterReader } from '@/hooks/useChapterReader';
import WordPopover from '@/components/shared/WordPopover';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    ArrowLeft, BookOpen, ChevronLeft, ChevronRight, ChevronUp,
    Loader2, Sparkles, Award, Plus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChapterReaderProps {
    bookId: string;
    chapterNumber: number;
    onClose: () => void;
    onNavigate: (chapterNumber: number) => void;
}

type Phase = 'reading' | 'comprehension' | 'results';

export default function ChapterReader({
    bookId, chapterNumber, onClose, onNavigate
}: ChapterReaderProps) {
    const {
        chapter, bookInfo, isLoading, isProcessing, error,
        wordPopover, isWordLoading, showVocabPanel, readingProgress,
        comprehensionResult, wordsTapped, remainingLookups, isPro,
        fetchChapter, tapWord, dismissPopover,
        toggleVocabPanel, submitComprehension,
        calculateReadingProgress,
    } = useChapterReader(bookId, chapterNumber);

    const [phase, setPhase] = useState<Phase>('reading');
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showComprehensionButton, setShowComprehensionButton] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { fetchChapter(); }, [fetchChapter]);

    // Track scroll
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const handler = () => {
            const percent = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
            calculateReadingProgress(percent);
            if (percent >= 90) setShowComprehensionButton(true);
        };
        el.addEventListener('scroll', handler);
        return () => el.removeEventListener('scroll', handler);
    }, [calculateReadingProgress]);

    const handleStartComprehension = () => {
        if (chapter?.comprehension_questions?.length) {
            setSelectedAnswers(new Array(chapter.comprehension_questions.length).fill(null));
            setCurrentQuestion(0);
            setPhase('comprehension');
        }
    };

    const handleSelectAnswer = (qIdx: number, optIdx: number) => {
        const a = [...selectedAnswers]; a[qIdx] = optIdx; setSelectedAnswers(a);
    };
    const handleCheckAnswer = () => setShowExplanation(true);
    const handleNextQuestion = () => {
        setShowExplanation(false);
        if (currentQuestion < (chapter?.comprehension_questions?.length || 0) - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            submitComprehension(selectedAnswers.filter((a): a is number => a !== null));
            setPhase('results');
        }
    };

    const totalChapters = bookInfo?.total_chapters || 1;
    const hasPrev = chapterNumber > 1;
    const hasNext = chapterNumber < totalChapters;

    // ── Processing State ──
    if (isProcessing) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] bg-[#080808] flex flex-col items-center justify-center p-8 font-sans">
                <Loader2 className="w-12 h-12 text-[#E8521A] animate-spin mb-6" />
                <h2 className="text-xl font-serif text-[#f0ece4] mb-3">Getting chapter ready</h2>
                <p className="text-[11px] font-mono uppercase tracking-widest text-[#5a5652] text-center max-w-sm leading-relaxed p-4 border border-[#1e1e1e] rounded-xl bg-[#0f0f0f]">
                    We\'re finding the best words for you to learn.
                </p>
                <Button onClick={onClose} variant="ghost" className="mt-8 text-[#5a5652] hover:text-[#f0ece4] hover:bg-[#141414] rounded-full font-mono text-[10px] uppercase tracking-widest">Cancel</Button>
            </motion.div>
        );
    }

    if (isLoading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] bg-[#080808] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#E8521A] animate-spin" />
            </motion.div>
        );
    }

    if (error || !chapter) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] bg-[#080808] flex items-center justify-center font-sans">
                <div className="text-center">
                    <p className="text-red-500 font-mono text-sm uppercase tracking-widest mb-4">{error || 'Chapter Not Found'}</p>
                    <Button onClick={onClose} variant="outline" className="border-[#1e1e1e] bg-[#141414] hover:bg-[#1e1e1e] text-[#f0ece4] font-mono text-[10px] uppercase tracking-widest rounded-full px-8">Go back</Button>
                </div>
            </motion.div>
        );
    }

    // ── Results ──
    if (phase === 'results' && comprehensionResult) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] bg-[#080808] flex items-center justify-center p-4 font-sans relative overflow-hidden">
                
                {/* Visual particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0, y: 0 }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0.5],
                                y: -100 - Math.random() * 150,
                                x: (Math.random() - 0.5) * 250,
                            }}
                            transition={{ duration: 2 + Math.random() * 2, delay: i * 0.1, ease: "easeOut" }}
                            className="absolute bg-[#E8521A] w-1.5 h-1.5 rounded-full shadow-[0_0_15px_rgba(232,82,26,0.8)]"
                        />
                    ))}
                </div>

                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }} className="max-w-md w-full relative z-10">
                    <Card className="p-8 sm:p-10 text-center border border-[#1e1e1e] bg-[#0f0f0f] shadow-2xl rounded-3xl">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="mx-auto mb-8 p-5 rounded-full bg-[#141414] border border-[#2a2a2a] w-fit shadow-inner">
                            <Award className="w-12 h-12 text-[#E8521A]" />
                        </motion.div>

                        <h2 className="text-3xl font-serif text-[#f0ece4] mb-3 leading-tight">
                            {comprehensionResult.book_completed ? 'Book Finished' : 'Chapter Complete'}
                        </h2>
                        <p className="text-[#9a9590] text-sm mb-10 font-sans max-w-[260px] mx-auto">
                            {comprehensionResult.message}
                        </p>

                        <div className={`text-6xl font-serif mb-2 ${
                            comprehensionResult.score >= 70 ? 'text-[#E8521A]' :
                            comprehensionResult.score >= 40 ? 'text-[#D94A15]' : 'text-red-400'
                        }`}>
                            {comprehensionResult.correct}/{comprehensionResult.total}
                        </div>
                        <p className="text-[10px] font-mono text-[#5a5652] uppercase tracking-[0.2em] mb-10">
                            Score: {comprehensionResult.score}%
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <div className="p-4 rounded-2xl bg-[#141414] border border-[#1e1e1e] shadow-inner flex flex-col items-center">
                                <p className="text-3xl font-serif text-[#E8521A] mb-1">+{comprehensionResult.xp_earned}</p>
                                <p className="text-[9px] font-mono text-[#5a5652] uppercase tracking-widest">XP Yield</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#141414] border border-[#1e1e1e] shadow-inner flex flex-col items-center">
                                <p className="text-3xl font-serif text-[#f0ece4] mb-1">{wordsTapped}</p>
                                <p className="text-[9px] font-mono text-[#5a5652] uppercase tracking-widest">Words tapped</p>
                            </div>
                        </div>

                        {comprehensionResult.next_chapter ? (
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => onNavigate(comprehensionResult.next_chapter!)}
                                    className="w-full bg-[#E8521A] hover:bg-[#D94A15] text-[#080808] font-mono text-[10px] font-bold uppercase tracking-widest h-14 rounded-full shadow-[0_4px_20px_rgba(232,82,26,0.15)] transition-all gap-2"
                                >
                                    Start Chapter {comprehensionResult.next_chapter} <ChevronRight className="w-4 h-4" />
                                </Button>
                                <Button onClick={onClose} variant="outline" className="w-full border-[#1e1e1e] bg-transparent text-[#9a9590] hover:text-[#f0ece4] hover:bg-[#141414] font-mono text-[10px] uppercase tracking-widest h-14 rounded-full">
                                    Back to library
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={onClose} className="w-full bg-[#E8521A] hover:bg-[#D94A15] text-[#080808] font-mono text-[10px] font-bold uppercase tracking-widest h-14 rounded-full shadow-[0_4px_20px_rgba(232,82,26,0.15)] transition-all">
                                Back to library
                            </Button>
                        )}
                    </Card>
                </motion.div>
            </motion.div>
        );
    }

    // ── Comprehension ──
    if (phase === 'comprehension') {
        const questions = chapter.comprehension_questions || [];
        const q = questions[currentQuestion];
        if (!q) return null;

        const selected = selectedAnswers[currentQuestion];
        const isCorrect = selected === q.correct;

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] bg-[#080808] flex flex-col font-sans pt-safe-top">
                
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e1e] bg-[#0f0f0f]">
                    <span className="text-[10px] font-mono text-[#9a9590] uppercase tracking-[0.2em] font-bold">Quiz</span>
                    <div className="flex gap-2">
                        {questions.map((_: any, i: number) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${
                                i === currentQuestion ? 'bg-[#E8521A] w-6 shadow-[0_0_10px_rgba(232,82,26,0.5)]' :
                                i < currentQuestion ? 'bg-[#E8521A]/40 w-3' : 'bg-[#1e1e1e] w-3'
                            }`} />
                        ))}
                    </div>
                    <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-[0.2em]">
                        {currentQuestion + 1} / {questions.length}
                    </span>
                </div>

                <div className="flex-1 flex flex-col items-center px-6 py-10 overflow-y-auto">
                    <motion.div key={currentQuestion}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-xl w-full"
                    >
                        <h3 className="text-2xl sm:text-3xl font-serif text-[#f0ece4] mb-10 leading-snug drop-shadow-sm">{q.question}</h3>
                        
                        <div className="flex flex-col gap-4 mb-10">
                            {q.options.map((opt: string, optIdx: number) => {
                                let cls = 'border-[#1e1e1e] bg-[#0f0f0f] text-[#f0ece4] hover:bg-[#141414] hover:border-[#2a2a2a]';
                                if (showExplanation) {
                                    if (optIdx === q.correct) cls = 'border-[#E8521A] bg-[#E8521A]/5 text-[#E8521A]';
                                    else if (optIdx === selected && !isCorrect) cls = 'border-red-500/50 bg-red-500/10 text-red-500';
                                    else cls = 'border-[#1e1e1e] bg-[#080808] text-[#5a5652] opacity-50';
                                } else if (selected === optIdx) {
                                    cls = 'border-[#E8521A]/50 bg-[#E8521A]/5 text-[#E8521A] shadow-[0_0_15px_rgba(232,82,26,0.05)]';
                                }

                                return (
                                    <button key={optIdx}
                                        onClick={() => !showExplanation && handleSelectAnswer(currentQuestion, optIdx)}
                                        disabled={showExplanation}
                                        className={`w-full p-5 rounded-2xl border flex items-center gap-4 text-left transition-all duration-300 ${cls}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] font-mono uppercase font-bold transition-all ${
                                            (showExplanation && optIdx === q.correct) || (!showExplanation && selected === optIdx) 
                                            ? 'border-[#E8521A] bg-[#E8521A]/10 text-[#E8521A]'
                                            : (showExplanation && optIdx === selected && !isCorrect)
                                            ? 'border-red-500/50 bg-red-500/10 text-red-500'
                                            : 'border-[#2a2a2a] bg-[#141414] text-[#5a5652]'
                                        }`}>
                                            {String.fromCharCode(65 + optIdx)}
                                        </div>
                                        <span className="text-base font-sans flex-1">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {showExplanation && (
                                <motion.div initial={{ opacity: 0, height: 0, y: 10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} className="mb-8">
                                    <div className={`p-6 rounded-2xl border shadow-inner ${isCorrect ? 'border-[#E8521A]/30 bg-[#E8521A]/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                        <p className={`text-[12px] font-mono font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${isCorrect ? 'text-[#E8521A]' : 'text-red-400'}`}>
                                            {isCorrect ? 'Correct!' : 'Incorrect'}
                                        </p>
                                        <p className="text-sm font-sans text-[#f0ece4]/90 leading-relaxed">{q.explanation}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
                
                <div className="p-6 bg-[#0f0f0f] border-t border-[#1e1e1e] pb-safe-bottom">
                    <div className="max-w-xl mx-auto">
                        {!showExplanation ? (
                            <Button className="w-full bg-[#E8521A] hover:bg-[#D94A15] text-[#080808] font-mono text-[12px] font-bold uppercase tracking-widest h-14 rounded-full shadow-[0_4px_20px_rgba(232,82,26,0.15)] transition-all" 
                                disabled={selected === null} 
                                onClick={handleCheckAnswer}>
                                Submit answer
                            </Button>
                        ) : (
                            <Button className="w-full bg-[#c9a84c] hover:bg-[#b98e72] text-[#080808] font-mono text-[12px] font-bold uppercase tracking-widest h-14 rounded-full shadow-[0_4px_20px_rgba(201,168,76,0.15)] transition-all" 
                                onClick={handleNextQuestion}>
                                {currentQuestion < questions.length - 1 ? 'Next question' : 'See results'}
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    // ── Reading Phase ──
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#080808] flex flex-col font-sans pt-safe-top">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#1e1e1e] z-[62]">
                <motion.div
                    className="h-full bg-[#E8521A]"
                    animate={{ width: `${readingProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#1e1e1e] bg-[#0f0f0f] z-[61]">
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-[#5a5652] hover:text-[#f0ece4] hover:bg-[#141414]">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="text-center flex-1 min-w-0 px-4">
                    <p className="text-[12px] font-mono text-[#9a9590] uppercase tracking-widest truncate">
                        {bookInfo?.title}
                    </p>
                    <p className="text-[9px] font-mono text-[#5a5652] uppercase tracking-[0.2em] mt-1">
                        Chapter {chapterNumber} <span className="text-[#2a2a2a] mx-1">/</span> {totalChapters}
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleVocabPanel} className="rounded-full text-[#E8521A] bg-[#E8521A]/10 hover:bg-[#E8521A]/20 border border-[#E8521A]/20">
                    <BookOpen className="w-4 h-4" />
                </Button>
            </div>

            {/* Content area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 sm:px-10 py-10 pb-32 custom-scrollbar scroll-smooth">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#f0ece4] mb-12 leading-tight">
                        {chapter.title || `Chapter ${chapterNumber}`}
                    </h2>
                    <InteractiveText content={chapter.content} onTapWord={tapWord} />
                </div>
            </div>

            {/* Bottom Nav bar */}
            <div className="border-t border-[#1e1e1e] bg-[#0f0f0f]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between z-[61] pb-safe-bottom">
                <Button variant="ghost" size="sm" disabled={!hasPrev}
                    onClick={() => hasPrev && onNavigate(chapterNumber - 1)}
                    className="gap-2 text-[10px] font-mono uppercase tracking-widest text-[#5a5652] disabled:opacity-30 hover:text-[#f0ece4] hover:bg-[#141414]">
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Button>
                <span className="text-[10px] text-[#2a2a2a] font-black uppercase tracking-widest leading-none flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e1e1e] mx-1"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e1e1e] mx-1"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e1e1e] mx-1"></span>
                </span>
                <Button variant="ghost" size="sm" disabled={!hasNext}
                    onClick={() => hasNext && onNavigate(chapterNumber + 1)}
                    className="gap-2 text-[10px] font-mono uppercase tracking-widest text-[#5a5652] disabled:opacity-30 hover:text-[#f0ece4] hover:bg-[#141414]">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Comprehension Button Pop Up */}
            <AnimatePresence>
                {showComprehensionButton && phase === 'reading' && chapter.comprehension_questions?.length > 0 && (
                    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-24 left-4 right-4 z-[65] flex justify-center pointer-events-none">
                        <Button onClick={handleStartComprehension}
                            className="pointer-events-auto bg-[#E8521A] hover:bg-[#D94A15] text-[#080808] font-mono text-[11px] font-bold uppercase tracking-widest h-14 px-8 rounded-full shadow-[0_10px_30px_rgba(232,82,26,0.3)] transition-all gap-3 border border-[#232,82,26]/50">
                            <Sparkles className="w-4 h-4" /> Start Quiz
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Popovers */}
            <AnimatePresence>
                {(wordPopover || isWordLoading) && (
                    <WordPopover
                        wordData={wordPopover}
                        isLoading={isWordLoading}
                        onDismiss={dismissPopover}
                        remainingLookups={remainingLookups}
                        isPro={isPro}
                    />
                )}
            </AnimatePresence>

            {/* Vocabulary Panel Overlay */}
            <AnimatePresence>
                {showVocabPanel && (
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="fixed bottom-0 left-0 right-0 z-[70] h-[75vh] bg-[#0c0c0c] border-t border-[#1e1e1e] rounded-t-3xl flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-safe-bottom">
                        
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e1e]">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#f0ece4]">Key Words</h3>
                            <button onClick={toggleVocabPanel} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#141414] border border-[#2a2a2a] text-[#5a5652] hover:text-[#f0ece4] hover:border-[#5a5652] transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                            {chapter.vocabulary_items?.map((v: any, i: number) => (
                                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-[#141414] border border-[#1e1e1e] group hover:border-[#2a2a2a] transition-all">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-serif text-xl tracking-tight text-[#f0ece4] group-hover:text-[#E8521A] transition-colors">{v.word}</span>
                                            <span className="text-[9px] px-2 py-0.5 rounded-sm border border-[#2a2a2a] bg-[#080808] text-[#9a9590] uppercase tracking-widest font-mono">
                                                {v.part_of_speech}
                                            </span>
                                        </div>
                                        <p className="text-sm font-sans text-[#f0ece4]/90 mb-2">{v.translation}</p>
                                        {v.in_context && (
                                            <div className="pl-3 border-l-2 border-[#1e1e1e] group-hover:border-[#E8521A]/30 transition-colors">
                                                <p className="text-xs font-serif text-[#5a5652] italic line-clamp-2 leading-relaxed">
                                                    "{v.in_context}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <Button size="icon" variant="ghost" className="flex-shrink-0 w-10 h-10 rounded-full border border-[#2a2a2a] bg-[#080808] text-[#5a5652] group-hover:bg-[#E8521A]/10 group-hover:text-[#E8521A] group-hover:border-[#E8521A]/30">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {(!chapter.vocabulary_items || chapter.vocabulary_items.length === 0) && (
                                <div className="p-12 text-center text-[#5a5652] font-mono text-[10px] uppercase tracking-widest border border-dashed border-[#1e1e1e] rounded-3xl">
                                    No key words found in this chapter.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click away for panel */}
            <AnimatePresence>
                {showVocabPanel && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={toggleVocabPanel}
                        className="fixed inset-0 z-[69] bg-black/60 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Interactive Text with tappable words ──
function InteractiveText({ content, onTapWord }: { content: string; onTapWord: (word: string, ctx: string) => void }) {
    const paragraphs = content.split('\n\n').filter(Boolean);
    return (
        <div className="space-y-6">
            {paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-xl sm:text-2xl font-serif leading-[1.8] text-[#9a9590] tracking-wide text-justify indent-8 first-letter:text-5xl first-letter:font-black first-letter:text-[#E8521A] first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none">
                    <WordTokens text={p} onTapWord={onTapWord} />
                </p>
            ))}
        </div>
    );
}

function WordTokens({ text, onTapWord }: { text: string; onTapWord: (word: string, ctx: string) => void }) {
    const tokens = text.split(/(\s+|[.,;!?()[\]{}"'“”‘’]+)/);
    return (
        <>
            {tokens.map((token, i) => {
                // If it's punctuation or whitespace, just render it normally
                if (/^(\s+|[.,;!?()[\]{}"'“”‘’]+)$/.test(token)) {
                    return <span key={i}>{token}</span>;
                }
                
                const cleanWord = token.replace(/[^a-záéíóúüñ]/gi, '').toLowerCase();
                if (!cleanWord) return <span key={i}>{token}</span>;
                
                return (
                    <span key={i}
                        onClick={() => onTapWord(cleanWord, text)}
                        className="cursor-pointer rounded-[4px] px-[2px] -mx-[2px] transition-colors duration-200 hover:bg-[#E8521A]/20 hover:text-[#f0ece4] active:bg-[#E8521A]/40 cursor-text-lookup">
                        {token}
                    </span>
                );
            })}
        </>
    );
}
