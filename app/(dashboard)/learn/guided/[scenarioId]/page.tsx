"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GUIDED_SCENARIOS, GuidedScenario } from '@/lib/data/guided_scenarios';
import Phase1Learn from '@/components/learn/guided/Phase1Learn';
import Phase2Practice from '@/components/learn/guided/Phase2Practice';
import Phase3Speak from '@/components/learn/guided/Phase3Speak';
import ScenarioComplete from '@/components/learn/guided/ScenarioComplete';
import Phase4Build from '@/components/learn/guided/Phase4Build';
import { trackEvent } from '@/lib/posthog';
import { CheckCircle2 } from 'lucide-react';

type Phase = 'learn' | 'practice' | 'speak' | 'build' | 'complete';

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

    const phases: { id: Phase; label: string; step: number }[] = [
        { id: 'learn', label: 'Learn', step: 1 },
        { id: 'practice', label: 'Practice', step: 2 },
        { id: 'speak', label: 'Speak', step: 3 },
        { id: 'build', label: 'Build', step: 4 }
    ];

    const currentStepIndex = phases.findIndex(p => p.id === currentPhase);

    const renderStepIndicator = () => {
        if (currentPhase === 'complete') return null;
        
        return (
            <div className="flex justify-center items-center gap-6 py-4 border-b border-border bg-background/80 backdrop-blur-md z-20">
                {phases.map((p, index) => {
                    const isActive = currentPhase === p.id;
                    const isCompleted = currentStepIndex > index;

                    return (
                        <div key={p.id} className="flex flex-col items-center">
                            <span className={`text-[11px] font-mono uppercase tracking-widest font-bold mb-1 transition-colors ${isActive ? 'text-[#E8521A]' : isCompleted ? 'text-text-primary' : 'text-text-muted'}`}>
                                Step {p.step}: {p.label}
                            </span>
                            <div className="h-4 flex items-center justify-center">
                                {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#E8521A]" />
                                ) : isActive ? (
                                    <div className="w-2 h-2 rounded-full bg-[#E8521A]" />
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-border" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const handlePhaseComplete = async (phase: Phase, payload?: any) => {
        if (phase === 'learn') {
            setCurrentPhase('practice');
        } else if (phase === 'practice') {
            setCurrentPhase('speak');
        } else if (phase === 'speak') {
            setCurrentPhase('build');
        } else if (phase === 'build') {
            // Save words to vocabulary
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
                        importSource: 'guided_phase4',
                        languageId: 'es',
                        familiarity: 2
                    })
                });
                if (!importRes.ok) console.error('Vocab import failed');
            } catch (err) {
                console.error('Failed to import vocabulary:', err);
            }

            // Update completion status
            try {
                const completeRes = await fetch('/api/guided/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        scenarioOrder: scenario.order,
                        phase4Progress: {
                            phase4_complete: true,
                            phase4_round1_score: payload?.round1_score || 0,
                            phase4_round2_score: payload?.round2_score || 0,
                            phase4_round3_attempts: payload?.round3_attempts || 0
                        }
                    })
                });
                if (!completeRes.ok) console.error('Completion update failed');
            } catch (err) {
                console.error(err);
            }

            setCurrentPhase('complete');
        } else if (phase === 'complete') {
            router.refresh();
            router.push('/learn');
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-background w-full max-w-md mx-auto relative overflow-hidden">
            {renderStepIndicator()}
            <div className="flex-1 relative overflow-hidden">
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
                {currentPhase === 'build' && (
                    <Phase4Build 
                        scenario={scenario} 
                        userId={user.id}
                        onComplete={(payload) => handlePhaseComplete('build', payload)}
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
        </div>
    );
}
