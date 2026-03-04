"use client";

import React, { useState } from 'react';
import { PhraseSet, PhraseItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PhraseBuilderProps {
    phraseSet: PhraseSet;
    onComplete: (learned: number, learnedPhrases: PhraseItem[]) => void;
}

const categoryColors: Record<string, string> = {
    greeting: 'bg-emerald-500/10 text-emerald-500',
    ordering: 'bg-primary/10 text-primary',
    asking: 'bg-blue-500/10 text-blue-500',
    responding: 'bg-amber-500/10 text-amber-500',
    closing: 'bg-pink-500/10 text-pink-500',
};

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
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-1">10 phrases you need</h2>
                <p className="text-sm text-muted-foreground">
                    Tap each phrase to study it, then tap again to mark as learned
                </p>
            </div>

            {/* Progress counter */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-primary">{learnedCount}</span>
                    <span className="text-sm text-muted-foreground">/ 10 learned</span>
                </div>
                <div className="h-2 flex-1 max-w-[200px] ml-4 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: `${(learnedCount / 10) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                </div>
            </div>

            {/* Phrase cards */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-24">
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
                                className="cursor-pointer"
                                style={{
                                    transformStyle: 'preserve-3d',
                                    transition: 'transform 0.4s ease',
                                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                }}
                            >
                                {/* Front */}
                                <Card
                                    className={`p-5 transition-all border-l-4 ${isLearned
                                        ? 'border-l-emerald-500 bg-emerald-500/5'
                                        : 'border-l-primary bg-card'
                                        }`}
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        display: isFlipped ? 'none' : 'block',
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="text-lg font-bold text-foreground">{phrase.spanish}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${categoryColors[phrase.category] || 'bg-secondary text-muted-foreground'}`}>
                                                {phrase.category}
                                            </span>
                                            {isLearned && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                        </div>
                                    </div>
                                    <p className="text-sm text-amber-500 font-medium mb-1">{phrase.phonetic}</p>
                                    <p className="text-sm text-muted-foreground mb-2">{phrase.english}</p>
                                    <div className="bg-secondary/50 rounded-lg px-3 py-2">
                                        <p className="text-xs text-muted-foreground">{phrase.usage}</p>
                                    </div>
                                </Card>

                                {/* Back (immersion) */}
                                <Card
                                    className="p-8 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 flex flex-col items-center justify-center text-center min-h-[120px]"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                        display: isFlipped ? 'flex' : 'none',
                                    }}
                                >
                                    <p className="text-2xl font-bold text-foreground mb-3">{phrase.spanish}</p>
                                    <p className="text-lg text-amber-500 font-medium">{phrase.phonetic}</p>
                                    <p className="text-xs text-muted-foreground mt-3">Tap again to mark as learned</p>
                                </Card>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Tip + Continue */}
            <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-background via-background to-transparent">
                {!canContinue && (
                    <p className="text-xs text-center text-muted-foreground mb-3">
                        You don&apos;t need to memorize these perfectly — just get familiar with them
                    </p>
                )}
                <Button
                    onClick={() => {
                        const learnedPhrases = phraseSet.phrases.filter(p => learned.has(p.id));
                        onComplete(learnedCount, learnedPhrases);
                    }}
                    disabled={!canContinue}
                    className={`w-full h-12 text-base font-bold rounded-xl transition-all ${canContinue ? 'bg-primary shadow-lg shadow-primary/25' : 'opacity-50'
                        }`}
                >
                    Continue to Challenge <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
            </div>
        </div>
    );
}
