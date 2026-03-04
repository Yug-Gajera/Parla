// ============================================================
// FluentLoop — useModules Hook
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { UserModuleProgress, ScenarioModule } from '@/types';

interface UseModulesReturn {
    progress: UserModuleProgress[];
    isLoading: boolean;
    error: string | null;
    totalUnlocked: number;
    fetchProgress: () => Promise<void>;
    updateProgress: (
        scenarioType: string,
        step: 'dialogue' | 'phrases' | 'challenge',
        score?: number,
        phrasesLearned?: number,
        learnedPhrases?: any[]
    ) => Promise<UserModuleProgress | null>;
    isUnlocked: (scenarioType: string) => boolean;
    getProgress: (scenarioType: string) => UserModuleProgress | undefined;
    fetchModule: (scenarioType: string) => Promise<ScenarioModule | null>;
    moduleLoading: boolean;
}

export function useModules(languageId: string | null): UseModulesReturn {
    const [progress, setProgress] = useState<UserModuleProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [moduleLoading, setModuleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProgress = useCallback(async () => {
        if (!languageId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/modules/progress?language_id=${languageId}`);
            const json = await res.json();
            if (json.success) {
                setProgress(json.data || []);
            } else {
                setError(json.error || 'Failed to fetch progress');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setIsLoading(false);
        }
    }, [languageId]);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    const updateProgress = useCallback(async (
        scenarioType: string,
        step: 'dialogue' | 'phrases' | 'challenge',
        score?: number,
        phrasesLearned?: number,
        learnedPhrases?: any[]
    ): Promise<UserModuleProgress | null> => {
        if (!languageId) return null;
        try {
            const res = await fetch('/api/modules/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario_type: scenarioType,
                    language_id: languageId,
                    step,
                    score,
                    phrases_learned: phrasesLearned,
                    learned_phrases: learnedPhrases,
                }),
            });
            const json = await res.json();
            if (json.success && json.data) {
                // Optimistically update local state
                setProgress(prev => {
                    const idx = prev.findIndex(
                        p => p.scenario_type === scenarioType
                    );
                    if (idx >= 0) {
                        const updated = [...prev];
                        updated[idx] = json.data;
                        return updated;
                    }
                    return [...prev, json.data];
                });
                return json.data;
            }
            return null;
        } catch {
            return null;
        }
    }, [languageId]);

    const fetchModule = useCallback(async (scenarioType: string): Promise<ScenarioModule | null> => {
        if (!languageId) return null;
        setModuleLoading(true);
        try {
            const res = await fetch('/api/modules/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario_type: scenarioType,
                    language_id: languageId,
                }),
            });
            const json = await res.json();
            if (json.success) return json.data;
            return null;
        } catch {
            return null;
        } finally {
            setModuleLoading(false);
        }
    }, [languageId]);

    const isUnlocked = useCallback((scenarioType: string) => {
        return progress.some(p => p.scenario_type === scenarioType && p.scenario_unlocked);
    }, [progress]);

    const getProgress = useCallback((scenarioType: string) => {
        return progress.find(p => p.scenario_type === scenarioType);
    }, [progress]);

    const totalUnlocked = progress.filter(p => p.scenario_unlocked).length;

    return {
        progress,
        isLoading,
        error,
        totalUnlocked,
        fetchProgress,
        updateProgress,
        isUnlocked,
        getProgress,
        fetchModule,
        moduleLoading,
    };
}
