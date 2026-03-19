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
}

export function useArticleReader(articleId: string) {
    const [article, setArticle] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wordPopover, setWordPopover] = useState<WordData | null>(null);
    const [isWordLoading, setIsWordLoading] = useState(false);
    const [showVocabPanel, setShowVocabPanel] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);
    const [comprehensionResult, setComprehensionResult] = useState<ComprehensionResult | null>(null);
    const [knownWords, setKnownWords] = useState<Set<string>>(new Set());
    const [wordsTapped, setWordsTapped] = useState(0);
    const [remainingLookups, setRemainingLookups] = useState<number | null>(null);
    const { isPro } = usePlanLimits();

    const fetchArticle = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/articles/${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load article');

            setArticle(data.article);
            if (data.known_words) {
                setKnownWords(new Set(data.known_words));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const tapWord = useCallback(async (word: string, contextSentence: string) => {
        setWordsTapped(prev => prev + 1);

        // 1. Check article's vocabulary_items first (pre-extracted by Claude)
        const vocabItem = article?.vocabulary_items?.find(
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
                in_deck: knownWords.has(word),
            });
            return;
        }

        // 2. Not in vocabulary_items — show loading, call on-the-fly lookup
        setWordPopover({ word, in_context: contextSentence, in_deck: knownWords.has(word) });
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
            } else if (res.status === 402 || (data.error && data.error.includes('limit reached'))) {
                setWordPopover(prev => prev ? {
                    ...prev,
                    note: 'Daily lookup limit reached',
                } : null);
            }
            
            if (typeof data.remaining === 'number') {
                setRemainingLookups(data.remaining);
            }
        } catch {
            // Silent fail — word tap should never break the reading experience
        } finally {
            setIsWordLoading(false);
        }
    }, [article, knownWords]);

    const dismissPopover = useCallback(() => {
        setWordPopover(null);
        setIsWordLoading(false);
    }, []);

    const toggleVocabPanel = useCallback(() => {
        setShowVocabPanel(prev => !prev);
    }, []);

    const calculateReadingProgress = useCallback((scrollPercent: number) => {
        setReadingProgress(Math.min(Math.max(scrollPercent, 0), 100));
    }, []);

    const submitComprehension = useCallback(async (answers: number[]) => {
        try {
            const res = await fetch(`/api/articles/${articleId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    completed: true,
                    answers,
                    words_tapped: wordsTapped,
                }),
            });
            const data = await res.json();
            setComprehensionResult(data);
        } catch {
            setComprehensionResult({
                score: 0, correct: 0, total: answers.length,
                xp_earned: 30, message: 'Progress saved.',
            });
        }
    }, [articleId, wordsTapped]);

    return {
        article, isLoading, error,
        wordPopover, isWordLoading, showVocabPanel, readingProgress,
        comprehensionResult, knownWords, wordsTapped, remainingLookups, isPro,
        fetchArticle, tapWord, dismissPopover,
        toggleVocabPanel, submitComprehension,
        calculateReadingProgress,
    };
}
