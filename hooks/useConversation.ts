import { useState, useRef, useCallback, useEffect } from 'react';
import { SCENARIOS, Scenario } from '@/lib/data/scenarios';
import { toast } from 'sonner';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
}

export function useConversation(scenarioId: string, languageId: string, level: string) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    const startSession = useCallback(async () => {
        setIsLoading(true);
        setElapsedSeconds(0);
        setMessages([]);

        try {
            const res = await fetch('/api/conversation/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario_id: scenarioId, language_id: languageId, level })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to start session');

            setSessionId(data.session_id);
            setScenario(data.scenario);
            setMessages([{
                role: 'assistant',
                content: data.message,
                timestamp: new Date().toISOString()
            }]);

        } catch (err) {
            console.error(err);
            toast.error('Could not connect to conversation partner. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [scenarioId, languageId, level]);

    const sendMessage = async (text: string) => {
        if (!sessionId || !text.trim() || isStreaming) return;

        const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
        const historyForApi = [...messages]; // capture before optimistic update

        // Optimistic UI update
        setMessages(prev => [...prev, userMsg]);
        setIsStreaming(true);

        try {
            const res = await fetch('/api/conversation/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    user_message: text,
                    conversation_history: historyForApi.slice(-6), // Send last 6 messages to save context limits
                    scenario_id: scenarioId,
                    level
                })
            });

            if (!res.ok) throw new Error('API Error');
            if (!res.body) throw new Error('No stream body');

            // Setup a blank assistant message to stream into
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
                    // Update the last message in the array
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
                    duration_minutes: Math.ceil(elapsedSeconds / 60)
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            return data; // contains `scoring` and `xpEarned`
        } catch (err) {
            console.error('Failed to end session and score', err);
            toast.error('Failed to save session scores. They may take a moment to appear.');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        scenario,
        messages,
        isLoading,
        isStreaming,
        elapsedSeconds,
        startSession,
        sendMessage,
        endSession
    };
}
