"use client";

import React, { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { VocabularyWord } from '@/hooks/useVocabulary';
import { Brain, Play, Trash2, Calendar, Target, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface WordDetailSheetProps {
    word: VocabularyWord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReviewClick: (word: VocabularyWord) => void;
    onRemoveWord: (user_vocabulary_id: string) => Promise<void>;
}

export function WordDetailSheet({ word, open, onOpenChange, onReviewClick, onRemoveWord }: WordDetailSheetProps) {
    const [isRemoving, setIsRemoving] = useState(false);

    if (!word) return null;

    const baseWord = word.vocabulary_words;

    // Status color mapping
    const statusColors = {
        'new': 'border-border-strong text-text-muted bg-surface',
        'learning': 'border-gold/40 text-gold bg-gold-subtle',
        'familiar': 'border-success/40 text-success bg-success-subtle',
        'mastered': 'border-gold text-background bg-gold',
    };

    const statusGradient = statusColors[word.status as keyof typeof statusColors] || statusColors.new;

    const accuracy = word.times_seen > 0
        ? Math.round((word.times_correct / word.times_seen) * 100)
        : 0;

    const handleRemove = async () => {
        const confirm = window.confirm('Are you sure you want to remove this word from your deck? You will lose this progress.');
        if (!confirm) return;

        setIsRemoving(true);
        try {
            await onRemoveWord(word.id);
            onOpenChange(false);
        } catch (err) {
            console.error('Failed to remove word', err);
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col sm:max-w-md sm:mx-auto rounded-t-3xl overflow-hidden bg-background border-t border-border font-sans shadow-2xl">
                <div className="flex-1 overflow-y-auto px-6 pt-10 pb-8 flex flex-col relative w-full custom-scrollbar">

                    {/* Header Area */}
                    <div className="flex flex-col items-center justify-center text-center w-full mb-8 mt-2">
                        {baseWord.cefr_level && (
                            <div className="flex items-center justify-center mb-6">
                                <span className="px-3 py-1 rounded-sm border border-gold/30 text-[10px] font-mono-num font-bold uppercase tracking-[0.2em] bg-gold/5 text-gold">
                                    {baseWord.cefr_level}
                                </span>
                            </div>
                        )}

                        <h2 className="text-4xl sm:text-5xl font-display tracking-tight text-text-primary mb-4 drop-shadow-sm">
                            {baseWord.word}
                        </h2>

                        <div className="flex items-center gap-4 mt-2">
                            {baseWord.pronunciation && (
                                <span className="font-mono-num text-[11px] text-text-secondary uppercase tracking-widest px-3 py-1 border border-border-strong bg-surface rounded-sm">
                                    /{baseWord.pronunciation}/
                                </span>
                            )}
                            {baseWord.part_of_speech && (
                                <span className="font-mono-num text-[11px] text-text-secondary italic uppercase tracking-widest px-3 py-1 border border-border-strong bg-surface rounded-sm">
                                    {baseWord.part_of_speech}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="w-full text-center mb-10">
                        <p className="text-2xl text-text-primary font-display mb-1">{baseWord.translation}</p>
                    </div>

                    {/* Example Sentence */}
                    {baseWord.example_sentence && (
                        <div className="w-full bg-card rounded-2xl p-6 border border-border mb-10 shadow-inner">
                            <p className="text-xl font-display text-text-primary mb-3 leading-relaxed">
                                {baseWord.example_sentence}
                            </p>
                            <p className="text-[13px] font-sans text-text-muted">
                                {baseWord.example_translation}
                            </p>
                        </div>
                    )}

                    <Separator className="mb-8 opacity-20 border-border" />

                    {/* Stats Module */}
                    <div className="w-full mb-10">
                        <h3 className="text-[10px] font-mono-num font-bold text-text-muted uppercase tracking-widest mb-4 px-1">Acquisition Metrics</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col gap-2 relative overflow-hidden group hover:border-border-strong transition-all">
                                <div className="absolute -right-4 -top-4 opacity-5">
                                    <Brain className="w-20 h-20 text-gold" />
                                </div>
                                <span className="text-[10px] font-mono-num text-text-muted uppercase tracking-widest flex items-center gap-2">
                                    <Brain className="w-3.5 h-3.5 text-gold" /> Status
                                </span>
                                <span className={`w-fit mt-1 px-2.5 py-0.5 rounded-sm border text-[9px] font-mono-num font-bold uppercase tracking-[0.1em] ${statusGradient}`}>
                                    {word.status}
                                </span>
                            </div>

                            <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col gap-2 relative overflow-hidden group hover:border-border-strong transition-all">
                                <div className="absolute -right-4 -top-4 opacity-5">
                                    <Calendar className="w-20 h-20 text-gold" />
                                </div>
                                <span className="text-[10px] font-mono-num text-text-muted uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-gold" /> Next Review
                                </span>
                                <span className="text-xl font-display text-text-primary mt-1">
                                    {word.next_review_date
                                        ? new Date(word.next_review_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                        : 'Immediate'}
                                </span>
                            </div>

                            <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col gap-2 relative overflow-hidden group hover:border-border-strong transition-all">
                                <div className="absolute -right-4 -top-4 opacity-5">
                                    <Play className="w-20 h-20 text-gold" />
                                </div>
                                <span className="text-[10px] font-mono-num text-text-muted uppercase tracking-widest flex items-center gap-2">
                                    <Play className="w-3.5 h-3.5 text-gold" /> Interacted
                                </span>
                                <span className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-display text-text-primary">{word.times_seen}</span>
                                    <span className="text-xs font-mono-num text-text-muted uppercase tracking-widest">cycles</span>
                                </span>
                            </div>

                            <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col gap-2 relative overflow-hidden group hover:border-border-strong transition-all">
                                <div className="absolute -right-4 -top-4 opacity-5">
                                    <Target className="w-20 h-20 text-gold" />
                                </div>
                                <span className="text-[10px] font-mono-num text-text-muted uppercase tracking-widest flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5 text-gold" /> Precision
                                </span>
                                <span className="text-2xl font-display text-gold mt-1">
                                    {accuracy}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full" />

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 w-full mt-auto">
                        <Button
                            className="w-full bg-gold hover:brightness-110 text-background font-mono-num text-[10px] uppercase tracking-widest font-bold h-14 rounded-full shadow-lg transition-all"
                            onClick={() => {
                                onOpenChange(false);
                                onReviewClick(word);
                            }}
                        >
                            Initiate Review
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-transparent bg-transparent text-error hover:bg-error/5 font-mono-num text-[10px] uppercase tracking-widest font-bold h-14 rounded-full transition-colors"
                            onClick={handleRemove}
                            disabled={isRemoving}
                        >
                            {isRemoving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Purge from Lexicon
                        </Button>
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    );
}
