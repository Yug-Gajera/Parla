"use client";

import { useState, useCallback, useEffect } from 'react';

interface Video {
    id: string;
    youtube_id: string;
    title: string;
    channel_name: string;
    cefr_level: string;
    topics: string[];
    thumbnail_url: string;
    duration_seconds: number;
    summary: string;
    user_progress: { completed: boolean; comprehension_score: number } | null;
}

export function useWatch(languageId: string) {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [levelFilter, setLevelFilter] = useState('');
    const [topicFilter, setTopicFilter] = useState('');

    const fetchVideos = useCallback(async (pageNum: number, append = false) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ language_id: languageId, page: String(pageNum), limit: '12' });
            if (levelFilter) params.set('level', levelFilter);
            if (topicFilter) params.set('topic', topicFilter);

            const res = await fetch(`/api/watch?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setVideos(prev => append ? [...prev, ...data.videos] : data.videos);
            setHasMore(data.hasMore);
        } catch (err) {
            console.error('Failed to fetch videos:', err);
        } finally {
            setIsLoading(false);
        }
    }, [languageId, levelFilter, topicFilter]);

    useEffect(() => {
        setPage(1);
        fetchVideos(1);
    }, [fetchVideos]);

    const fetchMore = useCallback(() => {
        const next = page + 1;
        setPage(next);
        fetchVideos(next, true);
    }, [page, fetchVideos]);

    return { videos, isLoading, hasMore, levelFilter, topicFilter, setLevelFilter, setTopicFilter, fetchMore };
}
