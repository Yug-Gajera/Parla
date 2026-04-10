"use client";

import { useState, useCallback } from 'react';
import { WordData } from '@/components/shared/WordPopover';
import { usePlanLimits } from '@/hooks/usePlanLimits';

interface ComprehensionResult {
    score: number;
    correct: number;
    total: number;
    xp_earned: number;
    message: string;
    book_completed: boolean;
    next_chapter: number | null;
}

export function useChapterReader(bookId: string, chapterNumber: number) {
    const [chapter, setChapter] = useState<any>(null);
    const [bookInfo, setBookInfo] = useState<{ title: string; total_chapters: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wordPopover, setWordPopover] = useState<WordData | null>(null);
    const [isWordLoading, setIsWordLoading] = useState(false);
    const [showVocabPanel, setShowVocabPanel] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);
    const [comprehensionResult, setComprehensionResult] = useState<ComprehensionResult | null>(null);
    const [wordsTapped, setWordsTapped] = useState(0);
    const [remainingLookups, setRemainingLookups] = useState<number | null>(null);
    const { isPro } = usePlanLimits();

    const fetchChapter = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/books/${bookId}/chapters/${chapterNumber}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load chapter');

            if (!data.chapter.processed) {
                setIsProcessing(true);
                // Poll until processed
                const poll = async () => {
                    const r = await fetch(`/api/books/${bookId}/chapters/${chapterNumber}`);
                    const d = await r.json();
                    if (d.chapter?.processed) {
                        setChapter(d.chapter);
                        setBookInfo(d.book);
                        setIsProcessing(false);
                        setIsLoading(false);
                    } else {
                        setTimeout(poll, 3000);
                    }
                };
                setTimeout(poll, 3000);
            } else {
                setChapter(data.chapter);
                setBookInfo(data.book);
                setIsLoading(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setIsLoading(false);
        }
    }, [bookId, chapterNumber]);

    const tapWord = useCallback(async (word: string, contextSentence: string) => {
        setWordsTapped(prev => prev + 1);

        // Check chapter vocabulary first
        const vocabItem = chapter?.vocabulary_items?.find(
            (v: { word: string }) => v.word.toLowerCase() === word.toLowerCase()
        );

        if (vocabItem) {
            setWordPopover({
                word,
                translation: vocabItem.translation,
                spanish_explanation: vocabItem.spanish_explanation || null,
                part_of_speech: vocabItem.part_of_speech,
                in_context: vocabItem.in_context || contextSentence,
                note: vocabItem.note,
            });
            return;
        }

        // Fallback: on-the-fly lookup
        setWordPopover({ word, in_context: contextSentence });
        setIsWordLoading(true);

        try {
            const res = await fetch('/api/words/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word, context_sentence: contextSentence }),
            });
            const data = await res.json();
            if (data.word_info) {
                setWordPopover(prev => prev ? {
                    ...prev,
                    translation: data.word_info.translation,
                    spanish_explanation: data.word_info.spanish_explanation || null,
                    part_of_speech: data.word_info.part_of_speech,
                    note: data.word_info.note,
                } : null);
            }
            if (typeof data.remaining === 'number') {
                setRemainingLookups(data.remaining);
            }
        } catch {
            // Silent fail
        } finally {
            setIsWordLoading(false);
        }
    }, [chapter]);

    const dismissPopover = useCallback(() => {
        setWordPopover(null);
        setIsWordLoading(false);
    }, []);

    const toggleVocabPanel = useCallback(() => setShowVocabPanel(prev => !prev), []);

    const calculateReadingProgress = useCallback((scrollPercent: number) => {
        setReadingProgress(Math.min(Math.max(scrollPercent, 0), 100));
    }, []);

    const submitComprehension = useCallback(async (answers: number[]) => {
        try {
            const res = await fetch(`/api/books/${bookId}/chapters/${chapterNumber}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers,
                    words_tapped: wordsTapped,
                }),
            });
            const data = await res.json();
            setComprehensionResult(data);
        } catch {
            setComprehensionResult({
                score: 0, correct: 0, total: answers.length,
                xp_earned: 40, message: 'Progress saved.',
                book_completed: false, next_chapter: chapterNumber + 1,
            });
        }
    }, [bookId, chapterNumber, wordsTapped]);

    return {
        chapter, bookInfo, isLoading, isProcessing, error,
        wordPopover, isWordLoading, showVocabPanel, readingProgress,
        comprehensionResult, wordsTapped, remainingLookups, isPro,
        fetchChapter, tapWord, dismissPopover,
        toggleVocabPanel, submitComprehension,
        calculateReadingProgress,
    };
}
