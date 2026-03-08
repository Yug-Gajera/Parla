"use client";

import React, { useState } from 'react';
import { ChatMessage } from '@/hooks/useConversation';
import { motion } from 'framer-motion';
import { Mic, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

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
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} mb-4`}
        >
            {/* AI Avatar */}
            {isAI && (
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm mr-2 mt-auto shrink-0 border border-primary/30">
                    AI
                </div>
            )}

            {/* Bubble */}
            <div className={`flex flex-col max-w-[80%] ${isAI ? 'items-start' : 'items-end'}`}>
                <div
                    className={`px-4 py-3 rounded-2xl relative ${isAI
                        ? 'bg-secondary text-secondary-foreground rounded-bl-sm border border-border/50'
                        : 'bg-primary text-primary-foreground rounded-br-sm shadow-[0_5px_15px_-5px_rgba(124,58,237,0.4)]'
                        }`}
                >
                    <span className="text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                        {isAiStreaming && <span className="ml-1 inline-block w-1.5 h-4 bg-foreground/50 animate-pulse align-middle" />}
                    </span>
                </div>

                {/* Metadata row: timestamp + voice indicator */}
                <div className="flex items-center gap-1.5 mt-1 px-1">
                    {hasVoiceData && (
                        <Mic className="w-[10px] h-[10px] text-muted-foreground/50" />
                    )}
                    {timeString && (
                        <span className="text-[10px] text-muted-foreground font-medium select-none">
                            {timeString}
                        </span>
                    )}
                </div>

                {/* Low confidence indicator */}
                {hasLowConfidence && (
                    <button
                        onClick={() => setShowClarityDetails(!showClarityDetails)}
                        className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] text-amber-500/80 font-medium">
                            Some words were unclear
                        </span>
                        {showClarityDetails
                            ? <ChevronUp className="w-3 h-3 text-amber-500/60" />
                            : <ChevronDown className="w-3 h-3 text-amber-500/60" />
                        }
                    </button>
                )}

                {/* Expanded clarity details */}
                {showClarityDetails && hasLowConfidence && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-wrap gap-1 mt-1 px-1"
                    >
                        {message.voiceData!.lowConfidenceWords.map((word, i) => (
                            <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            >
                                {word}
                            </span>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
