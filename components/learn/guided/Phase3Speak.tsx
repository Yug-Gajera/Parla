import React, { useState, useRef, useEffect } from 'react';
import { GuidedScenario } from '@/lib/data/guided_scenarios';
import { Button } from '@/components/ui/button';
import { X, Mic, Square, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/posthog';
import { playSpanishAudio } from '@/lib/playAudio';

interface PhaseProps {
    scenario: GuidedScenario;
    userId: string;
    onComplete: () => void;
    onClose: () => void;
}

type Turn = { speaker: 'ai' | 'user'; text: string; targetPhraseId?: string; isScored?: boolean; passed?: boolean };

export default function Phase3Speak({ scenario, userId, onComplete, onClose }: PhaseProps) {
    const [turns, setTurns] = useState<Turn[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isScoring, setIsScoring] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const supabase = createClient();

    // Map 3 phrases to a generic dialogue
    const targetPhrases = scenario.phrases.slice(0, 3);
    
    // Hardcoded script structure
    const script: Turn[] = [
        { speaker: 'ai', text: `Let's practice! Speak clearly. How would you say: "${targetPhrases[0]?.translation}"?` },
        { speaker: 'user', text: '', targetPhraseId: targetPhrases[0]?.id },
        { speaker: 'ai', text: `Great! Now, how do you say: "${targetPhrases[1]?.translation}"?` },
        { speaker: 'user', text: '', targetPhraseId: targetPhrases[1]?.id },
        { speaker: 'ai', text: `Almost done. Finally: "${targetPhrases[2]?.translation}"?` },
        { speaker: 'user', text: '', targetPhraseId: targetPhrases[2]?.id },
    ];

    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Initialize the first AI turn
        setTurns([script[0]]);
        setCurrentStep(1); // The next step is user's turn
        playSpanishAudio(script[0].text, 'slow');
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            recorder.ondataavailable = e => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = processAudio;
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (e) {
            console.error("Mic access denied", e);
            toast.error("Microphone access is required.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
        }
    };

    const processAudio = async () => {
        setIsScoring(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Find the target phrase
        const currentTarget = script[currentStep];
        const targetPhraseObj = targetPhrases.find(p => p.id === currentTarget.targetPhraseId);

        if (!targetPhraseObj) {
             setIsScoring(false);
             return;
        }

        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');
        formData.append('language', 'es');

        try {
            // 1. Transcribe
            const transcriptRes = await fetch('/api/voice/transcribe', {
                method: 'POST',
                body: formData
            });
            
            if (!transcriptRes.ok) throw new Error('Transcription failed');
            const transcriptData = await transcriptRes.json();
            const spokenText = transcriptData.transcript || '';

            // 2. Score attempt
            const scoreRes = await fetch('/api/conversation/score-attempt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_text: targetPhraseObj.text,
                    spoken_text: spokenText,
                    user_level: 'A1', // Default for guided
                    session_id: null,
                    attempt_number: 1,
                    skipped: false
                })
            });

            if (!scoreRes.ok) throw new Error('Scoring failed');
            const data = await scoreRes.json();
            
            // Add user's scored response
            const newTurn: Turn = { 
                speaker: 'user', 
                text: spokenText || '(Inaudible)', 
                isScored: true, 
                passed: data.score >= 60 
            };
            
            setTurns(prev => [...prev, newTurn]);

            await supabase.from('guided_scenario_attempts').insert({
                user_id: userId,
                scenario_id: scenario.id,
                phase: 3,
                turn_number: currentStep,
                target_text: targetPhraseObj.text,
                spoken_text: spokenText,
                score: data.score,
                passed: data.score >= 60
            } as any);

            if (data.score >= 60) {
                // Progress the script
                setTimeout(() => {
                    const nextStep = currentStep + 1;
                    if (nextStep < script.length) {
                        const aiTurn = script[nextStep];
                        setTurns(prev => [...prev, aiTurn]);
                        setCurrentStep(nextStep + 1); // Point to next user turn
                        playSpanishAudio(aiTurn.text, 'slow');
                    } else {
                        // Finished
                        trackEvent('guided_learning_phase_completed', {
                            scenario_id: scenario.id,
                            phase: 3,
                            user_level: 'A1'
                        });
                        onComplete();
                    }
                }, 1500);
            } else {
                // Let user try again
                setTimeout(() => {
                    toast.error("Not quite right. Try again!");
                    // Remove the failed user turn so they can record again
                    setTurns(prev => prev.slice(0, -1));
                }, 1500);
            }

        } catch (e) {
            toast.error("Error analyzing speech.");
            setTurns(prev => prev.slice(0, -1)); // Revert
        } finally {
            setIsScoring(false);
        }
    };

    // Calculate progress based on how many user turns passed
    const passedUserTurns = Math.floor(currentStep / 2);
    const totalUserTurns = 3;
    const progress = (passedUserTurns / totalUserTurns) * 100;

    return (
        <div className="flex flex-col h-[100dvh] font-sans bg-background relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
                <button onClick={onClose} className="p-2 -ml-2 text-text-muted hover:text-text-primary">
                    <X className="w-5 h-5" />
                </button>
                <div className="flex-1 max-w-[200px] mx-4">
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-[#E8521A] transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E8521A]">
                    Phase 3
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
                <AnimatePresence initial={false}>
                    {turns.map((turn, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`
                                max-w-[85%] p-4 rounded-2xl
                                ${turn.speaker === 'user' 
                                    ? `rounded-tr-sm text-background ${turn.passed ? 'bg-[#E8521A]' : 'bg-red-500'}` 
                                    : 'bg-surface border border-border rounded-tl-sm text-text-primary'}
                            `}>
                                <p className="text-[15px] leading-relaxed font-medium">
                                    {turn.text}
                                </p>
                                {turn.speaker === 'user' && turn.isScored && (
                                    <div className="mt-2 text-[10px] font-mono uppercase tracking-widest opacity-80 flex items-center gap-1">
                                        {turn.passed ? <><CheckCircle2 className="w-3 h-3" /> Great job</> : 'Try Again'}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {isScoring && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-end"
                        >
                            <div className="max-w-[85%] p-4 rounded-2xl bg-surface border border-border rounded-tr-sm text-text-muted flex items-center space-x-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs uppercase tracking-widest font-mono">Analyzing...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mic Controls */}
            <div className="shrink-0 p-6 pt-2 pb-10 bg-background flex flex-col items-center">
                {currentStep % 2 !== 0 && !isScoring ? (
                    <div className="relative">
                        {isRecording && (
                            <div className="absolute inset-0 -m-4 rounded-full bg-[#E8521A]/20 animate-ping" />
                        )}
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`
                                relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all
                                ${isRecording ? 'bg-background border-2 border-[#E8521A] text-[#E8521A]' : 'bg-[#E8521A] text-background hover:brightness-110'}
                            `}
                        >
                            {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
                        </button>
                    </div>
                ) : (
                    <div className="h-20 flex items-center justify-center">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted">Wait for your turn...</span>
                    </div>
                )}
                <p className="mt-6 text-[10px] font-mono uppercase tracking-widest text-[#E8521A] font-bold">
                    {isRecording ? 'Tap to finish' : 'Tap to speak'}
                </p>
                <div className="mt-4 text-center">
                    <p className="text-sm font-medium text-text-primary">
                        Target Phrase:
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                        {targetPhrases[Math.floor(currentStep / 2)]?.text}
                    </p>
                </div>
            </div>
        </div>
    );
}
