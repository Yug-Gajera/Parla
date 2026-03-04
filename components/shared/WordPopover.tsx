"use client";

// ============================================================
// FluentLoop — Shared Word Popover Component
// ============================================================

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Check, Loader2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

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
}

const POS_COLORS: Record<string, string> = {
    noun: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    verb: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    adjective: 'bg-green-500/20 text-green-400 border-green-500/30',
    adverb: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    phrase: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    preposition: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    conjunction: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

/**
 * Bolds the tapped word within a context sentence.
 * Uses word-boundary matching to avoid partial matches.
 */
function highlightWord(sentence: string, word: string): React.ReactNode {
    if (!sentence || !word) return sentence;

    // Escape regex chars, match word boundaries (case insensitive)
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(\\b${escaped}\\b)`, 'gi');
    const parts = sentence.split(regex);

    return parts.map((part, i) =>
        regex.test(part)
            ? <strong key={i} className="text-primary font-bold">{part}</strong>
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
}: WordPopoverProps) {
    if (!wordData && !isLoading) return null;

    const posColor = wordData?.part_of_speech
        ? POS_COLORS[wordData.part_of_speech.toLowerCase()] || 'bg-muted text-muted-foreground'
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            className="fixed bottom-0 left-0 right-0 z-[70] p-4"
        >
            <div
                className="mx-auto"
                style={{
                    maxWidth: '320px',
                    width: '90vw',
                    background: '#1a1a1a',
                    border: '1px solid #333333',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
            >
                {/* Loading state */}
                {isLoading && (
                    <div className="flex flex-col items-center py-4 gap-3">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <p className="text-sm text-gray-400">
                            Looking up <span className="text-white font-bold">{wordData?.word}</span>...
                        </p>
                    </div>
                )}

                {/* Loaded content */}
                {!isLoading && wordData && (
                    <>
                        {/* Header: word + POS + close */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-bold" style={{ fontSize: '20px' }}>
                                    {wordData.word}
                                </span>
                                {wordData.part_of_speech && (
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${posColor}`}>
                                        {wordData.part_of_speech}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onDismiss}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* English section */}
                        {wordData.translation && (
                            <div className="mb-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span style={{ fontSize: '11px' }}>🇬🇧</span>
                                    <span className="text-gray-500" style={{ fontSize: '11px', fontWeight: 600 }}>
                                        English
                                    </span>
                                </div>
                                <div
                                    className="text-white"
                                    style={{
                                        fontSize: '15px',
                                        background: '#222222',
                                        padding: '8px 10px',
                                        borderRadius: '8px',
                                    }}
                                >
                                    {wordData.translation}
                                </div>
                            </div>
                        )}

                        {/* Spanish section */}
                        {wordData.spanish_explanation && (
                            <div className="mb-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span style={{ fontSize: '11px' }}>🇪🇸</span>
                                    <span className="text-gray-500" style={{ fontSize: '11px', fontWeight: 600 }}>
                                        En español
                                    </span>
                                </div>
                                <div
                                    className="text-white italic"
                                    style={{
                                        fontSize: '14px',
                                        background: 'rgba(124, 58, 237, 0.1)',
                                        border: '1px solid rgba(124, 58, 237, 0.2)',
                                        padding: '8px 10px',
                                        borderRadius: '8px',
                                    }}
                                >
                                    {wordData.spanish_explanation}
                                </div>
                            </div>
                        )}

                        {/* Context section */}
                        {wordData.in_context && (
                            <div className="mb-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span style={{ fontSize: '11px' }}>📖</span>
                                    <span className="text-gray-500" style={{ fontSize: '11px', fontWeight: 600 }}>
                                        En contexto
                                    </span>
                                </div>
                                <p className="text-gray-400" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                                    &quot;{highlightWord(wordData.in_context, wordData.word)}&quot;
                                </p>
                            </div>
                        )}

                        {/* Limit reached notice */}
                        {wordData.note === 'Daily lookup limit reached' && (
                            <p className="text-amber-500/70 text-xs mb-3 text-center">
                                Daily word lookup limit reached. Try again tomorrow.
                            </p>
                        )}

                        {/* Bottom buttons */}
                        <div className="flex flex-col gap-2">
                            {wordData.in_deck ? (
                                <div className="flex items-center justify-center gap-2 py-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-emerald-500 text-xs font-medium">
                                        In Deck{wordData.deck_status ? ` · ${wordData.deck_status}` : ''}
                                    </span>
                                </div>
                            ) : onAddToDeck && (
                                <Button
                                    size="sm"
                                    onClick={() => onAddToDeck(wordData.word)}
                                    className="w-full bg-primary hover:bg-primary/90 text-xs font-bold gap-1.5"
                                    style={{ height: '32px' }}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add to Deck
                                </Button>
                            )}

                            {showUseInReply && onUseInReply && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onUseInReply(wordData.word)}
                                    className="w-full text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                                    style={{ height: '32px' }}
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Use in reply
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
