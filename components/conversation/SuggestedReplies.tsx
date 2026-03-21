"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Loader2, Volume2, Send, X } from 'lucide-react';

export interface Suggestion {
    spanish: string;
    english: string;
    phonetic: string;
}

interface SuggestedRepliesProps {
    sessionId: string | null;
    conversationHistory: any[];
    level: string;
    speakToReplyEnabled: boolean;
    onSelectSuggestion: (suggestion: Suggestion, requireSpeak: boolean) => void;
}

export function SuggestedReplies({ sessionId, conversationHistory, level, speakToReplyEnabled, onSelectSuggestion }: SuggestedRepliesProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedForChoice, setSelectedForChoice] = useState<number | null>(null);

    const isA1A2 = level === 'A1' || level === 'A2';
    // The requirement is enforced for A1/A2. B1+ can choose if the setting is on, or if the setting is off they also don't have to.
    const mustSpeak = isA1A2 && speakToReplyEnabled;

    const handleOpen = async () => {
        setIsOpen(true);
        if (suggestions.length === 0) {
            setIsLoading(true);
            try {
                const res = await fetch('/api/conversation/suggest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: sessionId,
                        conversation_history: conversationHistory,
                        level
                    })
                });
                const data = await res.json();
                if (data.success) {
                    setSuggestions(data.suggestions);
                }
            } catch (e) {
                console.error("Failed to load suggestions", e);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSuggestionClick = (index: number, suggestion: Suggestion) => {
        if (mustSpeak) {
            setIsOpen(false);
            onSelectSuggestion(suggestion, true);
        } else {
            // Give B1+ or disabled A1A2 users the choice
            setSelectedForChoice(selectedForChoice === index ? null : index);
        }
    };

    return (
        <div className="w-full flex justify-center mb-3">
            {!isOpen && (
                <button 
                    onClick={handleOpen}
                    className="flex items-center gap-2 bg-surface border border-accent/20 text-accent font-mono text-[11px] uppercase tracking-widest font-bold px-4 py-2 rounded-full hover:bg-accent/5 transition-colors shadow-sm"
                >
                    <Lightbulb className="w-4 h-4" />
                    Help me reply
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="w-full max-w-[600px] bg-surface border border-border rounded-2xl p-4 shadow-lg flex flex-col gap-3 relative"
                    >
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover text-text-muted hover:text-text-primary"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 mb-2 text-text-primary">
                            <Lightbulb className="w-4 h-4 text-accent" />
                            <h3 className="font-display font-semibold text-[15px]">Suggested Replies</h3>
                        </div>

                        {isLoading ? (
                            <div className="w-full py-8 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {suggestions.map((s, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <button 
                                            onClick={() => handleSuggestionClick(idx, s)}
                                            className="flex flex-col text-left p-3 rounded-xl border border-border bg-background hover:border-accent hover:bg-accent/5 transition-colors"
                                        >
                                            <span className="font-serif text-[18px] text-text-primary mb-1">{s.spanish}</span>
                                            <span className="font-body text-[13px] text-text-secondary italic">{s.english}</span>
                                        </button>
                                        
                                        {/* B1+ Choice prompt */}
                                        <AnimatePresence>
                                            {selectedForChoice === idx && !mustSpeak && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="flex gap-2 mt-2 overflow-hidden px-1"
                                                >
                                                    <button 
                                                        onClick={() => { setIsOpen(false); onSelectSuggestion(s, true); }}
                                                        className="flex-1 bg-accent text-white h-10 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <Volume2 className="w-4 h-4" /> Speak it
                                                    </button>
                                                    <button 
                                                        onClick={() => { setIsOpen(false); onSelectSuggestion(s, false); }}
                                                        className="flex-1 bg-surface-hover border border-border text-text-primary h-10 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2"
                                                    >
                                                        <Send className="w-4 h-4" /> Send as text
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
