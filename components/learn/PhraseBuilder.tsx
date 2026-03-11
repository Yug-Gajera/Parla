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
                <h2 className="text-3xl font-serif text-[#f0ece4] mb-2 tracking-tight">Core Lexicon</h2>
                <p className="text-sm font-mono text-[#5a5652] uppercase tracking-[0.1em]">
                    Phase 2 &nbsp;&bull;&nbsp; Tap to isolate. Tap again to assimilate.
                </p>
            </div>

            {/* Progress counter */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 bg-[#141414] border border-[#1e1e1e] p-5 rounded-2xl shadow-inner">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 bg-[#080808] border border-[#2a2a2a] rounded-full flex items-center justify-center shadow-inner">
                        <span className="text-xl font-mono text-[#c9a84c]">{learnedCount}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#5a5652]">/ 10 Acquired</span>
                </div>
                <div className="h-1.5 flex-1 max-w-full sm:max-w-xs w-full bg-[#080808] border border-[#1e1e1e] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#8b7538] to-[#c9a84c] rounded-full shadow-[0_0_10px_rgba(201,168,76,0.6)]"
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
                                    className={`p-6 transition-all duration-300 rounded-2xl ${isLearned
                                        ? 'border-[#c9a84c]/30 bg-[#c9a84c]/5 shadow-[0_0_20px_rgba(201,168,76,0.05)]'
                                        : 'border-[#1e1e1e] bg-[#141414] hover:border-[#2a2a2a] hover:bg-[#171717]'
                                        }`}
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        display: isFlipped ? 'none' : 'block',
                                    }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                                        <p className={`text-xl font-serif leading-tight ${isLearned ? 'text-[#c9a84c]' : 'text-[#f0ece4]'}`}>{phrase.spanish}</p>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="px-3 py-1 rounded bg-[#080808] border border-[#2a2a2a] text-[9px] font-mono tracking-widest uppercase text-[#5a5652]">
                                                {phrase.category}
                                            </span>
                                            {isLearned ? (
                                                <CheckCircle2 className="w-5 h-5 text-[#c9a84c]" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border border-[#2a2a2a] group-hover:bg-[#1e1e1e]" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mb-4">
                                        <p className="text-sm text-[#c9a84c] font-mono opacity-80">{phrase.phonetic}</p>
                                        <p className="text-sm text-[#9a9590]">{phrase.english}</p>
                                    </div>
                                    <div className="bg-[#080808] border border-[#1e1e1e] rounded-xl px-4 py-3">
                                        <p className="text-xs font-sans text-[#5a5652] leading-relaxed"><span className="font-bold text-[#9a9590] uppercase text-[9px] tracking-widest mr-2">Context</span> {phrase.usage}</p>
                                    </div>
                                </Card>

                                {/* Back (immersion) */}
                                <Card
                                    className="p-10 border-[#c9a84c]/40 bg-[#141414] rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[0_0_40px_rgba(201,168,76,0.1)]"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateX(180deg)',
                                        display: isFlipped ? 'flex' : 'none',
                                    }}
                                >
                                    <div className="absolute inset-0 bg-[#c9a84c]/5" />
                                    <div className="relative z-10 w-full flex flex-col items-center">
                                        <p className="text-3xl font-serif text-[#c9a84c] mb-4">{phrase.spanish}</p>
                                        <p className="text-lg text-[#f0ece4] font-mono mb-8 opacity-80">{phrase.phonetic}</p>
                                        <Button className="rounded-full bg-[#c9a84c] text-[#080808] hover:bg-[#b98e72] font-mono text-[10px] uppercase font-bold tracking-widest px-8">
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
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#080808] via-[#080808]/90 to-transparent">
                <div className="max-w-4xl mx-auto flex flex-col items-center">
                    {!canContinue && (
                        <p className="text-[10px] font-mono uppercase tracking-widest text-center text-[#5a5652] mb-4">
                            Acquire minimum 8 phrases to proceed
                        </p>
                    )}
                    <Button
                        onClick={() => {
                            const learnedPhrases = phraseSet.phrases.filter(p => learned.has(p.id));
                            onComplete(learnedCount, learnedPhrases);
                        }}
                        disabled={!canContinue}
                        className={`w-full max-w-md h-14 text-[10px] font-mono tracking-widest uppercase font-bold rounded-full transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.8)] ${
                            canContinue 
                            ? 'bg-[#c9a84c] text-[#080808] hover:bg-[#b98e72] shadow-[0_4px_20px_rgba(201,168,76,0.2)]' 
                            : 'bg-[#141414] text-[#5a5652] border border-[#1e1e1e] cursor-not-allowed'
                            }`}
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
