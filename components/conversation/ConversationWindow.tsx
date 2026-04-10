"use client";

// ============================================================
// Parlova — Conversation Window (Redesigned)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation } from '@/hooks/useConversation';
import { useSituationHistory } from '@/hooks/useSituationHistory';
import { MessageBubble } from './MessageBubble';
import { MicrophoneButton } from './MicrophoneButton';
import { ScoreCard } from './ScoreCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Loader2, StopCircle, Keyboard, Mic2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type TranscriptionResult } from '@/lib/voice/transcription';
import { useProfile } from '@/hooks/useProfile';
import { SuggestedReplies, type Suggestion } from './SuggestedReplies';
import { SpeakReplyModal } from './SpeakReplyModal';
import { RateLimitWarning } from '@/components/ui/RateLimitWarning';

interface ConversationWindowProps {
    scenarioId: string;
    languageId: string;
    level: string;
    onClose: () => void;
}

export function ConversationWindow({ scenarioId, languageId, level, onClose }: ConversationWindowProps) {
    const {
        scenario, messages, isLoading, isStreaming, elapsedSeconds,
        situationName, situationTwist, situationId, sessionId,
        inputMode, switchToTextMode,
        startSession, sendMessage, endSession, resetConversation, rateLimit,
    } = useConversation(scenarioId, languageId, level);

    const { getCompletedSituationIds, getBestScore, refetch: refetchHistory } = useSituationHistory(languageId);
    const { settings } = useProfile();

    const [input, setInput] = useState('');
    const [scoringData, setScoringData] = useState<any>(null);
    const [showTextSwitch, setShowTextSwitch] = useState(false);
    const [activeSpeakSuggestion, setActiveSpeakSuggestion] = useState<Suggestion | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timerStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;

    useEffect(() => {
        startSession();
    }, [scenarioId]); 

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isStreaming]);

    useEffect(() => {
        const handleResize = () => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleTranscriptionComplete = useCallback((result: TranscriptionResult) => {
        sendMessage(result.transcript, {
            confidence: result.confidence,
            lowConfidenceWords: result.lowConfidenceWords,
            usedWhisper: result.usedWhisper,
            durationSeconds: result.durationSeconds,
        });
    }, [sendMessage]);

    const handleSend = () => {
        if (!input.trim() || isStreaming) return;
        sendMessage(input);
        setInput('');
    };

    const handleTextSwitchConfirm = () => {
        switchToTextMode();
        setShowTextSwitch(false);
    };

    const handleEnd = async () => {
        const confirm = window.confirm("Ready to finish? See how you did.");
        if (!confirm) return;

        const result = await endSession();
        if (result && result.scoring) {
            await refetchHistory();
            setScoringData(result);
        } else {
            onClose();
        }
    };

    const handleReplay = () => {
        setScoringData(null);
        resetConversation();
        startSession();
    };

    const handleTryAnother = () => {
        setScoringData(null);
        resetConversation();
        startSession(situationId || undefined);
    };

    const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant');

    if (scoringData) {
        const completedIds = getCompletedSituationIds(scenarioId);
        const bestScores: Record<string, number | null> = {};
        (scenario?.situations || []).forEach(sit => {
            bestScores[sit.id] = getBestScore(scenarioId, sit.id);
        });

        return (
            <ScoreCard
                scoring={scoringData.scoring}
                xpEarned={scoringData.xpEarned}
                scenario={scenario}
                onClose={onClose}
                situationName={situationName}
                situationTwist={situationTwist}
                situationId={situationId}
                onReplay={handleReplay}
                onTryAnother={handleTryAnother}
                completedSituationIds={completedIds}
                situationBestScores={bestScores}
                inputMode={scoringData.input_mode}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col pt-safe-top pb-safe-bottom">
            {/* Top Bar */}
            <header className="top-bar h-16 px-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => {
                        if (messages.length > 1) {
                            if (window.confirm("End this conversation? Your progress will be scored.")) handleEnd();
                        } else {
                            onClose();
                        }
                    }} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-card-hover transition-colors">
                        <ArrowLeft className="w-5 h-5 text-text-primary" />
                    </button>
                    <div className="flex flex-col">
                        <span className="font-display text-lg font-semibold leading-tight text-text-primary">
                            {scenario?.name || 'Conversation'}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            <span className="font-mono-num text-xs text-text-secondary">{timerStr}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {inputMode === 'voice' && (
                        <button onClick={() => setShowTextSwitch(true)} className="btn-ghost btn-sm px-3 flex items-center gap-2 h-9 rounded-full text-xs font-bold uppercase tracking-widest">
                            <Keyboard className="w-4 h-4" /> Type
                        </button>
                    )}
                    <button onClick={handleEnd} disabled={isLoading || messages.length < 2} className="btn-primary btn-sm px-4 flex items-center gap-2 h-9 rounded-full text-xs font-bold uppercase tracking-widest">
                        <StopCircle className="w-4 h-4" /> Finish
                    </button>
                </div>
            </header>

            {/* Text Switch Confirmation */}
            <AnimatePresence>
                {showTextSwitch && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-16 left-0 right-0 z-20 bg-surface border-b border-border p-4 shadow-2xl"
                    >
                        <p className="text-sm text-center mb-4 text-text-primary">
                            Switch to text for this session?<br />
                            <span className="text-text-secondary text-xs">You can speak again next time.</span>
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={handleTextSwitchConfirm} className="btn-secondary px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Keyboard className="w-4 h-4" /> Switch to Text
                            </button>
                            <button onClick={() => setShowTextSwitch(false)} className="btn-primary px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Mic2 className="w-4 h-4" /> Keep Speaking
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 w-full max-w-[760px] mx-auto overflow-y-auto px-4 py-8 scroll-smooth">
                {isLoading && messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                        <Loader2 className="w-8 h-8 animate-spin text-[#E8521A] mb-4" />
                        <p className="text-sm">Connecting to {scenario?.character_name}...</p>
                    </div>
                ) : (
                    <div className="flex flex-col w-full pb-10">
                        {/* Scenario Context Pill */}
                        <div className="w-full text-center my-6">
                            <span className="scenario-pill">
                                {scenario?.setting || 'Connecting...'}
                            </span>
                        </div>

                        <AnimatePresence>
                            {messages.map((m, i) => (
                                <MessageBubble
                                    key={i}
                                    message={m}
                                    isAiStreaming={isStreaming && i === messages.length - 1 && m.role === 'assistant'}
                                />
                            ))}
                        </AnimatePresence>

                        {/* AI Typing Indicator */}
                        {isLoading && messages.length > 0 && !isStreaming && (
                            <div className="flex w-full justify-start mb-4 animate-fade-up">
                                <div className="w-8 h-8 rounded-full bg-[#E8521A]/10 text-[#E8521A] flex items-center justify-center border border-[#E8521A]/22 shrink-0 mt-auto mr-2 font-mono-num text-[10px] font-bold tracking-widest">
                                    AI
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
            <div className="w-full border-t border-border bg-surface/90 backdrop-blur-xl p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shrink-0">
                <div className="max-w-[760px] mx-auto">
                    
                    {/* Suggested Replies Feature */}
                    {messages.length > 0 && lastAiMessage && !isStreaming && (
                        <SuggestedReplies 
                            sessionId={sessionId}
                            conversationHistory={messages}
                            level={level}
                            speakToReplyEnabled={settings?.speak_to_reply ?? true}
                            onSelectSuggestion={(suggestion, requireSpeak) => {
                                if (requireSpeak) {
                                    setActiveSpeakSuggestion(suggestion);
                                } else {
                                    sendMessage(suggestion.spanish);
                                }
                            }}
                        />
                    )}

                    {inputMode === 'voice' ? (
                        <div className="flex flex-col items-center">
                            {rateLimit && rateLimit.operation === 'conversation' && rateLimit.remaining <= 3 && (
                                <div className="w-full max-w-[420px]">
                                    <RateLimitWarning
                                        operation={rateLimit.operation}
                                        current={rateLimit.current}
                                        limit={rateLimit.limit}
                                        remaining={rateLimit.remaining}
                                        resetAt={rateLimit.resetAt}
                                    />
                                </div>
                            )}
                            {lastAiMessage && !isStreaming && (
                                <div className="w-full max-w-[400px] mb-3 px-4 py-3 rounded-xl bg-surface-hover border border-border">
                                    <p className="text-[13px] text-text-secondary line-clamp-2 leading-relaxed">
                                        "{lastAiMessage.content}"
                                    </p>
                                </div>
                            )}
                            <MicrophoneButton
                                onTranscriptionComplete={handleTranscriptionComplete}
                                isDisabled={isLoading || isStreaming}
                                language="es-ES"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="relative flex items-end w-full max-w-[600px] mx-auto">
                                <textarea
                                    className="parlova-input min-h-[52px] max-h-[140px] resize-none pr-14 rounded-[26px] scrollbar-none"
                                    placeholder="Escribe en español..."
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
                                        ${(!input.trim() || isLoading || isStreaming) ? 'bg-border-strong text-text-muted' : 'bg-[#E8521A] text-background hover:brightness-110'}`}
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading || isStreaming}
                                >
                                    <Send className="w-[18px] h-[18px] ml-0.5" />
                                </button>
                            </div>
                            <p className="text-center mt-3 text-[10px] font-bold text-text-muted uppercase tracking-widest select-none font-mono-num">
                                Text mode — no speaking score
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Speak Reply Modal */}
            <AnimatePresence>
                {activeSpeakSuggestion && (
                    <SpeakReplyModal
                        suggestion={activeSpeakSuggestion}
                        sessionId={sessionId}
                        userLevel={level}
                        onClose={() => setActiveSpeakSuggestion(null)}
                        onSuccess={(spokenText) => {
                            setActiveSpeakSuggestion(null);
                            sendMessage(spokenText);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
