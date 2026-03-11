"use client";

// ============================================================
// Parlova — Shared Word Popover Component (Redesigned)
// ============================================================

import React from 'react';
import { X, Plus, Check, Loader2, BookOpen } from 'lucide-react';
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
            ? <strong key={i} className="text-[#f0ece4] font-semibold">{part}</strong>
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed bottom-[24px] left-0 right-0 z-[70] px-[16px] pointer-events-none flex justify-center"
        >
            <div
                className="pointer-events-auto w-full max-w-[340px] bg-[#141414] border border-[#1e1e1e] rounded-[14px] p-[20px] shadow-2xl relative"
            >
                {/* Close Button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-[16px] right-[16px] w-[28px] h-[28px] rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[#9a9590]"
                >
                    <X className="w-[14px] h-[14px]" />
                </button>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center py-[24px] gap-[12px]">
                        <Loader2 className="w-[20px] h-[20px] text-[#c9a84c] animate-spin" />
                        <p className="text-[14px] text-[#9a9590]">
                            Looking up <span className="text-[#f0ece4] font-medium">{wordData?.word || 'word'}</span>...
                        </p>
                    </div>
                )}

                {/* Content */}
                {!isLoading && wordData && (
                    <div className="flex flex-col">
                        {/* Header */}
                        <div className="mb-[20px] pr-[32px]">
                            <h3 className="font-display text-[26px] font-semibold text-[#f0ece4] leading-none mb-[8px]">
                                {wordData.word}
                            </h3>
                            {wordData.part_of_speech && (
                                <span className="inline-block px-[8px] py-[2px] rounded-md bg-[rgba(255,255,255,0.05)] border border-[#2a2a2a] text-[#9a9590] text-[11px] font-medium uppercase tracking-wider">
                                    {wordData.part_of_speech}
                                </span>
                            )}
                        </div>

                         {/* Definitions */}
                         <div className="flex flex-col gap-[12px] mb-[20px]">
                            {/* English */}
                            {wordData.translation && (
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-medium text-[#5a5652] uppercase tracking-widest mb-[4px]">English</span>
                                    <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg px-[12px] py-[10px]">
                                        <p className="text-[15px] text-[#f0ece4]">{wordData.translation}</p>
                                    </div>
                                </div>
                            )}

                            {/* Spanish Context */}
                            {wordData.spanish_explanation && (
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-medium text-[#5a5652] uppercase tracking-widest mb-[4px]">Español</span>
                                    <div className="bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.15)] rounded-lg px-[12px] py-[10px]">
                                        <p className="text-[14px] text-[#e4c76b] italic">{wordData.spanish_explanation}</p>
                                    </div>
                                </div>
                            )}

                             {/* Given Context */}
                             {wordData.in_context && (
                                <div className="flex flex-col mt-[4px]">
                                    <span className="text-[11px] font-medium text-[#5a5652] uppercase tracking-widest mb-[4px]">In Context</span>
                                    <p className="text-[14px] text-[#9a9590] leading-[1.6]">
                                        "{highlightWord(wordData.in_context, wordData.word)}"
                                    </p>
                                </div>
                            )}
                        </div>

                         {/* Limit Notice */}
                         {wordData.note === 'Daily lookup limit reached' && (
                            <p className="text-[12px] text-[#fb923c] mb-[16px] text-center px-[8px] bg-[rgba(251,146,60,0.1)] py-[8px] rounded-lg border border-[rgba(251,146,60,0.2)]">
                                Daily word lookup limit reached. Try again tomorrow.
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-[8px] mt-auto">
                            {wordData.in_deck ? (
                                <div className="flex items-center justify-center gap-[6px] py-[8px] bg-[rgba(74,222,128,0.05)] border border-[rgba(74,222,128,0.15)] rounded-lg">
                                    <Check className="w-[14px] h-[14px] text-[#4ade80]" />
                                    <span className="text-[#4ade80] text-[13px] font-medium">
                                        Saved {wordData.deck_status ? ` · ${wordData.deck_status}` : ''}
                                    </span>
                                </div>
                            ) : onAddToDeck && (
                                <button
                                    onClick={() => onAddToDeck(wordData.word)}
                                    className="btn btn-primary w-full h-[40px]"
                                >
                                    <Plus className="w-[16px] h-[16px]" /> Add to Deck
                                </button>
                            )}

                            {showUseInReply && onUseInReply && (
                                <button
                                    onClick={() => onUseInReply(wordData.word)}
                                    className="btn btn-secondary w-full h-[40px]"
                                >
                                    <BookOpen className="w-[16px] h-[16px]" /> Use in Reply
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
