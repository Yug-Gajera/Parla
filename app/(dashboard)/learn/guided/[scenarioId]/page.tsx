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
            // 1. Save all phrases from this scenario to the user's vocabulary deck
            try {
                const wordsToImport = scenario.phrases.map(p => ({
                    spanish: p.text,
                    english: p.translation,
                    cefr_level: 'A1',
                    part_of_speech: 'phrase'
                }));

                const importRes = await fetch('/api/vocabulary/import-batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        words: wordsToImport,
                        importSource: 'guided_scenario',
                        languageId: 'es'
                    })
                });

                if (!importRes.ok) {
                    const errBody = await importRes.json().catch(() => ({}));
                    console.error('Vocab import failed:', importRes.status, errBody);
                }
            } catch (err) {
                console.error('Failed to import vocabulary:', err);
                // Non-blocking: we still want to show the completion screen
            }

            // 2. Update guided_scenarios_completed via server-side API (client Supabase can't update users table due to RLS)
            try {
                const completeRes = await fetch('/api/guided/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scenarioOrder: scenario.order })
                });

                if (!completeRes.ok) {
                    const errBody = await completeRes.json().catch(() => ({}));
                    console.error('Guided completion update failed:', completeRes.status, errBody);
                }
            } catch (err) {
                console.error('Failed to update guided completion:', err);
            }

            setCurrentPhase('complete');
        } else if (phase === 'complete') {
            router.refresh();
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
