"use client";

// ============================================================
// Parlova — Story Browser (Redesigned)
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useStories } from '@/hooks/useStories';
import { TOPIC_CATEGORIES, CONTENT_TYPES } from '@/lib/data/story-topics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Users, CheckCircle2, BookOpen, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const StoryReader = dynamic(() => import('./StoryReader'), { ssr: false });

interface StoryBrowserProps {
    languageId: string;
}

const TYPE_EMOJI: Record<string, string> = {
    short_story: '📖',
    dialogue: '💬',
    letter: '✉️',
    journal: '📓',
};

// Subtle gold-tinted level indicators for the luxury theme
function levelColor(level: string): string {
    const colors: Record<string, string> = {
        A1: 'bg-[#141414] text-[#c9a84c] border-[#c9a84c]/20',
        A2: 'bg-[#141414] text-[#e4c76b] border-[#e4c76b]/20',
        B1: 'bg-[#c9a84c]/5 text-[#c9a84c] border-[#c9a84c]/30',
        B2: 'bg-[#c9a84c]/10 text-[#e4c76b] border-[#c9a84c]/40',
        C1: 'bg-[#c9a84c]/15 text-[#e4c76b] border-[#e4c76b]/50',
        C2: 'bg-[#c9a84c]/20 text-[#f0ece4] border-[#e4c76b]/60',
    };
    return colors[level] || 'bg-[#1e1e1e] text-[#5a5652] border-[#2a2a2a]';
}

