import { useState, useCallback, useEffect } from 'react';
import { getWeekStartDate } from '@/lib/utils/level';
import { toast } from 'sonner';

export interface LeaderboardEntry {
    rank: number | string;
    id: string;
    user_id: string;
    name: string;
    avatar: string;
    weekly_score: number;
    total_score: number;
    is_current_user: boolean;
}

export function useLeaderboard(languageId: string, initialLevel: string) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<string | number>('-');
    const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    // UI Filters
    const [selectedLevel, setSelectedLevel] = useState(initialLevel);
    // Track weeks using a JS Date object always snapped to the Monday
    const [selectedWeek, setSelectedWeek] = useState<Date>(getWeekStartDate(new Date()));

    const fetchLeaderboard = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const weekStr = selectedWeek.toISOString().split('T')[0];
            const url = `/api/leaderboard?language_id=${languageId}&level_band=${encodeURIComponent(selectedLevel)}&week=${weekStr}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to load leaderboard');

            const data = await res.json();
            setEntries(data.entries || []);
            setUserRank(data.current_user_rank || '-');
            setUserEntry(data.current_user_entry || null);

        } catch (err) {
            console.error(err);
            if (!silent) toast.error("Could not refresh leaderboard.");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [languageId, selectedLevel, selectedWeek]);

    // Initial fetch and dependency changes
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchLeaderboard(true); // silent fetch
        }, 60000);
        return () => clearInterval(interval);
    }, [fetchLeaderboard]);

    const goToPreviousWeek = () => {
        setSelectedWeek(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() - 7);
            return d;
        });
    };

    const goToNextWeek = () => {
        setSelectedWeek(prev => {
            const todayWeek = getWeekStartDate();
            const d = new Date(prev);
            d.setDate(d.getDate() + 7);
            // Don't go into the future
            if (d.getTime() > todayWeek.getTime()) return prev;
            return d;
        });
    };

    return {
        entries,
        userRank,
        userEntry,
        isLoading,
        selectedLevel,
        selectedWeek,
        setLevelFilter: setSelectedLevel,
        goToPreviousWeek,
        goToNextWeek,
        refresh: fetchLeaderboard
    };
}
