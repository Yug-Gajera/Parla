let currentAudio: HTMLAudioElement | null = null;

export type AudioSpeed = 'veryslow' | 'slow' | 'normal' | 'fast';

const SPEED_MAP: Record<AudioSpeed, number> = {
    veryslow: 0.7,
    slow: 0.8,
    normal: 0.9,
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
        });

        if (!response.ok) {
            throw new Error('TTS request failed');
        }

        const audioBlob = await response.blob();
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
                currentAudio = null;
                onError?.();
                reject(new Error('Playback failed'));
            };
            audio.play().catch(reject);
        });

    } catch (error) {
        console.error('Audio error:', error);
        fallbackToWebSpeech(text, speed);
        onEnd?.();
    }
}

export function stopCurrentAudio(): void {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
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
