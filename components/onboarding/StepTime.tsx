'use client';

// ============================================================
// Parlova — Onboarding Step 3: Daily Time
// ============================================================

import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft } from 'lucide-react';

const TIMES = [
    { min: 10, label: '10 minutes', desc: 'Casual learner — building the habit' },
    { min: 20, label: '20 minutes', desc: 'Regular learner — steady progress' },
    { min: 30, label: '30 minutes', desc: 'Serious learner — noticeable results' },
    { min: 45, label: '45+ minutes', desc: 'Intensive — fastest path to fluency' },
];

export default function StepTime() {
    const { dailyGoalMinutes, setDailyGoal, nextStep, prevStep } = useOnboardingStore();

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
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-center text-balance">
                How much time can you practice daily?
            </h1>
            <p className="text-muted-foreground text-center mb-10">
                Consistency beats intensity every time
            </p>

            {/* ── List ── */}
            <div className="flex flex-col gap-4 w-full max-w-[500px] mx-auto mb-10">
                {TIMES.map((t) => {
                    const isSelected = dailyGoalMinutes === t.min;
                    return (
                        <button
                            key={t.min}
                            onClick={() => setDailyGoal(t.min)}
                            className={`
                flex flex-col items-start p-6 rounded-2xl border-2 transition-all w-full text-left
                ${!isSelected ? 'hover:border-primary hover:bg-card border-border bg-card' : ''}
                ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(124,58,237,0.3)]' : ''}
              `}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <Clock size={20} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                                <span className={`font-semibold text-lg ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                    {t.label}
                                </span>
                            </div>
                            <div className="text-sm text-muted-foreground pl-8">
                                {t.desc}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Continue Button ── */}
            <div className="w-full flex justify-end">
                <Button
                    onClick={nextStep}
                    disabled={!dailyGoalMinutes}
                    className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-lg rounded-xl"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}
