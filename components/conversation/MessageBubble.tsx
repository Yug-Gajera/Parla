"use client";

// ============================================================
// Parlova — Message Bubble (Redesigned)
// ============================================================

import React, { useState } from 'react';
import { ChatMessage } from '@/hooks/useConversation';
import { motion } from 'framer-motion';
import { Mic2, AlertTriangle, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { playSpanishAudio } from '@/lib/playAudio';

interface MessageBubbleProps {
    message: ChatMessage;
    isAiStreaming?: boolean;
}

export function MessageBubble({ message, isAiStreaming }: MessageBubbleProps) {
    const isAI = message.role === 'assistant';
    const [showClarityDetails, setShowClarityDetails] = useState(false);

    const speakMessage = (text: string) => {
        playSpanishAudio(text, 'normal');
    };

    const timeString = message.timestamp
        ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    const hasVoiceData = !isAI && message.voiceData;
    const hasLowConfidence = hasVoiceData && message.voiceData!.lowConfidenceWords.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col w-full mb-6 ${isAI ? 'items-start' : 'items-end'}`}
        >
            <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                
                {/* AI Avatar */}
                {isAI && (
                    <div className="flex flex-col items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-[#E8521A]/10 text-[#E8521A] flex items-center justify-center font-bold text-[10px] tracking-widest border border-[#E8521A]/20 shrink-0 font-mono-num">
                            AI
                        </div>
                        <button 
                            onClick={() => speakMessage(message.content)}
                            disabled={isAiStreaming}
                            className="p-1 rounded-full bg-surface-hover text-text-muted hover:text-[#E8521A] transition-colors disabled:opacity-30"
                        >
                            <Volume2 className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* Bubble */}
                <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
                    <div className={isAI ? 'bubble-ai' : 'bubble-user'}>
                        <span className="whitespace-pre-wrap">
                            {message.content}
                            {isAiStreaming && <span className="ml-1 inline-block w-1.5 h-4 bg-text-primary opacity-50 animate-pulse align-middle" />}
                        </span>
                    </div>

                    {/* Metadata row: timestamp + voice indicator */}
                    <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                        {hasVoiceData && (
                            <Mic2 className="w-3 h-3 text-text-muted" />
                        )}
                        {timeString && (
                            <span className="bubble-timestamp font-mono-num">
                                {timeString}
                            </span>
                        )}
                    </div>

                    {/* Low confidence indicator */}
                    {hasLowConfidence && (
                        <div className="mt-2 flex flex-col items-end w-full">
                            <button
                                onClick={() => setShowClarityDetails(!showClarityDetails)}
                                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface-hover transition-colors"
                            >
                                <AlertTriangle className="w-3 h-3 text-warning" />
                                <span className="text-[11px] text-warning font-medium opacity-80">
                                    We couldn't hear some words clearly
                                </span>
                                {showClarityDetails
                                    ? <ChevronUp className="w-3 h-3 text-warning opacity-60" />
                                    : <ChevronDown className="w-3 h-3 text-warning opacity-60" />
                                }
                            </button>

                            {/* Expanded clarity details */}
                            {showClarityDetails && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex flex-wrap justify-end gap-1 mt-1 px-1"
                                >
                                    {message.voiceData!.lowConfidenceWords.map((word, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-warning/10 text-warning border border-warning/20 font-mono-num"
                                        >
                                            {word}
                                        </span>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </motion.div>
    );
}
