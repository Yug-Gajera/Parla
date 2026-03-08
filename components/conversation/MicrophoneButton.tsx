"use client";

// ============================================================
// Parlova — Microphone Button
// Core voice recording UI with states, visualizer, confirmation
// ============================================================

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, AlertCircle, Check, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMicrophone, type MicState } from '@/hooks/useMicrophone';
import { type TranscriptionResult } from '@/lib/voice/transcription';

interface MicrophoneButtonProps {
    onTranscriptionComplete: (result: TranscriptionResult) => void;
    onTranscriptionError?: (error: string) => void;
    isDisabled: boolean;
    language?: string;
}

const TIPS = [
    "Speak in full sentences for a better score",
    "It's okay to be slow — clarity matters more",
    "Try to use words from the conversation",
    "Don't translate in your head — just speak",
    "Breathe. You know more Spanish than you think.",
];

export function MicrophoneButton({
    onTranscriptionComplete,
    onTranscriptionError,
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

    // Rotate tips every 30 seconds
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
        if (result) {
            onTranscriptionComplete(result);
        }
    };

    const handleRetry = () => {
        retryRecording();
    };

    // ── Sound Wave Bars ────────────────────────────────────
    const bars = [0.6, 1.0, 0.8, 1.0, 0.6]; // relative multipliers

    // ── Timer Format ───────────────────────────────────────
    const timerStr = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}`;

    // ── Button Appearance ──────────────────────────────────
    const getButtonStyle = (): string => {
        switch (micState) {
            case 'recording':
                return 'bg-red-600 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.4)]';
            case 'processing':
                return 'bg-violet-600 border-violet-500 shadow-[0_0_30px_rgba(124,58,237,0.4)]';
            case 'error':
                return 'bg-[#1a1a1a] border-red-500/50';
            default:
                return 'bg-[#1a1a1a] border-[#333] hover:border-violet-500/50';
        }
    };

    // ── Error Messages ─────────────────────────────────────
    const getErrorMessage = (): string => {
        if (!error) return '';
        switch (error.code) {
            case 'not-allowed':
                return 'Microphone access denied. Please allow microphone access in your browser settings and refresh.';
            case 'no-speech':
                return 'No speech detected. Tap to try again.';
            case 'network':
                return 'Connection issue. Check your internet and try again.';
            case 'audio-capture':
                return 'Microphone not found. Check your device settings.';
            default:
                return 'Something went wrong. Tap to try again.';
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {/* Tip (only in idle) */}
            <AnimatePresence mode="wait">
                {micState === 'idle' && !isDisabled && (
                    <motion.p
                        key={tipIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-muted-foreground text-center px-4 h-5"
                    >
                        💡 {TIPS[tipIndex]}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Mic Button + Wave Visualizer */}
            <div className="relative flex items-center justify-center">
                {/* Sound waves (only when recording) */}
                {micState === 'recording' && (
                    <div className="absolute flex items-center gap-[3px] pointer-events-none">
                        {/* Left side bars */}
                        {bars.slice(0, 2).map((mult, i) => (
                            <div
                                key={`l-${i}`}
                                className="w-[3px] rounded-full bg-white/50 transition-all duration-100"
                                style={{
                                    height: `${Math.max(6, (audioLevel * mult * 0.6))}px`,
                                    transform: `translateX(-${(2 - i) * 18 + 22}px)`,
                                    position: 'absolute',
                                }}
                            />
                        ))}
                        {/* Right side bars */}
                        {bars.slice(3).map((mult, i) => (
                            <div
                                key={`r-${i}`}
                                className="w-[3px] rounded-full bg-white/50 transition-all duration-100"
                                style={{
                                    height: `${Math.max(6, (audioLevel * mult * 0.6))}px`,
                                    transform: `translateX(${i * 18 + 22}px)`,
                                    position: 'absolute',
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Main Button */}
                <motion.button
                    onClick={handleButtonClick}
                    disabled={isDisabled || micState === 'processing' || micState === 'confirming'}
                    whileTap={{ scale: 0.93 }}
                    className={`
                        w-20 h-20 rounded-full border-2 flex items-center justify-center
                        transition-all duration-200 relative z-10
                        disabled:opacity-40 disabled:cursor-not-allowed
                        ${getButtonStyle()}
                    `}
                    style={micState === 'idle' && !isDisabled ? {
                        animation: 'breathe 3s ease-in-out infinite',
                    } : undefined}
                >
                    {micState === 'recording' ? (
                        <Square className="w-7 h-7 text-white fill-white" />
                    ) : micState === 'processing' ? (
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                    ) : micState === 'error' ? (
                        <AlertCircle className="w-7 h-7 text-red-500" />
                    ) : (
                        <Mic className="w-7 h-7 text-white" />
                    )}
                </motion.button>

                {/* Recording arc (30s max duration indicator) */}
                {micState === 'recording' && (
                    <svg className="absolute inset-0 w-20 h-20 -rotate-90 pointer-events-none" viewBox="0 0 80 80">
                        <circle
                            cx="40" cy="40" r="38"
                            fill="none"
                            stroke={recordingSeconds >= 25 ? '#f59e0b' : 'rgba(255,255,255,0.15)'}
                            strokeWidth="2"
                            strokeDasharray={`${(recordingSeconds / 30) * 238.76} 238.76`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                        />
                    </svg>
                )}
            </div>

            {/* Status Label */}
            <div className="text-center min-h-[40px]">
                {micState === 'idle' && !isDisabled && (
                    <p className="text-sm text-muted-foreground font-medium">
                        Tap to speak
                    </p>
                )}
                {micState === 'idle' && isDisabled && (
                    <p className="text-sm text-muted-foreground font-medium">
                        Waiting for response...
                    </p>
                )}
                {micState === 'requesting' && (
                    <p className="text-sm text-muted-foreground font-medium">
                        Allowing microphone...
                    </p>
                )}
                {micState === 'recording' && (
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-sm text-red-400 font-semibold">Listening...</p>
                        <p className="text-xs text-muted-foreground font-mono">{timerStr}</p>
                    </div>
                )}
                {micState === 'processing' && (
                    <p className="text-sm text-violet-400 font-medium">
                        Understanding your Spanish...
                    </p>
                )}
                {micState === 'error' && (
                    <p className="text-xs text-red-400 text-center max-w-[280px] leading-relaxed">
                        {getErrorMessage()}
                    </p>
                )}
                {interimText && micState === 'recording' && (
                    <p className="text-xs text-muted-foreground/60 italic mt-1 max-w-[280px] truncate">
                        {interimText}
                    </p>
                )}
            </div>

            {/* Confirmation Card */}
            <AnimatePresence>
                {micState === 'confirming' && currentTranscription && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="w-full max-w-sm bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4"
                    >
                        <p className="text-xs text-muted-foreground font-medium mb-2">🎤 You said:</p>
                        <p className="text-base text-foreground leading-relaxed mb-4">
                            &ldquo;{currentTranscription.transcript}&rdquo;
                        </p>

                        {/* Low confidence words */}
                        {currentTranscription.lowConfidenceWords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {currentTranscription.lowConfidenceWords.map((word, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        {word}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleConfirm}
                                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold h-10 rounded-xl"
                            >
                                <Check className="w-4 h-4 mr-1.5" /> Send
                            </Button>
                            <Button
                                onClick={handleRetry}
                                variant="ghost"
                                className="flex-1 text-muted-foreground hover:text-foreground font-semibold h-10 rounded-xl border border-border"
                            >
                                <RefreshCcw className="w-4 h-4 mr-1.5" /> Try Again
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Breathing animation keyframes */}
            <style jsx global>{`
                @keyframes breathe {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.3); }
                    50% { box-shadow: 0 0 0 8px rgba(124,58,237,0); }
                }
            `}</style>
        </div>
    );
}
