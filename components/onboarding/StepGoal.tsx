'use client';

// ============================================================
// Parlova — Onboarding Step 2: Goal
// ============================================================

import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Button } from '@/components/ui/button';
import { Plane, Briefcase, Heart, Star, ArrowLeft } from 'lucide-react';

const GOALS = [
    { id: 'travel', icon: Plane, label: 'Travel', desc: 'I want to travel to Spanish speaking places' },
    { id: 'work', icon: Briefcase, label: 'Work', desc: 'I need it for my job' },
    { id: 'family', icon: Heart, label: 'Family', desc: 'My family or partner speaks Spanish' },
    { id: 'fun', icon: Star, label: 'Fun', desc: 'I just want to learn something new' },
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
                Why are you learning Spanish?
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-mono uppercase tracking-widest text-center mb-16">
                Pick your main goal
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
                                flex flex-col md:flex-row items-start md:items-center gap-5 p-7 rounded-[18px] border transition-all duration-300 text-left relative overflow-hidden group
                                ${!isSelected ? 'hover:border-accent-border border-border bg-card shadow-sm' : ''}
                                ${isSelected ? 'border-accent-border bg-card shadow-md scale-[1.02]' : ''}
                            `}
                        >
                            {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />}
                            
                            <div className={`p-4 rounded-[18px] border flex-shrink-0 transition-colors duration-300 relative z-10 ${isSelected ? 'bg-accent/10 text-accent border-accent-border' : 'bg-surface text-text-muted border-border group-hover:text-text-muted'}`}>
                                <Icon size={24} strokeWidth={isSelected ? 2 : 1.5} />
                            </div>
                            
                            <div className="relative z-10">
                                <div className={`font-serif text-2xl mb-2 transition-colors duration-300 ${isSelected ? 'text-accent' : 'text-text-primary group-hover:text-text-primary'}`}>
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
                    className="btn-action w-full max-w-sm h-14"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}
