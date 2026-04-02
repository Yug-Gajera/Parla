"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSpanishAudio } from '@/lib/playAudio';
import { Loader2, Send, Mic2, Bot, CheckCircle2 } from 'lucide-react';
import { MicrophoneButton } from '@/components/conversation/MicrophoneButton';
import { type TranscriptionResult } from '@/lib/voice/transcription';

const TIPS = [
    "There are no wrong answers here 🎙️",
    "Parlo is endlessly patient — take your time",
    "Even one word is a great response",
    "You are doing amazingly well",
    "Every Spanish speaker started exactly here"
];

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

interface FirstConversationWindowProps {
    languageId: string;
    sessionId: string | null;
    onComplete: () => void;
}

export function FirstConversationWindow({ languageId, sessionId: initialSessionId, onComplete }: FirstConversationWindowProps) {
    const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [input, setInput] = useState('');
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Rotate tips every 30s
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTipIndex(prev => (prev + 1) % TIPS.length);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isStreaming]);

    const speakMessage = (text: string) => {
        // Strip the [English] parts from the speech
        const cleanText = text.replace(/\[[^\]]+\]/g, '').trim();
        playSpanishAudio(cleanText, 'slow');
    };

    // Auto-play AI messages when they finish streaming
    const lastMessageRef = useRef<string>('');
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && !isStreaming && lastMsg.content !== lastMessageRef.current) {
            speakMessage(lastMsg.content);
            lastMessageRef.current = lastMsg.content;
        }
    }, [messages, isStreaming]);

    // Start session if no session ID
    useEffect(() => {
        if (!sessionId) {
            const start = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch('/api/first-conversation/start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ language_id: languageId })
                    });
                    const data = await res.json();
                    if (data.success) {
                        setSessionId(data.session_id);
                        setMessages([{ role: 'assistant', content: data.message }]);
                    }
                } catch (e) {
                    console.error('Failed to start first conversation', e);
                } finally {
                    setIsLoading(false);
                }
            };
            start();
        }
    }, [sessionId, languageId]);

    const handleSend = async (textOverride?: string) => {
        const text = textOverride ?? input;
        if (!text.trim() || isStreaming || !sessionId) return;

        setInput('');
        const newUserMessage = { role: 'user' as const, content: text, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);
        setIsStreaming(true);

        try {
            const res = await fetch('/api/first-conversation/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    user_message: text,
                    conversation_history: messages
                })
            });

            if (!res.body) throw new Error('No body');
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedAiResponse = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                accumulatedAiResponse += chunk;

                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { role: 'assistant', content: accumulatedAiResponse };
                    return newMsgs;
                });
            }

            // Check for completion marker
            if (accumulatedAiResponse.includes('[FIRST_CONVERSATION_COMPLETE]')) {
                // Strip marker from display
                const cleanResponse = accumulatedAiResponse.replace('[FIRST_CONVERSATION_COMPLETE]', '').trim();
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { role: 'assistant', content: cleanResponse };
                    return newMsgs;
                });

                // Complete session in DB
                await fetch('/api/first-conversation/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId, language_id: languageId })
                });

                // Wait 2 seconds before celebration screen
                setTimeout(() => {
                    onComplete();
                }, 2000);
            }

        } catch (e) {
            console.error('Message stream error', e);
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    const handleTranscriptionComplete = useCallback((result: TranscriptionResult) => {
        handleSend(result.transcript);
    }, [handleSend]);

    // Calculate step progress (based on AI turns)
    const aiTurns = messages.filter(m => m.role === 'assistant').length;
    let currentStep = Math.min(6, Math.max(1, aiTurns));

    // Message bubble renderer
    const renderMessageContent = (content: string, role: string) => {
        if (role === 'user') return <p className="text-[16px] leading-relaxed text-background">{content}</p>;

        // Simple regex to extract bracketed English text: "Spanish [English]"
        // Replace brackets with specific styling spans
        const parts = content.split(/(\[[^[\]]+\])/);

        return (
            <div className="flex flex-col gap-1">
                {parts.map((part, i) => {
                    if (part.startsWith('[') && part.endsWith(']')) {
                        return <span key={i} className="text-[13px] text-text-muted mt-0.5 block">{part.substring(1, part.length - 1)}</span>;
                    }
                    if (part.trim() !== '') {
                        return <span key={i} className="text-[17px] leading-relaxed text-text-primary block mt-1">{part}</span>;
                    }
                    return null;
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col pt-safe-top pb-safe-bottom">
            {/* Header + Progress Dots */}
            <header className="h-16 px-4 flex flex-col justify-center items-center border-b border-border bg-surface shrink-0">
                <div className="scenario-pill mb-2 mt-2 font-display bg-[#FFE0D1] text-[#E8521A] border-[#FFC2A8]">
                    First Conversation with Parlo
                </div>
                <div className="flex gap-2 items-center mb-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="relative flex items-center justify-center">
                            {n < currentStep ? (
                                <div className="w-[10px] h-[10px] rounded-full bg-[#E8521A] flex items-center justify-center">
                                    <CheckCircle2 className="w-2 h-2 text-white" />
                                </div>
                            ) : n === currentStep ? (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#E8521A]" />
                            ) : (
                                <div className="w-2.5 h-2.5 rounded-full bg-border-strong" />
                            )}
                        </div>
                    ))}
                </div>
            </header>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 w-full max-w-[760px] mx-auto overflow-y-auto px-4 py-8 scroll-smooth">
                {isLoading && messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                        <Loader2 className="w-8 h-8 animate-spin text-[#E8521A] mb-4" />
                        <p className="font-body text-[14px]">Connecting to Parlo...</p>
                    </div>
                ) : (
                    <div className="flex flex-col w-full pb-10">
                        <AnimatePresence>
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                                >
                                    {m.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-[#FFF5F0] border border-[#FFE0D1] flex items-center justify-center shrink-0 mt-auto mr-2">
                                            <Bot className="w-5 h-5 text-[#E8521A]" />
                                        </div>
                                    )}
                                    <div className={`px-4 pt-3 pb-3 rounded-2xl max-w-[85%] border shadow-sm ${
                                        m.role === 'user' 
                                            ? 'bg-text-primary text-background rounded-br-sm border-transparent' 
                                            : 'bg-surface border-border rounded-bl-sm text-text-primary'
                                    }`}>
                                        {renderMessageContent(m.content, m.role)}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* AI Typing Indicator */}
                        {isLoading && !isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                            <div className="flex w-full justify-start mb-4 animate-fade-up">
                                <div className="w-8 h-8 rounded-full bg-[#FFF5F0] border border-[#FFE0D1] flex items-center justify-center shrink-0 mt-auto mr-2">
                                    <Bot className="w-5 h-5 text-[#E8521A]" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl bg-surface rounded-bl-sm border border-border flex items-center gap-1 h-12">
                                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-[bounce_1s_infinite]" />
                                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-[bounce_1s_infinite_0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-[bounce_1s_infinite_0.3s]" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="w-full border-t border-border bg-surface shrink-0 flex flex-col relative pb-safe-bottom">
                
                {/* Encouragement Banner */}
                <div className="absolute top-0 left-0 right-0 -translate-y-full px-4 py-2 bg-[#FFF5F0] border-t border-[#FFE0D1]">
                    <AnimatePresence mode="wait">
                        <motion.p 
                            key={currentTipIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-center font-body text-[12px] text-[#E8521A] font-medium"
                        >
                            {TIPS[currentTipIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                <div className="w-full max-w-[760px] mx-auto p-4 flex flex-col items-center gap-4">
                    <div className="w-full flex justify-between items-end gap-3">
                        <div className="flex-1 relative flex flex-col items-center">
                            <textarea
                                className="parlova-input min-h-[52px] max-h-[140px] resize-none pr-14 rounded-[26px] scrollbar-none w-full shadow-md"
                                placeholder="Type your response..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                disabled={isLoading || isStreaming}
                                rows={1}
                            />
                            <button
                                className={`absolute right-1.5 bottom-1.5 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                                    ${(!input.trim() || isLoading || isStreaming) ? 'bg-border-strong text-text-muted' : 'bg-[#E8521A] text-white hover:bg-[#E8521A]/90 shadow-md'}`}
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading || isStreaming}
                            >
                                <Send className="w-[18px] h-[18px] ml-0.5" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center shrink-0">
                            <div className="scale-75 origin-bottom">
                                <MicrophoneButton 
                                    onTranscriptionComplete={handleTranscriptionComplete} 
                                    isDisabled={isLoading || isStreaming}
                                />
                            </div>
                            <span className="text-[10px] text-text-muted mt-1 font-medium font-body uppercase tracking-widest hidden sm:block">Or speak</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
