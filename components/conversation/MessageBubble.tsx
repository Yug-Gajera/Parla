"use client";

// ============================================================
// Parlova — Message Bubble (Redesigned)
// ============================================================

import React, { useState } from 'react';
import { ChatMessage } from '@/hooks/useConversation';
import { motion } from 'framer-motion';
import { Mic2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface MessageBubbleProps {
    message: ChatMessage;
    isAiStreaming?: boolean;
}

export function MessageBubble({ message, isAiStreaming }: MessageBubbleProps) {
    const isAI = message.role === 'assistant';
    const [showClarityDetails, setShowClarityDetails] = useState(false);

    const timeString = message.timestamp
        ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    const hasVoiceData = !isAI && message.voiceData;
    const hasLowConfidence = hasVoiceData && message.voiceData!.lowConfidenceWords.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col w-full mb-[24px] ${isAI ? 'items-start' : 'items-end'}`}
        >
            <div className={`flex items-end gap-[8px] max-w-[85%] sm:max-w-[75%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                
                {/* AI Avatar */}
                {isAI && (
                    <div className="w-[32px] h-[32px] rounded-pill bg-[rgba(201,168,76,0.12)] text-[#c9a84c] flex items-center justify-center font-semibold text-[13px] border border-[rgba(201,168,76,0.2)] shrink-0 mb-[4px]">
                        AI
                    </div>
                )}

                {/* Bubble */}
                <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
                    <div className={isAI ? 'bubble-ai' : 'bubble-user'}>
                        <span className="whitespace-pre-wrap">
                            {message.content}
                            {isAiStreaming && <span className="ml-[4px] inline-block w-[6px] h-[16px] bg-[#f0ece4] opacity-50 animate-pulse align-middle" />}
                        </span>
                    </div>

                    {/* Metadata row: timestamp + voice indicator */}
                    <div className={`flex items-center gap-[6px] mt-[6px] px-[4px] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                        {hasVoiceData && (
                            <Mic2 className="w-[12px] h-[12px] text-[#5a5652]" />
                        )}
                        {timeString && (
                            <span className="bubble-timestamp">
                                {timeString}
                            </span>
                        )}
                    </div>

                    {/* Low confidence indicator */}
                    {hasLowConfidence && (
                        <div className="mt-[8px] flex flex-col items-end w-full">
                            <button
                                onClick={() => setShowClarityDetails(!showClarityDetails)}
                                className="flex items-center gap-[4px] px-[8px] py-[4px] rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                            >
                                <AlertTriangle className="w-[12px] h-[12px] text-[#fb923c]" />
                                <span className="text-[11px] text-[#fb923c] font-medium opacity-80">
                                    Some words were unclear
                                </span>
                                {showClarityDetails
                                    ? <ChevronUp className="w-[12px] h-[12px] text-[#fb923c] opacity-60" />
                                    : <ChevronDown className="w-[12px] h-[12px] text-[#fb923c] opacity-60" />
                                }
                            </button>

                            {/* Expanded clarity details */}
                            {showClarityDetails && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex flex-wrap justify-end gap-[4px] mt-[4px] px-[4px]"
                                >
                                    {message.voiceData!.lowConfidenceWords.map((word, i) => (
                                        <span
                                            key={i}
                                            className="text-[11px] px-[6px] py-[2px] rounded-md bg-[rgba(251,146,60,0.1)] text-[#fb923c] border border-[rgba(251,146,60,0.2)]"
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
