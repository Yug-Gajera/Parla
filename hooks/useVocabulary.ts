import { useState, useCallback, useEffect } from 'react';

export type VocabularyStatus = 'all' | 'due' | 'new' | 'learning' | 'familiar' | 'mastered';

export interface VocabularyWord {
    id: string; // user_vocabulary id
    user_id: string;
    word_id: string;
    status: string;
    ease_factor: number;
    interval_days: number;
    next_review_date: string;
    times_seen: number;
    times_correct: number;
    added_at: string;
    last_reviewed_at: string;
    vocabulary_words: {
        id: string;
        language_id: string;
        word: string;
        translation: string;
        pronunciation: string;
        part_of_speech: string;
        frequency_rank: number;
        cefr_level: string;
        example_sentence: string;
        example_translation: string;
    };
}

export interface VocabularyStats {
    total: number;
    new: number;
    learning: number;
    familiar: number;
    mastered: number;
    dueToday: number;
}

export function useVocabulary(languageId: string | null) {
    const [words, setWords] = useState<VocabularyWord[]>([]);
    const [stats, setStats] = useState<VocabularyStats | null>(null);
    const [dueCount, setDueCount] = useState<number>(0);

    const [filter, setFilter] = useState<VocabularyStatus>('all');
    const [search, setSearch] = useState<string>('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 30;

    const fetchStats = useCallback(async () => {
        if (!languageId) return;
        try {
            const res = await fetch(`/api/vocabulary/stats?language_id=${languageId}`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            const json = await res.json();
            setStats(json.data);
            setDueCount(json.data.dueToday);
        } catch (err) {
            console.error(err);
        }
    }, [languageId]);

    const fetchWords = useCallback(async (reset = false) => {
        if (!languageId) return;
        setIsLoading(true);
        setError(null);
        try {
            const currentOffset = reset ? 0 : offset;

            let url = `/api/vocabulary?language_id=${languageId}&limit=${LIMIT}&offset=${currentOffset}`;
            if (filter !== 'all') {
                url += `&status=${filter}`;
            }
            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch words');
            const json = await res.json();

            setWords(prev => reset ? json.data : [...prev, ...json.data]);
            setOffset(currentOffset + json.data.length);
            setHasMore(json.data.length === LIMIT);

        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [languageId, filter, search, offset]);

    // Initial loads and filter/search changes
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        // Reset words when filter or search changes
        fetchWords(true);
    }, [filter, search, languageId]); // eslint-disable-line react-hooks/exhaustive-deps

    const addWord = async (wordId: string) => {
        if (!languageId) return;
        try {
            const res = await fetch('/api/vocabulary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word_id: wordId, language_id: languageId })
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to add word');
            }
            // Refresh to get the new word + update stats
            fetchStats();
            if (filter === 'all' || filter === 'new') {
                fetchWords(true);
            }
        } catch (err) {
            throw err;
        }
    };

    const removeWord = async (userVocabularyId: string) => {
        // Optimistic UI
        setWords(prev => prev.filter(w => w.id !== userVocabularyId));

        // In a real app we need a DELETE endpoint. 
        // Let's assume we'll build it or handle it in /api/vocabulary
        try {
            const res = await fetch(`/api/vocabulary?id=${userVocabularyId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');
            fetchStats();
        } catch (err) {
            // Revert optimistic
            fetchWords(true);
            throw err;
        }
    };

    const loadMore = () => {
        if (!isLoading && hasMore) {
            fetchWords(false);
        }
    };

    return {
        words,
        stats,
        dueCount,
        isLoading,
        error,
        filter,
        search,
        setFilter,
        setSearch,
        addWord,
        removeWord,
        loadMore,
        hasMore,
        refreshStats: fetchStats
    };
}
