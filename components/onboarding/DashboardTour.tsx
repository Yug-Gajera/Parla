"use client";

// ============================================================
// Parlova — Dashboard Tour Wrapper
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import OnboardingTour from './OnboardingTour';

export default function DashboardTour() {
    const [showTour, setShowTour] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkTourStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/tour/status');
            if (res.ok) {
                const data = await res.json();
                if (!data.has_seen_tour) {
                    // Small delay to ensure DOM is ready
                    setTimeout(() => setShowTour(true), 500);
                }
            }
        } catch (error) {
            console.error('Failed to check tour status:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkTourStatus();
    }, [checkTourStatus]);

    const markTourComplete = async () => {
        try {
            await fetch('/api/tour/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ has_seen_tour: true }),
            });
        } catch (error) {
            console.error('Failed to mark tour complete:', error);
        }
        setShowTour(false);
    };

    const handleDismiss = async () => {
        await markTourComplete();
    };

    const handleComplete = async () => {
        await markTourComplete();
    };

    if (isLoading) return null;

    if (!showTour) return null;

    return <OnboardingTour onComplete={handleComplete} onDismiss={handleDismiss} />;
}