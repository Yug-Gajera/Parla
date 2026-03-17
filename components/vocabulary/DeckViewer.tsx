"use client";

import React, { useState } from 'react';
import { useVocabulary, VocabularyWord } from '@/hooks/useVocabulary';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, LayoutGrid, Upload } from 'lucide-react';
import { WordDetailSheet } from './WordDetailSheet';
import { AddWordSheet } from './AddWordSheet';
import { VocabularyImportModal } from './VocabularyImportModal';
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
    const [isImportOpen, setIsImportOpen] = useState(false);

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
            {/* Header Row */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif text-text-primary">Lexicon Inventory</h2>
                <Button 
                    onClick={() => setIsImportOpen(true)}
                    className="btn-action px-6 h-10 w-fit"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Import vocabulary
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-5 rounded-[18px] bg-card border border-border flex flex-col shadow-sm">
                    <span className="text-text-muted text-[10px] font-mono font-bold uppercase tracking-widest mb-2">Total Lexicon</span>
                    <span className="text-3xl font-serif text-text-primary">{stats?.total ?? '-'}</span>
                </div>
                <div className="p-5 rounded-[18px] bg-card border border-border flex flex-col shadow-sm">
                    <span className="text-gold text-[10px] font-mono font-bold uppercase tracking-widest mb-2">Pending Review</span>
                    <span className="text-3xl font-serif text-gold">{stats?.dueToday ?? '-'}</span>
                </div>
                <div className="p-5 rounded-[18px] bg-card border border-border flex flex-col shadow-sm">
                    <span className="text-text-secondary text-[10px] font-mono font-bold uppercase tracking-widest mb-2">Acquiring</span>
                    <span className="text-3xl font-serif text-text-secondary">{stats?.learning ?? '-'}</span>
                </div>
                <div className="p-5 rounded-[18px] bg-card border border-border flex flex-col shadow-sm hover:border-accent-border transition-colors">
                    <span className="text-text-primary text-[10px] font-mono font-bold uppercase tracking-widest mb-2">Mastered</span>
                    <span className="text-3xl font-serif text-text-primary">{stats?.mastered ?? '-'}</span>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-4 w-full mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search your lexicon..."
                        className="pl-11 h-12 bg-surface border-border text-text-primary placeholder:text-text-muted rounded-[18px] focus-visible:ring-1 focus-visible:ring-gold focus-visible:ring-offset-0 font-sans shadow-sm"
                    />
                </div>
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 sm:pb-0">
                    {filters.map(f => (
                        <Button
                            key={f.id}
                            variant="ghost"
                            size="sm"
                            className={`whitespace-nowrap rounded-[12px] h-12 px-5 text-[11px] font-mono uppercase tracking-widest transition-all ${filter === f.id ? 'bg-gold text-bg font-bold shadow-md' : 'bg-card text-text-secondary border border-border hover:bg-surface hover:text-text-primary'}`}
                            onClick={() => setFilter(f.id as any)}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Deck List */}
            <div
                className="flex-1 overflow-y-auto pb-32 custom-scrollbar rounded-[18px] border border-border bg-surface shadow-sm"
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

                        <p style={{
                            fontFamily: "var(--font-sans), sans-serif",
                            fontSize: "15px",
                            color: "var(--color-text-secondary)",
                            textAlign: "center",
                            maxWidth: "240px",
                            lineHeight: 1.6,
                        }}>
                            No words yet. Start reading to build your deck.
                        </p>

                        {!search && (
                            <Button onClick={() => setIsAddOpen(true)} className="btn-action px-8">
                                <Plus className="mr-2 h-4 w-4" /> Index New Word
                            </Button>
                        )}

                        {/* Dashed Import Card for Empty State */}
                        <div className="bg-card border border-border rounded-[18px] p-8 text-center mt-6 w-full max-w-sm flex flex-col items-center shadow-sm">
                            <Upload className="text-gold mb-3" size={32} />
                            <h3 className="font-sans font-semibold text-[15px] text-text-primary mb-1">Already know some Spanish?</h3>
                            <p className="font-sans text-[13px] text-text-secondary mb-5 leading-snug">
                                Import your existing vocabulary instead of starting from scratch
                            </p>
                            <Button 
                                onClick={() => setIsImportOpen(true)}
                                className="btn-action px-8"
                            >
                                Import vocabulary
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {words.map((word) => (
                            <div
                                key={word.id}
                                className="flex items-center justify-between p-5 hover:bg-card cursor-pointer transition-colors group"
                                onClick={() => {
                                    setSelectedWord(word);
                                    setIsDetailOpen(true);
                                }}
                            >
                                <div className="flex flex-col gap-1.5 items-start">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-serif text-text-primary group-hover:text-gold transition-colors leading-none tracking-tight">
                                            {word.vocabulary_words.word}
                                        </span>
                                        <StatusBadge status={word.status} />
                                    </div>
                                    <span className="text-[13px] text-text-secondary font-sans max-w-[200px] sm:max-w-sm truncate opacity-80 group-hover:opacity-100 transition-opacity">
                                        {word.vocabulary_words.translation}
                                    </span>
                                </div>
                                <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest pr-2 text-right">
                                    {word.next_review_date ? new Date(word.next_review_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col divide-y divide-border">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-5 flex justify-between items-center">
                                <div className="flex flex-col gap-3 w-full">
                                    <Skeleton className="h-6 w-32 bg-border rounded" />
                                    <Skeleton className="h-4 w-48 bg-border rounded" />
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
                    className="h-14 w-14 rounded-full bg-gold hover:brightness-110 shadow-lg transition-all z-10 border border-gold/50"
                    onClick={() => setIsAddOpen(true)}
                >
                    <Plus className="h-6 w-6 text-bg" />
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

            <VocabularyImportModal 
                isOpen={isImportOpen} 
                onClose={() => setIsImportOpen(false)} 
                currentLevel="A1" // ideally pass down from hook or props, but this serves as fallback
                onSuccessAction={refreshStats}
            />
        </div>
    );
}

// Sub-component for badges
function StatusBadge({ status }: { status: string }) {
    const statusColors = {
        'new': 'bg-surface border-border-strong text-text-muted',
        'learning': 'bg-gold/10 border-gold/20 text-gold shadow-sm',
        'familiar': 'bg-green-600/10 border-green-600/20 text-green-700 shadow-sm',
        'mastered': 'bg-gold border-gold text-bg shadow-sm',
    };
    const c = statusColors[status as keyof typeof statusColors] || statusColors.new;
    return (
        <span className={`px-2 py-[2px] rounded border text-[9px] font-mono font-bold uppercase tracking-[0.1em] ${c}`}>
            {status}
        </span>
    );
}
