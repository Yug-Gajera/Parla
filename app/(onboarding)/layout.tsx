'use client';

// ============================================================
// Parlova — Onboarding Layout
// ============================================================

import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    const currentStep = useOnboardingStore((state) => state.currentStep);
    const totalSteps = 6;
    const progressPercent = (currentStep / totalSteps) * 100;

    return (
        <div className="min-h-screen w-full bg-[#080808] flex flex-col relative overflow-hidden font-sans">
            {/* ── Progress Bar ── */}
            <div className="fixed top-0 left-0 right-0 h-1.5 bg-[#1e1e1e] z-50 shadow-inner">
                <div
                    className="h-full bg-gradient-to-r from-[#8b7538] to-[#c9a84c] rounded-r-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(201,168,76,0.3)]"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* ── Main Content ── */}
            <main className="flex-1 flex flex-col items-center pt-8 pb-12 px-4 relative z-10 w-full selection:bg-[#c9a84c]/30 selection:text-[#f0ece4]">
                <div className="w-full max-w-[800px] flex flex-col items-center">
                    {children}
                </div>
            </main>
        </div>
    );
}
