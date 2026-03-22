"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Mic, Play, RefreshCw, Send, Loader2 } from 'lucide-react';
import { type Suggestion } from './SuggestedReplies';

interface SpeakReplyModalProps {
    suggestion: Suggestion;
    sessionId: string | null;
    userLevel: string;
    onClose: () => void;
    onSuccess: (spokenText: string) => void;
}

export function SpeakReplyModal({ suggestion, sessionId, userLevel, onClose, onSuccess }: SpeakReplyModalProps) {
    const [phase, setPhase] = useState<'intro' | 'speaking' | 'scoring' | 'result'>('intro');
    const [isRecording, setIsRecording] = useState(false);
    const [scoreData, setScoreData] = useState<any>(null);
    const [attemptCount, setAttemptCount] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Step 5 - App plays the correct audio automatically
        if (phase === 'intro') {
            playReferenceAudio();
        }
    }, [phase]);

    const playReferenceAudio = async () => {
        try {
            const res = await fetch('/api/voice/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: suggestion.spanish, voice: 'Esmeralda', language: 'es-MX' })
            });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
        } catch (e) {
            console.error("Failed TTS", e);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleFinishSpeaking(audioBlob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setPhase('speaking');
        } catch (e) {
            console.error("Mic error", e);
            alert("Microphone access is required to practice speaking.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
    };

    const handleFinishSpeaking = async (audioBlob: Blob) => {
        setPhase('scoring');
        setAttemptCount(prev => prev + 1);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');
            formData.append('language', 'es-ES'); // or mx

            // 1. Transcribe
            const transcriptRes = await fetch('/api/voice/transcribe', {
                method: 'POST',
                body: formData
            });
            const transcriptData = await transcriptRes.json();
            const spokenText = transcriptData.text || '';

            // 2. Score attempt
            const scoreRes = await fetch('/api/conversation/score-attempt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_text: suggestion.spanish,
                    spoken_text: spokenText,
                    user_level: userLevel,
                    session_id: sessionId,
                    attempt_number: attemptCount + 1,
                    skipped: false
                })
            });

            const scoreJson = await scoreRes.json();
            setScoreData({ ...scoreJson, spokenText });
            setPhase('result');
        } catch (e) {
            console.error("Scoring error", e);
            alert("Something went wrong scoring your pronunciation.");
            setPhase('intro');
        }
    };

    const handleRetry = () => {
        setScoreData(null);
        setPhase('intro');
    };

    const handleContinue = () => {
        if (scoreData?.spokenText) {
            onSuccess(scoreData.spokenText); // Sending user's actual attempt or the target text?
            // "On continue the spoken attempt is sent as the reply"
        } else {
            onSuccess(suggestion.spanish); // Fallback
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 py-safe-bottom">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-card border border-border shadow-2xl rounded-[32px] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 pb-2">
                    <h3 className="font-serif text-xl text-text-primary">Speak to Reply</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover text-text-muted">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 pt-4 flex-1 flex flex-col items-center">

                    <p className="text-sm font-mono tracking-widest text-[#E8521A] uppercase font-bold mb-6 text-center">
                        Say this out loud
                    </p>

                    <div className="w-full bg-surface border border-accent/20 rounded-2xl p-6 text-center relative group">
                        <button 
                            onClick={playReferenceAudio}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-accent hover:bg-accent/10 transition-colors"
                        >
                            <Volume2 className="w-4 h-4" />
                        </button>
                        <h2 className="font-serif text-3xl text-text-primary mb-2 leading-tight">
                            {suggestion.spanish}
                        </h2>
                        <p className="text-text-muted text-sm font-body italic mb-1">{suggestion.english}</p>
                        {suggestion.phonetic && (
                            <p className="text-text-secondary font-mono text-[11px] uppercase tracking-widest">{suggestion.phonetic}</p>
                        )}
                    </div>

                    <div className="h-40 w-full flex items-center justify-center mt-6">
                        {phase === 'intro' && (
                            <button 
                                onClick={startRecording}
                                className="w-20 h-20 rounded-full bg-[#E8521A] hover:bg-[#E8521A]/90 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            >
                                <Mic className="w-8 h-8" />
                            </button>
                        )}
                        {phase === 'speaking' && (
                            <div className="flex flex-col items-center">
                                <button 
                                    onClick={stopRecording}
                                    className="w-20 h-20 rounded-full bg-red-500 text-white shadow-xl flex items-center justify-center relative "
                                >
                                    <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20"></span>
                                    <div className="w-6 h-6 bg-white rounded-sm" />
                                </button>
                                <span className="mt-4 font-mono text-xs text-red-500 uppercase tracking-widest animate-pulse font-bold">Recording...</span>
                            </div>
                        )}
                        {phase === 'scoring' && (
                            <div className="flex flex-col items-center gap-3 text-text-muted">
                                <Loader2 className="w-8 h-8 animate-spin text-[#E8521A]" />
                                <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Scoring...</span>
                            </div>
                        )}
                        {phase === 'result' && scoreData && (
                            <div className="w-full flex justify-center items-center">
                                <div className="text-center">
                                    <div className="text-5xl font-serif text-text-primary mb-2">
                                        {scoreData.score}%
                                    </div>
                                    <p className={`font-mono text-xs font-bold uppercase tracking-widest ${
                                        scoreData.score >= 85 ? 'text-green-500' :
                                        scoreData.score >= 65 ? 'text-[#E8521A]' : 'text-text-muted'
                                    }`}>
                                        {scoreData.feedback_level.replace('_', ' ')}
                                    </p>
                                    
                                    {scoreData.spokenText && (
                                        <div className="mt-4 p-3 bg-surface rounded-xl border border-border text-sm text-text-secondary italic">
                                            "{scoreData.spokenText}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Actions */}
                    {phase === 'result' && (
                        <div className="w-full flex gap-3 mt-4">
                            <button 
                                onClick={handleRetry}
                                className="flex-1 btn-secondary h-12 rounded-xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" /> Retry
                            </button>
                            <button 
                                onClick={handleContinue}
                                className="flex-1 btn-primary h-12 rounded-xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
                            >
                                Continue <Send className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
