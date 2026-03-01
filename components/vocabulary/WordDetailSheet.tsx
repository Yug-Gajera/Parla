"use client";

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
        'new': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        'learning': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        'familiar': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        'mastered': 'bg-primary/10 text-primary border-primary/20',
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
            <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col sm:max-w-md sm:mx-auto rounded-t-3xl overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 pt-10 pb-8 flex flex-col relative w-full hide-scrollbar">

                    {/* Header Area */}
                    <div className="flex flex-col items-center justify-center text-center w-full mb-8 mt-4">
                        {baseWord.cefr_level && (
                            <div className="flex items-center justify-center mb-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                                    {baseWord.cefr_level}
                                </span>
                            </div>
                        )}

                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
                            {baseWord.word}
                        </h2>

                        <div className="flex items-center gap-3 text-muted-foreground mt-2">
                            {baseWord.pronunciation && (
                                <span className="font-mono text-sm opacity-70">
                                    /{baseWord.pronunciation}/
                                </span>
                            )}
                            {baseWord.part_of_speech && (
                                <>
                                    {baseWord.pronunciation && <span>•</span>}
                                    <span className="italic text-sm">{baseWord.part_of_speech}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="w-full text-center mb-10">
                        <p className="text-2xl text-foreground font-medium mb-1">{baseWord.translation}</p>
                    </div>

                    {/* Example Sentence */}
                    {baseWord.example_sentence && (
                        <div className="w-full bg-card rounded-2xl p-5 border border-border/50 mb-8 inset-shadow-sm">
                            <p className="text-lg italic text-foreground mb-3 font-medium">
                                "{baseWord.example_sentence}"
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {baseWord.example_translation}
                            </p>
                        </div>
                    )}

                    <Separator className="mb-8 opacity-50" />

                    {/* Stats Module */}
                    <div className="w-full mb-10">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">Your Progress</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-card p-4 rounded-xl border border-border flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Brain className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Status</span>
                                </div>
                                <span className={`w-fit px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${statusGradient}`}>
                                    {word.status}
                                </span>
                            </div>

                            <div className="bg-card p-4 rounded-xl border border-border flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Next Review</span>
                                </div>
                                <span className="text-base font-semibold text-foreground">
                                    {word.next_review_date
                                        ? new Date(word.next_review_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                        : 'Today'}
                                </span>
                            </div>

                            <div className="bg-card p-4 rounded-xl border border-border flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Play className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Seen</span>
                                </div>
                                <span className="text-base font-semibold text-foreground">
                                    {word.times_seen} time{word.times_seen !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="bg-card p-4 rounded-xl border border-border flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Target className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Accuracy</span>
                                </div>
                                <span className="text-base font-semibold text-foreground">
                                    {accuracy}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full" />

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 w-full mt-auto">
                        <Button
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl text-md"
                            onClick={() => {
                                onOpenChange(false);
                                onReviewClick(word);
                            }}
                        >
                            Review Now
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive py-6 rounded-xl"
                            onClick={handleRemove}
                            disabled={isRemoving}
                        >
                            {isRemoving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Remove from deck
                        </Button>
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    );
}