export default function StoryBrowser({ languageId }: StoryBrowserProps) {
    const {
        stories, isLoading, isGenerating, error, hasMore,
        selectedCategory, selectedContentType,
        dailyGenerationsRemaining, generatedStory, wasGenerated,
        setSelectedCategory, setSelectedContentType,
        getStory, fetchMore, clearGeneratedStory,
    } = useStories(languageId);

    const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
    const [showFoundFlash, setShowFoundFlash] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Handle generated/found story
    useEffect(() => {
        if (generatedStory) {
            if (!wasGenerated) {
                // Existing story served instantly — brief flash
                setShowFoundFlash(true);
                setTimeout(() => {
                    setShowFoundFlash(false);
                    setActiveStoryId(generatedStory.id);
                    clearGeneratedStory();
                }, 800);
            } else {
                // Newly generated — open directly
                setActiveStoryId(generatedStory.id);
                clearGeneratedStory();
            }
        }
    }, [generatedStory, wasGenerated, clearGeneratedStory]);

    // Infinite scroll
    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) fetchMore(); },
            { rootMargin: '200px' }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, fetchMore]);

    return (
        <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full font-sans">
            <AnimatePresence>
                {activeStoryId && (
                    <StoryReader
                        storyId={activeStoryId}
                        onClose={() => setActiveStoryId(null)}
                    />
                )}
            </AnimatePresence>

            {/* ── SECTION 1: Generate a Story ── */}
            <Card className="p-8 sm:p-10 border-[#1e1e1e] bg-[#0f0f0f] relative overflow-hidden rounded-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-bl-full -z-10 blur-xl" />

                <div className="relative z-10 w-full max-w-2xl">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 rounded-full bg-[#141414] border border-[#2a2a2a] shadow-inner">
                            <Sparkles className="w-5 h-5 text-[#c9a84c]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif text-[#f0ece4] tracking-tight">Narrative Synthesis</h2>
                            <p className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest mt-1">
                                Generate leveled literature dynamically
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6 mt-8">
                        <p className="text-[10px] font-mono uppercase text-[#5a5652] mb-3 tracking-[0.2em] font-medium">Domain Specification</p>
                        <div className="flex gap-2 flex-wrap mb-8">
                            {TOPIC_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-widest transition-all border ${selectedCategory === cat.id
                                            ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30 shadow-inner'
                                            : 'bg-[#0f0f0f] border-[#2a2a2a] text-[#5a5652] hover:text-[#9a9590] hover:border-[#c9a84c]/20'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        <p className="text-[10px] font-mono uppercase text-[#5a5652] mb-3 tracking-[0.2em] font-medium">Format Parameters</p>
                        <div className="flex gap-2 flex-wrap mb-8">
                            {CONTENT_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedContentType(type.id)}
                                    className={`px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-widest transition-all border flex items-center gap-2 ${selectedContentType === type.id
                                            ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30 shadow-inner'
                                            : 'bg-[#0f0f0f] border-[#2a2a2a] text-[#5a5652] hover:text-[#9a9590] hover:border-[#c9a84c]/20'
                                        }`}
                                >
                                    <span className="opacity-80">{TYPE_EMOJI[type.id]}</span> {type.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-6 border-t border-[#1e1e1e]">
                            <Button
                                onClick={getStory}
                                disabled={!selectedCategory || !selectedContentType || isGenerating}
                                className={`h-12 px-8 rounded-full font-mono text-[10px] uppercase tracking-widest font-bold transition-all shadow-[0_4px_20px_rgba(201,168,76,0.15)] flex gap-2 w-full sm:w-auto
                                    ${(!selectedCategory || !selectedContentType || isGenerating) 
                                        ? 'bg-[#1e1e1e] text-[#5a5652] cursor-not-allowed border-[#2a2a2a]' 
                                        : 'bg-[#c9a84c] text-[#080808] hover:bg-[#b98e72]'
                                    }
                                `}
                            >
                                {isGenerating ? (
                                    <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Compiling Data...</>
                                ) : (
                                    <><Zap className="w-4 h-4 shrink-0" /> Initialize Generation</>
                                )}
                            </Button>

                            <div className="flex flex-col flex-1 pl-4 sm:border-l border-[#2a2a2a]">
                                <span className={`text-[10px] font-mono uppercase tracking-[0.2em] font-medium ${dailyGenerationsRemaining === 0 ? 'text-[#ef4444]' : 'text-[#c9a84c]'}`}>
                                    {dailyGenerationsRemaining} Yields Remaining
                                </span>
                                <span className="text-[10px] text-[#5a5652] mt-1">
                                    Resets diurnally at 00:00 GMT
                                </span>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg text-xs font-mono text-[#ef4444] tracking-widest uppercase">
                                Exception: {error}
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* "Found a story" flash */}
            <AnimatePresence>
                {showFoundFlash && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-[#080808]/90 backdrop-blur-sm flex items-center justify-center"
                    >
                        <Card className="p-10 text-center border-[#c9a84c]/20 bg-[#141414] shadow-[0_0_50px_rgba(201,168,76,0.1)] rounded-3xl max-w-sm">
                            <div className="w-20 h-20 bg-[#c9a84c]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-[#c9a84c]" />
                            </div>
                            <h3 className="text-2xl font-serif text-[#f0ece4]">Archived Text Located</h3>
                            <p className="text-[10px] font-mono text-[#9a9590] mt-3 uppercase tracking-[0.2em]">Retreiving from cache...</p>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SECTION 2: Browse Stories ── */}
            <div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2.5 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f]">
                        <BookOpen className="w-4 h-4 text-[#9a9590]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif text-[#f0ece4]">Literature Database</h3>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a5652] mt-1">
                            Authored by Parlova operatives
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {isLoading && stories.length === 0 && (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={`skeleton-${i}`} className="p-6 bg-[#0f0f0f] border-[#1e1e1e] rounded-2xl animate-pulse h-[220px] flex flex-col">
                                <div className="flex gap-2 mb-4">
                                    <div className="w-20 h-5 bg-[#141414] rounded-full" />
                                    <div className="w-6 h-5 bg-[#141414] rounded-full" />
                                </div>
                                <div className="w-3/4 h-5 bg-[#1e1e1e] rounded mb-3" />
                                <div className="w-full h-4 bg-[#141414] rounded mb-2" />
                                <div className="w-5/6 h-4 bg-[#141414] rounded mb-4" />
                                <div className="mt-auto flex gap-2">
                                    <div className="w-12 h-5 bg-[#1e1e1e] rounded-full" />
                                    <div className="w-16 h-5 bg-[#1e1e1e] rounded-full" />
                                </div>
                            </Card>
                        ))
                    )}

                    {stories.map((story, i) => {
                        const cat = TOPIC_CATEGORIES.find(c => c.id === story.topic_category);
                        return (
                            <motion.div key={story.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="h-full"
                            >
                                <Card
                                    className="p-6 h-full cursor-pointer transition-all duration-300 rounded-2xl flex flex-col bg-[#141414] border-[#1e1e1e] hover:border-[#c9a84c]/40 hover:bg-[#171717] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group"
                                    onClick={() => setActiveStoryId(story.id)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded bg-[#080808] border border-[#2a2a2a] text-[#c9a84c]">
                                                {TYPE_EMOJI[story.content_type]} {story.content_type.replace('_', ' ')}
                                            </span>
                                            {cat && <span className="text-sm grayscale group-hover:grayscale-0 transition-all">{cat.emoji}</span>}
                                        </div>
                                    </div>

                                    <h4 className="font-serif text-lg mb-2 line-clamp-2 leading-snug text-[#f0ece4] group-hover:text-[#c9a84c] transition-colors">
                                        {story.title}
                                    </h4>
                                    <p className="text-[13px] font-sans text-[#5a5652] line-clamp-2 mb-6 leading-relaxed">
                                        {story.summary}
                                    </p>

                                    <div className="flex items-center gap-2 mt-auto flex-wrap">
                                        <span className={`text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-1 flex items-center justify-center rounded border ${levelColor(story.cefr_level)}`}>
                                            {story.cefr_level}
                                        </span>
                                        <span className="text-[9px] font-mono text-[#5a5652] uppercase tracking-[0.1em]">
                                            {story.word_count} W
                                        </span>
                                        {story.times_read > 0 && (
                                            <span className="flex items-center gap-1.5 text-[9px] font-mono text-[#5a5652] uppercase tracking-[0.1em] ml-auto bg-[#080808] px-2 py-1 rounded border border-[#1e1e1e]">
                                                <Users className="w-3 h-3 text-[#c9a84c]/50" />
                                                {story.times_read} REQS
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {!isLoading && stories.length === 0 && (
                    <Card className="p-16 flex flex-col items-center justify-center text-center bg-[#0f0f0f] border-dashed border-[#1e1e1e] rounded-3xl mt-6">
                        <BookOpen className="w-10 h-10 text-[#2a2a2a] mb-6" />
                        <h3 className="text-xl font-serif text-[#f0ece4] mb-3">Database Empty</h3>
                        <p className="text-sm font-sans text-[#9a9590] max-w-sm leading-relaxed">
                            No narrative files currently reside at this sector index. Be the first to run the generation sequence above.
                        </p>
                    </Card>
                )}

                {isLoading && stories.length > 0 && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
                    </div>
                )}

                {hasMore && <div ref={sentinelRef} className="h-10 w-full" />}
                
                {!hasMore && stories.length > 0 && (
                    <p className="text-center text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a5652] py-8 border-t border-[#1e1e1e] mt-4">
                        End of archive
                    </p>
                )}
            </div>
        </div>
    );
}
