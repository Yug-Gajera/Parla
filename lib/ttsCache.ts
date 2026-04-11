import { AudioSpeed, SPEED_MAP } from './playAudio';

// Cache for prefetched TTS audio URLs, keyed by phrase text
const audioCache = new Map<string, string>();

// Track in-flight prefetch requests to avoid duplicates
const inFlightPrefetches = new Map<string, Promise<string | null>>();

// Current abort controller for canceling in-flight fetches
let currentAbortController: AbortController | null = null;

// Current audio element for playback
let currentAudio: HTMLAudioElement | null = null;

/**
 * Generate a cache key from text, speed, and voice
 */
function getCacheKey(text: string, speed: AudioSpeed, voice: string): string {
    return `${text}|${speed}|${voice}`;
}

/**
 * Prefetch TTS audio and store in cache
 * Returns the object URL if successful, null otherwise
 */
export async function prefetchAudio(
    text: string,
    speed: AudioSpeed = 'veryslow',
    voice: string = 'nova'
): Promise<string | null> {
    const cleanText = text.replace(/\.\.\./g, '');
    const cacheKey = getCacheKey(cleanText, speed, voice);

    // Return existing cached URL if available
    if (audioCache.has(cacheKey)) {
        return audioCache.get(cacheKey)!;
    }

    // Check if already being prefetched
    if (inFlightPrefetches.has(cacheKey)) {
        return inFlightPrefetches.get(cacheKey)!;
    }

    // Start new prefetch
    const prefetchPromise = (async (): Promise<string | null> => {
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: cleanText,
                    speed: SPEED_MAP[speed],
                    voice,
                }),
            });

            if (!response.ok) {
                throw new Error('TTS prefetch request failed');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Store in cache
            audioCache.set(cacheKey, audioUrl);
            inFlightPrefetches.delete(cacheKey);

            return audioUrl;
        } catch (error) {
            inFlightPrefetches.delete(cacheKey);
            console.error('TTS prefetch error:', error);
            return null;
        }
    })();

    inFlightPrefetches.set(cacheKey, prefetchPromise);
    return prefetchPromise;
}

/**
 * Prefetch multiple phrases in parallel
 */
export async function prefetchPhrases(
    phrases: string[],
    speed: AudioSpeed = 'veryslow',
    voice: string = 'nova'
): Promise<void> {
    await Promise.all(phrases.map(phrase => prefetchAudio(phrase, speed, voice)));
}

/**
 * Play audio from cache, fetching if not available
 * Similar signature to playSpanishAudio for easy replacement
 */
export async function playFromCache(
    text: string,
    speed: AudioSpeed = 'veryslow',
    voice: string = 'nova',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: () => void
): Promise<void> {
    const cleanText = text.replace(/\.\.\./g, '');
    const cacheKey = getCacheKey(cleanText, speed, voice);

    // Stop any current playback
    stopCachedAudio();

    const abortController = new AbortController();
    currentAbortController = abortController;

    try {
        onStart?.();

        let audioUrl: string | null | undefined = audioCache.get(cacheKey);

        // If not in cache, wait for in-flight prefetch or fetch now
        if (!audioUrl) {
            // Check if prefetch is in progress
            const inFlight = inFlightPrefetches.get(cacheKey);
            if (inFlight) {
                audioUrl = await inFlight;
            } else {
                // Fetch now
                audioUrl = await prefetchAudio(cleanText, speed, voice);
            }
        }

        if (abortController.signal.aborted) return;

        if (!audioUrl) {
            throw new Error('Failed to get audio URL');
        }

        const audio = new Audio(audioUrl);
        currentAudio = audio;

        await new Promise<void>((resolve, reject) => {
            audio.onended = () => {
                currentAudio = null;
                onEnd?.();
                resolve();
            };
            audio.onerror = () => {
                currentAudio = null;
                if (!abortController.signal.aborted) {
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
        if (abortController.signal.aborted) return;
        console.error('Cached audio error:', error);
        // Fallback to Web Speech API
        fallbackToWebSpeech(cleanText, speed);
        onEnd?.();
    }
}

/**
 * Stop current audio playback
 */
export function stopCachedAudio(): void {
    // Abort any in-flight fetch
    if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
    }

    // Stop HTML audio playback (don't revoke - it's cached)
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

/**
 * Clear all cached audio URLs and revoke object URLs
 * Call this when the scenario unmounts
 */
export function clearCache(): void {
    stopCachedAudio();

    // Revoke all object URLs
    audioCache.forEach((url) => {
        URL.revokeObjectURL(url);
    });
    audioCache.clear();

    // Clear any pending prefetches
    inFlightPrefetches.clear();
}

/**
 * Check if a phrase is cached
 */
export function isCached(text: string, speed: AudioSpeed = 'veryslow', voice: string = 'nova'): boolean {
    const cleanText = text.replace(/\.\.\./g, '');
    const cacheKey = getCacheKey(cleanText, speed, voice);
    return audioCache.has(cacheKey);
}

/**
 * Get cache size (for debugging)
 */
export function getCacheSize(): number {
    return audioCache.size;
}

// Web Speech API fallback
function fallbackToWebSpeech(text: string, speed: AudioSpeed): void {
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = SPEED_MAP[speed];
    window.speechSynthesis.speak(utterance);
}