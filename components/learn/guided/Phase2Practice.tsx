import React, { useState } from 'react';
import { GuidedScenario } from '@/lib/data/guided_scenarios';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/lib/posthog';

interface PhaseProps {
    scenario: GuidedScenario;
    onComplete: () => void;
    onClose: () => void;
}

// A simple flashcard practice. User sees English -> guesses Spanish, then flips to check.
// They select "I knew it" or "Still learning".
// If "I knew it", it is removed from the active queue.

export default function Phase2Practice({ scenario, onComplete, onClose }: PhaseProps) {
    const [queue, setQueue] = useState(scenario.phrases);
    const [isFlipped, setIsFlipped] = useState(false);

    if (queue.length === 0) {
        trackEvent('guided_learning_phase_completed', {
            scenario_id: scenario.id,
            phase: 2,
            user_level: 'A1'
        });
        onComplete();
        return null;
    }

    const currentPhrase = queue[0];
    const progress = ((scenario.phrases.length - queue.length) / scenario.phrases.length) * 100;

    const handleAnswer = (knewIt: boolean) => {
        setIsFlipped(false);
        if (knewIt) {
            setQueue(prev => prev.slice(1));
        } else {
            // Move to back of the queue
            setQueue(prev => {
                const newQueue = [...prev];
                const failed = newQueue.shift()!;
                newQueue.push(failed);
                return newQueue;
            });
        }
    };

    return (
        <div className="flex flex-col h-full font-sans bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
                <button onClick={onClose} className="p-2 -ml-2 text-text-muted hover:text-text-primary">
                    <X className="w-5 h-5" />
                </button>
                <div className="flex-1 max-w-[200px] mx-4">
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-[#E8521A] transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E8521A]">
                    Phase 2
                </div>
            </div>

            <div className="text-center px-6 mt-4">
                <h3 className="text-xl font-display text-text-primary">Practice Flashcards</h3>
                <p className="text-text-secondary text-sm mt-1">Translate to Spanish</p>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 perspective-[1000px] relative">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentPhrase.id + (isFlipped ? '-back' : '-front')}
                        initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => !isFlipped && setIsFlipped(true)}
                        className={`w-full max-w-sm aspect-[4/5] rounded-[32px] cursor-pointer shadow-lg border flex flex-col items-center justify-center p-8 text-center bg-card
                            ${isFlipped ? 'border-[#E8521A]/30 bg-surface' : 'border-border hover:border-accent-border'}`}
                    >
                        {!isFlipped ? (
                            <>
                                <span className="text-[10px] uppercase font-mono tracking-widest text-text-muted mb-8">Tap to reveal</span>
                                <h2 className="text-3xl font-display text-text-primary">
                                    {currentPhrase.translation}
                                </h2>
                            </>
                        ) : (
                            <>
                                <h2 className="text-4xl font-display text-[#E8521A] mb-4">
                                    {currentPhrase.text}
                                </h2>
                                <p className="font-mono text-text-muted text-sm tracking-widest uppercase mb-8">
                                    {currentPhrase.phonetic}
                                </p>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Nav */}
            <div className="p-6 border-t border-[#1e1e1e] h-32 flex flex-col justify-center">
                {!isFlipped ? (
                    <button
                        onClick={() => setIsFlipped(true)}
                        className="w-full bg-surface border border-border text-text-primary font-mono text-[11px] uppercase tracking-widest font-bold h-14 rounded-full hover:bg-card transition-all"
                    >
                        Show Answer
                    </button>
                ) : (
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => handleAnswer(false)}
                            className="flex-1 bg-surface border border-border text-text-secondary hover:text-text-primary font-mono text-[11px] uppercase tracking-widest font-bold h-14 rounded-full transition-all"
                        >
                            Still Learning
                        </button>
                        <button
                            onClick={() => handleAnswer(true)}
                            className="flex-1 bg-[#E8521A] text-background hover:brightness-110 font-mono text-[11px] uppercase tracking-widest font-bold h-14 rounded-full shadow-[0_4px_20px_rgba(232,82,26,0.2)] flex items-center justify-center gap-2 transition-all"
                        >
                            <Check className="w-4 h-4" /> I knew it
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
