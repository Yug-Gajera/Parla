"use client";

import { useState, useCallback, useEffect } from 'react';

interface Book {
    id: string;
    title: string;
    author: string;
    book_type: string;
    cefr_level: string;
    description: string;
    cover_color: string;
    total_chapters: number;
    word_count_total: number;
    estimated_hours: number;
    topics: string[];
    user_progress: {
        current_chapter: number;
        chapters_completed: number;
        completed_at: string | null;
    } | null;
}

interface Filters {
    bookType: string;
    level: string;
}

export function useBooks(languageId: string) {
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<Filters>({ bookType: 'all', level: '' });

    const fetchBooks = useCallback(async (pageNum: number, append = false) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                language_id: languageId,
                page: String(pageNum),
                limit: '12',
            });
            if (filters.level) params.set('level', filters.level);
            if (filters.bookType !== 'all') params.set('book_type', filters.bookType);

            const res = await fetch(`/api/books?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setBooks(prev => append ? [...prev, ...data.books] : data.books);
            setHasMore(data.hasMore);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch books');
        } finally {
            setIsLoading(false);
        }
    }, [languageId, filters]);

    useEffect(() => {
        setPage(1);
        fetchBooks(1);
    }, [fetchBooks]);

    const fetchMore = useCallback(() => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchBooks(nextPage, true);
    }, [page, fetchBooks]);

    const updateFilters = useCallback((newFilters: Partial<Filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const inProgressBooks = books.filter(
        b => b.user_progress && !b.user_progress.completed_at
    );

    return {
        books, isLoading, error, hasMore, inProgressBooks,
        filters, updateFilters, fetchMore,
    };
}
