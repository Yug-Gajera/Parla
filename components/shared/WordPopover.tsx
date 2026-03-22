"use client";

// ============================================================
// Parlova — Shared Word Popover Component (Redesigned)
// ============================================================

import React from 'react';
import { X, Plus, Check, Loader2, BookOpen, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface WordData {
    word: string;
    translation?: string | null;
    spanish_explanation?: string | null;
    part_of_speech?: string | null;
    in_context?: string | null;
    note?: string | null;
    in_deck?: boolean;
    deck_status?: string | null;
}

interface WordPopoverProps {
    wordData: WordData | null;
    isLoading?: boolean;
    onDismiss: () => void;
    onAddToDeck?: (word: string) => void;
    showUseInReply?: boolean;
    onUseInReply?: (word: string) => void;
    remainingLookups?: number | null;
    isPro?: boolean;
}

/**
 * Bolds the tapped word within a context sentence.
 * Uses word-boundary matching to avoid partial matches.
 */
function highlightWord(sentence: string, word: string): React.ReactNode {
    if (!sentence || !word) return sentence;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(\\b${escaped}\\b)`, 'gi');
    const parts = sentence.split(regex);
    return parts.map((part, i) =>
        regex.test(part)
            ? <strong key={i} className="text-text-primary font-semibold">{part}</strong>
            : part
    );
}

export default function WordPopover({
    wordData,
    isLoading = false,
    onDismiss,
    onAddToDeck,
    showUseInReply = false,
    onUseInReply,
    remainingLookups = null,
    isPro = false,
}: WordPopoverProps) {
    if (!wordData && !isLoading) return null;

    const speakWord = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.75;
            utterance.lang = 'es-ES';
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed bottom-6 left-0 right-0 z-[70] px-4 pointer-events-none flex justify-center"
        >
            <div
                className="pointer-events-auto w-full max-w-[340px] bg-card border border-border rounded-xl p-5 shadow-2xl relative"
            >
                {/* Close Button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center bg-surface hover:bg-border transition-colors text-text-secondary"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center py-6 gap-3">
                        <Loader2 className="w-5 h-5 text-[#E8521A] animate-spin" />
                        <p className="text-sm text-text-muted">
                            Looking up <span className="text-text-primary font-medium">{wordData?.word || 'word'}</span>...
                        </p>
                    </div>
                )}

                {/* Content */}
                {!isLoading && wordData && (
                    <div className="flex flex-col">
                        {/* Header */}
                        <div className="mb-5 pr-8">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-display text-2xl font-semibold text-text-primary leading-none">
                                    {wordData.word}
                                </h3>
                                <button 
                                    onClick={() => speakWord(wordData.word)}
                                    className="p-1.5 rounded-full bg-surface-hover text-text-muted hover:text-[#E8521A] transition-colors"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            </div>
                            {wordData.part_of_speech && (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-surface border border-border-strong text-text-muted text-[11px] font-medium uppercase tracking-wider font-mono-num">
                                    {wordData.part_of_speech}
                                </span>
                            )}
                            {!isPro && remainingLookups !== null && (
                                <span className="ml-3 text-[9px] font-mono-num font-bold text-orange-500/80 uppercase tracking-widest">
                                    {remainingLookups} lookups left today
                                </span>
                            )}
                        </div>

                         {/* Definitions */}
                         <div className="flex flex-col gap-3 mb-5">
                            {/* English */}
                            {wordData.translation && (
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-1 font-mono-num">English</span>
                                    <div className="bg-surface border border-border rounded-lg px-3 py-2.5">
                                        <p className="text-[15px] text-text-primary">{wordData.translation}</p>
                                    </div>
                                </div>
                            )}

                            {/* Spanish Context */}
                            {wordData.spanish_explanation && (
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-1 font-mono-num">Español</span>
                                    <div className="bg-[#E8521A]/8 border border-[#E8521A]/22 rounded-lg px-3 py-2.5">
                                        <p className="text-sm text-[#E8521A] italic">{wordData.spanish_explanation}</p>
                                    </div>
                                </div>
                            )}

                             {/* Given Context */}
                             {wordData.in_context && (
                                <div className="flex flex-col mt-1">
                                    <span className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-1 font-mono-num">In Context</span>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        "{highlightWord(wordData.in_context, wordData.word)}"
                                    </p>
                                </div>
                            )}
                        </div>

                         {/* Limit Notice */}
                         {wordData.note === 'Daily lookup limit reached' && (
                            <p className="text-xs text-error mb-4 text-center px-2 bg-error-subtle py-2 rounded-lg border border-error-border">
                                Daily word lookup limit reached. Try again tomorrow.
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-2 mt-auto">
                            {wordData.in_deck ? (
                                <div className="flex items-center justify-center gap-1.5 py-2 bg-success-subtle border border-success/20 rounded-lg">
                                    <Check className="w-3.5 h-3.5 text-success" />
                                    <span className="text-success text-[13px] font-medium font-mono-num">
                                        Saved {wordData.deck_status ? ` · ${wordData.deck_status}` : ''}
                                    </span>
                                </div>
                            ) : onAddToDeck && (
                                <button
                                    onClick={() => onAddToDeck(wordData.word)}
                                    className="btn-primary w-full h-10 flex items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-widest"
                                >
                                    <Plus className="w-4 h-4" /> Add to Deck
                                </button>
                            )}

                            {showUseInReply && onUseInReply && (
                                <button
                                    onClick={() => onUseInReply(wordData.word)}
                                    className="btn-secondary w-full h-10 flex items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-widest"
                                >
                                    <BookOpen className="w-4 h-4" /> Use in Reply
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
