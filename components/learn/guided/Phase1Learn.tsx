import React, { useState, useEffect, useRef } from 'react';
import { GuidedScenario } from '@/lib/data/guided_scenarios';
import { X, Volume2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/lib/posthog';
import { speakSpanish } from '@/lib/webSpeech';

interface PhaseProps {
    scenario: GuidedScenario;
    onComplete: () => void;
    onClose: () => void;
}

export default function Phase1Learn({ scenario, onComplete, onClose }: PhaseProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const phrases = scenario.phrases;

    // We don't have real audio files for these dummy phrases yet,
    // so we'll use a mocked TTS synthesis for demonstration.
    const speakPhrase = (text: string) => {
        speakSpanish(text, 0.7);
    };

    useEffect(() => {
        // Auto-play TTS when phrase changes
        speakPhrase(phrases[currentIndex].text);
    }, [currentIndex, phrases]);

    const handleNext = () => {
        if (currentIndex < phrases.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            trackEvent('guided_learning_phase_completed', {
                scenario_id: scenario.id,
                phase: 1,
                user_level: 'A1'
            });
            onComplete();
        }
    };

    const progress = ((currentIndex + 1) / phrases.length) * 100;

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
                    Phase 1
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center px-6 pb-20 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full"
                    >
                        <button 
                            onClick={() => speakPhrase(phrases[currentIndex].text)}
                            className="w-16 h-16 mx-auto bg-surface border border-border rounded-full flex items-center justify-center text-[#E8521A] hover:bg-[#E8521A] hover:text-background transition-colors mb-12 shadow-sm"
                        >
                            <Volume2 className="w-8 h-8" />
                        </button>

                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-display text-text-primary px-4">
                                {phrases[currentIndex].text}
                            </h2>
                            <p className="font-mono text-text-muted text-sm tracking-widest uppercase">
                                {phrases[currentIndex].phonetic}
                            </p>
                            <p className="text-lg text-text-secondary">
                                {phrases[currentIndex].translation}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Nav */}
            <div className="p-6 border-t border-[#1e1e1e]">
                <button
                    onClick={handleNext}
                    className="w-full bg-[#E8521A] text-background hover:brightness-110 font-mono text-[11px] uppercase tracking-widest font-bold h-14 rounded-full shadow-[0_4px_20px_rgba(232,82,26,0.2)] flex items-center justify-center gap-2 transition-all"
                >
                    {currentIndex < phrases.length - 1 ? 'Next Phrase' : 'Start Practice'}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
