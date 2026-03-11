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
        'new': 'border-[#2a2a2a] text-[#f0ece4] bg-[#141414]',
        'learning': 'border-[#c9a84c]/40 text-[#c9a84c] bg-[#c9a84c]/10',
        'familiar': 'border-[#f0ece4]/40 text-[#f0ece4] bg-[#f0ece4]/10',
        'mastered': 'border-[#c9a84c] text-[#080808] bg-[#c9a84c]',
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
            <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col sm:max-w-md sm:mx-auto rounded-t-3xl overflow-hidden bg-[#080808] border-t border-[#1e1e1e] font-sans shadow-2xl">
                <div className="flex-1 overflow-y-auto px-6 pt-10 pb-8 flex flex-col relative w-full custom-scrollbar">

                    {/* Header Area */}
                    <div className="flex flex-col items-center justify-center text-center w-full mb-8 mt-2">
                        {baseWord.cefr_level && (
                            <div className="flex items-center justify-center mb-6">
                                <span className="px-3 py-1 rounded-sm border border-[#c9a84c]/30 text-[10px] font-mono font-bold uppercase tracking-[0.2em] bg-[#c9a84c]/5 text-[#c9a84c]">
                                    {baseWord.cefr_level}
                                </span>
                            </div>
                        )}

                        <h2 className="text-4xl sm:text-5xl font-serif tracking-tight text-[#f0ece4] mb-4 drop-shadow-sm">
                            {baseWord.word}
                        </h2>

                        <div className="flex items-center gap-4 mt-2">
                            {baseWord.pronunciation && (
                                <span className="font-mono text-[11px] text-[#9a9590] uppercase tracking-widest px-3 py-1 border border-[#2a2a2a] bg-[#0f0f0f] rounded-sm">
                                    /{baseWord.pronunciation}/
                                </span>
                            )}
                            {baseWord.part_of_speech && (
                                <span className="font-mono text-[11px] text-[#9a9590] italic uppercase tracking-widest px-3 py-1 border border-[#2a2a2a] bg-[#0f0f0f] rounded-sm">
                                    {baseWord.part_of_speech}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="w-full text-center mb-10">
                        <p className="text-2xl text-[#f0ece4] font-serif mb-1">{baseWord.translation}</p>
                    </div>

                    {/* Example Sentence */}
                    {baseWord.example_sentence && (
                        <div className="w-full bg-[#141414] rounded-2xl p-6 border border-[#1e1e1e] mb-10 shadow-inner">
                            <p className="text-xl font-serif text-[#f0ece4] mb-3 leading-relaxed">
                                {baseWord.example_sentence}
                            </p>
                            <p className="text-[13px] font-sans text-[#5a5652]">
                                {baseWord.example_translation}
                            </p>
                        </div>
                    )}

                    <Separator className="mb-8 opacity-20 border-[#1e1e1e]" />

                    {/* Stats Module */}
                    <div className="w-full mb-10">
                        <h3 className="text-[10px] font-mono font-bold text-[#5a5652] uppercase tracking-widest mb-4 px-1">Acquisition Metrics</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#0f0f0f] p-5 rounded-2xl border border-[#1e1e1e] flex flex-col gap-2 relative overflow-hidden group hover:border-[#2a2a2a] transition-all">
                                <div className="absolute -right-4 -top-4 opacity-5">
                                    <Brain className="w-20 h-20 text-[#c9a84c]" />
                                </div>
                                <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest flex items-center gap-2">
                                    <Brain className="w-3.5 h-3.5 text-[#c9a84c]" /> Status
                                </span>
                                <span className={`w-fit mt-1 px-2.5 py-0.5 rounded-sm border text-[9px] font-mono font-bold uppercase tracking-[0.1em] ${statusGradient}`}>
                                    {word.status}
                                </span>
                            </div>

                            <div className="bg-[#0f0f0f] p-5 rounded-2xl border border-[#1e1e1e] flex flex-col gap-2 relative overflow-hidden group hover:border-[#2a2a2a] transition-all">
                                <div className="absolute -right-4 -top-4 opacity-5">
                                    <Calendar className="w-20 h-20 text-[#c9a84c]" />
                                </div>
                                <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-[#c9a84c]" /> Next Review
                                </span>
                                <span className="text-xl font-serif text-[#f0ece4] mt-1">
                                    {word.next_review_date
                                        ? new Date(word.next_review_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                        : 'Immediate'}
                                </span>
                            </div>

                            <div className="bg-[#0f0f0f] p-5 rounded-2xl border border-[#1e1e1e] flex flex-col gap-2 relative overflow-hidden group hover:border-[#2a2a2a] transition-all">
                                <div className="absolute -right-4 -top-4 opacity-5">
                                    <Play className="w-20 h-20 text-[#c9a84c]" />
                                </div>
                                <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest flex items-center gap-2">
                                    <Play className="w-3.5 h-3.5 text-[#c9a84c]" /> Interacted
                                </span>
                                <span className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-serif text-[#f0ece4]">{word.times_seen}</span>
                                    <span className="text-xs font-mono text-[#5a5652] uppercase tracking-widest">cycles</span>
                                </span>
                            </div>

                            <div className="bg-[#0f0f0f] p-5 rounded-2xl border border-[#1e1e1e] flex flex-col gap-2 relative overflow-hidden group hover:border-[#2a2a2a] transition-all">
                                <div className="absolute -right-4 -top-4 opacity-5">
                                    <Target className="w-20 h-20 text-[#c9a84c]" />
                                </div>
                                <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5 text-[#c9a84c]" /> Precision
                                </span>
                                <span className="text-2xl font-serif text-[#c9a84c] mt-1">
                                    {accuracy}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full" />

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 w-full mt-auto">
                        <Button
                            className="w-full bg-[#c9a84c] hover:bg-[#b98e72] text-[#080808] font-mono text-[10px] uppercase tracking-widest font-bold h-14 rounded-full shadow-[0_4px_20px_rgba(201,168,76,0.15)] transition-all"
                            onClick={() => {
                                onOpenChange(false);
                                onReviewClick(word);
                            }}
                        >
                            Initiate Review
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-transparent bg-transparent text-red-500 hover:bg-red-500/10 hover:text-red-400 font-mono text-[10px] uppercase tracking-widest font-bold h-14 rounded-full transition-colors"
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
