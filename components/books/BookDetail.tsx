"use client";

// ============================================================
// Parlai — Book Detail (Header, Description, Chapter List)
// ============================================================

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, BookOpen, Clock, Check,
    Loader2, ChevronRight, Circle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BookDetailProps {
    bookId: string;
    onClose: () => void;
    onOpenChapter: (chapterNumber: number) => void;
}

const LEVEL_COLORS: Record<string, string> = {
    A1: 'border-border text-text-primary',
    A2: 'border-border text-text-primary',
    B1: 'border-border text-text-primary',
    B2: 'border-gold-border text-gold',
    C1: 'border-gold-border text-gold',
    C2: 'border-gold-border text-gold',
};

export default function BookDetail({ bookId, onClose, onOpenChapter }: BookDetailProps) {
    const [book, setBook] = useState<any>(null);
    const [chapters, setChapters] = useState<any[]>([]);
    const [userProgress, setUserProgress] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/books/${bookId}`);
                const data = await res.json();
                if (data.book) setBook(data.book);
                if (data.chapters) setChapters(data.chapters);
                if (data.user_progress) setUserProgress(data.user_progress);
            } catch (err) {
                console.error('Failed to load book:', err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [bookId]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[60] bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="fixed inset-0 z-[60] bg-background flex items-center justify-center font-sans">
                <div className="text-center">
                    <p className="text-text-muted font-mono-num text-[10px] uppercase tracking-widest mb-4">Volume not indexed</p>
                    <Button onClick={onClose} variant="outline" className="border-border bg-card text-text-primary hover:bg-surface rounded-full px-8 font-mono-num text-[10px] uppercase tracking-widest">
                        Return
                    </Button>
                </div>
            </div>
        );
    }

    const currentChapter = userProgress?.current_chapter || 1;
    const chaptersCompleted = userProgress?.chapters_completed || 0;
    const isStarted = !!userProgress;
    const isCompleted = !!userProgress?.completed_at;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col overflow-y-auto font-sans text-text-primary"
        >
            {/* ── Colored Header ── */}
            <div
                className="relative px-4 pt-4 pb-12 sm:px-8 shadow-2xl"
                style={{ backgroundColor: book.cover_color || 'var(--color-card)' }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />

                <div className="relative z-10 max-w-2xl mx-auto pt-safe-top">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white/60 hover:text-white hover:bg-white/10 gap-2 mb-6 -ml-2 rounded-full font-mono-num text-[10px] uppercase tracking-[0.1em]"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Archive
                    </Button>

                    <div className="flex items-start gap-2 mb-3 flex-wrap">
                        <span className="bg-background/60 text-text-primary text-[9px] font-mono-num uppercase tracking-widest px-3 py-1 rounded-sm backdrop-blur-md border border-white/10">
                            {book.book_type === 'classic' ? 'Archive' : 'Graded'}
                        </span>
                        <span className={`text-[9px] font-mono-num font-bold uppercase tracking-widest px-3 py-1 rounded-sm border bg-background/40 backdrop-blur-sm ${LEVEL_COLORS[book.cefr_level] || 'border-border text-text-primary'}`}>
                            {book.cefr_level}
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-display text-white leading-tight mt-2 drop-shadow-2xl">
                        {book.title}
                    </h1>
                    <p className="text-gold font-sans text-sm sm:text-base mt-2 drop-shadow-md">{book.author}</p>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 px-4 sm:px-8 pb-16 max-w-2xl mx-auto w-full space-y-10 relative z-20 -mt-6">
                
                <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-mono-num text-text-secondary uppercase tracking-widest mb-6 pb-6 border-b border-border">
                        <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-gold" /> {book.total_chapters} Phases
                        </span>
                        {book.estimated_hours && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-gold" /> ~{book.estimated_hours} Hours
                            </span>
                        )}
                        {book.word_count_total > 0 && (
                            <span className="flex items-center gap-1.5">
                                <span className="text-gold">W</span> {book.word_count_total.toLocaleString()} Count
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-text-muted text-sm leading-relaxed mb-6 font-sans">
                        {book.description}
                    </p>

                    {/* Topics */}
                    {book.topics?.length > 0 && (
                        <div className="flex gap-2 flex-wrap pb-2">
                            {book.topics.map((t: string) => (
                                <span key={t} className="text-[9px] font-mono-num uppercase tracking-widest px-2.5 py-1 rounded-sm border border-border-strong bg-surface text-text-secondary">
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tracking & CTA */}
                <div className="space-y-4">
                    {/* Progress bar for in-progress */}
                    {isStarted && !isCompleted && (
                        <div className="bg-surface border border-border p-5 rounded-xl">
                            <div className="flex items-center justify-between text-[10px] font-mono-num uppercase tracking-widest mb-3">
                                <span className="text-text-secondary">
                                    {chaptersCompleted} of {book.total_chapters} Finalized
                                </span>
                                <span className="font-bold text-gold">
                                    {Math.round((chaptersCompleted / book.total_chapters) * 100)}%
                                </span>
                            </div>
                            <div className="h-1 bg-border rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gold rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(chaptersCompleted / book.total_chapters) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* CTA button */}
                    <Button
                        onClick={() => onOpenChapter(currentChapter)}
                        className={`w-full h-14 font-mono-num text-[10px] font-bold uppercase tracking-widest rounded-full gap-2 transition-all ${
                            isCompleted ? 'bg-card text-text-primary border border-border-strong hover:bg-surface' 
                            : 'bg-gold text-background hover:brightness-110 shadow-[0_4px_20px_var(--color-gold-subtle)]'
                        }`}
                    >
                        {isCompleted ? (
                            <>Re-initialize Volume <BookOpen className="w-4 h-4 ml-1" /></>
                        ) : isStarted ? (
                            <>Resume Phase {currentChapter} <ChevronRight className="w-4 h-4 ml-1" /></>
                        ) : (
                            <>Commence Volume <ChevronRight className="w-4 h-4 ml-1" /></>
                        )}
                    </Button>
                </div>

                {/* ── Chapter List ── */}
                <div className="pt-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-5 bg-gold rounded-full" />
                        <h2 className="font-display text-2xl text-text-primary tracking-tight">Index</h2>
                    </div>
                    
                    <div className="space-y-3">
                        {chapters.map((ch, i) => {
                            const cp = ch.user_progress;
                            const isComplete = !!cp?.completed_at;
                            const isCurrent = !isComplete && ch.chapter_number === currentChapter;

                            return (
                                <motion.button
                                    key={ch.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    onClick={() => onOpenChapter(ch.chapter_number)}
                                    className={`w-full text-left px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 group ${
                                        isCurrent ? 'bg-gold-subtle border-gold-border shadow-inner' 
                                        : 'bg-surface border-border hover:border-border-strong hover:bg-card'
                                    }`}
                                >
                                    {/* Status dot */}
                                    {isComplete ? (
                                        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center flex-shrink-0 shadow-inner">
                                            <Check className="w-4 h-4 text-text-muted" />
                                        </div>
                                    ) : isCurrent ? (
                                        <div className="w-8 h-8 rounded-full bg-gold-subtle flex items-center justify-center flex-shrink-0 border border-gold-border shadow-[0_0_10px_var(--color-gold-subtle)]">
                                            <Circle className="w-2.5 h-2.5 text-gold fill-gold" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0">
                                            <Circle className="w-2 h-2 text-border-strong" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <span className="font-display text-lg text-text-primary group-hover:text-gold transition-colors truncate">
                                                {ch.title || `Phase ${ch.chapter_number}`}
                                            </span>
                                            {isCurrent && (
                                                <span className="text-[8px] font-mono-num font-bold text-gold border border-gold-border uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-[10px] font-mono-num uppercase tracking-widest text-text-secondary">
                                            <span className="flex items-center gap-1"><span className="text-gold font-bold opacity-60">#</span> {ch.chapter_number}</span>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span>{ch.word_count || '—'} W</span>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span>~{ch.estimated_minutes || 3} M</span>
                                            {isComplete && cp?.comprehension_score != null && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <span className="text-text-muted tracking-wider">
                                                        IQ <span className="text-text-primary font-bold">{cp.comprehension_score}%</span>
                                                    </span>
                                                </>
                                            )}
                                            {!ch.processed && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <span className="text-gold animate-pulse">Computing</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-border-strong group-hover:text-gold transition-colors flex-shrink-0" />
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
