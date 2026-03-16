import { create } from 'zustand';
import { DiagnosticQuestion } from '@/types';

interface OnboardingState {
    currentStep: number;
    selectedLanguageId: string | null;
    selectedLanguageCode: string | null;
    goal: string | null;
    dailyGoalMinutes: number | null;
    selfReportedLevel: string | null;
    assessedLevel: string | null;
    levelScore: number | null;
    diagnosticAnswers: Record<string, number>; // questionId -> selectedOptionIndex
    
    // Vocab Import State
    estimatedLevel: string | null;
    highConfidence: boolean;
    importMethod: string | null;

    // Actions
    nextStep: () => void;
    prevStep: () => void;
    setLanguage: (id: string, code: string) => void;
    setGoal: (goal: string) => void;
    setDailyGoal: (minutes: number) => void;
    setSelfReportedLevel: (level: string) => void;
    setDiagnosticAnswer: (questionId: string, answerIndex: number) => void;
    setAssessmentResult: (level: string, score: number) => void;
    setVocabularyImportResult: (level: string | null, confidence: boolean, method: string) => void;
    resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    currentStep: 1,
    selectedLanguageId: null,
    selectedLanguageCode: null,
    goal: null,
    dailyGoalMinutes: null,
    selfReportedLevel: null,
    assessedLevel: null,
    levelScore: null,
    diagnosticAnswers: {},
    estimatedLevel: null,
    highConfidence: false,
    importMethod: null,

    nextStep: () => set((state) => ({ currentStep: Math.min(7, state.currentStep + 1) })),
    prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

    setLanguage: (id, code) => set({ selectedLanguageId: id, selectedLanguageCode: code }),
    setGoal: (goal) => set({ goal }),
    setDailyGoal: (minutes) => set({ dailyGoalMinutes: minutes }),
    setSelfReportedLevel: (level) => set({ selfReportedLevel: level }),

    setDiagnosticAnswer: (questionId, answerIndex) =>
        set((state) => ({
            diagnosticAnswers: {
                ...state.diagnosticAnswers,
                [questionId]: answerIndex
            }
        })),

    setAssessmentResult: (level, score) => set({ assessedLevel: level, levelScore: score }),
    setVocabularyImportResult: (level, confidence, method) => set({ estimatedLevel: level, highConfidence: confidence, importMethod: method }),

    resetOnboarding: () => set({
        currentStep: 1,
        selectedLanguageId: null,
        selectedLanguageCode: null,
        goal: null,
        dailyGoalMinutes: null,
        selfReportedLevel: null,
        assessedLevel: null,
        levelScore: null,
        diagnosticAnswers: {},
        estimatedLevel: null,
        highConfidence: false,
        importMethod: null,
    })
}));
