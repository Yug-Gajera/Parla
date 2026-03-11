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
                className="absolute left-0 top-6 p-3 text-[#5a5652] hover:text-[#f0ece4] transition-colors rounded-full hover:bg-[#141414] border border-transparent hover:border-[#1e1e1e]"
            >
                <ArrowLeft size={18} />
            </button>

            {/* ── Header ── */}
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4 text-center text-[#f0ece4] drop-shadow-sm">
                Define Objective
            </h1>
            <p className="text-[#5a5652] text-sm md:text-base font-mono uppercase tracking-widest text-center mb-16">
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
                                ${!isSelected ? 'hover:border-[#2a2a2a] hover:bg-[#141414] border-[#1e1e1e] bg-[#0f0f0f] shadow-inner' : ''}
                                ${isSelected ? 'border-[#c9a84c] bg-[#c9a84c]/5 shadow-[0_0_20px_rgba(201,168,76,0.1)] scale-[1.02]' : ''}
                            `}
                        >
                            {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/5 to-transparent pointer-events-none" />}
                            
                            <div className={`p-4 rounded-xl border flex-shrink-0 transition-colors duration-300 relative z-10 ${isSelected ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30' : 'bg-[#080808] text-[#5a5652] border-[#2a2a2a] group-hover:text-[#9a9590]'}`}>
                                <Icon size={24} strokeWidth={isSelected ? 2 : 1.5} />
                            </div>
                            
                            <div className="relative z-10">
                                <div className={`font-serif text-2xl mb-2 transition-colors duration-300 ${isSelected ? 'text-[#c9a84c]' : 'text-[#f0ece4] group-hover:text-[#f0ece4]'}`}>
                                    {g.label}
                                </div>
                                <div className="text-[12px] font-mono tracking-wide text-[#9a9590] uppercase leading-relaxed">
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
                    className="w-full max-w-sm bg-[#c9a84c] hover:bg-[#b98e72] text-[#080808] font-mono text-[11px] uppercase tracking-widest font-bold h-14 rounded-full shadow-[0_4px_20px_rgba(201,168,76,0.15)] transition-all disabled:opacity-30 disabled:shadow-none"
                >
                    Confirm Parameter
                </Button>
            </div>
        </div>
    );
}
