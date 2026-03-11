'use client';

// ============================================================
// Parlova — Onboarding Step 5: Diagnostic Test
// ============================================================

import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { DiagnosticQuestion, DiagnosticResult } from '@/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

type ViewState = 'loading_questions' | 'testing' | 'analyzing' | 'error';

export default function StepDiagnostic() {
    const {
        selectedLanguageCode,
        selfReportedLevel,
        diagnosticAnswers,
        setDiagnosticAnswer,
        setAssessmentResult,
        nextStep,
        prevStep
    } = useOnboardingStore();

    const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewState, setViewState] = useState<ViewState>('loading_questions');

    // State for the currently displayed question showing its result
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Fetch questions on mount
    useEffect(() => {
        async function fetchQuestions() {
            try {
                setViewState('loading_questions');
                // Add artificial delay for UI smoothness
                await new Promise(resolve => setTimeout(resolve, 1500));

                const res = await fetch('/api/ai/diagnostic', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ selfReportedLevel, languageCode: selectedLanguageCode })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Failed to fetch questions');
                }

                setQuestions(data.data);
                setViewState('testing');
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'System Error');
                setViewState('error');
            }
        }

        fetchQuestions();
    }, [selfReportedLevel, selectedLanguageCode]);

    const handleAnswer = async (index: number) => {
        if (selectedOption !== null) return; // Prevent double clicking

        setSelectedOption(index);
        const currentQuestion = questions[currentIndex];
        setDiagnosticAnswer(currentQuestion.id, index);

        // Wait 1.5s to show correct/wrong state
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (currentIndex < questions.length - 1) {
            setSelectedOption(null);
            setCurrentIndex(prev => prev + 1);
        } else {
            // Finished all 10 questions -> Analyze
            submitForAssessment();
        }
    };

    const submitForAssessment = async () => {
        try {
            setViewState('analyzing');
            // Wait for UI to update State
            await new Promise(resolve => setTimeout(resolve, 1500));

            const updatedAnswers = useOnboardingStore.getState().diagnosticAnswers;

            const res = await fetch('/api/ai/diagnostic/assess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: updatedAnswers, questions })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Diagnostic evaluation failed');
            }

            const result = data.data as DiagnosticResult;
            setAssessmentResult(result.assessed_level, result.score);
            nextStep();

        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Process Terminated');
            setViewState('error');
        }
    };


    // ── Render States ──

    if (viewState === 'loading_questions') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in relative pt-12 font-sans">
                <button
                    onClick={prevStep}
                    className="absolute left-0 top-0 p-3 text-[#5a5652] hover:text-[#f0ece4] transition-colors rounded-full hover:bg-[#141414] border border-transparent hover:border-[#1e1e1e]"
                >
                    <ArrowLeft size={18} />
                </button>
                <Loader2 size={48} strokeWidth={1.5} className="animate-spin text-[#c9a84c] mb-8" />
                <h2 className="text-2xl font-serif text-[#f0ece4] mb-3">Initializing Diagnostic</h2>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a5652] text-center max-w-sm px-6 py-3 border border-[#1e1e1e] bg-[#0f0f0f] rounded-lg">
                    Generating vectors for constraint level {selfReportedLevel}
                </p>
            </div>
        );
    }

    if (viewState === 'analyzing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in font-sans">
                <Loader2 size={48} strokeWidth={1.5} className="animate-spin text-[#c9a84c] mb-8" />
                <h2 className="text-2xl font-serif text-[#f0ece4] mb-3">Synthesizing Results</h2>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a5652] text-center px-6 py-3 border border-[#1e1e1e] bg-[#0f0f0f] rounded-lg">
                    Grading lexicon syntax and semantics
                </p>
            </div>
        );
    }

    if (viewState === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in pt-12 relative font-sans">
                <button
                    onClick={prevStep}
                    className="absolute left-0 top-0 p-3 text-[#5a5652] hover:text-[#f0ece4] transition-colors rounded-full hover:bg-[#141414] border border-transparent hover:border-[#1e1e1e]"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="p-5 border border-red-500/20 bg-red-500/5 text-red-400 rounded-full mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-serif text-[#f0ece4] mb-3">Diagnostic Interrupted</h2>
                <p className="text-[11px] font-sans text-[#9a9590] text-center max-w-sm mb-10 leading-relaxed">
                    Connection to primary assessor failed. Please verify neural uplink.
                </p>
                <Button
                    onClick={() => setViewState('loading_questions')}
                    className="bg-[#c9a84c] hover:bg-[#b98e72] text-[#080808] font-mono text-[10px] uppercase tracking-widest font-bold px-10 h-14 rounded-full shadow-[0_4px_20px_rgba(201,168,76,0.15)] transition-all"
                >
                    Reinitialize
                </Button>
            </div>
        )
    }

    const q = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
        <div className="flex flex-col items-center w-full animation-fade-in relative pt-12 pb-16 font-sans">
            {/* ── Mini Progress ── */}
            <div className="w-full max-w-xl mx-auto mb-16 px-4">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold mb-3 text-[#5a5652] uppercase tracking-[0.2em]">
                    <span>Diagnostic Scan</span>
                    <span>{currentIndex + 1} <span className="text-[#2a2a2a] px-1">/</span> {questions.length}</span>
                </div>
                <div className="h-1.5 w-full bg-[#1e1e1e] rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-[#8b7538] to-[#c9a84c] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* ── Question ── */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                >
                    <div className="w-full max-w-2xl mx-auto mb-12 min-h-[120px] flex flex-col items-center justify-center text-center px-4">
                        {(q as any).emoji && (
                            <span className="text-4xl mb-6 block">{(q as any).emoji}</span>
                        )}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#f0ece4] tracking-tight text-balance leading-snug drop-shadow-sm">
                            {q.question}
                        </h1>
                    </div>

                    {/* ── Options ── */}
                    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto px-4">
                        {q.options.map((opt, idx) => {
                            const isSelected = selectedOption === idx;
                            const isCorrectAnswer = idx === Number(q.correct_answer);

                            let buttonClass = 'hover:bg-[#141414] hover:border-[#2a2a2a] bg-[#0f0f0f] border-[#1e1e1e] text-[#f0ece4]';
                            let badgeClass = 'bg-[#141414] border-[#2a2a2a] text-[#5a5652]';

                            if (selectedOption !== null) {
                                // State: Answer shown
                                if (isSelected && isCorrectAnswer) {
                                    buttonClass = 'bg-[#c9a84c]/5 border-[#c9a84c]/50 text-[#c9a84c] shadow-[0_0_15px_rgba(201,168,76,0.1)]';
                                    badgeClass = 'bg-[#c9a84c] border-[#c9a84c] text-[#080808]';
                                } else if (isSelected && !isCorrectAnswer) {
                                    buttonClass = 'bg-red-500/5 border-red-500/30 text-red-500';
                                    badgeClass = 'bg-red-500/20 border-red-500/30 text-red-400';
                                } else if (isCorrectAnswer) {
                                    buttonClass = 'bg-[#c9a84c]/5 border-[#c9a84c]/50 text-[#c9a84c]';
                                    badgeClass = 'bg-[#c9a84c] border-[#c9a84c] text-[#080808]';
                                } else {
                                    buttonClass = 'opacity-30 border-[#1e1e1e] bg-[#080808] text-[#5a5652]';
                                }
                            }

                            const labels = ['A', 'B', 'C', 'D'];

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={selectedOption !== null}
                                    className={`
                                        flex items-center gap-5 p-5 sm:p-6 rounded-2xl border transition-all duration-300 w-full text-left font-sans
                                        ${buttonClass}
                                    `}
                                >
                                    <div className={`
                                        flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center font-mono font-bold text-[10px] transition-all duration-300
                                        ${badgeClass}
                                    `}>
                                        {labels[idx]}
                                    </div>
                                    <span className="flex-1 text-base sm:text-lg">{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

        </div>
    );
}

// Fallback icon for error state
function AlertTriangle({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
    );
}
