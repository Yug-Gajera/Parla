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
                toast.error(err instanceof Error ? err.message : 'Something went wrong');
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
                throw new Error(data.error || 'Failed to assess level');
            }

            const result = data.data as DiagnosticResult;
            setAssessmentResult(result.assessed_level, result.score);
            nextStep();

        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Analysis failed');
            setViewState('error');
        }
    };


    // ── Render States ──

    if (viewState === 'loading_questions') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full animation-fade-in relative pt-12">
                <button
                    onClick={prevStep}
                    className="absolute left-0 top-0 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
                >
                    <ArrowLeft size={24} />
                </button>
                <Loader2 size={48} className="animate-spin text-primary mb-6" />
                <h2 className="text-2xl font-semibold mb-2">Preparing your assessment...</h2>
                <p className="text-muted-foreground text-center max-w-sm">
                    Generating personalized questions for your {selfReportedLevel} level.
                </p>
            </div>
        );
    }

    if (viewState === 'analyzing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full animation-fade-in">
                <Loader2 size={48} className="animate-spin text-primary mb-6" />
                <h2 className="text-2xl font-semibold mb-2">Analyzing your results...</h2>
                <p className="text-muted-foreground text-center">
                    Grading your grammar, vocabulary, and comprehension.
                </p>
            </div>
        );
    }

    if (viewState === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full animation-fade-in pt-12 relative">
                <button
                    onClick={prevStep}
                    className="absolute left-0 top-0 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="p-4 bg-destructive/10 text-destructive rounded-full mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Connection Error</h2>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                    We couldn&apos;t reach the AI assessor. Please check your connection and try again.
                </p>
                <Button
                    onClick={() => setViewState('loading_questions')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-5"
                >
                    Retry Assessment
                </Button>
            </div>
        )
    }

    const q = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
        <div className="flex flex-col items-center w-full animation-fade-in relative pt-12">
            {/* ── Mini Progress ── */}
            <div className="w-full max-w-md mx-auto mb-8">
                <div className="flex justify-between items-center text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                    <span>Diagnostic Test</span>
                    <span>{currentIndex + 1} of {questions.length}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* ── Question ── */}
            <div className="w-full max-w-xl mx-auto mb-10 min-h-[120px] flex flex-col items-center justify-center text-center">
                {(q as any).emoji && (
                    <span className="text-4xl mb-3 block">{(q as any).emoji}</span>
                )}
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance leading-snug">
                    {q.question}
                </h1>
            </div>

            {/* ── Options ── */}
            <div className="flex flex-col gap-3 w-full max-w-xl mx-auto mb-6">
                {q.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectAnswer = idx === Number(q.correct_answer);

                    let buttonClass = 'hover:bg-secondary hover:border-primary/50 bg-card border-border';

                    if (selectedOption !== null) {
                        // State: Answer shown
                        if (isSelected && isCorrectAnswer) {
                            buttonClass = 'bg-green-500/10 border-green-500 text-green-500 font-semibold';
                        } else if (isSelected && !isCorrectAnswer) {
                            buttonClass = 'bg-destructive/10 border-destructive text-destructive opacity-70';
                        } else if (isCorrectAnswer) {
                            buttonClass = 'bg-green-500/10 border-green-500 text-green-500 font-semibold';
                        } else {
                            buttonClass = 'opacity-30 border-border bg-card';
                        }
                    }

                    const labels = ['A', 'B', 'C', 'D'];

                    return (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            disabled={selectedOption !== null}
                            className={`
                flex items-center gap-4 p-5 rounded-2xl border-2 transition-all w-full text-left text-lg
                ${buttonClass}
              `}
                        >
                            <div className={`
                flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                ${selectedOption !== null && (isSelected || isCorrectAnswer) ? 'bg-current text-background' : 'bg-secondary text-muted-foreground'}
              `}>
                                {labels[idx]}
                            </div>
                            <span className="flex-1">{opt}</span>
                        </button>
                    );
                })}
            </div>

        </div>
    );
}

// Fallback icon for error state
function AlertTriangle({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
    );
}
