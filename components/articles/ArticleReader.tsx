"use client";

// ============================================================
// Parlova — Article Reader (Redesigned)
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useArticleReader } from '@/hooks/useArticleReader';
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
        comprehensionResult, knownWords, wordsTapped, remainingLookups, isPro,
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
                className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-[32px] h-[32px] text-[#E8521A] animate-spin mb-[16px]" />
                    <p className="text-text-secondary text-[15px]">Loading article...</p>
                </div>
            </motion.div>
        );
    }

    if (error || !article) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center p-[24px]">
                <div className="bg-card border border-border shadow-sm rounded-2xl text-center max-w-[400px] w-full p-[32px]">
                    <p className="text-error font-medium mb-[24px]">{error || 'Article not found'}</p>
                    <button onClick={onClose} className="btn-secondary w-full py-3 rounded-xl border border-border-strong text-text-primary hover:bg-surface">Go Back</button>
                </div>
            </motion.div>
        );
    }

    // ── Results Phase ──
    if (phase === 'results' && comprehensionResult) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center p-[24px]">
                <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }} className="max-w-[400px] w-full">
                    <div className="bg-surface border-2 border-[#E8521A]/30 shadow-xl rounded-2xl text-center p-[40px]">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="mx-auto mb-[24px] w-[64px] h-[64px] rounded-full bg-[#E8521A]/10 border border-[#E8521A]/20 flex items-center justify-center text-[#E8521A]">
                            <Award className="w-[32px] h-[32px]" />
                        </motion.div>

                        <h2 className="font-serif text-[28px] font-semibold text-text-primary mb-[8px]">Reading Complete</h2>
                        <p className="text-[15px] text-text-secondary mb-[32px]">{comprehensionResult.message}</p>

                        <div className="mb-[32px]">
                            <div className="font-mono-num text-[48px] font-semibold leading-none mb-[8px] text-[#E8521A]">
                                {comprehensionResult.correct}<span className="text-[24px] text-text-muted">/{comprehensionResult.total}</span>
                            </div>
                            <p className="text-[13px] text-text-muted uppercase tracking-widest font-medium">
                                Score: {comprehensionResult.score}%
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-[16px] mb-[32px]">
                            <div className="bg-card border border-border p-[16px] rounded-xl flex flex-col items-center">
                                <span className="font-mono-num text-[20px] font-semibold text-green-600 mb-[4px]">+{comprehensionResult.xp_earned}</span>
                                <span className="text-[11px] text-text-muted uppercase tracking-widest">XP Earned</span>
                            </div>
                            <div className="bg-card border border-border p-[16px] rounded-xl flex flex-col items-center">
                                <span className="font-mono-num text-[20px] font-semibold text-text-primary mb-[4px]">{wordsTapped}</span>
                                <span className="text-[11px] text-text-muted uppercase tracking-widest">Words Looked Up</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-[12px]">
                            <button onClick={onClose} className="w-full py-3 rounded-xl bg-[#E8521A] text-bg font-semibold hover:brightness-110 transition-all font-mono-num uppercase tracking-wider text-sm shadow-md">
                                Keep Reading
                            </button>
                            <button onClick={() => { setPhase('reading'); toggleVocabPanel(); }} className="w-full py-3 rounded-xl border border-border-strong text-text-primary hover:bg-card transition-all font-mono-num uppercase tracking-wider text-sm">
                                Review Vocabulary
                            </button>
                        </div>
                    </div>
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
                className="fixed inset-0 z-[60] bg-background flex flex-col pt-safe-top">
                <div className="flex items-center justify-between px-[20px] h-[64px] border-b border-border">
                    <span className="text-[14px] font-semibold text-text-primary">Comprehension Check</span>
                    <div className="flex gap-[6px]">
                        {article.comprehension_questions.map((_: unknown, i: number) => (
                            <div key={i} className={`h-[4px] rounded-full transition-all duration-300 ${
                                i === currentQuestion ? 'w-[24px] bg-[#E8521A]' :
                                i < currentQuestion ? 'w-[12px] bg-[#E8521A] opacity-50' : 'w-[12px] bg-border-strong'
                            }`} />
                        ))}
                    </div>
                    <span className="font-mono-num text-[13px] text-text-secondary">
                        {currentQuestion + 1}/{article.comprehension_questions.length}
                    </span>
                </div>

                <div className="flex-1 flex items-center justify-center p-[24px] overflow-y-auto">
                    <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }} className="max-w-[500px] w-full py-[40px]">
                        
                        <h3 className="font-serif text-[22px] font-semibold mb-[32px] text-text-primary leading-snug">
                            {q.question}
                        </h3>

                        <div className="flex flex-col gap-[16px] mb-[32px]">
                            {q.options.map((opt: string, optIdx: number) => {
                                let optClass = 'border-border-strong hover:border-border hover:bg-surface text-text-secondary bg-card';
                                if (showExplanation) {
                                    if (optIdx === q.correct) optClass = 'border-green-500/30 bg-green-500/10 text-green-700';
                                    else if (optIdx === selected && !isCorrect) optClass = 'border-error/30 bg-error/10 text-error';
                                } else if (selected === optIdx) {
                                    optClass = 'border-[#E8521A] bg-[#E8521A]/10 text-text-primary shadow-md';
                                }
                                return (
                                    <button key={optIdx}
                                        onClick={() => !showExplanation && handleSelectAnswer(currentQuestion, optIdx)}
                                        disabled={showExplanation}
                                        className={`w-full p-[20px] rounded-[16px] border text-left text-[16px] transition-all duration-200 ${optClass}`}>
                                        <span className="font-mono-num text-[14px] opacity-60 mr-[12px]">{String.fromCharCode(65 + optIdx)}.</span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {showExplanation && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-[32px] overflow-hidden">
                                    <div className={`p-[20px] rounded-[16px] border ${isCorrect ? 'border-green-500/20 bg-green-500/10' : 'border-error/20 bg-error/10'}`}>
                                        <p className={`text-[15px] font-semibold mb-[8px] ${isCorrect ? 'text-green-700' : 'text-error'}`}>
                                            {isCorrect ? 'Correct!' : 'Not quite'}
                                        </p>
                                        <p className="text-[14px] text-text-secondary leading-relaxed">{q.explanation}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!showExplanation ? (
                            <button className="w-full h-[56px] text-[16px] rounded-xl bg-[#E8521A] text-bg font-semibold hover:brightness-110 tracking-widest font-mono-num uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all" disabled={selected === null} onClick={handleCheckAnswer}>
                                Check Answer
                            </button>
                        ) : (
                            <button className="w-full h-[56px] text-[16px] rounded-xl bg-[#E8521A] text-bg font-semibold hover:brightness-110 tracking-widest font-mono-num uppercase shadow-md transition-all" onClick={handleNextQuestion}>
                                {currentQuestion < article.comprehension_questions.length - 1 ? 'Next Question' : 'See Results'}
                            </button>
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
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-surface z-10">
                <motion.div className="h-full bg-[#E8521A]"
                    animate={{ width: `${readingProgress}%` }} transition={{ ease: 'easeOut' }} />
            </div>

            {/* Header */}
            <header className="top-bar border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
                <button onClick={handleBack} className="w-[40px] h-[40px] rounded-full flex items-center justify-center hover:bg-black/5 transition-colors text-text-secondary">
                    <ArrowLeft className="w-[20px] h-[20px]" />
                </button>
                <div className="flex-1 flex justify-center items-center gap-[12px] text-[12px] font-medium text-text-muted font-mono-num uppercase tracking-widest">
                    <span className="truncate max-w-[120px]">{article.source_name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-[4px]"><Clock className="w-[12px] h-[12px]" /> {article.estimated_read_minutes} min</span>
                </div>
                <button onClick={toggleVocabPanel} className="w-[40px] h-[40px] rounded-full flex items-center justify-center hover:bg-black/5 transition-colors text-text-primary relative">
                    <BookOpen className="w-[18px] h-[18px]" />
                    {article.vocabulary_items?.length > 0 && (
                        <span className="absolute top-[8px] right-[8px] w-[8px] h-[8px] bg-[#E8521A] rounded-full" />
                    )}
                </button>
            </header>

            {/* Article content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-[24px] py-[40px] sm:py-[64px] scroll-smooth pb-[160px]">
                <div className="max-w-[680px] mx-auto">
                    
                    {/* Meta Tags */}
                    <div className="flex items-center gap-[8px] flex-wrap mb-[24px]">
                        <span className="px-3 py-1 rounded-full text-[11px] font-mono-num font-bold uppercase tracking-widest bg-[#E8521A]/10 text-[#E8521A] border border-[#E8521A]/20 flex shadow-md">
                            Level {article.cefr_level}
                        </span>
                        {article.topics?.map((t: string) => (
                            <span key={t} className="px-[12px] py-[6px] rounded-full text-[11px] font-mono-num font-medium bg-card border border-border text-text-secondary capitalize">
                                {t}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold leading-[1.1] text-text-primary mb-[32px]">
                        {article.title}
                    </h1>

                    {/* Image */}
                    {article.image_url && (
                        <div className="mb-[40px] w-full aspect-video rounded-[16px] overflow-hidden bg-surface border border-border">
                            <img src={article.image_url} alt={article.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                    )}

                    {/* Content */}
                    <InteractiveText content={article.content} knownWords={knownWords} onTapWord={tapWord} />
                </div>
            </div>

            {/* Check Understanding button */}
            <AnimatePresence>
                {showComprehensionButton && phase === 'reading' && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-[40px] left-0 right-0 z-[40] flex justify-center pointer-events-none px-[24px]"
                    >
                        <button
                            onClick={handleStartComprehension}
                            className="btn btn-primary h-[56px] px-[32px] pointer-events-auto shadow-2xl shadow-[rgba(232,82,26,0.2)]"
                        >
                            <Sparkles className="w-[18px] h-[18px] mr-[8px]" />
                            Check Understanding
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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

            {/* Vocabulary Panel (Bottom Sheet) */}
            <AnimatePresence>
                {showVocabPanel && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[64] bg-black/20 backdrop-blur-sm"
                            onClick={toggleVocabPanel}
                        />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute bottom-0 left-0 right-0 z-[65] max-h-[85vh] bg-surface border-t border-border rounded-t-[24px] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] flex flex-col">
                            
                            <div className="flex items-center justify-between px-[24px] h-[72px] border-b border-border shrink-0">
                                <h3 className="font-serif text-[20px] font-semibold text-text-primary">Key Vocabulary</h3>
                                <button onClick={toggleVocabPanel} className="w-[32px] h-[32px] rounded-full flex items-center justify-center bg-black/5 text-text-secondary hover:bg-black/10 transition-colors">
                                    <X className="w-[16px] h-[16px]" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-[24px] flex flex-col gap-[16px]">
                                {article.vocabulary_items?.map((v: any, i: number) => (
                                    <div key={i} className="bg-card border border-border shadow-sm rounded-xl p-[20px] flex flex-row items-start gap-[16px] justify-between group">
                                        <div className="flex flex-col gap-[4px] min-w-0">
                                            <div className="flex items-center gap-[8px]">
                                                <span className="font-serif text-[20px] font-semibold text-text-primary leading-none">{v.word}</span>
                                                <span className="text-[10px] uppercase font-medium tracking-widest text-text-muted font-mono-num">{v.part_of_speech}</span>
                                            </div>
                                            <p className="text-[15px] text-text-secondary truncate">{v.translation}</p>
                                        </div>
                                        <button className="w-[36px] h-[36px] shrink-0 rounded-full flex items-center justify-center border border-border-strong text-[#E8521A] bg-transparent hover:bg-[#E8521A]/10 hover:border-[#E8521A]/30 transition-all">
                                            <Plus className="w-[16px] h-[16px]" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Exit confirmation */}
            <AnimatePresence>
                {showExitConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-center justify-center p-[24px]"
                        onClick={() => setShowExitConfirm(false)}>
                        <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-card border border-border shadow-lg p-[32px] max-w-[360px] w-full text-center rounded-2xl">
                            <h3 className="font-serif text-[24px] font-semibold mb-[12px] text-text-primary">Leave Article?</h3>
                            <p className="text-[14px] text-text-secondary mb-[32px] leading-relaxed">
                                You're making great progress. Do you want to stop reading here?
                            </p>
                            <div className="flex flex-col gap-[12px]">
                                <button className="w-full py-3 rounded-xl bg-[#E8521A] text-bg font-semibold hover:brightness-110 tracking-widest font-mono-num uppercase shadow-md transition-all" onClick={() => setShowExitConfirm(false)}>
                                    Keep Reading
                                </button>
                                <button className="w-full py-3 rounded-xl border border-border-strong text-text-primary hover:bg-surface font-mono-num tracking-widest uppercase transition-all" onClick={onClose}>
                                    Yes, Exit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
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
        <div className="space-y-[24px]">
            {paragraphs.map((paragraph, pIdx) => {
                const sentences = paragraph.split(/(?<=[.!?])\s+/);
                return (
                    <p key={pIdx} className="text-[17px] leading-[1.8] text-text-primary font-light">
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
                                                className={`cursor-pointer transition-colors duration-200 hover:text-[#E8521A] rounded-[2px] ${
                                                    isKnown ? 'text-text-secondary' : 'text-text-primary font-normal'
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
