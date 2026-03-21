'use client';

// ============================================================
// Parlova — Onboarding Step 6: Diagnostic Test
// ============================================================

import React, { useEffect, useState, useRef } from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { DiagnosticQuestion, DiagnosticResult } from '@/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

type ViewState = 'confirm_level' | 'loading_questions' | 'testing' | 'analyzing' | 'error';

export default function StepDiagnostic() {
    const {
        selectedLanguageCode,
        selfReportedLevel,
        estimatedLevel,
        highConfidence,
        diagnosticAnswers,
        setDiagnosticAnswer,
        setAssessmentResult,
        nextStep,
        prevStep
    } = useOnboardingStore();

    const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // If estimatedLevel exists from Vocab Import, we pause to confirm. Otherwise we load immediately.
    const [viewState, setViewState] = useState<ViewState>(
        estimatedLevel ? 'confirm_level' : 'loading_questions'
    );
    
    const [targetLevel, setTargetLevel] = useState<string>(estimatedLevel || selfReportedLevel || 'A1');
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Track if we already started fetching so we don't double fetch in strict mode
    const fetchStarted = useRef(false);

    useEffect(() => {
        if (viewState === 'loading_questions' && !fetchStarted.current) {
            fetchStarted.current = true;
            fetchQuestions();
        }
    }, [viewState]);

    async function fetchQuestions() {
        try {
            // Add artificial delay for UI smoothness
            await new Promise(resolve => setTimeout(resolve, 1500));

            const questionCount = highConfidence ? 6 : 10;

            const res = await fetch('/api/ai/diagnostic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    selfReportedLevel: targetLevel, 
                    languageCode: selectedLanguageCode,
                    questionCount
                })
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
            // Finished all questions -> Analyze
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

    if (viewState === 'confirm_level') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in relative pt-12 font-sans px-4 text-center">
                <button
                    onClick={prevStep}
                    className="absolute left-0 top-0 p-3 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted border border-transparent hover:border-border"
                >
                    <ArrowLeft size={18} />
                </button>
                <h2 className="text-3xl font-serif text-foreground mb-4">Let's find your level.</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                    Based on your words, we are starting your test at <strong>{estimatedLevel}</strong>. 
                    <br/><br/>Change this if it feels wrong.
                </p>
                <div className="mb-10">
                    <select 
                        value={targetLevel} 
                        onChange={(e) => setTargetLevel(e.target.value)}
                        className="bg-card border border-border text-text-primary text-lg rounded-xl p-3 outline-none focus:border-accent-border transition-colors cursor-pointer"
                    >
                        <option value="A1">A1 - Beginner</option>
                        <option value="A2">A2 - Elementary</option>
                        <option value="B1">B1 - Intermediate</option>
                        <option value="B2">B2 - Upper Intermediate</option>
                        <option value="C1">C1 - Advanced</option>
                        <option value="C2">C2 - Mastery</option>
                    </select>
                </div>
                <Button
                    onClick={() => setViewState('loading_questions')}
                    className="btn-action px-10 h-14"
                >
                    Start {highConfidence && '(Shortened)'}
                </Button>
            </div>
        );
    }

    if (viewState === 'loading_questions') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in relative pt-12 font-sans px-4">
                <button
                    onClick={estimatedLevel ? () => { fetchStarted.current = false; setViewState('confirm_level'); } : prevStep}
                    className="absolute left-0 top-0 p-3 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted border border-transparent hover:border-border"
                >
                    <ArrowLeft size={18} />
                </button>
                <Loader2 size={48} strokeWidth={1.5} className="animate-spin text-accent mb-8" />
                <h2 className="text-2xl font-serif text-text-primary mb-3">Getting things ready for you...</h2>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted text-center max-w-sm px-6 py-3 border border-border bg-card rounded-[18px] shadow-sm">
                    Loading questions...
                </p>
            </div>
        );
    }

    if (viewState === 'analyzing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in font-sans px-4">
                <Loader2 size={48} strokeWidth={1.5} className="animate-spin text-accent mb-8" />
                <h2 className="text-2xl font-serif text-text-primary mb-3">Checking your answers...</h2>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted text-center px-6 py-3 border border-border bg-card rounded-[18px] shadow-sm">
                    Almost done...
                </p>
            </div>
        );
    }

    if (viewState === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in pt-12 relative font-sans px-4">
                <button
                    onClick={prevStep}
                    className="absolute left-0 top-0 p-3 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted border border-transparent hover:border-border"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="p-5 border border-red-500/20 bg-red-500/5 text-red-400 rounded-full mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-serif text-foreground mb-3">Something went wrong.</h2>
                <p className="text-[11px] font-sans text-muted-foreground text-center max-w-sm mb-10 leading-relaxed">
                    Check your connection and try again.
                </p>
                <Button
                    onClick={() => { fetchStarted.current = false; setViewState('loading_questions'); }}
                    className="btn-action px-10 h-14"
                >
                    Try Again
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
                <div className="flex justify-between items-center text-[10px] font-mono font-bold mb-3 text-text-muted uppercase tracking-[0.2em]">
                    <span>Test</span>
                    <span>{currentIndex + 1} <span className="text-border-strong px-1">/</span> {questions.length}</span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden shadow-sm">
                    <div
                        className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
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
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-foreground tracking-tight text-balance leading-snug drop-shadow-sm">
                            {q.question}
                        </h1>
                    </div>

                    {/* ── Options ── */}
                    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto px-4">
                        {q.options.map((opt, idx) => {
                            const isSelected = selectedOption === idx;
                            const isCorrectAnswer = idx === Number(q.correct_answer);

                            let buttonClass = 'hover:bg-muted hover:border-border-strong bg-card border-border text-foreground';
                            let badgeClass = 'bg-muted border-border-strong text-muted-foreground';

                            if (selectedOption !== null) {
                                // State: Answer shown
                                if (isSelected && isCorrectAnswer) {
                                    buttonClass = 'bg-primary/5 border-primary/50 text-primary shadow-sm';
                                    badgeClass = 'bg-primary border-primary text-primary-foreground';
                                } else if (isSelected && !isCorrectAnswer) {
                                    buttonClass = 'bg-red-500/5 border-red-500/30 text-red-500';
                                    badgeClass = 'bg-red-500/20 border-red-500/30 text-red-400';
                                } else if (isCorrectAnswer) {
                                    buttonClass = 'bg-primary/5 border-primary/50 text-primary';
                                    badgeClass = 'bg-primary border-primary text-primary-foreground';
                                } else {
                                    buttonClass = 'opacity-30 border-border bg-background text-muted-foreground';
                                }
                            }

                            const labels = ['A', 'B', 'C', 'D'];

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={selectedOption !== null}
                                    className={`
                                        flex items-center gap-5 p-5 sm:p-6 rounded-[18px] border transition-all duration-300 w-full text-left font-sans
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
