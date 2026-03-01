// ============================================================
// FluentLoop — Onboarding Main Page
// ============================================================

import { Metadata } from 'next';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';

export const metadata: Metadata = {
    title: 'Welcome | FluentLoop',
    description: 'Let\'s personalize your language learning journey.',
};

export default function OnboardingPage() {
    return <OnboardingFlow />;
}
