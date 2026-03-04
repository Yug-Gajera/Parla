'use client';

// ============================================================
// FluentLoop — Onboarding Step 2: Goal
// ============================================================

import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Button } from '@/components/ui/button';
import { Plane, Briefcase, Heart, Star, ArrowLeft } from 'lucide-react';

const GOALS = [
    { id: 'travel', icon: Plane, label: 'Travel & Holidays', desc: 'Get by confidently while traveling' },
    { id: 'business', icon: Briefcase, label: 'Business & Career', desc: 'Communicate professionally' },
    { id: 'family', icon: Heart, label: 'Family & Relationships', desc: 'Connect with people you love' },
    { id: 'fluency', icon: Star, label: 'Full Fluency', desc: 'Think and dream in another language' },
];

export default function StepGoal() {
    const { goal, setGoal, nextStep, prevStep } = useOnboardingStore();

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
                What&apos;s your main goal?
            </h1>
            <p className="text-muted-foreground text-center mb-10">
                This helps us recommend the right content
            </p>

            {/* ── Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10">
                {GOALS.map((g) => {
                    const isSelected = goal === g.id;
                    const Icon = g.icon;
                    return (
                        <button
                            key={g.id}
                            onClick={() => setGoal(g.id)}
                            className={`
                flex items-center gap-5 p-6 rounded-2xl border-2 transition-all text-left
                ${!isSelected ? 'hover:border-primary hover:bg-card border-border bg-card' : ''}
                ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(124,58,237,0.3)]' : ''}
              `}
                        >
                            <div className={`p-4 rounded-xl ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <div className={`font-semibold text-lg mb-1 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                    {g.label}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {g.desc}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Continue Button ── */}
            <div className="w-full flex justify-end">
                <Button
                    onClick={nextStep}
                    disabled={!goal}
                    className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-lg rounded-xl"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}
