"use client";

import React, { useState } from 'react';
import { PhraseSet, PhraseItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PhraseBuilderProps {
    phraseSet: PhraseSet;
    onComplete: (learned: number, learnedPhrases: PhraseItem[]) => void;
}

export default function PhraseBuilder({ phraseSet, onComplete }: PhraseBuilderProps) {
    const [learned, setLearned] = useState<Set<number>>(new Set());
    const [flipped, setFlipped] = useState<number | null>(null);

    const handleTap = (phrase: PhraseItem) => {
        if (flipped === phrase.id) {
            // Second tap — mark as learned and unflip
            setLearned(prev => new Set(prev).add(phrase.id));
            setFlipped(null);
        } else {
            // First tap — flip to immersion side
            setFlipped(phrase.id);
        }
    };

    const learnedCount = learned.size;
    const canContinue = learnedCount >= 8;

    return (
        <div className="flex flex-col h-full font-sans max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6">
            {/* Header */}
            <div className="mb-8 text-center sm:text-left">
                <h2 className="text-3xl font-serif text-text-primary mb-2 tracking-tight">Core Lexicon</h2>
                <p className="text-sm font-mono-num text-text-muted uppercase tracking-[0.1em]">
                    Phase 2 &nbsp;&bull;&nbsp; Tap to isolate. Tap again to assimilate.
                </p>
            </div>

            {/* Progress counter */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 bg-card border border-border p-5 rounded-[18px] shadow-sm">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 bg-background border border-border-strong rounded-full flex items-center justify-center shadow-inner">
                        <span className="text-xl font-mono-num text-[#E8521A]">{learnedCount}</span>
                    </div>
                    <span className="text-[10px] font-mono-num uppercase tracking-widest text-text-muted">/ 10 Acquired</span>
                </div>
                <div className="h-1.5 flex-1 max-w-full sm:max-w-xs w-full bg-background border border-border rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#E8521A]/50 to-[#E8521A] rounded-full shadow-[0_0_10px_rgba(232,82,26,0.2)]"
                        animate={{ width: `${(learnedCount / 10) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                </div>
            </div>

            {/* Phrase cards */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-32 custom-scrollbar pr-2">
                {phraseSet.phrases.map((phrase, i) => {
                    const isLearned = learned.has(phrase.id);
                    const isFlipped = flipped === phrase.id;

                    return (
                        <motion.div
                            key={phrase.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            style={{ perspective: 1000 }}
                        >
                            <div
                                onClick={() => handleTap(phrase)}
                                className="cursor-pointer group"
                                style={{
                                    transformStyle: 'preserve-3d',
                                    transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                    transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                                }}
                            >
                                {/* Front */}
                                <Card
                                    className={`p-6 transition-all duration-300 rounded-[18px] ${isLearned
                                        ? 'border-accent-border bg-[#E8521A]/5 shadow-sm'
                                        : 'border-border bg-card hover:border-accent-border hover:bg-surface'
                                        }`}
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        display: isFlipped ? 'none' : 'block',
                                    }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                                        <p className={`text-xl font-serif leading-tight ${isLearned ? 'text-[#E8521A]' : 'text-text-primary'}`}>{phrase.spanish}</p>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="px-3 py-1 rounded bg-background border border-border-strong text-[9px] font-mono-num tracking-widest uppercase text-text-muted">
                                                {phrase.category}
                                            </span>
                                            {isLearned ? (
                                                <CheckCircle2 className="w-5 h-5 text-[#E8521A]" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border border-border-strong group-hover:bg-border" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mb-4">
                                        <p className="text-sm text-[#E8521A] font-mono-num opacity-80">{phrase.phonetic}</p>
                                        <p className="text-sm text-text-secondary">{phrase.english}</p>
                                    </div>
                                    <div className="bg-background border border-border rounded-xl px-4 py-3">
                                        <p className="text-xs font-sans text-text-muted leading-relaxed"><span className="font-bold text-text-secondary uppercase text-[9px] tracking-widest mr-2">Context</span> {phrase.usage}</p>
                                    </div>
                                </Card>

                                {/* Back (immersion) */}
                                <Card
                                    className="p-10 border-accent-border bg-card rounded-[18px] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateX(180deg)',
                                        display: isFlipped ? 'flex' : 'none',
                                    }}
                                >
                                    <div className="absolute inset-0 bg-[#E8521A]/5" />
                                    <div className="relative z-10 w-full flex flex-col items-center">
                                        <p className="text-3xl font-serif text-[#E8521A] mb-4">{phrase.spanish}</p>
                                        <p className="text-lg text-text-primary font-mono-num mb-8 opacity-80">{phrase.phonetic}</p>
                                        <Button className="btn-action px-8">
                                            Assimilate
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Tip + Continue */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
                <div className="max-w-4xl mx-auto flex flex-col items-center">
                    {!canContinue && (
                        <p className="text-[10px] font-mono-num uppercase tracking-widest text-center text-text-muted mb-4">
                            Acquire minimum 8 phrases to proceed
                        </p>
                    )}
                    <Button
                        onClick={() => {
                            const learnedPhrases = phraseSet.phrases.filter(p => learned.has(p.id));
                            onComplete(learnedCount, learnedPhrases);
                        }}
                        disabled={!canContinue}
                        className={`w-full max-md h-14 ${canContinue ? 'btn-action' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
                    >
                        {canContinue ? (
                            <>Proceed to Verification <ChevronRight className="w-4 h-4 ml-2" /></>
                        ) : (
                            <><Lock className="w-4 h-4 mr-2" /> System Locked</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
