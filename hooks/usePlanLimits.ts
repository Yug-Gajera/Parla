"use client";

import { useState, useEffect, useCallback } from 'react';

interface PlanLimits {
    plan: string;
    limits: {
        conversation: { allowed: boolean; remaining: number };
        article: { allowed: boolean; remaining: number };
        story: { allowed: boolean; remaining: number };
        word_lookup: { allowed: boolean; remaining: number };
    };
    free_limits: any;
}

export function usePlanLimits() {
    const [data, setData] = useState<PlanLimits | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLimits = useCallback(async () => {
        try {
            const res = await fetch('/api/user/plan');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Failed to fetch plan limits:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLimits();
    }, [fetchLimits]);

    return {
        plan: data?.plan || 'free',
        limits: data?.limits,
        freeLimits: data?.free_limits,
        isLoading,
        refetch: fetchLimits,
        isPro: data?.plan === 'pro' || data?.plan === 'pro_plus',
        isProPlus: data?.plan === 'pro_plus',
    };
}
