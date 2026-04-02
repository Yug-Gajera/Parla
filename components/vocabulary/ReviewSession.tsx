"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VocabularyWord } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, RotateCcw, Brain, Zap, X, Fingerprint, Volume2 } from 'lucide-react';
import { calculateSM2 } from '@/lib/utils/vocabulary';
import { playSpanishAudio } from '@/lib/playAudio';

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
        const isCorrect = quality >= 3;

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

    const speakWord = (text: string) => {
        playSpanishAudio(text, 'slow');
    };

    // ── Render: IDLE ──
    if (state === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[50vh] animation-fade-in bg-background font-sans">
                <div className="w-20 h-20 rounded-full border border-[#E8521A]/30 bg-[#E8521A]/5 shadow-inner flex items-center justify-center mb-8">
                    <Brain className="w-8 h-8 text-[#E8521A]" strokeWidth={1} />
                </div>
                <h2 className="text-4xl font-display text-text-primary mb-4">Review Words</h2>
                <p className="text-text-muted text-sm mb-12 text-center max-w-sm font-mono-num uppercase tracking-widest leading-relaxed mt-2">
                    {totalWords === 0
                        ? "You're all caught up. No words to review right now."
                        : `Get ready to review ${totalWords} word${totalWords !== 1 ? 's' : ''}.`}
                </p>
                <div className="flex gap-4 w-full max-w-sm flex-col">
                    <Button
                        onClick={startSession}
                        disabled={totalWords === 0}
                        className="bg-[#E8521A] hover:brightness-110 text-[#080808] font-mono-num text-[10px] font-bold uppercase tracking-widest h-14 rounded-full w-full shadow-[0_4px_20px_rgba(232,82,26,0.2)] transition-all"
                    >
                        Start Review
                    </Button>
                    <Button variant="outline" onClick={onClose} className="h-14 rounded-full border-border bg-transparent text-text-secondary hover:bg-surface hover:text-text-primary font-mono-num text-[10px] uppercase tracking-widest w-full">
                        Cancel
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
            <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[50vh] animation-fade-in bg-background font-sans relative overflow-hidden">
                {/* Subtle Particles */}
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
                            className="absolute bg-[#E8521A] w-1 h-1 rounded-full shadow-md"
                        />
                    ))}
                </div>

                <div className="relative z-10 w-full flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-[#E8521A]/5 border border-[#E8521A]/20 flex items-center justify-center mb-8 shadow-xl">
                        <Fingerprint className="w-10 h-10 text-[#E8521A]" strokeWidth={1} />
                    </div>
                    <h2 className="text-4xl font-display text-text-primary mb-3">Review Finished</h2>
                    <p className="text-text-secondary text-sm mb-12 text-center max-w-sm font-sans leading-relaxed">
                        You reviewed {totalWords} words in {mins} minute{mins !== 1 ? 's' : ''}. Great job!
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mb-12">
                        <StatCard label="Correct" value={`${accuracy}%`} />
                        <StatCard label="XP Earned" value={`+${xp}`} highlight />
                        <StatCard label="Perfect" value={stats.easy.toString()} icon={<Zap className="w-3.5 h-3.5" />} />
                        <StatCard label="Try Again" value={stats.again.toString()} icon={<RotateCcw className="w-3.5 h-3.5" />} isBad={stats.again > 0} />
                    </div>

                    <Button
                        onClick={onClose}
                        className="bg-[#E8521A] hover:brightness-110 text-[#080808] font-mono-num text-[10px] font-bold uppercase tracking-widest px-12 h-14 rounded-full shadow-[0_4px_20px_rgba(232,82,26,0.25)] transition-all"
                    >
                        Done
                    </Button>
                </div>
            </div>
        );
    }

    // ── Render: REVIEWING ──
    const progressPercent = ((currentIndex) / totalWords) * 100;
    const baseWord = currentWord.vocabulary_words;

    return (
        <div className="flex flex-col w-full h-full min-h-[80vh] bg-background fixed inset-0 z-50 pt-safe-top pb-safe-bottom font-sans">
            {/* Header / Progress */}
            <div className="flex flex-col px-6 py-6 w-full max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-text-muted hover:text-text-primary hover:bg-surface">
                        <X className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-6">
                        {streak > 2 && (
                            <span className="text-[#E8521A] font-mono-num text-[10px] uppercase tracking-widest font-bold animate-pulse flex items-center">
                                Seq {streak} <Zap className="w-3 h-3 ml-1 fill-[#E8521A]" />
                            </span>
                        )}
                        <span className="text-[10px] font-mono-num font-bold text-text-muted tracking-[0.2em] uppercase">
                            {currentIndex + 1} <span className="text-border-strong mx-1">/</span> {totalWords}
                        </span>
                    </div>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden w-full">
                    <div 
                        className="h-full bg-gradient-to-r from-[#E8521A]/80 to-[#E8521A] rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Card Area */}
            <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col justify-center px-6 perspective-1000 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentWord.id + (isFlipped ? '-back' : '-front')}
                        initial={{ rotateX: isFlipped ? -90 : 90, opacity: 0, scale: 0.95 }}
                        animate={{ rotateX: 0, opacity: 1, scale: 1 }}
                        exit={{ rotateX: isFlipped ? 90 : -90, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                        className="w-full flex-1 max-h-[500px] flex items-center justify-center cursor-pointer"
                        style={{ transformStyle: "preserve-3d" }}
                        onClick={() => !isFlipped && setIsFlipped(true)}
                    >
                        <div className={`w-full h-full rounded-3xl flex flex-col items-center justify-center p-8 sm:p-12 text-center shadow-2xl transition-all duration-500 overflow-hidden relative ${!isFlipped ? 'bg-card border border-border hover:border-border-strong group' : 'border border-[#E8521A]/20 bg-surface'}`}>
                            
                            {isFlipped && (
                                <div className="absolute inset-0 bg-[#E8521A]/5 opacity-50 pointer-events-none" />
                            )}

                            {!isFlipped ? (
                                // FRONT
                                <div className="flex flex-col items-center justify-center h-full">
                                    <span className="text-5xl sm:text-7xl font-display text-text-primary mb-6 tracking-tight">
                                        {baseWord.word}
                                    </span>
                                    <p className="text-[10px] font-mono-num tracking-[0.2em] text-text-muted uppercase opacity-70 group-hover:opacity-100 transition-opacity absolute bottom-10">
                                        Tap to see translation
                                    </p>
                                </div>
                            ) : (
                                // BACK
                                <div className="flex flex-col items-center justify-center h-full w-full animation-fade-in relative z-10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl sm:text-4xl font-display text-[#E8521A] opacity-90">
                                            {baseWord.word}
                                        </span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); speakWord(baseWord.word); }}
                                            className="p-1.5 rounded-full bg-[#E8521A]/10 text-[#E8521A] hover:bg-[#E8521A]/20 transition-colors"
                                        >
                                            <Volume2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <span className="text-4xl sm:text-6xl font-display text-text-primary mb-6 leading-tight tracking-tight">
                                        {baseWord.translation}
                                    </span>

                                    <div className="flex flex-wrap justify-center gap-3 mt-2 mb-10">
                                        {baseWord.pronunciation && (
                                            <span className="border border-border-strong bg-surface px-4 py-1.5 rounded-sm text-[11px] font-mono-num text-text-secondary">/{baseWord.pronunciation}/</span>
                                        )}
                                        {baseWord.part_of_speech && (
                                            <span className="border border-border-strong bg-surface px-4 py-1.5 rounded-sm text-[11px] font-mono-num text-text-secondary italic">{baseWord.part_of_speech}</span>
                                        )}
                                        {baseWord.cefr_level && (
                                            <span className="border border-[#E8521A]/30 bg-[#E8521A]/10 text-[#E8521A] px-4 py-1.5 rounded-sm text-[11px] font-mono-num font-bold uppercase tracking-widest">{baseWord.cefr_level}</span>
                                        )}
                                    </div>

                                    {baseWord.example_sentence && (
                                        <div className="w-full max-w-md bg-surface rounded-xl p-5 border border-border">
                                            <p className="text-lg font-display italic text-text-primary mb-2">{baseWord.example_sentence}</p>
                                            <p className="text-xs font-sans text-text-muted">{baseWord.example_translation}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Rating Buttons */}
            <div className="w-full max-w-3xl mx-auto px-6 pb-8 pt-6">
                <AnimatePresence>
                    {isFlipped && previews && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                            className="grid grid-cols-4 gap-3 sm:gap-4 w-full"
                        >
                            <RatingButton
                                onClick={() => handleRate(1)}
                                label="Again"
                                interval={formatDays(previews.again)}
                                colorClass="bg-card hover:bg-red-500/10 text-error border-border hover:border-error/30"
                            />
                            <RatingButton
                                onClick={() => handleRate(3)}
                                label="Hard"
                                interval={formatDays(previews.hard)}
                                colorClass="bg-card hover:bg-orange-500/10 text-orange-500 border-border hover:border-orange-500/30"
                            />
                            <RatingButton
                                onClick={() => handleRate(4)}
                                label="Good"
                                interval={formatDays(previews.good)}
                                colorClass="bg-card hover:bg-green-500/10 text-green-600 border-border hover:border-green-500/30"
                            />
                            <RatingButton
                                label="Perfect"
                                interval={formatDays(previews.easy)}
                                colorClass="bg-card hover:bg-gold/10 text-gold border-border hover:border-gold/50 bg-gradient-to-t from-gold/5 to-transparent"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                {!isFlipped && (
                    <div className="h-[76px] flex items-center justify-center">
                        <Button onClick={() => setIsFlipped(true)} variant="outline" className="w-full max-w-xs h-14 rounded-full border-border bg-card hover:bg-surface text-text-primary font-mono-num text-[10px] uppercase tracking-widest font-bold">
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
            className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl border transition-all duration-300 active:scale-95 group shadow-inner ${colorClass}`}
        >
            <span className="text-[10px] sm:text-xs font-mono-num font-bold uppercase tracking-widest mb-1.5">{label}</span>
            <span className="text-[9px] font-mono-num opacity-60 uppercase">{interval}</span>
        </button>
    );
}

function StatCard({ label, value, highlight, icon, isBad }: any) {
    return (
        <div className={`flex flex-col items-center p-5 rounded-2xl border shadow-inner ${highlight ? 'bg-[#E8521A]/5 border-[#E8521A]/20' : 'bg-card border-border'}`}>
            <span className={`text-[9px] font-mono-num font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${highlight ? 'text-[#E8521A]' : 'text-text-muted'}`}>
                {icon} {label}
            </span>
            <span className={`text-3xl font-display ${highlight ? 'text-[#E8521A]' : isBad ? 'text-error' : 'text-text-primary'}`}>
                {value}
            </span>
        </div>
    );
}
