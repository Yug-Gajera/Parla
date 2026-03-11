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
    A1: 'border-[#1e1e1e] text-[#f0ece4]',
    A2: 'border-[#1e1e1e] text-[#f0ece4]',
    B1: 'border-[#1e1e1e] text-[#f0ece4]',
    B2: 'border-[#c9a84c]/30 text-[#c9a84c]',
    C1: 'border-[#c9a84c]/30 text-[#c9a84c]',
    C2: 'border-[#c9a84c]/30 text-[#c9a84c]',
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
            <div className="fixed inset-0 z-[60] bg-[#080808] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#c9a84c] animate-spin" />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="fixed inset-0 z-[60] bg-[#080808] flex items-center justify-center font-sans">
                <div className="text-center">
                    <p className="text-[#9a9590] font-mono text-[10px] uppercase tracking-widest mb-4">Volume not indexed</p>
                    <Button onClick={onClose} variant="outline" className="border-[#1e1e1e] bg-[#141414] text-[#f0ece4] hover:bg-[#1e1e1e] rounded-full px-8 font-mono text-[10px] uppercase tracking-widest">
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
            className="fixed inset-0 z-[60] bg-[#080808] flex flex-col overflow-y-auto font-sans"
        >
            {/* ── Colored Header ── */}
            <div
                className="relative px-4 pt-4 pb-12 sm:px-8 shadow-2xl"
                style={{ backgroundColor: book.cover_color || '#141414' }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-[#080808]" />

                <div className="relative z-10 max-w-2xl mx-auto pt-safe-top">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white/60 hover:text-white hover:bg-white/10 gap-2 mb-6 -ml-2 rounded-full font-mono text-[10px] uppercase tracking-[0.1em]"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Archive
                    </Button>

                    <div className="flex items-start gap-2 mb-3 flex-wrap">
                        <span className="bg-[#080808]/60 text-[#f0ece4] text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-sm backdrop-blur-md border border-[#ffffff]/10">
                            {book.book_type === 'classic' ? 'Archive' : 'Graded'}
                        </span>
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-sm border bg-[#080808]/40 backdrop-blur-sm ${LEVEL_COLORS[book.cefr_level] || 'border-[#1e1e1e] text-[#f0ece4]'}`}>
                            {book.cefr_level}
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-serif text-white leading-tight mt-2 drop-shadow-2xl">
                        {book.title}
                    </h1>
                    <p className="text-[#c9a84c] font-sans text-sm sm:text-base mt-2 drop-shadow-md">{book.author}</p>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 px-4 sm:px-8 pb-16 max-w-2xl mx-auto w-full space-y-10 relative z-20 -mt-6">
                
                <div className="bg-[#141414] border border-[#1e1e1e] rounded-2xl p-6 shadow-xl">
                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-mono text-[#5a5652] uppercase tracking-widest mb-6 pb-6 border-b border-[#1e1e1e]">
                        <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-[#c9a84c]" /> {book.total_chapters} Phases
                        </span>
                        {book.estimated_hours && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-[#c9a84c]" /> ~{book.estimated_hours} Hours
                            </span>
                        )}
                        {book.word_count_total > 0 && (
                            <span className="flex items-center gap-1.5">
                                <span className="text-[#c9a84c]">W</span> {book.word_count_total.toLocaleString()} Count
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-[#9a9590] text-sm leading-relaxed mb-6 font-sans">
                        {book.description}
                    </p>

                    {/* Topics */}
                    {book.topics?.length > 0 && (
                        <div className="flex gap-2 flex-wrap pb-2">
                            {book.topics.map((t: string) => (
                                <span key={t} className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-sm border border-[#2a2a2a] bg-[#0f0f0f] text-[#5a5652]">
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
                        <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-5 rounded-xl">
                            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest mb-3">
                                <span className="text-[#5a5652]">
                                    {chaptersCompleted} of {book.total_chapters} Finalized
                                </span>
                                <span className="font-bold text-[#c9a84c]">
                                    {Math.round((chaptersCompleted / book.total_chapters) * 100)}%
                                </span>
                            </div>
                            <div className="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#8b7538] to-[#c9a84c] rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(chaptersCompleted / book.total_chapters) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* CTA button */}
                    <Button
                        onClick={() => onOpenChapter(currentChapter)}
                        className={`w-full h-14 font-mono text-[10px] font-bold uppercase tracking-widest rounded-full gap-2 transition-all ${
                            isCompleted ? 'bg-[#141414] text-[#f0ece4] border border-[#2a2a2a] hover:bg-[#1e1e1e]' 
                            : 'bg-[#c9a84c] text-[#080808] hover:bg-[#b98e72] shadow-[0_4px_20px_rgba(201,168,76,0.2)]'
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
                        <div className="w-1 h-5 bg-[#c9a84c] rounded-full" />
                        <h2 className="font-serif text-2xl text-[#f0ece4] tracking-tight">Index</h2>
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
                                        isCurrent ? 'bg-[#c9a84c]/5 border-[#c9a84c]/30 shadow-inner' 
                                        : 'bg-[#0f0f0f] border-[#1e1e1e] hover:border-[#2a2a2a] hover:bg-[#141414]'
                                    }`}
                                >
                                    {/* Status dot */}
                                    {isComplete ? (
                                        <div className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center flex-shrink-0 shadow-inner">
                                            <Check className="w-4 h-4 text-[#5a5652]" />
                                        </div>
                                    ) : isCurrent ? (
                                        <div className="w-8 h-8 rounded-full bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0 border border-[#c9a84c]/30 shadow-[0_0_10px_rgba(201,168,76,0.15)]">
                                            <Circle className="w-2.5 h-2.5 text-[#c9a84c] fill-[#c9a84c]" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#080808] border border-[#1e1e1e] flex items-center justify-center flex-shrink-0">
                                            <Circle className="w-2 h-2 text-[#2a2a2a]" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <span className="font-serif text-lg text-[#f0ece4] group-hover:text-[#c9a84c] transition-colors truncate">
                                                {ch.title || `Phase ${ch.chapter_number}`}
                                            </span>
                                            {isCurrent && (
                                                <span className="text-[8px] font-mono font-bold text-[#c9a84c] border border-[#c9a84c]/30 uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-[10px] font-mono uppercase tracking-widest text-[#5a5652]">
                                            <span className="flex items-center gap-1"><span className="text-[#c9a84c] font-bold opacity-60">#</span> {ch.chapter_number}</span>
                                            <span className="w-1 h-1 rounded-full bg-[#2a2a2a]" />
                                            <span>{ch.word_count || '—'} W</span>
                                            <span className="w-1 h-1 rounded-full bg-[#2a2a2a]" />
                                            <span>~{ch.estimated_minutes || 3} M</span>
                                            {isComplete && cp?.comprehension_score != null && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-[#2a2a2a]" />
                                                    <span className="text-[#9a9590] tracking-wider">
                                                        IQ <span className="text-[#f0ece4] font-bold">{cp.comprehension_score}%</span>
                                                    </span>
                                                </>
                                            )}
                                            {!ch.processed && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-[#2a2a2a]" />
                                                    <span className="text-[#c9a84c] animate-pulse">Computing</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-[#2a2a2a] group-hover:text-[#c9a84c] transition-colors flex-shrink-0" />
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
