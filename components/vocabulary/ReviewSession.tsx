"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VocabularyWord } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, RotateCcw, ArrowRight, Brain, Zap, X } from 'lucide-react';
import { calculateSM2 } from '@/lib/utils/vocabulary';

type SessionState = 'idle' | 'reviewing' | 'complete';

interface ReviewSessionProps {
    wordsToReview: VocabularyWord[]; // The words assigned for this session
    languageId: string | null;
    onClose: () => void;
    onCompletion?: () => void;
}

export function ReviewSession({ wordsToReview, languageId, onClose, onCompletion }: ReviewSessionProps) {
    const [state, setState] = useState<SessionState>('idle');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Stats tracking
    const [stats, setStats] = useState({
        correct: 0,
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
        startTime: 0,
        endTime: 0
    });

    const [streak, setStreak] = useState(0);

    const currentWord = wordsToReview[currentIndex];
    const totalWords = wordsToReview.length;

    // Derived pre-calculations for the SM-2 buttons
    const previews = useMemo(() => {
        if (!currentWord) return null;

        const timesSeen = currentWord.times_seen + 1;
        const prevInterval = currentWord.interval_days || 1;
        const prevEase = currentWord.ease_factor || 2.5;

        // Calculate for each standard quality
        return {
            again: calculateSM2(1, prevInterval, prevEase, timesSeen).interval_days,
            hard: calculateSM2(3, prevInterval, prevEase, timesSeen).interval_days,
            good: calculateSM2(4, prevInterval, prevEase, timesSeen).interval_days,
            easy: calculateSM2(5, prevInterval, prevEase, timesSeen).interval_days,
        };
    }, [currentWord]);

    const formatDays = (days: number) => {
        if (days === 1) return 'Tomorrow';
        if (days < 30) return `${days}d`;
        if (days < 365) return `${Math.floor(days / 30)}mo`;
        return `${Math.floor(days / 365)}y`;
    };

    const startSession = () => {
        setStats(s => ({ ...s, startTime: Date.now() }));
        setState('reviewing');
    };

    const handleRate = async (quality: number) => {
        if (!currentWord) return;

        // Update local session stats
        let isCorrect = quality >= 3;

        setStats(prev => ({
            ...prev,
            correct: prev.correct + (isCorrect ? 1 : 0),
            again: prev.again + (quality < 3 ? 1 : 0),
            hard: prev.hard + (quality === 3 ? 1 : 0),
            good: prev.good + (quality === 4 ? 1 : 0),
            easy: prev.easy + (quality === 5 ? 1 : 0),
        }));

        if (isCorrect) setStreak(s => s + 1);
        else setStreak(0);

        const isLast = currentIndex === totalWords - 1;
        const durationMinutes = Math.max(1, Math.round((Date.now() - stats.startTime) / 60000));

        // Assume 10 XP per card. Bonus at end handled entirely there or loosely here.
        const xpEarned = 10;

        // Fire API request optimistically in background
        fetch('/api/vocabulary/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: currentWord.id,
                languageId,
                quality,
                sessionComplete: isLast,
                durationMinutes: isLast ? durationMinutes : 0,
                xpEarned: isLast ? (xpEarned * totalWords) : 0
            })
        }).catch(err => console.error('Failed to submit review', err));

        // Move to next card or complete
        if (isLast) {
            setStats(s => ({ ...s, endTime: Date.now() }));
            setState('complete');
            if (onCompletion) onCompletion();
        } else {
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        }
    };

    // ── Render: IDLE ──
    if (state === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[50vh] animation-fade-in bg-background">
                <Brain className="w-16 h-16 text-primary mb-6" />
                <h2 className="text-3xl font-bold mb-2">Review Session</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-sm">
                    {totalWords === 0
                        ? "You're all caught up! There are no words due right now."
                        : `You have ${totalWords} word${totalWords !== 1 ? 's' : ''} to review today.`}
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={onClose} className="px-8">Back</Button>
                    <Button
                        onClick={startSession}
                        disabled={totalWords === 0}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
                    >
                        Start Review
                    </Button>
                </div>
            </div>
        );
    }

    // ── Render: COMPLETE ──
    if (state === 'complete') {
        const accuracy = Math.round((stats.correct / totalWords) * 100) || 0;
        const mins = Math.max(1, Math.round((stats.endTime - stats.startTime) / 60000));
        const xp = (totalWords * 10) + (accuracy === 100 ? 50 : 0);

        return (
            <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[50vh] animation-fade-in bg-background">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-sm">
                    Great job! You reviewed {totalWords} words in {mins} minute{mins !== 1 ? 's' : ''}.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mb-8">
                    <StatCard label="Accuracy" value={`${accuracy}%`} />
                    <StatCard label="XP Earned" value={`+${xp}`} highlight />
                    <StatCard label="Perfect" value={stats.easy.toString()} icon={<Zap className="w-3 h-3" />} />
                    <StatCard label="To Repeat" value={stats.again.toString()} icon={<RotateCcw className="w-3 h-3" />} isBad={stats.again > 0} />
                </div>

                <Button
                    onClick={onClose}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-12 py-6 text-lg rounded-xl"
                >
                    Continue
                </Button>
            </div>
        );
    }

    // ── Render: REVIEWING ──
    const progressPercent = ((currentIndex) / totalWords) * 100;
    const baseWord = currentWord.vocabulary_words;

    return (
        <div className="flex flex-col w-full h-full min-h-[80vh] bg-background fixed inset-0 z-50 pt-safe-top pb-safe-bottom">
            {/* Header / Progress */}
            <div className="flex flex-col px-6 py-4 w-full max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-muted-foreground hover:text-foreground">
                        <X className="w-6 h-6" />
                    </Button>
                    <div className="flex items-center gap-4">
                        {streak > 2 && (
                            <span className="text-amber-500 font-bold text-sm animate-pulse flex items-center">
                                {streak} <Zap className="w-4 h-4 ml-1 fill-amber-500" />
                            </span>
                        )}
                        <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
                            {currentIndex + 1} / {totalWords}
                        </span>
                    </div>
                </div>
                <Progress value={progressPercent} className="h-1.5 bg-secondary/50 [&>div]:bg-primary" />
            </div>

            {/* Card Area */}
            <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col justify-center px-6 perspective-1000 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentWord.id + (isFlipped ? '-back' : '-front')}
                        initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0, scale: 0.9 }}
                        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                        exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="w-full flex-1 max-h-[500px] flex items-center justify-center cursor-pointer"
                        style={{ transformStyle: "preserve-3d" }}
                        onClick={() => !isFlipped && setIsFlipped(true)}
                    >
                        <div className={`w-full h-full rounded-3xl bg-card border-2 flex flex-col items-center justify-center p-8 sm:p-12 text-center shadow-xl transition-colors ${!isFlipped ? 'hover:border-primary/50 border-border group' : 'border-primary/20 bg-card/50'}`}>

                            {!isFlipped ? (
                                // FRONT
                                <div className="flex flex-col items-center justify-center h-full">
                                    <span className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground mb-4">
                                        {baseWord.word}
                                    </span>
                                    <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-8">
                                        Tap to reveal
                                    </p>
                                </div>
                            ) : (
                                // BACK
                                <div className="flex flex-col items-center justify-center h-full w-full animation-fade-in">
                                    <span className="text-3xl sm:text-4xl font-bold text-muted-foreground/70 mb-2">
                                        {baseWord.word}
                                    </span>
                                    <span className="text-4xl sm:text-6xl font-bold text-foreground mb-2 leading-tight">
                                        {baseWord.translation}
                                    </span>

                                    <div className="flex flex-wrap justify-center gap-2 mt-4 mb-8">
                                        {baseWord.pronunciation && (
                                            <span className="bg-secondary/50 px-3 py-1 rounded-full text-sm font-mono text-muted-foreground">/{baseWord.pronunciation}/</span>
                                        )}
                                        {baseWord.part_of_speech && (
                                            <span className="bg-secondary/50 px-3 py-1 rounded-full text-sm text-muted-foreground italic">{baseWord.part_of_speech}</span>
                                        )}
                                        {baseWord.cefr_level && (
                                            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold uppercase">{baseWord.cefr_level}</span>
                                        )}
                                    </div>

                                    {baseWord.example_sentence && (
                                        <div className="w-full max-w-md bg-background/50 rounded-xl p-4 border border-border/30">
                                            <p className="text-lg italic font-medium mb-1">{baseWord.example_sentence}</p>
                                            <p className="text-sm text-muted-foreground">{baseWord.example_translation}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Rating Buttons */}
            <div className="w-full max-w-3xl mx-auto px-6 pb-8 pt-4">
                <AnimatePresence>
                    {isFlipped && previews && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                            className="grid grid-cols-4 gap-2 sm:gap-4 w-full"
                        >
                            <RatingButton
                                onClick={() => handleRate(1)}
                                label="Again"
                                interval={formatDays(previews.again)}
                                colorClass="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                            />
                            <RatingButton
                                onClick={() => handleRate(3)}
                                label="Hard"
                                interval={formatDays(previews.hard)}
                                colorClass="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border-orange-500/20"
                            />
                            <RatingButton
                                onClick={() => handleRate(4)}
                                label="Good"
                                interval={formatDays(previews.good)}
                                colorClass="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                            />
                            <RatingButton
                                onClick={() => handleRate(5)}
                                label="Easy"
                                interval={formatDays(previews.easy)}
                                colorClass="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/20"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                {!isFlipped && (
                    <div className="h-[88px] flex items-center justify-center">
                        <Button onClick={() => setIsFlipped(true)} variant="secondary" className="w-full max-w-xs h-14 rounded-xl text-lg font-semibold border-2 border-border/50">
                            Show Answer
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-components

function RatingButton({ onClick, label, interval, colorClass }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all active:scale-95 ${colorClass}`}
        >
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-1">{label}</span>
            <span className="text-[10px] sm:text-xs opacity-80">{interval}</span>
        </button>
    );
}

function StatCard({ label, value, highlight, icon, isBad }: any) {
    return (
        <div className={`flex flex-col items-center p-4 rounded-2xl border ${highlight ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'}`}>
            <span className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1 ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>
                {icon} {label}
            </span>
            <span className={`text-2xl font-bold ${highlight ? 'text-primary' : isBad ? 'text-red-500' : 'text-foreground'}`}>
                {value}
            </span>
        </div>
    );
}
