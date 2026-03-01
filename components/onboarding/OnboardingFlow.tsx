'use client';

// ============================================================
// FluentLoop — Onboarding Flow Container
// ============================================================

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnboardingStore } from '@/store/onboarding';

import StepLanguage from '@/components/onboarding/StepLanguage';
import StepGoal from '@/components/onboarding/StepGoal';
import StepTime from '@/components/onboarding/StepTime';
import StepLevel from '@/components/onboarding/StepLevel';
import StepDiagnostic from '@/components/onboarding/StepDiagnostic';
import StepResult from '@/components/onboarding/StepResult';

export default function OnboardingFlow() {
    const currentStep = useOnboardingStore((state) => state.currentStep);

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <StepLanguage key="step1" />;
            case 2:
                return <StepGoal key="step2" />;
            case 3:
                return <StepTime key="step3" />;
            case 4:
                return <StepLevel key="step4" />;
            case 5:
                return <StepDiagnostic key="step5" />;
            case 6:
                return <StepResult key="step6" />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full flex justify-center mt-12">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="w-full max-w-[800px]"
                >
                    {renderStep()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
