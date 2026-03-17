"use client";

// ============================================================
// Parlova — Microphone Button (Redesigned)
// ============================================================

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Square, Loader2, AlertCircle, Check, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMicrophone } from '@/hooks/useMicrophone';
import { type TranscriptionResult } from '@/lib/voice/transcription';

interface MicrophoneButtonProps {
    onTranscriptionComplete: (result: TranscriptionResult) => void;
    onTranscriptionError?: (error: string) => void;
    isDisabled: boolean;
    language?: string;
}

const TIPS = [
    "Speak in full lines for a better score",
    "It's okay to be slow — clarity matters",
    "Use words from the prompt",
    "Don't translate — just speak",
];

export function MicrophoneButton({
    onTranscriptionComplete,
    isDisabled,
    language = 'es-ES',
}: MicrophoneButtonProps) {
    const {
        micState,
        currentTranscription,
        interimText,
        audioLevel,
        recordingSeconds,
        error,
        startListening,
        stopListening,
        confirmTranscription,
        retryRecording,
    } = useMicrophone(language);

    const [tipIndex, setTipIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(i => (i + 1) % TIPS.length);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleButtonClick = () => {
        if (isDisabled) return;
        switch (micState) {
            case 'idle':
            case 'error':
                startListening();
                break;
            case 'recording':
                stopListening();
                break;
            default:
                break;
        }
    };

    const handleConfirm = () => {
        const result = confirmTranscription();
        if (result) onTranscriptionComplete(result);
    };

    const handleRetry = () => {
        retryRecording();
    };

    const timerStr = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}`;

    return (
        <div className="flex flex-col items-center gap-4 w-full mt-4">
            {/* Mic UI */}
            <div className="relative flex flex-col items-center justify-center">

                {/* Main Button */}
                <motion.button
                    onClick={handleButtonClick}
                    disabled={isDisabled || micState === 'processing' || micState === 'confirming'}
                    whileTap={{ scale: 0.95 }}
                    className={`mic-btn ${micState === 'recording' ? 'mic-btn-recording' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={micState === 'idle' && !isDisabled ? { animation: 'pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : undefined}
                >
                    {micState === 'recording' ? (
                        <Square className="w-6 h-6 text-background fill-current" />
                    ) : micState === 'processing' ? (
                        <Loader2 className="w-6 h-6 text-gold animate-spin" />
                    ) : micState === 'error' ? (
                        <AlertCircle className="w-6 h-6 text-error" />
                    ) : (
                        <Mic2 className={`w-6 h-6 ${isDisabled ? 'text-text-muted' : 'text-text-primary'}`} />
                    )}
                </motion.button>

                {/* Recording UI Rings */}
                {micState === 'recording' && (
                    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 -rotate-90 pointer-events-none" viewBox="0 0 88 88">
                        <circle
                            cx="44" cy="44" r="42"
                            fill="none"
                            stroke="var(--color-gold-subtle)"
                            strokeWidth="2"
                            strokeDasharray={`${(recordingSeconds / 30) * 263.89} 263.89`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                        />
                    </svg>
                )}
            </div>

            {/* Status Messages */}
            <div className="text-center min-h-[3rem] flex flex-col items-center justify-start">
                {micState === 'idle' && !isDisabled && (
                    <p className="mic-btn-label animate-fade-up">Tap to speak</p>
                )}
                {micState === 'idle' && isDisabled && (
                    <p className="mic-btn-label">Waiting for response...</p>
                )}
                {micState === 'recording' && (
                    <div className="flex flex-col items-center animate-fade-up">
                        <p className="text-sm text-gold font-semibold">Listening...</p>
                        <p className="text-xs text-text-secondary font-mono-num">{timerStr}</p>
                    </div>
                )}
                {micState === 'processing' && (
                    <p className="text-sm text-gold-hover font-medium animate-fade-up">
                        Understanding...
                    </p>
                )}
                {micState === 'error' && (
                    <p className="text-[13px] text-error text-center max-w-[280px]">
                        {error?.code === 'not-allowed' ? 'Microphone access denied.' : 'Connection issue. Try again.'}
                    </p>
                )}
                
                {/* Interim Text */}
                {interimText && micState === 'recording' && (
                    <p className="text-[13px] text-text-secondary italic mt-2 max-w-[280px] line-clamp-2">
                        {interimText}
                    </p>
                )}

                {/* Idle Tips */}
                <AnimatePresence mode="wait">
                    {micState === 'idle' && !isDisabled && (
                        <motion.p
                            key={tipIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-text-muted text-center max-w-[240px] mt-2"
                        >
                            {TIPS[tipIndex]}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Confirmation Card */}
            <AnimatePresence>
                {micState === 'confirming' && currentTranscription && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        className="w-full max-w-[340px] parlova-card p-6"
                    >
                        <p className="text-[11px] font-semibold tracking-widest text-text-muted uppercase mb-2 font-mono-num">You said</p>
                        <p className="text-[15px] text-text-primary leading-relaxed mb-4">
                            &ldquo;{currentTranscription.transcript}&rdquo;
                        </p>

                        <div className="flex flex-col gap-2">
                            <button onClick={handleConfirm} className="btn-primary w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-widest">
                                <Check size={16} /> Send
                            </button>
                            <button onClick={handleRetry} className="btn-secondary w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-widest">
                                <RefreshCcw size={16} /> Try Again
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
