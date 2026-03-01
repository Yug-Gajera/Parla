'use client';

// ============================================================
// FluentLoop — Onboarding Step 1: Language
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
        <div className="flex flex-col items-center w-full animation-fade-in">
            {/* ── Header ── */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-center text-balance">
                What language do you want to learn?
            </h1>
            <p className="text-muted-foreground text-center mb-10">
                We'll personalize everything for you
            </p>

            {/* ── Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mb-10">
                {LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguageId === lang.id;
                    return (
                        <button
                            key={lang.id}
                            onClick={() => handleSelect(lang.id, lang.code, lang.available)}
                            disabled={!lang.available}
                            className={`
                relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all
                ${!lang.available ? 'opacity-50 cursor-not-allowed bg-card border-border' : ''}
                ${lang.available && !isSelected ? 'hover:border-primary hover:bg-card border-border bg-card' : ''}
                ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(124,58,237,0.3)]' : ''}
              `}
                        >
                            <div className="text-5xl mb-3">{lang.emoji}</div>
                            <div className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {lang.name}
                            </div>

                            {/* Badge */}
                            <div className={`absolute -top-3 px-3 py-1 text-[10px] uppercase tracking-wide font-bold rounded-full ${lang.available ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {lang.available ? 'Available' : 'Coming Soon'}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Continue Button ── */}
            <div className="w-full flex justify-end">
                <Button
                    onClick={nextStep}
                    disabled={!selectedLanguageId}
                    className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-lg rounded-xl"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}
