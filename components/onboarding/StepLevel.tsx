'use client';

// ============================================================
// FluentLoop — Onboarding Step 4: Self-Reported Level
// ============================================================

import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const LEVELS = [
    { id: 'A1', label: 'Complete Beginner', desc: "I've never studied this language" },
    { id: 'A2', label: 'Beginner', desc: 'I know some words and basic phrases' },
    { id: 'B1', label: 'Elementary', desc: 'I can handle simple conversations' },
    { id: 'B2', label: 'Intermediate', desc: 'I can hold a conversation but make mistakes' },
    { id: 'C1', label: 'Advanced', desc: "I'm comfortable but want to refine" },
];

export default function StepLevel() {
    const { selfReportedLevel, setSelfReportedLevel, nextStep, prevStep } = useOnboardingStore();

    return (
        <div className="flex flex-col items-center w-full animation-fade-in relative pt-12">
            {/* ── Back Button ── */}
            <button
                onClick={prevStep}
                className="absolute left-0 top-0 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
            >
                <ArrowLeft size={24} />
            </button>

            {/* ── Header ── */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-center text-balance">What&apos;s your current level?</h1>
            <p className="text-muted-foreground text-center mb-10">
                Be honest — we'll verify this in the next step
            </p>

            {/* ── List ── */}
            <div className="flex flex-col gap-3 w-full max-w-[500px] mx-auto mb-6">
                {LEVELS.map((lvl) => {
                    const isSelected = selfReportedLevel === lvl.id;
                    return (
                        <button
                            key={lvl.id}
                            onClick={() => setSelfReportedLevel(lvl.id)}
                            className={`
                flex items-center justify-between p-5 rounded-2xl border-2 transition-all w-full text-left
                ${!isSelected ? 'hover:border-primary hover:bg-card border-border bg-card' : ''}
                ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(124,58,237,0.3)]' : ''}
              `}
                        >
                            <div>
                                <div className={`font-semibold mb-1 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                    {lvl.label}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {lvl.desc}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <p className="text-xs text-muted-foreground italic mb-10">
                You'll take a quick 10-question test next to confirm your level
            </p>

            {/* ── Continue Button ── */}
            <div className="w-full flex justify-end">
                <Button
                    onClick={nextStep}
                    disabled={!selfReportedLevel}
                    className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-lg rounded-xl"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}
