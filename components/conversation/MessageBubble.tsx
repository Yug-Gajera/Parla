"use client";

import React from 'react';
import { ChatMessage } from '@/hooks/useConversation';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
    message: ChatMessage;
    isAiStreaming?: boolean;
}

export function MessageBubble({ message, isAiStreaming }: MessageBubbleProps) {
    const isAI = message.role === 'assistant';

    const timeString = message.timestamp
        ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

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

                {/* Timestamp */}
                {timeString && (
                    <span className="text-[10px] text-muted-foreground mt-1 px-1 font-medium select-none">
                        {timeString}
                    </span>
                )}
            </div>
        </motion.div>
    );
}
