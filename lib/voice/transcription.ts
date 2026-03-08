// ============================================================
// Parlova — Voice Transcription Service
// Web Speech API primary + Whisper API fallback
// ============================================================

// ── Types ────────────────────────────────────────────────────

export interface WebSpeechResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
}

export interface WhisperResult {
    transcript: string;
    confidence: number;
    wordConfidences: { word: string; confidence: number }[];
    duration: number;
    used_whisper: true;
}

export interface TranscriptionResult {
    transcript: string;
    confidence: number;
    lowConfidenceWords: string[];
    usedWhisper: boolean;
    durationSeconds: number;
}

// ── Web Speech API ───────────────────────────────────────────

/**
 * Check if the browser supports Web Speech API
 */
export function isWebSpeechSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
    );
}

/**
 * Get the SpeechRecognition constructor
 */
function getSpeechRecognition(): any | null {
    if (typeof window === 'undefined') return null;
    return (
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        null
    );
}

/**
 * Transcribe speech using the browser's Web Speech API.
 * Returns a promise that resolves when the user stops speaking.
 */
export function transcribeWithWebSpeech(
    language: string = 'es-ES',
    onInterim?: (text: string) => void
): Promise<WebSpeechResult> {
    return new Promise((resolve, reject) => {
        const SpeechRecognitionClass = getSpeechRecognition();
        if (!SpeechRecognitionClass) {
            reject({ code: 'not-supported', message: 'Web Speech API not supported' });
            return;
        }

        const recognition = new SpeechRecognitionClass();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;

        let finalResult: WebSpeechResult | null = null;

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let bestTranscript = '';
            let bestConfidence = 0;
            let isFinal = false;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    bestTranscript = result[0].transcript;
                    bestConfidence = result[0].confidence || 0.85; // Some browsers don't report confidence
                    isFinal = true;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            if (interimTranscript && onInterim) {
                onInterim(interimTranscript);
            }

            if (isFinal) {
                finalResult = {
                    transcript: bestTranscript.trim(),
                    confidence: bestConfidence,
                    isFinal: true,
                };
            }
        };

        recognition.onend = () => {
            if (finalResult) {
                resolve(finalResult);
            } else {
                reject({ code: 'no-speech', message: 'No speech detected' });
            }
        };

        recognition.onerror = (event: any) => {
            const errorMap: Record<string, string> = {
                'not-allowed': 'Microphone access denied',
                'no-speech': 'No speech detected',
                'audio-capture': 'Microphone not found',
                'network': 'Network error during recognition',
                'aborted': 'Recognition was aborted',
            };
            reject({
                code: event.error || 'unknown',
                message: errorMap[event.error] || 'Speech recognition error',
            });
        };

        recognition.start();
    });
}

/**
 * Abort an active Web Speech recognition instance
 */
export function createWebSpeechController(language: string = 'es-ES') {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return null;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    return recognition;
}

// ── Whisper API (server-side fallback) ───────────────────────

/**
 * Transcribe audio using OpenAI Whisper via our API route.
 * Only called when Web Speech is unavailable or low-confidence.
 */
export async function transcribeWithWhisper(
    audioBlob: Blob,
    language: string = 'es'
): Promise<WhisperResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);

    const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Whisper transcription failed');
    }

    const data = await res.json();

    return {
        transcript: data.transcript,
        confidence: data.confidence,
        wordConfidences: data.wordConfidences || [],
        duration: data.duration || 0,
        used_whisper: true,
    };
}

// ── Combined Transcription Function ──────────────────────────

/**
 * Unified transcription: uses Web Speech result if confident,
 * otherwise falls back to Whisper.
 */
export async function transcribeAudio(
    audioBlob: Blob | null,
    webSpeechResult: WebSpeechResult | null,
    recordingDuration: number = 0
): Promise<TranscriptionResult> {
    // Case 1: Good Web Speech result
    if (webSpeechResult && webSpeechResult.confidence >= 0.7) {
        return {
            transcript: webSpeechResult.transcript,
            confidence: webSpeechResult.confidence,
            lowConfidenceWords: [], // Web Speech doesn't give per-word confidence
            usedWhisper: false,
            durationSeconds: recordingDuration,
        };
    }

    // Case 2: Low-confidence Web Speech — try Whisper
    if (webSpeechResult && webSpeechResult.confidence < 0.7 && audioBlob) {
        try {
            const whisperResult = await transcribeWithWhisper(audioBlob);
            return {
                transcript: whisperResult.transcript,
                confidence: whisperResult.confidence,
                lowConfidenceWords: whisperResult.wordConfidences
                    .filter(w => w.confidence < 0.6)
                    .map(w => w.word),
                usedWhisper: true,
                durationSeconds: whisperResult.duration || recordingDuration,
            };
        } catch {
            // Whisper failed — use the low-confidence Web Speech result anyway
            return {
                transcript: webSpeechResult.transcript,
                confidence: webSpeechResult.confidence,
                lowConfidenceWords: [],
                usedWhisper: false,
                durationSeconds: recordingDuration,
            };
        }
    }

    // Case 3: No Web Speech at all — use Whisper
    if (!webSpeechResult && audioBlob) {
        const whisperResult = await transcribeWithWhisper(audioBlob);
        return {
            transcript: whisperResult.transcript,
            confidence: whisperResult.confidence,
            lowConfidenceWords: whisperResult.wordConfidences
                .filter(w => w.confidence < 0.6)
                .map(w => w.word),
            usedWhisper: true,
            durationSeconds: whisperResult.duration || recordingDuration,
        };
    }

    throw new Error('No transcription source available');
}
