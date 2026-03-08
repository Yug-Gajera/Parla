// ============================================================
// Parlova — Audio Recorder
// MediaRecorder wrapper for capturing audio to send to Whisper
// ============================================================

const MAX_RECORDING_SECONDS = 30;

// ── Permission Check ─────────────────────────────────────────

/**
 * Check current microphone permission state.
 * Returns 'granted', 'denied', or 'prompt'.
 */
export async function requestMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
        // Try the Permissions API first (Chrome, Edge)
        if (navigator.permissions) {
            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            return result.state as 'granted' | 'denied' | 'prompt';
        }
    } catch {
        // Permissions API not supported (Safari) — fall through
    }

    // Fallback: try to get a stream to check permission
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Permission was granted — clean up the stream
        stream.getTracks().forEach(t => t.stop());
        return 'granted';
    } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            return 'denied';
        }
        return 'prompt';
    }
}

// ── Recording ────────────────────────────────────────────────

export interface RecordingSession {
    recorder: MediaRecorder;
    stream: MediaStream;
    startTime: number;
    chunks: Blob[];
    autoStopTimeout: NodeJS.Timeout | null;
}

/**
 * Start recording audio from the microphone.
 * Returns a RecordingSession object.
 */
export async function startRecording(): Promise<RecordingSession> {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        },
    });

    // Pick the best supported mime type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/mp4'; // iOS Safari fallback

    const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000,
    });

    const chunks: Blob[] = [];

    recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };

    recorder.start(250); // Collect data every 250ms

    const session: RecordingSession = {
        recorder,
        stream,
        startTime: Date.now(),
        chunks,
        autoStopTimeout: null,
    };

    // Auto-stop at max duration
    session.autoStopTimeout = setTimeout(() => {
        if (recorder.state === 'recording') {
            recorder.stop();
        }
    }, MAX_RECORDING_SECONDS * 1000);

    return session;
}

/**
 * Stop recording and return the audio blob.
 */
export function stopRecording(session: RecordingSession): Promise<Blob> {
    return new Promise((resolve) => {
        if (session.autoStopTimeout) {
            clearTimeout(session.autoStopTimeout);
        }

        const { recorder, stream, chunks } = session;

        recorder.onstop = () => {
            // Stop all tracks to release the microphone
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(chunks, { type: recorder.mimeType });
            resolve(blob);
        };

        if (recorder.state === 'recording') {
            recorder.stop();
        } else {
            // Already stopped (auto-stop triggered)
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(chunks, { type: recorder.mimeType });
            resolve(blob);
        }
    });
}

/**
 * Get the recording duration in seconds.
 */
export function getRecordingDuration(session: RecordingSession): number {
    return (Date.now() - session.startTime) / 1000;
}

// ── Audio Level Visualizer ───────────────────────────────────

/**
 * Create an audio level analyzer for a media stream.
 * Returns a function that returns the current level (0-100).
 * Call destroy() when done to clean up.
 */
export function createAudioLevelAnalyzer(stream: MediaStream) {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    return {
        getLevel(): number {
            analyser.getByteFrequencyData(dataArray);
            // Average of frequency amplitudes, normalized to 0–100
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            return Math.min(100, Math.round((avg / 128) * 100));
        },
        destroy() {
            source.disconnect();
            audioContext.close();
        },
    };
}

// ── Wake Lock (prevent screen sleep during recording) ────────

export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
    try {
        if ('wakeLock' in navigator) {
            return await navigator.wakeLock.request('screen');
        }
    } catch {
        // Wake Lock not supported or failed
    }
    return null;
}

export function releaseWakeLock(sentinel: WakeLockSentinel | null) {
    if (sentinel) {
        sentinel.release().catch(() => { });
    }
}
