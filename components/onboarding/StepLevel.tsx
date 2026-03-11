'use client';

// ============================================================
// Parlova — Onboarding Step 4: Self-Reported Level
// ============================================================

import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const LEVELS = [
    { id: 'A1', label: 'Novice Data', desc: 'Null proficiency. Initializing foundational arrays.' },
    { id: 'A2', label: 'Basic Constructs', desc: 'Functional vocabulary. Executing simple queries.' },
    { id: 'B1', label: 'Intermediate Matrix', desc: 'Sustained exchanges. Handling primary variables.' },
    { id: 'B2', label: 'Advanced Processing', desc: 'Complex dialogues. Sporadic syntax errors.' },
    { id: 'C1', label: 'Near-Native Ops', desc: 'Fluid generation. Seeking total optimization.' },
];

export default function StepLevel() {
    const { selfReportedLevel, setSelfReportedLevel, nextStep, prevStep } = useOnboardingStore();

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
                Current Aptitude
            </h1>
            <p className="text-[#5a5652] text-sm md:text-base font-mono uppercase tracking-widest text-center mb-16 px-4">
                Define functional parameters. Verification sequence to follow.
            </p>

            {/* ── List ── */}
            <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mb-10 px-4">
                {LEVELS.map((lvl) => {
                    const isSelected = selfReportedLevel === lvl.id;
                    return (
                        <button
                            key={lvl.id}
                            onClick={() => setSelfReportedLevel(lvl.id)}
                            className={`
                                flex items-center justify-between p-6 sm:p-7 rounded-2xl border transition-all duration-300 w-full text-left relative overflow-hidden group
                                ${!isSelected ? 'hover:border-[#2a2a2a] hover:bg-[#141414] border-[#1e1e1e] bg-[#0f0f0f] shadow-inner' : ''}
                                ${isSelected ? 'border-[#c9a84c] bg-[#c9a84c]/5 shadow-[0_0_20px_rgba(201,168,76,0.1)] scale-[1.02]' : ''}
                            `}
                        >
                            {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c]/5 to-transparent pointer-events-none" />}
                            
                            <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-center gap-4">
                                    <span className={`w-12 h-12 flex items-center justify-center rounded-lg border font-mono font-bold text-lg tracking-widest transition-colors ${isSelected ? 'border-[#c9a84c]/30 text-[#c9a84c] bg-[#c9a84c]/10' : 'border-[#2a2a2a] text-[#5a5652] bg-[#080808] group-hover:text-[#9a9590]'}`}>
                                        {lvl.id}
                                    </span>
                                    <div className={`font-serif text-2xl transition-colors ${isSelected ? 'text-[#c9a84c]' : 'text-[#f0ece4]'}`}>
                                        {lvl.label}
                                    </div>
                                </div>
                                <div className={`text-[11px] font-mono tracking-wide uppercase leading-relaxed sm:text-right transition-colors ${isSelected ? 'text-[#c9a84c]/80' : 'text-[#9a9590]'}`}>
                                    {lvl.desc}
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
                    disabled={!selfReportedLevel}
                    className="w-full max-w-sm bg-[#c9a84c] hover:bg-[#b98e72] text-[#080808] font-mono text-[11px] uppercase tracking-widest font-bold h-14 rounded-full shadow-[0_4px_20px_rgba(201,168,76,0.15)] transition-all disabled:opacity-30 disabled:shadow-none"
                >
                    Initialize Verification
                </Button>
            </div>
        </div>
    );
}
