import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SCENARIOS } from '@/lib/data/scenarios';

interface SituationRecord {
    situation_id: string;
    overall_score: number | null;
    completed_at: string;
}

type SituationMap = Record<string, SituationRecord[]>;

export function useSituationHistory(languageId: string) {
    const [history, setHistory] = useState<SituationMap>({});
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await (supabase as any)
                .from('user_situation_history')
                .select('scenario_type, situation_id, overall_score, completed_at')
                .eq('user_id', user.id)
                .eq('language_id', languageId)
                .order('completed_at', { ascending: false });

            if (error) throw error;

            // Group by scenario_type
            const map: SituationMap = {};
            (data || []).forEach((row: any) => {
                if (!map[row.scenario_type]) map[row.scenario_type] = [];
                map[row.scenario_type].push({
                    situation_id: row.situation_id,
                    overall_score: row.overall_score,
                    completed_at: row.completed_at,
                });
            });

            setHistory(map);
        } catch (err) {
            console.error('Failed to fetch situation history', err);
        } finally {
            setLoading(false);
        }
    }, [languageId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const getCompletionCount = (scenarioId: string): number => {
        return (history[scenarioId] || []).length;
    };

    const getCompletedSituationIds = (scenarioId: string): string[] => {
        return (history[scenarioId] || []).map(h => h.situation_id);
    };

    const getBestScore = (scenarioId: string, situationId: string): number | null => {
        const records = history[scenarioId] || [];
        const match = records.find(r => r.situation_id === situationId);
        return match?.overall_score ?? null;
    };

    const hasCompletedAll = (scenarioId: string): boolean => {
        const scenario = SCENARIOS.find(s => s.id === scenarioId);
        if (!scenario) return false;
        const completedIds = new Set(getCompletedSituationIds(scenarioId));
        return scenario.situations.every(s => completedIds.has(s.id));
    };

    return {
        history,
        loading,
        getCompletionCount,
        getCompletedSituationIds,
        getBestScore,
        hasCompletedAll,
        refetch: fetchHistory,
    };
}
