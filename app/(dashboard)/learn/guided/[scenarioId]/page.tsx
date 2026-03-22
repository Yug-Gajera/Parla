"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GUIDED_SCENARIOS, GuidedScenario } from '@/lib/data/guided_scenarios';
import Phase1Learn from '@/components/learn/guided/Phase1Learn';
import Phase2Practice from '@/components/learn/guided/Phase2Practice';
import Phase3Speak from '@/components/learn/guided/Phase3Speak';
import ScenarioComplete from '@/components/learn/guided/ScenarioComplete';
import { trackEvent } from '@/lib/posthog';

type Phase = 'learn' | 'practice' | 'speak' | 'complete';

export default function GuidedScenarioPage({ params }: { params: { scenarioId: string } }) {
    const router = useRouter();
    const [scenario, setScenario] = useState<GuidedScenario | null>(null);
    const [currentPhase, setCurrentPhase] = useState<Phase>('learn');
    const [user, setUser] = useState<any>(null);

    const supabase = createClient();

    useEffect(() => {
        const found = GUIDED_SCENARIOS.find(s => s.id === params.scenarioId);
        if (!found) {
            router.replace('/learn');
            return;
        }
        setScenario(found);

        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser(data.user);
                trackEvent('guided_scenario_started', {
                    scenario_id: params.scenarioId,
                    user_id: data.user.id
                });
            }
        });
    }, [params.scenarioId, router, supabase]);

    if (!scenario || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-text-primary">Loading...</div>;
    }

    const handlePhaseComplete = async (phase: Phase) => {
        // Record attempt in database based on phase completion (optional, done mostly in specific handlers)
        if (phase === 'learn') {
            setCurrentPhase('practice');
        } else if (phase === 'practice') {
            setCurrentPhase('speak');
        } else if (phase === 'speak') {
            // Update users table guided_scenarios_completed if this is a new completion
            // For now, fetch current completed, compare scenario order, and if scenario.order > completed, update.
            // @ts-ignore
            const { data } = await supabase.from('users').select('guided_scenarios_completed').eq('id', user.id).single();
            const currentCompleted = (data as any)?.guided_scenarios_completed || 0;
            if (scenario.order > currentCompleted) {
                // @ts-ignore
                await supabase.from('users').update({ guided_scenarios_completed: scenario.order }).eq('id', user.id);
            }
            setCurrentPhase('complete');
        } else if (phase === 'complete') {
            router.push('/learn');
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-background w-full max-w-md mx-auto relative overflow-hidden">
            {currentPhase === 'learn' && (
                <Phase1Learn 
                    scenario={scenario} 
                    onComplete={() => handlePhaseComplete('learn')}
                    onClose={() => router.push('/learn')}
                />
            )}
            {currentPhase === 'practice' && (
                <Phase2Practice 
                    scenario={scenario} 
                    onComplete={() => handlePhaseComplete('practice')}
                    onClose={() => router.push('/learn')}
                />
            )}
            {currentPhase === 'speak' && (
                <Phase3Speak 
                    scenario={scenario} 
                    userId={user.id}
                    onComplete={() => handlePhaseComplete('speak')}
                    onClose={() => router.push('/learn')}
                />
            )}
            {currentPhase === 'complete' && (
                <ScenarioComplete 
                    scenario={scenario} 
                    onFinish={() => handlePhaseComplete('complete')} 
                />
            )}
        </div>
    );
}
