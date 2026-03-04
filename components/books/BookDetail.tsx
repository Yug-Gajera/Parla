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
    A1: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    A2: 'bg-green-500/10 text-green-400 border-green-500/30',
    B1: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    B2: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    C1: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    C2: 'bg-red-500/10 text-red-400 border-red-500/30',
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
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="fixed inset-0 z-[60] bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive font-medium mb-4">Book not found</p>
                    <Button onClick={onClose} variant="outline">Go Back</Button>
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
            className="fixed inset-0 z-[60] bg-background flex flex-col overflow-y-auto"
        >
            {/* ── Colored Header ── */}
            <div
                className="relative px-4 pt-4 pb-8 sm:px-8"
                style={{ backgroundColor: book.cover_color }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />

                <div className="relative z-10 max-w-2xl mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 gap-1 mb-4 -ml-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>

                    <div className="flex items-start gap-1 mb-1 flex-wrap">
                        <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {book.book_type === 'classic' ? '📚 Classic' : '✨ Graded Reader'}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[book.cefr_level] || ''}`}>
                            {book.cefr_level}
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-2 drop-shadow-lg">
                        {book.title}
                    </h1>
                    <p className="text-white/70 text-sm mt-1">{book.author}</p>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 px-4 sm:px-8 py-6 max-w-2xl mx-auto w-full space-y-6">
                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> {book.total_chapters} chapters
                    </span>
                    {book.estimated_hours && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> ~{book.estimated_hours} hours
                        </span>
                    )}
                    {book.word_count_total > 0 && (
                        <span>{book.word_count_total.toLocaleString()} words</span>
                    )}
                </div>

                {/* Description */}
                <p className="text-foreground/80 text-sm leading-relaxed">{book.description}</p>

                {/* Topics */}
                {book.topics?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                        {book.topics.map((t: string) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                                {t}
                            </span>
                        ))}
                    </div>
                )}

                {/* CTA button */}
                <Button
                    onClick={() => onOpenChapter(currentChapter)}
                    className="w-full bg-primary font-bold gap-2"
                >
                    {isCompleted ? (
                        <>Read Again <BookOpen className="w-4 h-4" /></>
                    ) : isStarted ? (
                        <>Continue Reading — Chapter {currentChapter} <ChevronRight className="w-4 h-4" /></>
                    ) : (
                        <>Start Reading <ChevronRight className="w-4 h-4" /></>
                    )}
                </Button>

                {/* Progress bar for in-progress */}
                {isStarted && !isCompleted && (
                    <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                                {chaptersCompleted} of {book.total_chapters} completed
                            </span>
                            <span className="font-bold text-primary">
                                {Math.round((chaptersCompleted / book.total_chapters) * 100)}%
                            </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all"
                                style={{ width: `${(chaptersCompleted / book.total_chapters) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Chapter List ── */}
                <div>
                    <h2 className="font-bold text-lg mb-3">Chapters</h2>
                    <div className="space-y-2">
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
                                    className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/30 transition-all flex items-center gap-3 group"
                                >
                                    {/* Status dot */}
                                    {isComplete ? (
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        </div>
                                    ) : isCurrent ? (
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Circle className="w-3 h-3 text-primary fill-primary" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                            <Circle className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground font-bold">
                                                {ch.chapter_number}
                                            </span>
                                            <span className="font-medium text-sm truncate">
                                                {ch.title || `Chapter ${ch.chapter_number}`}
                                            </span>
                                            {isCurrent && (
                                                <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                            <span>{ch.word_count || '—'} words</span>
                                            <span>~{ch.estimated_minutes || 3} min</span>
                                            {isComplete && cp?.comprehension_score != null && (
                                                <span className="text-emerald-500 font-bold">
                                                    {cp.comprehension_score}%
                                                </span>
                                            )}
                                            {!ch.processed && (
                                                <span className="text-amber-500">Preparing...</span>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
