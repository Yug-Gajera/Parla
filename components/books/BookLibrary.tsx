"use client";

// ============================================================
// Parlai — Book Library (Browse & Continue Reading)
// ============================================================

import React from 'react';
import { useBooks } from '@/hooks/useBooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookLibraryProps {
    languageId: string;
    onSelectBook: (bookId: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
    A1: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    A2: 'bg-green-500/10 text-green-400 border-green-500/30',
    B1: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    B2: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    C1: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    C2: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const FILTER_TABS = [
    { id: 'all', label: 'All' },
    { id: 'classic', label: 'Classics' },
    { id: 'graded_reader', label: 'Graded Readers' },
];

export default function BookLibrary({ languageId, onSelectBook }: BookLibraryProps) {
    const {
        books, isLoading, inProgressBooks,
        filters, updateFilters, hasMore, fetchMore,
    } = useBooks(languageId);

    if (isLoading && books.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ── Continue Reading ── */}
            {inProgressBooks.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Continue Reading
                    </h2>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
                        {inProgressBooks.map(book => {
                            const progress = book.user_progress!;
                            const percent = Math.round(
                                (progress.chapters_completed / book.total_chapters) * 100
                            );
                            return (
                                <motion.div
                                    key={book.id}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => onSelectBook(book.id)}
                                    className="flex-shrink-0 w-[240px] cursor-pointer snap-start"
                                >
                                    <Card className="overflow-hidden border-primary/20 hover:border-primary/40 transition-colors">
                                        <div
                                            className="h-24 flex items-end p-3"
                                            style={{ backgroundColor: book.cover_color }}
                                        >
                                            <div>
                                                <p className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-lg">
                                                    {book.title}
                                                </p>
                                                <p className="text-white/70 text-[10px] mt-0.5">{book.author}</p>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] text-muted-foreground">
                                                    Chapter {progress.current_chapter} of {book.total_chapters}
                                                </span>
                                                <span className="text-[10px] font-bold text-primary">{percent}%</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Filter Tabs ── */}
            <section>
                <div className="flex items-center gap-2 mb-4 overflow-x-auto">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => updateFilters({ bookType: tab.id })}
                            className={`text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${filters.bookType === tab.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}

                    <div className="w-px h-5 bg-border mx-1" />

                    {['A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                        <button
                            key={level}
                            onClick={() => updateFilters({ level: filters.level === level ? '' : level })}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${filters.level === level
                                    ? LEVEL_COLORS[level]
                                    : 'border-border text-muted-foreground hover:border-primary/30'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>

                {/* ── Book Grid ── */}
                {books.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <p className="text-muted-foreground font-medium">
                            Books are being prepared — check back soon
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Classic Spanish books are being imported from Project Gutenberg
                        </p>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            {books.map((book, i) => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    index={i}
                                    onSelect={() => onSelectBook(book.id)}
                                />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="flex justify-center mt-6">
                                <Button variant="outline" onClick={fetchMore} className="gap-2">
                                    Load More <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}

function BookCard({ book, index, onSelect }: { book: any; index: number; onSelect: () => void }) {
    const progress = book.user_progress;
    const isCompleted = progress?.completed_at;
    const isInProgress = progress && !isCompleted;
    const percent = progress
        ? Math.round((progress.chapters_completed / book.total_chapters) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onSelect}
            className="cursor-pointer group"
        >
            <div
                className="rounded-xl aspect-[3/4] flex flex-col justify-end p-3 sm:p-4 relative overflow-hidden transition-transform group-hover:scale-[1.02]"
                style={{ backgroundColor: book.cover_color }}
            >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Completed badge */}
                {isCompleted && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Done
                    </div>
                )}

                {/* Book type badge */}
                <div className="absolute top-2 left-2 bg-black/30 text-white/80 text-[9px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {book.book_type === 'classic' ? '📚 Classic' : '✨ Graded'}
                </div>

                {/* Title & author */}
                <div className="relative z-10">
                    <h3 className="text-white font-bold text-sm sm:text-base leading-tight line-clamp-2 drop-shadow-lg">
                        {book.title}
                    </h3>
                    <p className="text-white/70 text-[11px] mt-0.5 drop-shadow">{book.author}</p>
                </div>
            </div>

            {/* Meta below card */}
            <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${LEVEL_COLORS[book.cefr_level] || 'bg-muted text-muted-foreground'}`}>
                        {book.cefr_level}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        {book.total_chapters} ch.
                    </span>
                    {book.estimated_hours && (
                        <span className="text-[10px] text-muted-foreground">
                            ~{book.estimated_hours}h
                        </span>
                    )}
                </div>

                {/* Progress bar for in-progress */}
                {isInProgress && (
                    <div>
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                            <span className="text-muted-foreground">
                                Ch. {progress.current_chapter}/{book.total_chapters}
                            </span>
                            <span className="font-bold text-primary">{percent}%</span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
