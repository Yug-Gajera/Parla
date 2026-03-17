'use client';

// ============================================================
// Parlova — Onboarding Step 1: Language
// ============================================================

import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Button } from '@/components/ui/button';

const LANGUAGES = [
    { id: '1', code: 'es', name: 'Spanish', emoji: '🇪🇸', available: true },
    { id: '2', code: 'fr', name: 'French', emoji: '🇫🇷', available: false },
    { id: '3', code: 'zh', name: 'Mandarin', emoji: '🇨🇳', available: false },
    { id: '4', code: 'ja', name: 'Japanese', emoji: '🇯🇵', available: false },
    { id: '5', code: 'pt', name: 'Portuguese', emoji: '🇧🇷', available: false },
    { id: '6', code: 'de', name: 'German', emoji: '🇩🇪', available: false },
];

export default function StepLanguage() {
    const { selectedLanguageId, setLanguage, nextStep } = useOnboardingStore();

    const handleSelect = (id: string, code: string, available: boolean) => {
        if (available) {
            setLanguage(id, code);
        }
    };

    return (
        <div className="flex flex-col items-center w-full animation-fade-in font-sans pb-16">
            {/* ── Header ── */}
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4 text-center text-foreground drop-shadow-sm">Select Archive</h1>
            <p className="text-muted-foreground text-sm md:text-base font-mono uppercase tracking-widest text-center mb-16">
                Choose the lexicon to initialize
            </p>

            {/* ── Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 w-full max-w-3xl mb-16">
                {LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguageId === lang.id;
                    return (
                        <button
                            key={lang.id}
                            onClick={() => handleSelect(lang.id, lang.code, lang.available)}
                            disabled={!lang.available}
                            className={`
                                relative flex flex-col items-center justify-center py-10 px-6 rounded-[18px] border transition-all duration-300
                                ${!lang.available ? 'opacity-30 cursor-not-allowed bg-card border-border grayscale px-0' : ''}
                                ${lang.available && !isSelected ? 'hover:border-accent-border bg-card border-border group shadow-sm' : ''}
                                ${isSelected ? 'border-accent-border bg-card shadow-md scale-[1.02]' : ''}
                            `}
                        >
                            <div className={`text-5xl mb-5 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {lang.emoji}
                            </div>
                            <div className={`font-serif text-xl tracking-wide ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                                {lang.name}
                            </div>

                            {/* Badge */}
                            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 text-[9px] font-mono tracking-[0.2em] font-bold uppercase rounded-sm border ${lang.available ? (isSelected ? 'bg-accent text-bg border-accent-border' : 'bg-surface text-text-muted border-border') : 'bg-transparent border-border text-text-muted'}`}>
                                {lang.available ? 'Active' : 'Locked'}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Continue Button ── */}
            <div className="w-full flex justify-center mt-auto">
                <Button
                    onClick={nextStep}
                    disabled={!selectedLanguageId}
                    className="w-full max-w-sm bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-[11px] uppercase tracking-widest font-bold h-14 rounded-full shadow-lg transition-all disabled:opacity-30 disabled:shadow-none"
                >
                    Proceed with Selection
                </Button>
            </div>
        </div>
    );
}
