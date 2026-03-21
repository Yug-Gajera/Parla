import { useState, useRef, useCallback, useEffect } from 'react';
import { SCENARIOS } from '@/lib/data/scenarios';
import type { Scenario } from '@/types';
import { toast } from 'sonner';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
    voiceData?: {
        confidence: number;
        lowConfidenceWords: string[];
        usedWhisper: boolean;
        durationSeconds: number;
    };
}

export type ConversationPhase = 'idle' | 'pre-session' | 'active' | 'ended';

export interface TranscriptionRecord {
    message_index: number;
    spoken_text: string;
    transcription_confidence: number;
    low_confidence_words: string[];
    used_whisper: boolean;
    recording_duration_seconds: number;
}

export function useConversation(scenarioId: string, languageId: string, level: string) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Situation state
    const [situationName, setSituationName] = useState<string | null>(null);
    const [situationTeaser, setSituationTeaser] = useState<string | null>(null);
    const [situationTwist, setSituationTwist] = useState<string | null>(null);
    const [situationId, setSituationId] = useState<string | null>(null);
    const [phase, setPhase] = useState<ConversationPhase>('idle');

    // Voice mode state
    const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
    const pronunciationDataRef = useRef<TranscriptionRecord[]>([]);

    // Timer logic
    useEffect(() => {
        if (sessionId && !timerRef.current) {
            timerRef.current = setInterval(() => {
                setElapsedSeconds(s => s + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sessionId]);

    const startSession = useCallback(async (skipSituationId?: string) => {
        setIsLoading(true);
        setElapsedSeconds(0);
        setMessages([]);

        try {
            const res = await fetch('/api/conversation/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario_id: scenarioId,
                    language_id: languageId,
                    level,
                    skip_situation_id: skipSituationId,
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to start session');

            setSessionId(data.session_id);
            setScenario(data.scenario);
            setSituationName(data.situation_name);
            setSituationTeaser(data.situation_teaser);
            setSituationTwist(data.situation_twist);
            setSituationId(data.situation_id);
            setMessages([{
                role: 'assistant',
                content: data.message,
                timestamp: new Date().toISOString()
            }]);
            setPhase('active');

        } catch (err) {
            console.error(err);
            toast.error('Could not connect to conversation partner. Please try again.');
            setPhase('idle');
        } finally {
            setIsLoading(false);
        }
    }, [scenarioId, languageId, level]);

    // Pre-session: fetch situation info without starting conversation yet
    const prepareSession = useCallback(async () => {
        setIsLoading(true);
        setPhase('pre-session');

        const foundScenario = SCENARIOS.find(s => s.id === scenarioId);
        if (foundScenario) {
            setScenario(foundScenario);
        }

        // We'll start the actual session when user confirms
        setIsLoading(false);
    }, [scenarioId]);

    const skipToNewVariation = useCallback(async () => {
        // Start a new session with a different situation
        await startSession(situationId || undefined);
    }, [startSession, situationId]);

    const sendMessage = async (
        text: string,
        voiceData?: {
            confidence: number;
            lowConfidenceWords: string[];
            usedWhisper: boolean;
            durationSeconds: number;
        }
    ) => {
        if (!sessionId || !text.trim() || isStreaming) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
            voiceData,
        };
        const historyForApi = [...messages];

        // Track pronunciation data for scoring
        if (voiceData) {
            pronunciationDataRef.current.push({
                message_index: messages.filter(m => m.role === 'user').length,
                spoken_text: text,
                transcription_confidence: voiceData.confidence,
                low_confidence_words: voiceData.lowConfidenceWords,
                used_whisper: voiceData.usedWhisper,
                recording_duration_seconds: voiceData.durationSeconds,
            });
        }

        setMessages(prev => [...prev, userMsg]);
        setIsStreaming(true);

        try {
            const res = await fetch('/api/conversation/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    user_message: text,
                    conversation_history: historyForApi.slice(-6),
                    scenario_id: scenarioId,
                    level,
                    // Voice metadata
                    transcription_confidence: voiceData?.confidence,
                    low_confidence_words: voiceData?.lowConfidenceWords,
                    used_whisper: voiceData?.usedWhisper,
                    recording_duration: voiceData?.durationSeconds,
                })
            });

            if (!res.ok) throw new Error('API Error');
            if (!res.body) throw new Error('No stream body');

            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString() }]);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let finalContent = '';

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    finalContent += chunk;
                    setMessages(prev => {
                        const newArr = [...prev];
                        newArr[newArr.length - 1] = {
                            ...newArr[newArr.length - 1],
                            content: finalContent
                        };
                        return newArr;
                    });
                }
            }

        } catch (err) {
            console.error('Streaming error', err);
            toast.error('Connection lost. Please try saying that again.');
        } finally {
            setIsStreaming(false);
        }
    };

    const switchToTextMode = useCallback(() => {
        setInputMode('text');
    }, []);

    const endSession = async () => {
        if (!sessionId) return null;
        setIsLoading(true);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;

        try {
            const res = await fetch('/api/conversation/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    scenario_id: scenarioId,
                    level,
                    duration_minutes: Math.ceil(elapsedSeconds / 60),
                    input_mode: inputMode,
                    transcription_data: pronunciationDataRef.current,
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setPhase('ended');
            return data; // contains `scoring`, `xpEarned`, situation info
        } catch (err) {
            console.error('Failed to end session and score', err);
            toast.error('Failed to save session scores. They may take a moment to appear.');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const resetConversation = useCallback(() => {
        setSessionId(null);
        setScenario(null);
        setMessages([]);
        setSituationName(null);
        setSituationTeaser(null);
        setSituationTwist(null);
        setSituationId(null);
        setPhase('idle');
        setElapsedSeconds(0);
        setInputMode('voice');
        pronunciationDataRef.current = [];
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
    }, []);

    return {
        scenario,
        messages,
        isLoading,
        isStreaming,
        elapsedSeconds,
        phase,
        situationName,
        situationTeaser,
        situationTwist,
        situationId,
        inputMode,
        startSession,
        prepareSession,
        skipToNewVariation,
        sendMessage,
        endSession,
        resetConversation,
        sessionId,
        switchToTextMode,
    };
}
