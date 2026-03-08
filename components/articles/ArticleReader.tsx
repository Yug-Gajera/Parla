"use client";

// ============================================================
// Parlova — Article Reader (3 questions, 90% trigger)
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useArticleReader } from '@/hooks/useArticleReader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import WordPopover from '@/components/shared/WordPopover';
import {
    ArrowLeft, Clock, BookOpen, Plus, Check,
    Loader2, ChevronUp, X, Sparkles, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArticleReaderProps {
    articleId: string;
    onClose: () => void;
}

type Phase = 'reading' | 'comprehension' | 'results';

export default function ArticleReader({ articleId, onClose }: ArticleReaderProps) {
    const {
        article, isLoading, error,
        wordPopover, isWordLoading, showVocabPanel, readingProgress,
        comprehensionResult, knownWords, wordsTapped,
        fetchArticle, tapWord, dismissPopover,
        toggleVocabPanel, submitComprehension,
        calculateReadingProgress,
    } = useArticleReader(articleId);

    const [phase, setPhase] = useState<Phase>('reading');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showComprehensionButton, setShowComprehensionButton] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchArticle(articleId);
    }, [articleId, fetchArticle]);

    // Track reading progress — show comprehension button at 90%
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

    const handleBack = () => {
        if (readingProgress > 10 && phase === 'reading') {
            setShowExitConfirm(true);
        } else {
            onClose();
        }
    };

    const handleStartComprehension = () => {
        if (article?.comprehension_questions?.length) {
            setSelectedAnswers(new Array(article.comprehension_questions.length).fill(null));
            setCurrentQuestion(0);
            setPhase('comprehension');
        }
    };

    const handleSelectAnswer = (qIdx: number, optIdx: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[qIdx] = optIdx;
        setSelectedAnswers(newAnswers);
    };

    const handleCheckAnswer = () => setShowExplanation(true);

    const handleNextQuestion = () => {
        setShowExplanation(false);
        if (currentQuestion < (article?.comprehension_questions?.length || 0) - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            const answers = selectedAnswers.filter((a): a is number => a !== null);
            submitComprehension(answers);
            setPhase('results');
        }
    };

    // ── Loading / Error ──
    if (isLoading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading article...</p>
                </div>
            </motion.div>
        );
    }

    if (error || !article) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive font-medium mb-4">{error || 'Article not found'}</p>
                    <Button onClick={onClose} variant="outline">Go Back</Button>
                </div>
            </motion.div>
        );
    }

    // ── Results Phase ──
    if (phase === 'results' && comprehensionResult) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-background flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }} className="max-w-md w-full">
                    <Card className="p-8 text-center border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="mx-auto mb-6 p-4 rounded-full bg-primary/10 w-fit">
                            <Award className="w-10 h-10 text-primary" />
                        </motion.div>

                        <h2 className="text-2xl font-bold mb-2">Reading Complete!</h2>
                        <p className="text-muted-foreground mb-6">{comprehensionResult.message}</p>

                        <div className="mb-6">
                            <div className={`text-5xl font-black ${comprehensionResult.score >= 70 ? 'text-emerald-500' : comprehensionResult.score >= 40 ? 'text-amber-500' : 'text-red-400'}`}>
                                {comprehensionResult.correct}/{comprehensionResult.total}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Comprehension Score: {comprehensionResult.score}%
                            </p>
                        </div>

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

                        <div className="flex flex-col gap-2">
                            <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 font-bold">
                                Keep Reading
                            </Button>
                            <Button onClick={() => { setPhase('reading'); toggleVocabPanel(); }} variant="outline" className="w-full">
                                Review New Words
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </motion.div>
        );
    }

    // ── Comprehension Phase (3 questions) ──
    if (phase === 'comprehension') {
        const q = article.comprehension_questions[currentQuestion];
        const selected = selectedAnswers[currentQuestion];
        const isCorrect = selected === q.correct;

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-background flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-bold">Comprehension Check</span>
                    <div className="flex gap-1.5">
                        {article.comprehension_questions.map((_: unknown, i: number) => (
                            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i === currentQuestion ? 'bg-primary scale-125' :
                                i < currentQuestion ? 'bg-emerald-500' : 'bg-muted'
                                }`} />
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {currentQuestion + 1}/{article.comprehension_questions.length}
                    </span>
                </div>

                <div className="flex-1 flex items-center justify-center p-4">
                    <motion.div key={currentQuestion} initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full">
                        <h3 className="text-lg font-bold mb-6 text-center leading-relaxed">
                            {q.question}
                        </h3>

                        <div className="flex flex-col gap-3 mb-6">
                            {q.options.map((opt: string, optIdx: number) => {
                                let optClass = 'border-border hover:border-primary/50';
                                if (showExplanation) {
                                    if (optIdx === q.correct) optClass = 'border-emerald-500 bg-emerald-500/10';
                                    else if (optIdx === selected && !isCorrect) optClass = 'border-red-500 bg-red-500/10';
                                } else if (selected === optIdx) {
                                    optClass = 'border-primary bg-primary/10';
                                }
                                return (
                                    <button key={optIdx}
                                        onClick={() => !showExplanation && handleSelectAnswer(currentQuestion, optIdx)}
                                        disabled={showExplanation}
                                        className={`p-4 rounded-xl border-2 text-left text-sm transition-all ${optClass}`}>
                                        <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {showExplanation && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
                                    <Card className={`p-4 ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                                        <p className="text-sm font-bold mb-1">
                                            {isCorrect ? '✅ Correct!' : '❌ Not quite'}
                                        </p>
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
                                {currentQuestion < article.comprehension_questions.length - 1 ? 'Next Question' : 'See Results'}
                            </Button>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // ── Reading Phase ──
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col">
            {/* Reading progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted z-10">
                <motion.div className="h-full bg-gradient-to-r from-primary to-emerald-500"
                    animate={{ width: `${readingProgress}%` }} transition={{ ease: 'easeOut' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border pt-3">
                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{article.source_name}</span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.estimated_read_minutes} min
                    </span>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleVocabPanel}>
                    <BookOpen className="w-4 h-4" />
                </Button>
            </div>

            {/* Article content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-3">
                        {article.title}
                    </h1>

                    <div className="flex items-center gap-2 flex-wrap mb-6">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelColorFn(article.cefr_level)}`}>
                            {article.cefr_level}
                        </span>
                        {article.topics?.map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-muted-foreground capitalize">
                                {t}
                            </span>
                        ))}
                        <span className="text-xs text-muted-foreground">{article.word_count} words</span>
                    </div>

                    {article.image_url && (
                        <div className="mb-6 rounded-xl overflow-hidden border border-border">
                            <img src={article.image_url} alt={article.title}
                                className="w-full h-48 object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                    )}

                    <InteractiveText content={article.content} knownWords={knownWords} onTapWord={tapWord} />
                </div>
            </div>

            {/* Check Understanding button — appears at 90% scroll */}
            <AnimatePresence>
                {showComprehensionButton && phase === 'reading' && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-6 left-4 right-4 z-[65] flex justify-center"
                    >
                        <Button
                            onClick={handleStartComprehension}
                            className="bg-primary hover:bg-primary/90 font-bold px-8 gap-2 shadow-xl shadow-primary/20"
                        >
                            <Sparkles className="w-4 h-4" />
                            Check Your Understanding
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
                            <h3 className="font-bold">Key Vocabulary</h3>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="text-xs">Add All to Deck</Button>
                                <button onClick={toggleVocabPanel} className="p-1.5 hover:bg-muted rounded-lg">
                                    <ChevronUp className="w-4 h-4 rotate-180" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {article.vocabulary_items?.map((v: { word: string; translation: string; part_of_speech: string; difficulty: string; in_context: string; note: string }, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold">{v.word}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">{v.part_of_speech}</span>
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Exit confirmation */}
            <AnimatePresence>
                {showExitConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
                        onClick={() => setShowExitConfirm(false)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border">
                            <h3 className="text-lg font-bold mb-2">Exit article?</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                You&apos;re partway through. Your progress will be saved.
                            </p>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowExitConfirm(false)}>
                                    Keep Reading
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

function levelColorFn(level: string): string {
    const colors: Record<string, string> = {
        A1: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        A2: 'bg-green-500/10 text-green-400 border-green-500/30',
        B1: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        B2: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
        C1: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        C2: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
    return colors[level] || 'bg-muted text-muted-foreground';
}

function InteractiveText({
    content, knownWords, onTapWord,
}: {
    content: string;
    knownWords: Set<string>;
    onTapWord: (word: string, contextSentence: string) => void;
}) {
    const paragraphs = content.split('\n\n').filter(Boolean);

    return (
        <div className="article-content space-y-4">
            {paragraphs.map((paragraph, pIdx) => {
                const sentences = paragraph.split(/(?<=[.!?])\s+/);
                return (
                    <p key={pIdx} className="text-[17px] leading-[1.85] text-foreground/90">
                        {sentences.map((sentence, sIdx) => {
                            const tokens = sentence.split(/(\s+)/);
                            return (
                                <React.Fragment key={sIdx}>
                                    {tokens.map((token, tIdx) => {
                                        if (/^\s+$/.test(token)) return token;
                                        const cleanWord = token.replace(/[^a-záéíóúüñ]/gi, '').toLowerCase();
                                        if (!cleanWord) return token;
                                        const isKnown = knownWords.has(cleanWord);
                                        return (
                                            <span key={tIdx}
                                                onClick={() => onTapWord(cleanWord, sentence)}
                                                className={`cursor-pointer rounded px-[1px] transition-colors hover:bg-primary/20 ${isKnown ? 'underline decoration-primary/40 decoration-dotted underline-offset-4' : ''
                                                    }`}>
                                                {token}
                                            </span>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </p>
                );
            })}
        </div>
    );
}
