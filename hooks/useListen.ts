"use client";

import { useState, useCallback, useEffect } from 'react';

export function useListen(languageId: string) {
    const [shows, setShows] = useState<any[]>([]);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [showFilter, setShowFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');

    const fetchShows = useCallback(async () => {
        try {
            const res = await fetch('/api/listen/shows');
            const data = await res.json();
            if (data.shows) setShows(data.shows);
        } catch (err) {
            console.error('Failed to fetch shows:', err);
        }
    }, []);

    const fetchEpisodes = useCallback(async (pageNum: number, append = false) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pageNum), limit: '12' });
            if (showFilter) params.set('show_id', showFilter);
            if (levelFilter) params.set('level', levelFilter);

            const res = await fetch(`/api/listen/episodes?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setEpisodes(prev => append ? [...prev, ...data.episodes] : data.episodes);
            setHasMore(data.hasMore);
        } catch (err) {
            console.error('Failed to fetch episodes:', err);
        } finally {
            setIsLoading(false);
        }
    }, [showFilter, levelFilter]);

    useEffect(() => { fetchShows(); }, [fetchShows]);
    useEffect(() => { setPage(1); fetchEpisodes(1); }, [fetchEpisodes]);

    const fetchMore = useCallback(() => {
        const next = page + 1;
        setPage(next);
        fetchEpisodes(next, true);
    }, [page, fetchEpisodes]);

    return { shows, episodes, isLoading, hasMore, showFilter, levelFilter, setShowFilter, setLevelFilter, fetchMore };
}
