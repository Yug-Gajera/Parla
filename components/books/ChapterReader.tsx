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
        comprehensionResult, wordsTapped,
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
                className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center p-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <h2 className="text-lg font-bold mb-2">Preparing this chapter...</h2>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                    First read takes 5–10 seconds while we analyze vocabulary and questions.
                </p>
                <Button onClick={onClose} variant="ghost" className="mt-6 text-xs">Cancel</Button>
            </motion.div>
        );
    }

    if (isLoading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </motion.div>
        );
    }

    if (error || !chapter) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive font-medium mb-4">{error || 'Chapter not found'}</p>
                    <Button onClick={onClose} variant="outline">Go Back</Button>
                </div>
            </motion.div>
        );
    }

    // ── Results ──
    if (phase === 'results' && comprehensionResult) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] bg-background flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }} className="max-w-md w-full">
                    <Card className="p-8 text-center border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="mx-auto mb-6 p-4 rounded-full bg-primary/10 w-fit">
                            <Award className="w-10 h-10 text-primary" />
                        </motion.div>

                        <h2 className="text-2xl font-bold mb-2">
                            {comprehensionResult.book_completed ? '🎉 Book Complete!' : 'Chapter Complete!'}
                        </h2>
                        <p className="text-muted-foreground mb-6">{comprehensionResult.message}</p>

                        <div className={`text-5xl font-black mb-2 ${comprehensionResult.score >= 70 ? 'text-emerald-500' :
                                comprehensionResult.score >= 40 ? 'text-amber-500' : 'text-red-400'
                            }`}>
                            {comprehensionResult.correct}/{comprehensionResult.total}
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            Score: {comprehensionResult.score}%
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-card border border-border">
                                <p className="text-2xl font-bold text-primary">+{comprehensionResult.xp_earned}</p>
                                <p className="text-[11px] text-muted-foreground">XP Earned</p>
                            </div>
                            <div className="p-3 rounded-xl bg-card border border-border">
                                <p className="text-2xl font-bold text-foreground">{wordsTapped}</p>
                                <p className="text-[11px] text-muted-foreground">Words Looked Up</p>
                            </div>
                        </div>

                        {comprehensionResult.next_chapter ? (
                            <div className="space-y-2">
                                <Button
                                    onClick={() => onNavigate(comprehensionResult.next_chapter!)}
                                    className="w-full bg-primary font-bold gap-2"
                                >
                                    Next Chapter <ChevronRight className="w-4 h-4" />
                                </Button>
                                <Button onClick={onClose} variant="outline" className="w-full text-xs">
                                    Back to Book
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={onClose} className="w-full bg-primary font-bold">
                                Back to Library
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
                className="fixed inset-0 z-[60] bg-background flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-bold">Comprehension</span>
                    <div className="flex gap-1.5">
                        {questions.map((_: any, i: number) => (
                            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i === currentQuestion ? 'bg-primary scale-125' :
                                    i < currentQuestion ? 'bg-emerald-500' : 'bg-muted'
                                }`} />
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {currentQuestion + 1}/{questions.length}
                    </span>
                </div>

                <div className="flex-1 flex items-center justify-center p-4">
                    <motion.div key={currentQuestion}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-lg w-full"
                    >
                        <h3 className="text-lg font-bold mb-6 text-center">{q.question}</h3>
                        <div className="flex flex-col gap-3 mb-6">
                            {q.options.map((opt: string, optIdx: number) => {
                                let cls = 'border-border hover:border-primary/50';
                                if (showExplanation) {
                                    if (optIdx === q.correct) cls = 'border-emerald-500 bg-emerald-500/10';
                                    else if (optIdx === selected && !isCorrect) cls = 'border-red-500 bg-red-500/10';
                                } else if (selected === optIdx) cls = 'border-primary bg-primary/10';

                                return (
                                    <button key={optIdx}
                                        onClick={() => !showExplanation && handleSelectAnswer(currentQuestion, optIdx)}
                                        disabled={showExplanation}
                                        className={`p-4 rounded-xl border-2 text-left text-sm transition-all ${cls}`}
                                    >
                                        <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>{opt}
                                    </button>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {showExplanation && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
                                    <Card className={`p-4 ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                                        <p className="text-sm font-bold mb-1">{isCorrect ? '✅ Correct!' : '❌ Not quite'}</p>
                                        <p className="text-sm text-muted-foreground">{q.explanation}</p>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!showExplanation ? (
                            <Button className="w-full bg-primary font-bold" disabled={selected === null} onClick={handleCheckAnswer}>
                                Check Answer
                            </Button>
                        ) : (
                            <Button className="w-full bg-primary font-bold" onClick={handleNextQuestion}>
                                {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                            </Button>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // ── Reading Phase ──
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted z-10">
                <motion.div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500"
                    animate={{ width: `${readingProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border pt-3">
                <Button variant="ghost" size="sm" onClick={onClose} className="gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <div className="text-center flex-1 min-w-0 px-2">
                    <p className="text-xs text-muted-foreground truncate">
                        {bookInfo?.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                        Chapter {chapterNumber} of {totalChapters}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleVocabPanel}>
                    <BookOpen className="w-4 h-4" />
                </Button>
            </div>

            {/* Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-6">
                        {chapter.title || `Chapter ${chapterNumber}`}
                    </h2>
                    <InteractiveText content={chapter.content} onTapWord={tapWord} />
                </div>
            </div>

            {/* Chapter navigation (sticky bottom) */}
            <div className="border-t border-border bg-card/80 backdrop-blur-md px-4 py-3 flex items-center justify-between z-[62]">
                <Button variant="ghost" size="sm" disabled={!hasPrev}
                    onClick={() => hasPrev && onNavigate(chapterNumber - 1)}
                    className="gap-1 text-xs">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                <span className="text-xs text-muted-foreground font-medium">
                    {chapterNumber} / {totalChapters}
                </span>
                <Button variant="ghost" size="sm" disabled={!hasNext}
                    onClick={() => hasNext && onNavigate(chapterNumber + 1)}
                    className="gap-1 text-xs">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Comprehension button at 90% */}
            <AnimatePresence>
                {showComprehensionButton && phase === 'reading' && chapter.comprehension_questions?.length > 0 && (
                    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-16 left-4 right-4 z-[65] flex justify-center">
                        <Button onClick={handleStartComprehension}
                            className="bg-primary hover:bg-primary/90 font-bold px-8 gap-2 shadow-xl shadow-primary/20">
                            <Sparkles className="w-4 h-4" /> Finished? Check Understanding
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Word popover */}
            <AnimatePresence>
                {(wordPopover || isWordLoading) && (
                    <WordPopover
                        wordData={wordPopover}
                        isLoading={isWordLoading}
                        onDismiss={dismissPopover}
                    />
                )}
            </AnimatePresence>

            {/* Vocabulary Panel */}
            <AnimatePresence>
                {showVocabPanel && (
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="fixed bottom-0 left-0 right-0 z-[65] max-h-[70vh] bg-card border-t border-border rounded-t-2xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <h3 className="font-bold">Chapter Vocabulary</h3>
                            <button onClick={toggleVocabPanel} className="p-1.5 hover:bg-muted rounded-lg">
                                <ChevronUp className="w-4 h-4 rotate-180" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {chapter.vocabulary_items?.map((v: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold">{v.word}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                                {v.part_of_speech}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground">{v.translation}</p>
                                        {v.in_context && (
                                            <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
                                                &quot;{v.in_context}&quot;
                                            </p>
                                        )}
                                    </div>
                                    <Button size="sm" variant="ghost" className="flex-shrink-0">
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                            {(!chapter.vocabulary_items || chapter.vocabulary_items.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No vocabulary available for this chapter yet.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Interactive Text with tappable words ──
function InteractiveText({ content, onTapWord }: { content: string; onTapWord: (word: string, ctx: string) => void }) {
    const paragraphs = content.split('\n\n').filter(Boolean);
    return (
        <div className="space-y-4">
            {paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-[17px] leading-[1.85] text-foreground/90">
                    <WordTokens text={p} onTapWord={onTapWord} />
                </p>
            ))}
        </div>
    );
}

function WordTokens({ text, onTapWord }: { text: string; onTapWord: (word: string, ctx: string) => void }) {
    const tokens = text.split(/(\s+)/);
    return (
        <>
            {tokens.map((token, i) => {
                if (/^\s+$/.test(token)) return token;
                const cleanWord = token.replace(/[^a-záéíóúüñ]/gi, '').toLowerCase();
                if (!cleanWord) return token;
                return (
                    <span key={i}
                        onClick={() => onTapWord(cleanWord, text)}
                        className="cursor-pointer rounded px-[1px] transition-colors hover:bg-primary/20">
                        {token}
                    </span>
                );
            })}
        </>
    );
}
