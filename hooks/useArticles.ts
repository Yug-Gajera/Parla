"use client";

import { useState, useCallback, useEffect } from 'react';

interface Article {
    id: string;
    title: string;
    summary: string;
    source_name: string;
    cefr_level: string;
    topics: string[];
    published_at: string;
    image_url: string | null;
    estimated_read_minutes: number;
    word_count: number;
    user_progress: {
        started_at: string | null;
        completed_at: string | null;
        comprehension_score: number | null;
    } | null;
}

export function useArticles(languageId: string, userLevel: string) {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [levelFilter, setLevelFilter] = useState(userLevel);
    const [topicFilter, setTopicFilter] = useState('all');

    const fetchArticles = useCallback(async (pageNum: number, reset = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                language_id: languageId,
                level: levelFilter,
                page: String(pageNum),
                limit: '15',
            });
            if (topicFilter !== 'all') params.set('topic', topicFilter);

            const res = await fetch(`/api/articles?${params}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to fetch articles');

            if (reset) {
                setArticles(data.articles);
            } else {
                setArticles(prev => [...prev, ...data.articles]);
            }
            setHasMore(data.hasMore);
            setPage(pageNum);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, [languageId, levelFilter, topicFilter]);

    // Initial fetch and refetch on filter change
    useEffect(() => {
        fetchArticles(1, true);
    }, [fetchArticles]);

    const fetchMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchArticles(page + 1);
        }
    }, [isLoading, hasMore, page, fetchArticles]);

    const handleLevelFilter = useCallback((level: string) => {
        setLevelFilter(level);
        setPage(1);
        setHasMore(true);
    }, []);

    const handleTopicFilter = useCallback((topic: string) => {
        setTopicFilter(topic);
        setPage(1);
        setHasMore(true);
    }, []);

    const markCompleted = useCallback((articleId: string, score: number) => {
        setArticles(prev => prev.map(a =>
            a.id === articleId
                ? { ...a, user_progress: { ...a.user_progress, completed_at: new Date().toISOString(), comprehension_score: score, started_at: a.user_progress?.started_at || null } }
                : a
        ));
    }, []);

    return {
        articles, isLoading, error, hasMore,
        levelFilter, topicFilter,
        setLevelFilter: handleLevelFilter,
        setTopicFilter: handleTopicFilter,
        fetchMore, markCompleted,
    };
}
