"use client";

import React, { useState } from 'react';
import { useVocabulary, VocabularyWord } from '@/hooks/useVocabulary';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, LayoutGrid } from 'lucide-react';
import { WordDetailSheet } from './WordDetailSheet';
import { AddWordSheet } from './AddWordSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ReadingFigure, DoodleArrow } from '@/components/illustrations';

interface DeckViewerProps {
    languageId: string | null;
    onStartReview: (words: VocabularyWord[]) => void;
}

export function DeckViewer({ languageId, onStartReview }: DeckViewerProps) {
    const {
        words, stats, isLoading, filter, setFilter, search, setSearch, removeWord, refreshStats, hasMore, loadMore
    } = useVocabulary(languageId);

    const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Filters array
    const filters = [
        { id: 'all', label: 'All Words' },
        { id: 'due', label: 'Due Now' },
        { id: 'new', label: 'New' },
        { id: 'learning', label: 'Learning' },
        { id: 'familiar', label: 'Familiar' },
        { id: 'mastered', label: 'Mastered' },
    ];

    // Listen to scroll to load more
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 100;
        if (bottom && !isLoading && hasMore) {
            loadMore();
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative bg-transparent font-sans">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-5 rounded-2xl bg-[#141414] border border-[#1e1e1e] flex flex-col shadow-inner">
                    <span className="text-[#5a5652] text-[10px] font-mono font-bold uppercase tracking-widest mb-2">Total Lexicon</span>
                    <span className="text-3xl font-serif text-[#f0ece4]">{stats?.total ?? '-'}</span>
                </div>
                <div className="p-5 rounded-2xl bg-[#c9a84c]/5 border border-[#c9a84c]/20 flex flex-col shadow-inner">
                    <span className="text-[#c9a84c] text-[10px] font-mono font-bold uppercase tracking-widest mb-2">Pending Review</span>
                    <span className="text-3xl font-serif text-[#c9a84c]">{stats?.dueToday ?? '-'}</span>
                </div>
                <div className="p-5 rounded-2xl bg-[#141414] border border-[#1e1e1e] flex flex-col shadow-inner">
                    <span className="text-[#9a9590] text-[10px] font-mono font-bold uppercase tracking-widest mb-2">Acquiring</span>
                    <span className="text-3xl font-serif text-[#9a9590]">{stats?.learning ?? '-'}</span>
                </div>
                <div className="p-5 rounded-2xl bg-[#141414] border border-[#1e1e1e] flex flex-col shadow-inner hover:border-[#2a2a2a] transition-colors">
                    <span className="text-[#f0ece4] text-[10px] font-mono font-bold uppercase tracking-widest mb-2">Mastered</span>
                    <span className="text-3xl font-serif text-[#f0ece4]">{stats?.mastered ?? '-'}</span>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-4 w-full mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a5652]" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search your lexicon..."
                        className="pl-11 h-12 bg-[#0f0f0f] border-[#2a2a2a] text-[#f0ece4] placeholder:text-[#5a5652] rounded-xl focus-visible:ring-1 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-0 font-sans"
                    />
                </div>
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 sm:pb-0">
                    {filters.map(f => (
                        <Button
                            key={f.id}
                            variant="ghost"
                            size="sm"
                            className={`whitespace-nowrap rounded-lg h-12 px-5 text-[11px] font-mono uppercase tracking-widest transition-all ${filter === f.id ? 'bg-[#c9a84c] text-[#080808] font-bold hover:bg-[#b98e72]' : 'bg-[#141414] text-[#9a9590] border border-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-[#f0ece4]'}`}
                            onClick={() => setFilter(f.id as any)}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Deck List */}
            <div
                className="flex-1 overflow-y-auto pb-32 custom-scrollbar rounded-2xl border border-[#1e1e1e] bg-[#0f0f0f]"
                onScroll={handleScroll}
            >
                {words.length === 0 && !isLoading ? (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                        padding: "48px 24px",
                    }}>
                        <div style={{ display: "none" }} className="md:block">
                            <ReadingFigure />
                        </div>
                        <p style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "15px",
                            color: "#9a9590",
                            textAlign: "center",
                            maxWidth: "240px",
                            lineHeight: 1.6,
                        }}>
                            No words yet. Start reading to build your deck.
                        </p>
                        <div style={{ display: "none" }} className="md:block">
                            <DoodleArrow direction="down" />
                        </div>
                        {!search && (
                            <Button onClick={() => setIsAddOpen(true)} className="bg-[#c9a84c] hover:bg-[#b98e72] text-[#080808] font-mono text-[10px] font-bold uppercase tracking-widest h-12 px-8 rounded-full shadow-[0_4px_20px_rgba(201,168,76,0.15)] transition-all">
                                <Plus className="mr-2 h-4 w-4" /> Index New Word
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-[#1e1e1e]">
                        {words.map((word) => (
                            <div
                                key={word.id}
                                className="flex items-center justify-between p-5 hover:bg-[#141414] cursor-pointer transition-colors group"
                                onClick={() => {
                                    setSelectedWord(word);
                                    setIsDetailOpen(true);
                                }}
                            >
                                <div className="flex flex-col gap-1.5 items-start">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-serif text-[#f0ece4] group-hover:text-[#c9a84c] transition-colors leading-none tracking-tight">
                                            {word.vocabulary_words.word}
                                        </span>
                                        <StatusBadge status={word.status} />
                                    </div>
                                    <span className="text-[13px] text-[#9a9590] font-sans max-w-[200px] sm:max-w-sm truncate opacity-80 group-hover:opacity-100 transition-opacity">
                                        {word.vocabulary_words.translation}
                                    </span>
                                </div>
                                <div className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest pr-2 text-right">
                                    {word.next_review_date ? new Date(word.next_review_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col divide-y divide-[#1e1e1e]">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-5 flex justify-between items-center">
                                <div className="flex flex-col gap-3 w-full">
                                    <Skeleton className="h-6 w-32 bg-[#1e1e1e] rounded" />
                                    <Skeleton className="h-4 w-48 bg-[#1e1e1e] rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FAB Add Button */}
            <div className="absolute bottom-6 right-6">
                <Button
                    size="icon"
                    className="h-14 w-14 rounded-full bg-[#c9a84c] hover:bg-[#b98e72] shadow-[0_0_30px_rgba(201,168,76,0.3)] hover:shadow-[0_0_40px_rgba(201,168,76,0.5)] transition-all z-10 border border-[#c9a84c]/50"
                    onClick={() => setIsAddOpen(true)}
                >
                    <Plus className="h-6 w-6 text-[#080808]" />
                </Button>
            </div>

            {/* Overlays */}
            <WordDetailSheet
                word={selectedWord}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                onReviewClick={(w) => onStartReview([w])}
                onRemoveWord={removeWord}
            />

            <AddWordSheet
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                languageId={languageId}
                refreshDeck={refreshStats}
            />
        </div>
    );
}

// Sub-component for badges
function StatusBadge({ status }: { status: string }) {
    const statusColors = {
        'new': 'bg-[#141414] border-[#2a2a2a] text-[#5a5652]',
        'learning': 'bg-[#c9a84c]/10 border-[#c9a84c]/20 text-[#c9a84c]',
        'familiar': 'bg-[#f0ece4]/10 border-[#f0ece4]/20 text-[#f0ece4]',
        'mastered': 'bg-[#c9a84c] border-[#c9a84c] text-[#080808]',
    };
    const c = statusColors[status as keyof typeof statusColors] || statusColors.new;
    return (
        <span className={`px-2 py-[2px] rounded border text-[9px] font-mono font-bold uppercase tracking-[0.1em] ${c}`}>
            {status}
        </span>
    );
}
