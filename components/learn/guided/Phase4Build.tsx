import React, { useState, useEffect, useRef } from 'react';
import { GuidedScenario } from '@/lib/data/guided_scenarios';
import { Button } from '@/components/ui/button';
import { X, Mic, Square, Loader2, Volume2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/posthog';

// Placeholder or real audio player function
const playSpanishAudio = async (text: string, speed: 'normal' | 'slow' = 'normal') => {
    try {
        const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language: 'es', speed: speed === 'slow' ? 0.8 : 1.0 })
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
    } catch (e) {
        console.error(e);
    }
};

interface PhaseProps {
    scenario: GuidedScenario;
    userId: string;
    onComplete: (scores: any) => void;
    onClose: () => void;
}

type RoundName = 'intro' | 'round1' | 'round2' | 'round3' | 'complete';

export default function Phase4Build({ scenario, userId, onComplete, onClose }: PhaseProps) {
    const [round, setRound] = useState<RoundName>('intro');
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [round1ScoreSum, setRound1ScoreSum] = useState(0);
    const [round2ScoreSum, setRound2ScoreSum] = useState(0);
    const [round3Attempts, setRound3Attempts] = useState(0);

    const [exerciseIndex, setExerciseIndex] = useState(0);
    const [showBreakOverlay, setShowBreakOverlay] = useState(false);

    // Recording states for Round 1
    const [isRecording, setIsRecording] = useState(false);
    const [isScoring, setIsScoring] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    
    // Round 1 evaluation state
    const [r1Finished, setR1Finished] = useState(false);
    const [r1Passed, setR1Passed] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        trackEvent('phase4_started', { scenario_id: scenario.id });
        const fetchContent = async () => {
            try {
                const res = await fetch('/api/learn/generate-phase4-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scenario_id: scenario.id,
                        scenario_phrases: scenario.phrases.map(p => ({
                            spanish: p.text,
                            english: p.translation,
                            phonetic: p.phonetic || ''
                        }))
                    })
                });
                if (!res.ok) throw new Error('Failed to load exercises');
                const data = await res.json();
                setContent(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load Phase 4 exercises.");
                setLoading(false);
            }
        };

        fetchContent();
    }, [scenario]);

    useEffect(() => {
        if (round === 'intro' && !loading && content) {
            const t = setTimeout(() => {
                setRound('round1');
                setExerciseIndex(0);
            }, 2500);
            return () => clearTimeout(t);
        }
    }, [round, loading, content]);

    const finishPhase4 = () => {
        const payload = {
            round1_score: content?.round1 ? round1ScoreSum / content.round1.length : 0,
            round2_score: content?.round2 ? round2ScoreSum / content.round2.length : 0,
            round3_attempts: round3Attempts
        };
        trackEvent('phase4_completed', {
            scenario_id: scenario.id,
            total_time_seconds: 120, // stub
            ...payload
        });
        onComplete(payload);
    };

    // ------------- ROUND 1 LOGIC -------------
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            recorder.ondataavailable = e => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = processAudioR1;
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (e) {
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

    const processAudioR1 = async () => {
        setIsScoring(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const currentData = content.round1[exerciseIndex];
        
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');
        formData.append('language', 'es');

        try {
            const transcriptRes = await fetch('/api/voice/transcribe', { method: 'POST', body: formData });
            const transcriptData = await transcriptRes.json();
            const spokenText = transcriptData.transcript || '';

            const scoreRes = await fetch('/api/conversation/score-attempt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_text: currentData.combined_spanish,
                    spoken_text: spokenText,
                    user_level: 'A1',
                    attempt_number: 1,
                    skipped: false
                })
            });
            const data = await scoreRes.json();
            
            const score = data.score || 0;
            setRound1ScoreSum(prev => prev + score);
            
            setR1Passed(score >= 55);
            setR1Finished(true);

        } catch (e) {
            toast.error("Error analyzing speech.");
        } finally {
            setIsScoring(false);
        }
    };

    const nextR1 = () => {
        setR1Finished(false);
        const nextIdx = exerciseIndex + 1;
        if (nextIdx < content.round1.length) {
            setExerciseIndex(nextIdx);
        } else {
            setShowBreakOverlay(true);
            setTimeout(() => {
                setShowBreakOverlay(false);
                setRound('round2');
                setExerciseIndex(0);
            }, 1500);
        }
    };

    // ------------- ROUND 2 LOGIC -------------
    // R2 states
    const [r2Selected, setR2Selected] = useState<string | null>(null);
    const [r2Correct, setR2Correct] = useState<boolean | null>(null);

    const handleR2Tap = (word: string, currentData: any) => {
        if (r2Selected !== null) return;
        setR2Selected(word);
        if (word === currentData.correct_answer) {
            setR2Correct(true);
            setRound2ScoreSum(prev => prev + 100);
            playSpanishAudio(currentData.full_sentence, 'normal');
        } else {
            setR2Correct(false);
            trackEvent('phase4_exercise_failed', { scenario_id: scenario.id, round: 2, exercise_number: exerciseIndex + 1, attempts: 1 });
            setTimeout(() => {
                nextR2();
            }, 1200);
        }
    };

    const nextR2 = () => {
        setR2Selected(null);
        setR2Correct(null);
        const nextIdx = exerciseIndex + 1;
        if (nextIdx < content.round2.length) {
            setExerciseIndex(nextIdx);
        } else {
            setShowBreakOverlay(true);
            setTimeout(() => {
                setShowBreakOverlay(false);
                setRound('round3');
                setExerciseIndex(0);
            }, 1500);
        }
    };

    // ------------- ROUND 3 LOGIC -------------
    const [r3Slots, setR3Slots] = useState<string[]>([]);
    const [r3Bank, setR3Bank] = useState<string[]>([]);
    const [r3AttemptsCount, setR3AttemptsCount] = useState(0);
    const [r3State, setR3State] = useState<'playing' | 'wrong' | 'passed' | 'failed'>('playing');

    useEffect(() => {
        if (round === 'round3' && content?.round3) {
            const cd = content.round3[exerciseIndex];
            setR3Bank(cd?.scrambled_words || []);
            setR3Slots(Array((cd?.scrambled_words || []).length).fill(''));
            setR3State('playing');
            setR3AttemptsCount(0);
        }
    }, [round, exerciseIndex, content]);

    const addToSlot = (word: string, indexInBank: number) => {
        const slotIdx = r3Slots.indexOf('');
        if (slotIdx === -1) return;
        const newSlots = [...r3Slots];
        newSlots[slotIdx] = word;
        setR3Slots(newSlots);
        const newBank = [...r3Bank];
        newBank[indexInBank] = '';
        setR3Bank(newBank);
    };

    const removeFromSlot = (word: string, indexInSlot: number) => {
        const newSlots = [...r3Slots];
        newSlots[indexInSlot] = '';
        setR3Slots(newSlots);
        const emptyBankIdx = r3Bank.indexOf('');
        const newBank = [...r3Bank];
        if (emptyBankIdx !== -1) {
            newBank[emptyBankIdx] = word;
        } else {
            newBank.push(word);
        }
        setR3Bank(newBank);
    };

    const checkR3 = () => {
        setRound3Attempts(prev => prev + 1);
        setR3AttemptsCount(prev => prev + 1);
        const currentData = content.round3[exerciseIndex];
        const attempt = r3Slots.join(' ');
        const target = currentData.correct_order.join(' ');
        
        if (attempt === target) {
            setR3State('passed');
            playSpanishAudio(target, 'normal');
            setTimeout(() => {
                nextR3();
            }, 1500);
        } else {
            if (r3AttemptsCount >= 2) { // 3rd failure
                setR3State('failed');
            } else {
                setR3State('wrong');
                setTimeout(() => {
                    setR3State('playing');
                    // Bounce wrong words back
                    const newSlots = [...r3Slots];
                    const newBank = [...r3Bank];
                    r3Slots.forEach((sw, i) => {
                        if (sw !== currentData.correct_order[i] && sw !== '') {
                            newSlots[i] = '';
                            const emptyIdx = newBank.indexOf('');
                            if (emptyIdx !== -1) newBank[emptyIdx] = sw;
                            else newBank.push(sw);
                        }
                    });
                    setR3Slots(newSlots);
                    setR3Bank(newBank);
                }, 1500);
            }
        }
    };

    const nextR3 = () => {
        const nextIdx = exerciseIndex + 1;
        if (nextIdx < content.round3.length) {
            setExerciseIndex(nextIdx);
        } else {
            setRound('complete');
        }
    };


    // ------------- RENDERERS -------------
    if (loading) {
        return (
            <div className="flex flex-col h-[100dvh] items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-[#E8521A] animate-spin mb-4" />
                <p className="text-text-muted font-mono uppercase tracking-widest text-xs">Generating Exercises...</p>
            </div>
        );
    }

    if (round === 'intro') {
        return (
            <div className="flex flex-col h-[100dvh] items-center justify-center bg-background p-6">
                <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6">
                    <span className="text-5xl">🦉</span>
                </div>
                <h1 className="text-[28px] font-display text-text-primary text-center mb-2">
                    Now let's build sentences
                </h1>
                <p className="text-[15px] font-sans text-text-secondary text-center mb-8 max-w-sm">
                    Use the phrases you just learned to say something real
                </p>
                <div className="flex gap-4 items-center">
                    <span className="text-sm font-mono text-text-muted">Round 1 ○</span>
                    <span className="text-sm font-mono text-text-muted">Round 2 ○</span>
                    <span className="text-sm font-mono text-text-muted">Round 3 ○</span>
                </div>
            </div>
        );
    }

    const renderHeader = (title: string, progress: number) => (
        <div className="flex flex-col px-6 py-5 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
            <div className="flex items-center justify-between">
                <button onClick={onClose} className="p-2 -ml-2 text-text-muted hover:text-text-primary">
                    <X className="w-5 h-5" />
                </button>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E8521A]">
                    Phase 4 — {title}
                </div>
            </div>
            <div className="w-full mt-4 h-1.5 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-[#E8521A] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );

    if (showBreakOverlay) {
        return (
            <div className="flex flex-col h-[100dvh] items-center justify-center bg-background p-6">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
                <h1 className="text-2xl font-display text-text-primary text-center">
                    Round {round === 'round1' ? 1 : 2} done! 🎉
                </h1>
                <p className="text-text-muted mt-4 font-mono uppercase text-xs tracking-widest">
                    Next: {round === 'round1' ? 'fill in the blanks' : 'build a sentence'} →
                </p>
            </div>
        );
    }

    if (round === 'round1') {
        const currentData = content?.round1?.[exerciseIndex];
        if (!currentData) return null;

        return (
            <div className="flex flex-col h-full bg-background min-h-0">
                {renderHeader('Round 1 of 3 — Connect', ((exerciseIndex) / 5) * 100)}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center">
                    <div className="bg-surface border border-border rounded-[20px] p-[28px_24px] w-full max-w-[480px]">
                        <p className="font-sans font-medium text-[13px] uppercase text-text-muted mb-6">
                            Join these two phrases:
                        </p>
                        <div className="space-y-4 mb-8">
                            <div>
                                <p className="font-sans font-semibold text-[17px] text-text-primary">{currentData.phrase1_spanish}</p>
                                <p className="font-sans text-[13px] text-text-muted">{currentData.phrase1_english}</p>
                            </div>
                            <div className="flex items-center">
                                <span className="bg-[#E8521A]/10 text-[#E8521A] border border-[#E8521A]/20 rounded-full px-3 py-1 font-sans font-semibold text-[13px]">
                                    {currentData.connector}
                                </span>
                            </div>
                            <div>
                                <p className="font-sans font-semibold text-[17px] text-text-primary">{currentData.phrase2_spanish}</p>
                                <p className="font-sans text-[13px] text-text-muted">{currentData.phrase2_english}</p>
                            </div>
                        </div>

                        <div className="border-t border-border pt-6">
                            <p className="font-sans font-medium text-[12px] uppercase text-text-muted mb-2">Together they mean:</p>
                            <p className="font-sans italic text-[15px] text-text-secondary mb-6">{currentData.combined_english}</p>
                            
                            {!r1Finished ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Button 
                                        variant="outline" 
                                        className="h-12 w-full border-[#E8521A] text-[#E8521A] hover:bg-[#E8521A]/10 transition-colors"
                                        onClick={() => playSpanishAudio(currentData.combined_spanish, 'slow')}
                                    >
                                        <Volume2 className="w-5 h-5 mr-2" /> Hear the full sentence
                                    </Button>
                                    
                                    {isScoring ? (
                                        <div className="flex items-center gap-2 text-text-muted text-sm mt-4">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Scoring...
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center mt-4">
                                            <p className="text-sm font-sans text-text-muted mb-4">Now say it out loud</p>
                                            <button
                                                onClick={isRecording ? stopRecording : startRecording}
                                                className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${isRecording ? 'bg-background border-2 border-[#E8521A] text-[#E8521A]' : 'bg-[#E8521A] text-background hover:brightness-110'}`}
                                            >
                                                {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <p className="font-display font-semibold text-[22px] text-[#E8521A] mb-1">
                                        {currentData.combined_spanish}
                                    </p>
                                    <p className="font-sans text-[14px] text-[#E8521A]/80 mb-6">{currentData.phonetic}</p>
                                    
                                    <div className="flex gap-3">
                                        <Button className="flex-1 bg-[#E8521A] text-white hover:brightness-110" onClick={nextR1}>
                                            Got it — next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (round === 'round2') {
        const currentData = content?.round2?.[exerciseIndex];
        // Combine answer with wrong options and shuffle
        const [options, setOptions] = useState<string[]>([]);
        useEffect(() => {
            if (!currentData) return;
            const opts = [currentData.correct_answer, ...(currentData.wrong_options || [])];
            setOptions(opts.sort(() => Math.random() - 0.5));
        }, [currentData]);

        if (!currentData) return null;

        return (
            <div className="flex flex-col h-full bg-background min-h-0">
                {renderHeader('Round 2 of 3 — Fill the blank', ((exerciseIndex) / 5) * 100)}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center">
                    <div className="bg-surface border border-border rounded-[20px] p-[28px_24px] w-full max-w-[480px]">
                        <p className="font-sans font-medium text-[13px] uppercase text-text-muted mb-6">
                            Choose the missing word:
                        </p>

                        <div className="mb-6">
                            <p className="font-sans font-semibold text-[20px] text-text-primary leading-loose">
                                {r2Correct && r2Selected === currentData.correct_answer ? (
                                    <span className="text-[#E8521A] font-display">{currentData.full_sentence}</span>
                                ) : (
                                    currentData.sentence_with_blank.split('____').map((part: string, i: number, arr: any[]) => (
                                        <React.Fragment key={i}>
                                            {part}
                                            {i < arr.length - 1 && (
                                                <span className="inline-block border-b-2 border-[#E8521A] w-[80px] mx-1 align-bottom"></span>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </p>
                            <p className="font-sans italic text-[13px] text-text-muted mt-4">
                                {currentData.english}
                            </p>
                        </div>

                        {!r2Correct ? (
                            <div className="flex gap-3 justify-center mb-2">
                                {options.map((opt, i) => {
                                    const isSelected = r2Selected === opt;
                                    const isWrongSelected = isSelected && r2Correct === false;
                                    const isCorrectAnswer = opt === currentData.correct_answer && r2Correct === false;

                                    let styles = "bg-surface border-border hover:border-text-muted";
                                    if (isWrongSelected) styles = "border-red-500 bg-red-500/10 text-red-500";
                                    if (isCorrectAnswer) styles = "border-green-500 bg-green-500/10 text-green-500";

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleR2Tap(opt, currentData)}
                                            className={`border rounded-[10px] px-4 py-3 font-sans font-semibold text-[15px] text-text-primary min-w-[80px] text-center transition-all ${styles}`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <Button className="w-full mt-4 bg-[#E8521A] text-white hover:brightness-110" onClick={nextR2}>
                                Next →
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (round === 'round3') {
        const currentData = content?.round3?.[exerciseIndex];
        if (!currentData) return null;

        return (
            <div className="flex flex-col h-full bg-background min-h-0">
                {renderHeader('Round 3 of 3 — Build it', ((exerciseIndex) / 5) * 100)}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-8 flex flex-col items-center">
                    <div className="w-full max-w-[480px]">
                        <p className="font-sans font-medium text-[13px] uppercase text-text-muted mb-4">
                            Put these words in order:
                        </p>
                        <p className="font-sans font-medium text-[16px] text-text-primary mb-10 text-center bg-surface p-4 rounded-xl">
                            {currentData.english}
                        </p>

                        <div className="flex flex-wrap gap-2 justify-center mb-10 min-h-[60px]">
                            {r3Slots.map((word, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => word !== '' && removeFromSlot(word, i)}
                                    className={`border-b-2 border-border-strong min-w-[60px] h-[40px] flex items-center justify-center cursor-pointer transition-colors ${
                                        word !== '' 
                                            ? r3State === 'passed' ? 'bg-green-500/20 text-green-500 border-green-500 rounded-lg' 
                                            : r3State === 'wrong' ? 'bg-orange-500/20 text-orange-500 border-orange-500 rounded-lg'
                                            : 'bg-[#E8521A]/10 text-[#E8521A] border-transparent rounded-lg font-semibold'
                                            : ''
                                    }`}
                                >
                                    {word}
                                </div>
                            ))}
                        </div>

                        {r3State === 'playing' || r3State === 'wrong' ? (
                            <div className="flex flex-wrap gap-2 justify-center mb-8">
                                {r3Bank.map((word, i) => (
                                    word !== '' ? (
                                        <button
                                            key={i}
                                            onClick={() => addToSlot(word, i)}
                                            className="bg-surface border border-border-strong rounded-[10px] px-4 py-2 font-sans font-semibold text-[15px] text-text-primary active:scale-95 transition-transform"
                                        >
                                            {word}
                                        </button>
                                    ) : (
                                        <div key={i} className="px-4 py-2 opacity-0">{word}</div> // Keep spacing
                                    )
                                ))}
                            </div>
                        ) : null}

                        <div className="flex flex-col items-center justify-center min-h-[60px]">
                            {r3State === 'wrong' && (
                                <p className="text-orange-500 font-sans text-sm font-semibold animate-pulse">Almost! Try moving these words.</p>
                            )}
                            {r3State === 'failed' && (
                                <div className="text-center w-full">
                                    <p className="text-text-muted mb-2 text-sm uppercase">Here is the answer:</p>
                                    <p className="text-green-500 font-display text-xl mb-4">{currentData.correct_order.join(' ')}</p>
                                    <Button className="w-full bg-[#E8521A] text-white" onClick={nextR3}>Got it</Button>
                                </div>
                            )}
                            {r3State === 'passed' && (
                                <p className="text-green-500 font-sans font-bold text-lg animate-bounce">Perfect! 🎉</p>
                            )}
                            {r3Slots.every(w => w !== '') && r3State === 'playing' && (
                                <Button className="w-full max-w-[200px] bg-[#E8521A] text-white" onClick={checkR3}>
                                    Check my answer
                                </Button>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    if (round === 'complete') {
        return (
            <div className="flex flex-col h-full min-h-0 items-center justify-center bg-background p-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-8"
                >
                    <span className="text-6xl">✨🦉✨</span>
                </motion.div>
                
                <h1 className="text-[30px] font-display text-text-primary text-center mb-2">
                    You built real Spanish sentences!
                </h1>
                <p className="text-[15px] font-sans text-text-secondary text-center max-w-sm mb-10">
                    That is a huge step — most people never get this far.
                </p>

                <div className="flex flex-col gap-4 text-left w-full max-w-[300px] mb-12 font-mono text-[#E8521A]">
                    <div className="flex justify-between border-b border-[#E8521A]/20 pb-2">
                        <span>Sentences connected:</span>
                        <span className="font-bold">5</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E8521A]/20 pb-2">
                        <span>Blanks filled:</span>
                        <span className="font-bold">5</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E8521A]/20 pb-2">
                        <span>Sentences built:</span>
                        <span className="font-bold">5</span>
                    </div>
                </div>

                <Button className="w-full max-w-[300px] bg-[#E8521A] text-white py-6 text-lg hover:brightness-110" onClick={finishPhase4}>
                    Complete this scenario →
                </Button>
            </div>
        );
    }

    return null;
}
