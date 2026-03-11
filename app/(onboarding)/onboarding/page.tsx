export const dynamic = "force-dynamic";
// ============================================================
// Parlova — Onboarding Main Page
// ============================================================

import { Metadata } from 'next';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { WavingFigure, DoodleSpeechBubble } from '@/components/illustrations';

export const metadata: Metadata = {
    title: 'Welcome | Parlova',
    description: 'Let\'s personalize your language learning journey.',
};

export default function OnboardingPage() {
    return (
        <div className="w-full flex flex-col items-center">
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }} className="mb-4">
                <div style={{ display: "none" }} className="md:block">
                     <WavingFigure />
                     <div style={{ position: "absolute", top: "20px", right: "-10px" }}>
                         <DoodleSpeechBubble text="¡Hola!" />
                     </div>
                </div>
            </div>
            <OnboardingFlow />
        </div>
    );
}
