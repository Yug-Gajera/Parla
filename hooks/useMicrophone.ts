"use client";

// ============================================================
// Parlova — Microphone Hook
// Manages mic hardware, permission, recording, and Web Speech
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import {
    isWebSpeechSupported,
    transcribeWithWebSpeech,
    transcribeAudio,
    type WebSpeechResult,
    type TranscriptionResult,
} from '@/lib/voice/transcription';
import {
    requestMicrophonePermission,
    startRecording as startAudioRecording,
    stopRecording as stopAudioRecording,
    getRecordingDuration,
    createAudioLevelAnalyzer,
    requestWakeLock,
    releaseWakeLock,
    type RecordingSession,
} from '@/lib/voice/recorder';

export type MicState =
    | 'idle'
    | 'requesting'
    | 'recording'
    | 'processing'
    | 'confirming'
    | 'error';

export interface MicError {
    code: string;
    message: string;
}

export function useMicrophone(language: string = 'es-ES') {
    const [micState, setMicState] = useState<MicState>('idle');
    const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    const [currentTranscription, setCurrentTranscription] = useState<TranscriptionResult | null>(null);
    const [interimText, setInterimText] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [error, setError] = useState<MicError | null>(null);

    const recordingRef = useRef<RecordingSession | null>(null);
    const audioAnalyzerRef = useRef<ReturnType<typeof createAudioLevelAnalyzer> | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const animFrameRef = useRef<number>(0);
    const webSpeechResultRef = useRef<WebSpeechResult | null>(null);

    const webSpeechSupported = typeof window !== 'undefined' && isWebSpeechSupported();

    // ── Check permission ─────────────────────────────────────
    const checkPermission = useCallback(async () => {
        const status = await requestMicrophonePermission();
        setMicPermission(status);
        return status;
    }, []);

    // ── Audio level animation loop ───────────────────────────
    const startLevelMonitor = useCallback((stream: MediaStream) => {
        const analyzer = createAudioLevelAnalyzer(stream);
        audioAnalyzerRef.current = analyzer;

        const update = () => {
            if (audioAnalyzerRef.current) {
                setAudioLevel(analyzer.getLevel());
                animFrameRef.current = requestAnimationFrame(update);
            }
        };
        animFrameRef.current = requestAnimationFrame(update);
    }, []);

    const stopLevelMonitor = useCallback(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        audioAnalyzerRef.current?.destroy();
        audioAnalyzerRef.current = null;
        setAudioLevel(0);
    }, []);

    // ── Start recording ──────────────────────────────────────
    const startListening = useCallback(async () => {
        setError(null);
        setCurrentTranscription(null);
        setInterimText('');
        setRecordingSeconds(0);
        webSpeechResultRef.current = null;

        setMicState('requesting');

        try {
            // Start MediaRecorder (for Whisper fallback)
            const session = await startAudioRecording();
            recordingRef.current = session;

            // Start audio level monitoring
            startLevelMonitor(session.stream);

            // Request wake lock
            wakeLockRef.current = await requestWakeLock();

            setMicState('recording');

            // Start recording timer
            timerRef.current = setInterval(() => {
                setRecordingSeconds(s => {
                    if (s >= 29) {
                        // Auto-stop at 30 seconds
                        stopListening();
                        return 30;
                    }
                    return s + 1;
                });
            }, 1000);

            // Start Web Speech in parallel (if supported)
            if (webSpeechSupported) {
                transcribeWithWebSpeech(language, (interim) => {
                    setInterimText(interim);
                })
                    .then((result) => {
                        webSpeechResultRef.current = result;
                    })
                    .catch(() => {
                        // Web Speech failed — we'll use Whisper
                        webSpeechResultRef.current = null;
                    });
            }

        } catch (err: any) {
            const code = err?.name === 'NotAllowedError' ? 'not-allowed'
                : err?.name === 'NotFoundError' ? 'audio-capture'
                    : err?.code || 'unknown';

            setError({
                code,
                message: err?.message || 'Failed to start recording',
            });
            setMicState('error');
            setMicPermission(code === 'not-allowed' ? 'denied' : micPermission);

            // Auto-recover for non-permission errors
            if (code !== 'not-allowed') {
                setTimeout(() => setMicState('idle'), 3000);
            }
        }
    }, [language, micPermission, startLevelMonitor, webSpeechSupported]);

    // ── Stop recording ───────────────────────────────────────
    const stopListening = useCallback(async () => {
        // Stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Stop level monitor
        stopLevelMonitor();

        // Release wake lock
        releaseWakeLock(wakeLockRef.current);
        wakeLockRef.current = null;

        if (!recordingRef.current) {
            setMicState('idle');
            return;
        }

        setMicState('processing');

        try {
            const duration = getRecordingDuration(recordingRef.current);
            const audioBlob = await stopAudioRecording(recordingRef.current);
            recordingRef.current = null;

            // Wait a moment for Web Speech to finalize
            await new Promise(r => setTimeout(r, 300));

            const result = await transcribeAudio(
                audioBlob,
                webSpeechResultRef.current,
                duration
            );

            if (!result.transcript.trim()) {
                setError({ code: 'no-speech', message: 'No speech detected. Tap to try again.' });
                setMicState('error');
                setTimeout(() => setMicState('idle'), 2000);
                return;
            }

            setCurrentTranscription(result);
            setInterimText('');
            setMicState('confirming');

        } catch (err: any) {
            setError({
                code: err?.code || 'unknown',
                message: err?.message || 'Transcription failed',
            });
            setMicState('error');
            setTimeout(() => setMicState('idle'), 3000);
        }
    }, [stopLevelMonitor]);

    // ── Confirm / Retry ──────────────────────────────────────
    const confirmTranscription = useCallback((): TranscriptionResult | null => {
        const result = currentTranscription;
        setCurrentTranscription(null);
        setMicState('idle');
        setRecordingSeconds(0);
        return result;
    }, [currentTranscription]);

    const retryRecording = useCallback(() => {
        setCurrentTranscription(null);
        setInterimText('');
        setMicState('idle');
        setRecordingSeconds(0);
    }, []);

    // ── Cleanup on unmount ───────────────────────────────────
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            audioAnalyzerRef.current?.destroy();
            releaseWakeLock(wakeLockRef.current);
            if (recordingRef.current) {
                recordingRef.current.stream.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    return {
        micState,
        micPermission,
        currentTranscription,
        interimText,
        audioLevel,
        recordingSeconds,
        error,
        webSpeechSupported,
        checkPermission,
        startListening,
        stopListening,
        confirmTranscription,
        retryRecording,
    };
}
