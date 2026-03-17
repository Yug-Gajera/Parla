'use client';

// ============================================================
// Parlova — Onboarding Step 2: Goal
// ============================================================

import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Button } from '@/components/ui/button';
import { Plane, Briefcase, Heart, Star, ArrowLeft } from 'lucide-react';

const GOALS = [
    { id: 'travel', icon: Plane, label: 'Travel & Holidays', desc: 'Navigate globally with native proficiency' },
    { id: 'business', icon: Briefcase, label: 'Business & Career', desc: 'Command professional environments' },
    { id: 'family', icon: Heart, label: 'Family & Heritage', desc: 'Secure fluency for deep connections' },
    { id: 'fluency', icon: Star, label: 'Total Immersion', desc: 'Internalize syntax entirely' },
];

export default function StepGoal() {
    const { goal, setGoal, nextStep, prevStep } = useOnboardingStore();

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
                Define Objective
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-mono uppercase tracking-widest text-center mb-16">
                Establish primary calibration target
            </p>

            {/* ── Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl mb-16 px-4">
                {GOALS.map((g) => {
                    const isSelected = goal === g.id;
                    const Icon = g.icon;
                    return (
                        <button
                            key={g.id}
                            onClick={() => setGoal(g.id)}
                            className={`
                                flex flex-col md:flex-row items-start md:items-center gap-5 p-7 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group
                                ${!isSelected ? 'hover:border-border hover:bg-muted border-border bg-card shadow-inner' : ''}
                                ${isSelected ? 'border-primary bg-primary/5 shadow-sm scale-[1.02]' : ''}
                            `}
                        >
                            {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />}
                            
                            <div className={`p-4 rounded-xl border flex-shrink-0 transition-colors duration-300 relative z-10 ${isSelected ? 'bg-primary/10 text-primary border-primary/30' : 'bg-background text-muted-foreground border-border group-hover:text-muted-foreground'}`}>
                                <Icon size={24} strokeWidth={isSelected ? 2 : 1.5} />
                            </div>
                            
                            <div className="relative z-10">
                                <div className={`font-serif text-2xl mb-2 transition-colors duration-300 ${isSelected ? 'text-primary' : 'text-foreground group-hover:text-foreground'}`}>
                                    {g.label}
                                </div>
                                <div className="text-[12px] font-mono tracking-wide text-muted-foreground uppercase leading-relaxed">
                                    {g.desc}
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
                    disabled={!goal}
                    className="w-full max-w-sm bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-[11px] uppercase tracking-widest font-bold h-14 rounded-full shadow-lg transition-all disabled:opacity-30 disabled:shadow-none"
                >
                    Confirm Parameter
                </Button>
            </div>
        </div>
    );
}
