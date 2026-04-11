"use client";

// ============================================================
// Parlova — Onboarding Tour Component
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface OnboardingTourProps {
    onComplete: () => void;
    onDismiss: () => void;
}

type TourStep = 'welcome' | 'level' | 'vocabulary' | 'conversation';

const TOUR_STEPS: TourStep[] = ['welcome', 'level', 'vocabulary', 'conversation'];

const STEP_CONTENT: Record<TourStep, { title: string; description: string; position?: 'top' | 'bottom' | 'left' | 'right' }> = {
    welcome: {
        title: 'Welcome to Parlova 👋',
        description: "Let's show you around in 30 seconds.",
    },
    level: {
        title: 'Your Current Level',
        description: 'This is your current level — Parlova uses this to personalize every conversation for you.',
        position: 'bottom',
    },
    vocabulary: {
        title: 'Your Vocabulary',
        description: 'Import your own words here and practice them in real conversations.',
        position: 'bottom',
    },
    conversation: {
        title: 'Start Practicing',
        description: "This is your main move. Tap here anytime you're ready to practice Spanish.",
        position: 'bottom',
    },
};

export default function OnboardingTour({ onComplete, onDismiss }: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState<TourStep>('welcome');
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const currentStepIndex = TOUR_STEPS.indexOf(currentStep);

    const getTargetElement = useCallback((step: TourStep): HTMLElement | null => {
        if (step === 'welcome') return null;
        if (step === 'level') return document.querySelector('[data-tour="level-indicator"]') as HTMLElement;
        if (step === 'vocabulary') return document.querySelector('[data-tour="vocabulary-section"]') as HTMLElement;
        if (step === 'conversation') return document.querySelector('[data-tour="start-conversation"]') as HTMLElement;
        return null;
    }, []);

    const calculatePosition = useCallback(() => {
        if (currentStep === 'welcome') return;

        const target = getTargetElement(currentStep);
        if (!target) return;

        const rect = target.getBoundingClientRect();
        setHighlightRect(rect);

        const tooltipWidth = 320;
        const tooltipHeight = 160;
        const gap = 12;

        let top = 0;
        let left = 0;
        const position = STEP_CONTENT[currentStep].position || 'bottom';

        switch (position) {
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'top':
                top = rect.top - tooltipHeight - gap;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.left - tooltipWidth - gap;
                break;
            case 'right':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.right + gap;
                break;
        }

        // Keep tooltip within viewport
        const padding = 16;
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

        setTooltipPosition({ top, left });
    }, [currentStep, getTargetElement]);

    useEffect(() => {
        calculatePosition();

        const handleResize = () => calculatePosition();
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize, true);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
        };
    }, [calculatePosition]);

    const goToNextStep = useCallback(() => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < TOUR_STEPS.length) {
            setCurrentStep(TOUR_STEPS[nextIndex]);
        } else {
            onComplete();
        }
    }, [currentStepIndex, onComplete]);

    const handleDismiss = useCallback(() => {
        onDismiss();
    }, [onDismiss]);

    const renderProgressDots = () => (
        <div className="flex items-center justify-center gap-2 mt-6">
            {TOUR_STEPS.map((step, index) => (
                <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentStepIndex
                            ? 'bg-[#E8521A] w-6'
                            : index < currentStepIndex
                            ? 'bg-[#E8521A]/50'
                            : 'bg-[#E8521A]/20'
                    }`}
                />
            ))}
        </div>
    );

    // Welcome Modal
    if (currentStep === 'welcome') {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="relative bg-card border border-border rounded-3xl shadow-2xl p-10 max-w-md w-[90%] mx-4"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface transition-colors text-text-muted hover:text-text-primary"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Content */}
                        <div className="text-center">
                            <h2 className="font-serif text-3xl text-text-primary mb-3">
                                {STEP_CONTENT.welcome.title}
                            </h2>
                            <p className="text-text-secondary text-base mb-8 leading-relaxed">
                                {STEP_CONTENT.welcome.description}
                            </p>

                            {/* CTA Button */}
                            <button
                                onClick={goToNextStep}
                                className="w-full bg-[#E8521A] hover:bg-[#D94A15] text-white font-mono text-sm uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-[#E8521A]/20 hover:shadow-[#E8521A]/30"
                            >
                                Show me around
                            </button>
                        </div>

                        {renderProgressDots()}
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Tooltips for anchored elements
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100]"
            >
                {/* Backdrop with highlight cutout */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm">
                    {highlightRect && (
                        <div
                            className="absolute rounded-xl"
                            style={{
                                top: highlightRect.top - 4,
                                left: highlightRect.left - 4,
                                width: highlightRect.width + 8,
                                height: highlightRect.height + 8,
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                border: '2px solid #E8521A',
                            }}
                        />
                    )}
                </div>

                {/* Tooltip */}
                {highlightRect && (
                    <motion.div
                        ref={tooltipRef}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="absolute bg-card border border-border rounded-2xl shadow-2xl p-6 w-80"
                        style={{
                            top: tooltipPosition.top,
                            left: tooltipPosition.left,
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-surface transition-colors text-text-muted hover:text-text-primary"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Content */}
                        <h3 className="font-serif text-xl text-text-primary mb-2 pr-6">
                            {STEP_CONTENT[currentStep].title}
                        </h3>
                        <p className="text-text-secondary text-sm leading-relaxed mb-5">
                            {STEP_CONTENT[currentStep].description}
                        </p>

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setCurrentStep(TOUR_STEPS[currentStepIndex - 1])}
                                disabled={currentStepIndex === 0}
                                className="text-text-muted hover:text-text-primary text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={goToNextStep}
                                className="bg-[#E8521A] hover:bg-[#D94A15] text-white font-mono text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all"
                            >
                                {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                            </button>
                        </div>

                        {renderProgressDots()}
                    </motion.div>
                )}

                {/* Pulse animation on conversation button */}
                {currentStep === 'conversation' && highlightRect && (
                    <motion.div
                        className="absolute rounded-xl pointer-events-none"
                        style={{
                            top: highlightRect.top - 4,
                            left: highlightRect.left - 4,
                            width: highlightRect.width + 8,
                            height: highlightRect.height + 8,
                        }}
                        animate={{
                            boxShadow: [
                                '0 0 0 0 rgba(232, 82, 26, 0.4)',
                                '0 0 0 20px rgba(232, 82, 26, 0)',
                            ],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                        }}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
}