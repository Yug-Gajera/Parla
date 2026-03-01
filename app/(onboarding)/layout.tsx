'use client';

// ============================================================
// FluentLoop — Onboarding Layout
// ============================================================

import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    const currentStep = useOnboardingStore((state) => state.currentStep);
    const totalSteps = 6;
    const progressPercent = (currentStep / totalSteps) * 100;

    return (
        <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
            {/* ── Progress Bar ── */}
            <div className="fixed top-0 left-0 right-0 h-1.5 bg-secondary z-50">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* ── Main Content ── */}
            <main className="flex-1 flex flex-col items-center pt-8 pb-12 px-4 relative z-10 w-full">
                <div className="w-full max-w-[800px] flex flex-col items-center">
                    {children}
                </div>
            </main>
        </div>
    );
}
