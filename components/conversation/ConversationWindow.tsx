"use client";

import { useState, useEffect, useRef } from 'react';
import { useConversation } from '@/hooks/useConversation';
import { useSituationHistory } from '@/hooks/useSituationHistory';
import { MessageBubble } from './MessageBubble';
import { ScoreCard } from './ScoreCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Loader2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        startSession, sendMessage, endSession, resetConversation,
    } = useConversation(scenarioId, languageId, level);

    const { getCompletedSituationIds, getBestScore, refetch: refetchHistory } = useSituationHistory(languageId);

    const [input, setInput] = useState('');
    const [scoringData, setScoringData] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Format MM:SS
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timerStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;

    // Start immediately on mount
    useEffect(() => {
        startSession();
    }, [scenarioId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isStreaming]);

    // Handle keyboard opening (mobile resize)
    useEffect(() => {
        const handleResize = () => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSend = () => {
        if (!input.trim() || isStreaming) return;
        sendMessage(input);
        setInput('');
    };

    const handleEnd = async () => {
        const confirm = window.confirm("Ready to wrap up? Claude will score your conversation now.");
        if (!confirm) return;

        const result = await endSession();
        if (result && result.scoring) {
            await refetchHistory(); // Refresh history so ScoreCard dots are up to date
            setScoringData(result);
        } else {
            onClose(); // Failed or errored, just close
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
        startSession(situationId || undefined); // skip current situation
    };

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
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col pt-safe-top pb-safe-bottom">
            {/* Header View */}
            <header className="flex items-center justify-between h-16 px-4 bg-card/80 backdrop-blur-md border-b border-border z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => {
                        if (messages.length > 1) {
                            if (window.confirm("End this conversation? Your progress will be scored.")) handleEnd();
                        } else {
                            onClose();
                        }
                    }} className="rounded-full hover:bg-secondary">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </Button>
                    <div className="flex flex-col">
                        <span className="font-semibold leading-tight">{scenario?.name || 'Practice Session'}</span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs text-muted-foreground font-mono">{timerStr}</span>
                        </div>
                    </div>
                </div>

                <Button variant="destructive" size="sm" onClick={handleEnd} disabled={isLoading || messages.length < 2} className="rounded-full px-4 text-xs font-semibold h-9">
                    <StopCircle className="w-3.5 h-3.5 mr-1" /> Finish
                </Button>
            </header>

            {/* Messages Scroll Area */}
            <div
                ref={scrollRef}
                className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto px-4 py-6 scroll-smooth"
            >
                {isLoading && messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p>Initializing scenario securely with {scenario?.character_name}...</p>
                    </div>
                ) : (
                    <div className="flex flex-col w-full pb-8">
                        {/* Intro bubble specifying context */}
                        <div className="w-full text-center my-6">
                            <span className="bg-secondary/50 text-muted-foreground text-xs font-medium uppercase tracking-wider px-3 py-1.5 rounded-full border border-border">
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

                        {isLoading && messages.length > 0 && !isStreaming && (
                            <div className="flex w-full justify-start mb-4">
                                <div className="w-8 h-8 rounded-full bg-primary/20 mr-2 shrink-0" />
                                <div className="px-5 py-4 rounded-2xl bg-secondary rounded-bl-sm flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="w-full border-t border-border bg-card/90 backdrop-blur-md p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shrink-0">
                <div className="max-w-2xl mx-auto">
                    <div className="relative flex items-end w-full">
                        <textarea
                            className="w-full bg-background border border-border rounded-3xl pl-5 pr-14 py-3.5 min-h-[52px] max-h-32 text-base resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-inner"
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
                        <Button
                            size="icon"
                            className="absolute right-1.5 bottom-1.5 h-[40px] w-[40px] rounded-full shrink-0"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading || isStreaming}
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </Button>
                    </div>
                    <p className="text-center mt-3 text-xs text-muted-foreground font-medium select-none">
                        Hint: Real context speeds up learning. Try using full sentences!
                    </p>
                </div>
            </div>
        </div>
    );
}
