"use client";

import React, { useState, useEffect } from 'react';
import { useVocabulary, VocabularyWord } from '@/hooks/useVocabulary';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, LayoutGrid } from 'lucide-react';
import { WordDetailSheet } from './WordDetailSheet';
import { AddWordSheet } from './AddWordSheet';
import { Skeleton } from '@/components/ui/skeleton';

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
        <div className="w-full h-full flex flex-col relative bg-transparent">

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-card border border-border flex flex-col">
                    <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Total Words</span>
                    <span className="text-2xl font-bold">{stats?.total ?? '-'}</span>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col">
                    <span className="text-primary text-xs font-semibold uppercase tracking-wider mb-1">Due Today</span>
                    <span className="text-2xl font-bold text-primary">{stats?.dueToday ?? '-'}</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col">
                    <span className="text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">Learning</span>
                    <span className="text-2xl font-bold text-amber-500">{stats?.learning ?? '-'}</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col">
                    <span className="text-emerald-500 text-xs font-semibold uppercase tracking-wider mb-1">Mastered</span>
                    <span className="text-2xl font-bold text-emerald-500">{stats?.mastered ?? '-'}</span>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-3 w-full mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search your deck..."
                        className="pl-9 h-11 bg-card/50"
                    />
                </div>
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 sm:pb-0">
                    {filters.map(f => (
                        <Button
                            key={f.id}
                            variant={filter === f.id ? "secondary" : "ghost"}
                            size="sm"
                            className={`whitespace-nowrap rounded-full h-11 px-5 ${filter === f.id ? 'bg-secondary text-secondary-foreground font-medium' : 'text-muted-foreground'}`}
                            onClick={() => setFilter(f.id as any)}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Deck List */}
            <div
                className="flex-1 overflow-y-auto pb-32 hide-scrollbar rounded-xl border border-border/50 bg-card/30"
                onScroll={handleScroll}
            >
                {words.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 h-full text-center">
                        <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No words found</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            {search ? `We couldn't find any words matching "${search}".` : "Your vocabulary deck is empty right now. Add some new words to start learning."}
                        </p>
                        {!search && (
                            <Button onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
                                <Plus className="mr-2 h-4 w-4" /> Add Words
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-border/40">
                        {words.map((word) => (
                            <div
                                key={word.id}
                                className="flex items-center justify-between p-4 hover:bg-card/60 cursor-pointer transition-colors"
                                onClick={() => {
                                    setSelectedWord(word);
                                    setIsDetailOpen(true);
                                }}
                            >
                                <div className="flex flex-col gap-1 items-start">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-semibold text-foreground tracking-tight">
                                            {word.vocabulary_words.word}
                                        </span>
                                        <StatusBadge status={word.status} />
                                    </div>
                                    <span className="text-sm text-muted-foreground max-w-[200px] sm:max-w-xs truncate">
                                        {word.vocabulary_words.translation}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground font-medium pr-1 text-right">
                                    {word.next_review_date ? new Date(word.next_review_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col divide-y divide-border/40">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-4 flex justify-between items-center">
                                <div className="flex flex-col gap-2 w-full">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-48" />
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
                    className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.7)] z-10"
                    onClick={() => setIsAddOpen(true)}
                >
                    <Plus className="h-8 w-8 text-primary-foreground" />
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
        'new': 'bg-blue-500 text-white',
        'learning': 'bg-amber-500 text-white',
        'familiar': 'bg-emerald-500 text-white',
        'mastered': 'bg-primary text-primary-foreground',
    };
    const c = statusColors[status as keyof typeof statusColors] || statusColors.new;
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c}`}>
            {status}
        </span>
    );
}
