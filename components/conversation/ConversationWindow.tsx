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

interface ConversationWindowProps {
    scenarioId: string;
    languageId: string;
    level: string;
    onClose: () => void;
}

export function ConversationWindow({ scenarioId, languageId, level, onClose }: ConversationWindowProps) {
    const {
        scenario, messages, isLoading, isStreaming, elapsedSeconds,
        situationName, situationTwist, situationId,
        inputMode, switchToTextMode,
        startSession, sendMessage, endSession, resetConversation,
    } = useConversation(scenarioId, languageId, level);

    const { getCompletedSituationIds, getBestScore, refetch: refetchHistory } = useSituationHistory(languageId);

    const [input, setInput] = useState('');
    const [scoringData, setScoringData] = useState<any>(null);
    const [showTextSwitch, setShowTextSwitch] = useState(false);
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
        const confirm = window.confirm("Ready to wrap up? AI will score your conversation now.");
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
        <div className="fixed inset-0 z-50 bg-[#080808] flex flex-col pt-safe-top pb-safe-bottom">
            {/* Top Bar */}
            <header className="top-bar">
                <div className="flex items-center gap-[16px]">
                    <button onClick={() => {
                        if (messages.length > 1) {
                            if (window.confirm("End this conversation? Your progress will be scored.")) handleEnd();
                        } else {
                            onClose();
                        }
                    }} className="w-[40px] h-[40px] rounded-pill flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                        <ArrowLeft className="w-[20px] h-[20px] text-[#f0ece4]" />
                    </button>
                    <div className="flex flex-col">
                        <span className="font-display text-[18px] font-semibold leading-tight text-[#f0ece4]">
                            {scenario?.name || 'Practice Session'}
                        </span>
                        <div className="flex items-center gap-[6px]">
                            <span className="w-[6px] h-[6px] rounded-pill bg-[#4ade80] animate-pulse" />
                            <span className="font-mono-num text-[12px] text-[#9a9590]">{timerStr}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-[8px]">
                    {inputMode === 'voice' && (
                        <button onClick={() => setShowTextSwitch(true)} className="btn btn-ghost btn-sm px-[12px]">
                            <Keyboard className="w-[14px] h-[14px]" /> Type
                        </button>
                    )}
                    <button onClick={handleEnd} disabled={isLoading || messages.length < 2} className="btn btn-primary btn-sm px-[16px]">
                        <StopCircle className="w-[14px] h-[14px]" /> Finish
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
                        className="absolute top-[56px] left-0 right-0 z-20 bg-[#141414] border-b border-[#1e1e1e] p-[16px] shadow-2xl"
                    >
                        <p className="text-[14px] text-center mb-[16px] text-[#f0ece4]">
                            Switch to text for this session?<br />
                            <span className="text-[#9a9590] text-[12px]">You can speak again next time.</span>
                        </p>
                        <div className="flex gap-[12px] justify-center">
                            <button onClick={handleTextSwitchConfirm} className="btn btn-secondary px-[16px]">
                                <Keyboard className="w-[14px] h-[14px]" /> Switch to Text
                            </button>
                            <button onClick={() => setShowTextSwitch(false)} className="btn btn-primary px-[16px]">
                                <Mic2 className="w-[14px] h-[14px]" /> Keep Speaking
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 w-full max-w-[760px] mx-auto overflow-y-auto px-[16px] py-[32px] scroll-smooth">
                {isLoading && messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#9a9590]">
                        <Loader2 className="w-[32px] h-[32px] animate-spin text-[#c9a84c] mb-[16px]" />
                        <p className="text-[14px]">Connecting securely with {scenario?.character_name}...</p>
                    </div>
                ) : (
                    <div className="flex flex-col w-full pb-[40px]">
                        {/* Scenario Context Pill */}
                        <div className="w-full text-center my-[24px]">
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
                            <div className="flex w-full justify-start mb-[16px] animate-fade-up">
                                <div className="w-[32px] h-[32px] rounded-pill bg-[rgba(201,168,76,0.12)] text-[#c9a84c] flex items-center justify-center border border-[rgba(201,168,76,0.2)] shrink-0 mt-auto mr-[8px]">
                                    AI
                                </div>
                                <div className="px-[16px] py-[14px] rounded-[16px] bg-[#141414] rounded-bl-sm border border-[#1e1e1e] flex items-center gap-[4px] h-[48px]">
                                    <div className="w-[6px] h-[6px] bg-[#5a5652] rounded-pill animate-[bounce_1s_infinite]" />
                                    <div className="w-[6px] h-[6px] bg-[#5a5652] rounded-pill animate-[bounce_1s_infinite_0.15s]" />
                                    <div className="w-[6px] h-[6px] bg-[#5a5652] rounded-pill animate-[bounce_1s_infinite_0.3s]" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="w-full border-t border-[#1e1e1e] bg-[rgba(15,15,15,0.9)] backdrop-blur-xl p-[16px] pb-[calc(env(safe-area-inset-bottom)+16px)] shrink-0">
                <div className="max-w-[760px] mx-auto">
                    {inputMode === 'voice' ? (
                        <div className="flex flex-col items-center">
                            {lastAiMessage && !isStreaming && (
                                <div className="w-full max-w-[400px] mb-[12px] px-[16px] py-[12px] rounded-lg bg-[rgba(255,255,255,0.02)] border border-[#1e1e1e]">
                                    <p className="text-[13px] text-[#9a9590] line-clamp-2 leading-relaxed">
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
                                    className="parlova-input min-h-[52px] max-h-[140px] resize-none pr-[56px] rounded-[26px]"
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
                                    className={`absolute right-[6px] bottom-[6px] w-[40px] h-[40px] rounded-pill flex items-center justify-center transition-colors
                                        ${(!input.trim() || isLoading || isStreaming) ? 'bg-[#2a2a2a] text-[#5a5652]' : 'bg-[#c9a84c] text-[#080808] hover:brightness-110'}`}
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading || isStreaming}
                                >
                                    <Send className="w-[18px] h-[18px] ml-[2px]" />
                                </button>
                            </div>
                            <p className="text-center mt-[12px] text-[11px] font-medium text-[#5a5652] uppercase tracking-widest select-none">
                                Text mode — no pronunciation score
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
