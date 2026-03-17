'use client';

// ============================================================
// Parlova — Onboarding Step 3: Daily Time
// ============================================================

import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft } from 'lucide-react';

const TIMES = [
    { min: 10, label: '10 Minutes', desc: 'Minimal exposure. Maintaining the baseline.' },
    { min: 20, label: '20 Minutes', desc: 'Standard calibration. Consistent accumulation.' },
    { min: 30, label: '30 Minutes', desc: 'Elevated protocol. Accelerated synthesis.' },
    { min: 45, label: '45+ Minutes', desc: 'Maximum velocity. Total neural immersion.' },
];

export default function StepTime() {
    const { dailyGoalMinutes, setDailyGoal, nextStep, prevStep } = useOnboardingStore();

    return (
        <div className="flex flex-col items-center w-full animation-fade-in relative pt-16 pb-16 font-sans">
            {/* ── Back Button ── */}
            <button
                onClick={prevStep}
                className="absolute left-0 top-6 p-3 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted border border-transparent hover:border-border"
            >
                <ArrowLeft size={18} />
            </button>

            {/* ── Header ── */}
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4 text-center text-foreground drop-shadow-sm">
                Commitment Horizon
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-mono uppercase tracking-widest text-center mb-16">
                Specify daily immersion duration
            </p>

            {/* ── List ── */}
            <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto mb-16 px-4">
                {TIMES.map((t) => {
                    const isSelected = dailyGoalMinutes === t.min;
                    return (
                        <button
                            key={t.min}
                            onClick={() => setDailyGoal(t.min)}
                            className={`
                                flex flex-col md:flex-row items-start md:items-center p-6 sm:p-7 rounded-2xl border transition-all duration-300 w-full text-left relative overflow-hidden group
                                ${!isSelected ? 'hover:border-border hover:bg-muted border-border bg-card shadow-inner' : ''}
                                ${isSelected ? 'border-primary bg-primary/5 shadow-sm scale-[1.02]' : ''}
                            `}
                        >
                            {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />}
                            
                            <div className="flex items-center gap-5 w-full relative z-10">
                                <div className={`p-4 rounded-xl border flex-shrink-0 transition-colors duration-300 ${isSelected ? 'bg-primary/10 text-primary border-primary/30' : 'bg-background text-muted-foreground border-border group-hover:text-muted-foreground'}`}>
                                    <Clock size={20} strokeWidth={isSelected ? 2 : 1.5} />
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-2">
                                    <span className={`font-serif text-2xl tracking-wide transition-colors duration-300 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                        {t.label}
                                    </span>
                                    <span className={`text-[11px] font-mono tracking-wide uppercase leading-relaxed md:text-right ${isSelected ? 'text-primary/80' : 'text-muted-foreground'}`}>
                                        {t.desc}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Continue Button ── */}
            <div className="w-full flex justify-center mt-auto">
                <Button
                    onClick={nextStep}
                    disabled={!dailyGoalMinutes}
                    className="w-full max-w-sm bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-[11px] uppercase tracking-widest font-bold h-14 rounded-full shadow-lg transition-all disabled:opacity-30 disabled:shadow-none"
                >
                    Lock Duration
                </Button>
            </div>
        </div>
    );
}
