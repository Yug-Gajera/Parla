let currentAudio: HTMLAudioElement | null = null;
let currentAbortController: AbortController | null = null;

export type AudioSpeed = 'veryslow' | 'slow' | 'normal' | 'fast';

const SPEED_MAP: Record<AudioSpeed, number> = {
    veryslow: 0.75,
    slow: 0.85,
    normal: 0.95,
    fast: 1.0,
};

export async function playSpanishAudio(
    text: string,
    speed: AudioSpeed = 'slow',
    voice: string = 'nova',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: () => void
): Promise<void> {

    stopCurrentAudio();

    const abortController = new AbortController();
    currentAbortController = abortController;

    try {
        onStart?.();

        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                speed: SPEED_MAP[speed],
                voice,
            }),
            signal: abortController.signal,
        });

        // Bail out silently if this call was cancelled
        if (abortController.signal.aborted) return;

        if (!response.ok) {
            throw new Error('TTS request failed');
        }

        const audioBlob = await response.blob();

        if (abortController.signal.aborted) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudio = audio;

        await new Promise<void>((resolve, reject) => {
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                currentAudio = null;
                onEnd?.();
                resolve();
            };
            audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                // Only treat as real error if not intentionally aborted
                if (!abortController.signal.aborted) {
                    currentAudio = null;
                    onError?.();
                    reject(new Error('Playback failed'));
                } else {
                    resolve();
                }
            };
            audio.play().catch(err => {
                if (!abortController.signal.aborted) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

    } catch (error) {
        // Only fallback to Web Speech if this was a real failure,
        // not an intentional cancellation from stopCurrentAudio()
        if (abortController.signal.aborted) return;

        console.error('Audio error:', error);
        fallbackToWebSpeech(text, speed);
        onEnd?.();
    }
}

export function stopCurrentAudio(): void {
    // Abort any in-flight fetch
    if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
    }

    // Stop HTML audio playback
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
    }

    // Cancel any active Web Speech fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

function fallbackToWebSpeech(
    text: string,
    speed: AudioSpeed
): void {
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = SPEED_MAP[speed];
    window.speechSynthesis.speak(utterance);
}
