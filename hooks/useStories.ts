"use client";

import { useState, useCallback, useEffect } from 'react';

interface Story {
    id: string;
    title: string;
    content_type: string;
    topic: string;
    topic_category: string;
    cefr_level: string;
    word_count: number;
    summary: string;
    times_read: number;
    generated_at: string;
    user_progress: {
        completed_at: string | null;
        comprehension_score: number | null;
    } | null;
}

interface RateLimitInfo {
    operation: string;
    current: number;
    limit: number;
    remaining: number;
    isWarning: boolean;
    resetAt: string;
}

export function useStories(languageId: string) {
    const [stories, setStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
    const [dailyGenerationsRemaining, setDailyGenerationsRemaining] = useState(3);
    const [generatedStory, setGeneratedStory] = useState<any>(null);
    const [wasGenerated, setWasGenerated] = useState(false);
    const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);

    const fetchStories = useCallback(async (pageNum: number, reset = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                language_id: languageId,
                page: String(pageNum),
                limit: '12',
            });

            const res = await fetch(`/api/stories?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch stories');

            if (reset) {
                setStories(data.stories);
            } else {
                setStories(prev => [...prev, ...data.stories]);
            }
            setHasMore(data.hasMore);
            setPage(pageNum);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, [languageId]);

    useEffect(() => {
        fetchStories(1, true);
    }, [fetchStories]);

    const fetchMore = useCallback(() => {
        if (!isLoading && hasMore) fetchStories(page + 1);
    }, [isLoading, hasMore, page, fetchStories]);

    const getStory = useCallback(async () => {
        if (!selectedCategory || !selectedContentType) return;

        setIsGenerating(true);
        setError(null);
        setGeneratedStory(null);
        try {
            const res = await fetch('/api/stories/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language_id: languageId,
                    topic_category: selectedCategory,
                    content_type: selectedContentType,
                }),
            });
            const data = await res.json();

            if (res.status === 429) {
                setDailyGenerationsRemaining(0);
                setError(data.message || 'Daily limit reached');
                setRateLimit(data.rateLimit || null);
                return;
            }

            if (!res.ok) throw new Error(data.message || 'Generation failed');

            setGeneratedStory(data.story);
            setWasGenerated(data.was_generated);
            setDailyGenerationsRemaining(data.daily_generations_remaining);
            setRateLimit(data.rateLimit || null);

            // Refresh stories list
            fetchStories(1, true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsGenerating(false);
        }
    }, [languageId, selectedCategory, selectedContentType, fetchStories]);

    const clearGeneratedStory = useCallback(() => {
        setGeneratedStory(null);
        setWasGenerated(false);
    }, []);

    return {
        stories, isLoading, isGenerating, error, hasMore,
        selectedCategory, selectedContentType,
        dailyGenerationsRemaining, generatedStory, wasGenerated,
        rateLimit,
        setSelectedCategory, setSelectedContentType,
        getStory, fetchMore, clearGeneratedStory,
    };
}
