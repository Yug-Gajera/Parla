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
    A1: 'border-[#1e1e1e] text-[#f0ece4]',
    A2: 'border-[#1e1e1e] text-[#f0ece4]',
    B1: 'border-[#1e1e1e] text-[#f0ece4]',
    B2: 'border-[#1e1e1e] text-[#f0ece4]',
    C1: 'border-[#c9a84c]/30 text-[#c9a84c]',
    C2: 'border-[#c9a84c]/30 text-[#c9a84c]',
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
                <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-12 font-sans py-4">
            {/* ── Continue Reading ── */}
            {inProgressBooks.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-6 bg-[#c9a84c] rounded-full" />
                        <h2 className="text-2xl font-serif text-[#f0ece4] tracking-tight">Active Volumes</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x custom-scrollbar">
                        {inProgressBooks.map(book => {
                            const progress = book.user_progress!;
                            const percent = Math.round(
                                (progress.chapters_completed / book.total_chapters) * 100
                            );
                            return (
                                <motion.div
                                    key={book.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelectBook(book.id)}
                                    className="flex-shrink-0 w-[260px] cursor-pointer snap-start group"
                                >
                                    <div className="rounded-2xl overflow-hidden border border-[#1e1e1e] bg-[#141414] shadow-xl group-hover:border-[#2a2a2a] transition-colors">
                                        <div
                                            className="h-28 flex items-end p-4 relative overflow-hidden"
                                            style={{ backgroundColor: book.cover_color || '#1e1e1e' }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            <div className="relative z-10 w-full">
                                                <p className="text-[#f0ece4] font-serif text-lg leading-tight line-clamp-2 drop-shadow-md">
                                                    {book.title}
                                                </p>
                                                <p className="text-[#c9a84c] font-sans text-xs mt-1 drop-shadow-md">{book.author}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-[#0f0f0f]">
                                            <div className="flex items-center justify-between mb-3 text-[10px] font-mono uppercase tracking-widest text-[#5a5652]">
                                                <span>
                                                    Chapter {progress.current_chapter}
                                                </span>
                                                <span className="text-[#c9a84c] font-bold">{percent}%</span>
                                            </div>
                                            <div className="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#8b7538] to-[#c9a84c] rounded-full transition-all"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Filter Tabs ── */}
            <section>
                <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 custom-scrollbar border-b border-[#1e1e1e]">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => updateFilters({ bookType: tab.id })}
                            className={`text-[11px] font-mono tracking-widest uppercase px-4 py-3 border-b-2 whitespace-nowrap transition-all ${filters.bookType === tab.id
                                    ? 'border-[#c9a84c] text-[#c9a84c]'
                                    : 'border-transparent text-[#5a5652] hover:text-[#f0ece4]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}

                    <div className="w-px h-6 bg-[#2a2a2a] mx-2" />

                    <div className="flex gap-2">
                        {['A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                            <button
                                key={level}
                                onClick={() => updateFilters({ level: filters.level === level ? '' : level })}
                                className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-sm border transition-all uppercase tracking-widest ${filters.level === level
                                        ? 'bg-[#c9a84c] text-[#080808] border-[#c9a84c]'
                                        : 'bg-[#141414] border-[#1e1e1e] text-[#5a5652] hover:border-[#2a2a2a] hover:text-[#9a9590]'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Book Grid ── */}
                {books.length === 0 ? (
                    <div className="p-16 text-center border border-dashed border-[#2a2a2a] rounded-3xl bg-[#080808]">
                        <BookOpen className="w-12 h-12 text-[#1e1e1e] mx-auto mb-6 opacity-80" strokeWidth={1} />
                        <h3 className="text-xl font-serif text-[#f0ece4] mb-2">Lexicon Empty</h3>
                        <p className="text-[#5a5652] font-sans text-sm max-w-sm mx-auto leading-relaxed">
                            Project Gutenberg indexing in process. Classic texts will appear here shortly.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
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
                            <div className="flex justify-center mt-12">
                                <Button variant="outline" onClick={fetchMore} className="bg-[#141414] border-[#1e1e1e] text-[#9a9590] hover:bg-[#1a1a1a] hover:text-[#f0ece4] font-mono text-[10px] uppercase font-bold tracking-widest px-8 h-12 rounded-full gap-2">
                                    Expand Catalogue <ChevronRight className="w-3.5 h-3.5" />
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
            className="cursor-pointer group flex flex-col h-full"
        >
            <div
                className="rounded-xl aspect-[3/4.2] flex flex-col justify-end p-4 sm:p-5 relative overflow-hidden transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-[#1e1e1e]"
                style={{ backgroundColor: book.cover_color || '#1e1e1e' }}
            >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />

                {/* Completed badge */}
                {isCompleted && (
                    <div className="absolute top-3 right-3 bg-[#c9a84c] text-[#080808] text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm flex items-center gap-1.5 shadow-lg">
                        <Check className="w-3 h-3" strokeWidth={3} /> Finalized
                    </div>
                )}

                {/* Book type badge */}
                <div className="absolute top-3 left-3 bg-[#080808]/60 text-[#f0ece4] text-[8px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-sm backdrop-blur-md border border-[#2a2a2a]">
                    {book.book_type === 'classic' ? 'Archive' : 'Graded'}
                </div>

                {/* Title & author */}
                <div className="relative z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-[#f0ece4] font-serif font-bold text-base sm:text-lg leading-tight line-clamp-2 drop-shadow-md mb-1.5">
                        {book.title}
                    </h3>
                    <p className="text-[#c9a84c] text-[11px] sm:text-xs font-sans drop-shadow-sm">{book.author}</p>
                </div>
            </div>

            {/* Meta below card */}
            <div className="mt-3 space-y-2 px-1 flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border bg-[#080808] ${LEVEL_COLORS[book.cefr_level] || 'border-[#1e1e1e] text-[#5a5652]'}`}>
                        {book.cefr_level}
                    </span>
                    <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest">
                        {book.total_chapters} Ph.
                    </span>
                    {book.estimated_hours && (
                        <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest">
                            ~{book.estimated_hours}h
                        </span>
                    )}
                </div>

                {/* Progress bar for in-progress */}
                {isInProgress && (
                    <div className="mt-auto pt-2">
                        <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest mb-1.5">
                            <span className="text-[#5a5652]">
                                Phase {progress.current_chapter}/{book.total_chapters}
                            </span>
                            <span className="font-bold text-[#c9a84c]">{percent}%</span>
                        </div>
                        <div className="h-0.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#c9a84c] rounded-full"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
