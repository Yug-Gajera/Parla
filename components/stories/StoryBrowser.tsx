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
import { RateLimitWarning } from '@/components/ui/RateLimitWarning';

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
        A1: 'bg-card text-[#E8521A] border-[#E8521A]/20',
        A2: 'bg-card text-[#E8521A] border-[#E8521A]/20',
        B1: 'bg-[#E8521A]/5 text-[#E8521A] border-[#E8521A]/30',
        B2: 'bg-[#E8521A]/10 text-[#E8521A] border-[#E8521A]/40',
        C1: 'bg-[#E8521A]/15 text-[#E8521A] border-[#E8521A]/50',
        C2: 'bg-[#E8521A]/20 text-text-primary border-[#E8521A]/60',
    };
    return colors[level] || 'bg-border text-text-muted border-border-strong';
}

export default function StoryBrowser({ languageId }: StoryBrowserProps) {
    const {
        stories, isLoading, isGenerating, error, hasMore,
        selectedCategory, selectedContentType,
        dailyGenerationsRemaining, generatedStory, wasGenerated,
        rateLimit,
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
            <Card className="p-8 sm:p-10 border-border bg-surface relative overflow-hidden rounded-2xl shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8521A]/5 rounded-bl-full -z-10 blur-xl" />

                <div className="relative z-10 w-full max-w-2xl">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 rounded-full bg-card border border-border-strong shadow-inner">
                            <Sparkles className="w-5 h-5 text-[#E8521A]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif text-text-primary tracking-tight">Create a Story</h2>
                            <p className="text-[10px] font-mono-num text-text-muted uppercase tracking-widest mt-1">
                                Make a custom story for your level
                            </p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 mt-8">
                        <p className="text-[10px] font-mono-num uppercase text-text-muted mb-3 tracking-[0.2em] font-medium">Choose a Topic</p>
                        <div className="flex gap-2 flex-wrap mb-8">
                            {TOPIC_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-[11px] font-mono-num uppercase tracking-widest transition-all border ${selectedCategory === cat.id
                                        ? 'bg-[#E8521A]/10 text-[#E8521A] border-[#E8521A]/30 shadow-md'
                                        : 'bg-surface border-border-strong text-text-muted hover:text-text-secondary hover:border-[#E8521A]/20'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        <p className="text-[10px] font-mono-num uppercase text-text-muted mb-3 tracking-[0.2em] font-medium">Choose a Style</p>
                        <div className="flex gap-2 flex-wrap mb-8">
                            {CONTENT_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedContentType(type.id)}
                                    className={`px-4 py-2 rounded-full text-[11px] font-mono-num uppercase tracking-widest transition-all border flex items-center gap-2 ${selectedContentType === type.id
                                        ? 'bg-[#E8521A]/10 text-[#E8521A] border-[#E8521A]/30 shadow-md'
                                        : 'bg-surface border-border-strong text-text-muted hover:text-text-secondary hover:border-[#E8521A]/20'
                                        }`}
                                >
                                    <span className="opacity-80">{TYPE_EMOJI[type.id]}</span> {type.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-6 border-t border-border">
                            {rateLimit && rateLimit.operation === 'story' && rateLimit.remaining <= 3 && (
                                <div className="w-full sm:w-auto sm:min-w-[320px]">
                                    <RateLimitWarning
                                        operation={rateLimit.operation}
                                        current={rateLimit.current}
                                        limit={rateLimit.limit}
                                        remaining={rateLimit.remaining}
                                        resetAt={rateLimit.resetAt}
                                    />
                                </div>
                            )}
                            <Button
                                onClick={getStory}
                                disabled={!selectedCategory || !selectedContentType || isGenerating}
                                className={`h-12 px-8 rounded-full font-mono-num text-[10px] uppercase tracking-widest font-bold transition-all shadow-md flex gap-2 w-full sm:w-auto
                                    ${(!selectedCategory || !selectedContentType || isGenerating) 
                                        ? 'bg-border text-text-muted cursor-not-allowed border-border-strong' 
                                        : 'bg-[#E8521A] text-bg hover:brightness-110 shadow-lg'
                                    }
                                `}
                            >
                                {isGenerating ? (
                                    <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Writing Story...</>
                                ) : (
                                    <><Zap className="w-4 h-4 shrink-0" /> Generate Story</>
                                )}
                            </Button>

                            <div className="flex flex-col flex-1 pl-4 sm:border-l border-border-strong">
                                <span className={`text-[10px] font-mono-num uppercase tracking-[0.2em] font-medium ${dailyGenerationsRemaining === 0 ? 'text-error' : 'text-[#E8521A]'}`}>
                                    {dailyGenerationsRemaining} Stories Left Today
                                </span>
                                <span className="text-[10px] text-text-muted mt-1">
                                    Resets every day
                                </span>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg text-xs font-mono-num text-error tracking-widest uppercase">
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
                        className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center"
                    >
                        <Card className="p-10 text-center border-[#E8521A]/20 bg-card shadow-xl rounded-3xl max-w-sm">
                            <div className="w-20 h-20 bg-[#E8521A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-[#E8521A]" />
                            </div>
                            <h3 className="text-2xl font-serif text-text-primary">Found a Story</h3>
                            <p className="text-[10px] font-mono-num text-text-secondary mt-3 uppercase tracking-[0.2em]">Loading saved story...</p>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SECTION 2: Browse Stories ── */}
            <div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2.5 rounded-xl border border-border-strong bg-surface">
                        <BookOpen className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif text-text-primary">Story Library</h3>
                        <p className="text-[10px] font-mono-num uppercase tracking-[0.2em] text-text-muted mt-1">
                            Written by the community
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {isLoading && stories.length === 0 && (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={`skeleton-${i}`} className="p-6 bg-surface border-border rounded-2xl animate-pulse h-[220px] flex flex-col">
                                <div className="flex gap-2 mb-4">
                                    <div className="w-20 h-5 bg-card rounded-full" />
                                    <div className="w-6 h-5 bg-card rounded-full" />
                                </div>
                                <div className="w-3/4 h-5 bg-border rounded mb-3" />
                                <div className="w-full h-4 bg-card rounded mb-2" />
                                <div className="w-5/6 h-4 bg-card rounded mb-4" />
                                <div className="mt-auto flex gap-2">
                                    <div className="w-12 h-5 bg-border rounded-full" />
                                    <div className="w-16 h-5 bg-border rounded-full" />
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
                                    className="p-6 h-full cursor-pointer transition-all duration-300 rounded-2xl flex flex-col bg-card border-border hover:border-[#E8521A]/40 hover:bg-surface hover:-translate-y-1 hover:shadow-md group"
                                    onClick={() => setActiveStoryId(story.id)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-mono-num font-bold uppercase tracking-widest px-2 py-1 rounded bg-background border border-border-strong text-[#E8521A]">
                                                {TYPE_EMOJI[story.content_type]} {story.content_type.replace('_', ' ')}
                                            </span>
                                            {cat && <span className="text-sm grayscale group-hover:grayscale-0 transition-all">{cat.emoji}</span>}
                                        </div>
                                    </div>

                                    <h4 className="font-serif text-lg mb-2 line-clamp-2 leading-snug text-text-primary group-hover:text-[#E8521A] transition-colors">
                                        {story.title}
                                    </h4>
                                    <p className="text-[13px] font-sans text-text-muted line-clamp-2 mb-6 leading-relaxed">
                                        {story.summary}
                                    </p>

                                    <div className="flex items-center gap-2 mt-auto flex-wrap">
                                        <span className={`text-[9px] font-mono-num uppercase tracking-[0.2em] px-2 py-1 flex items-center justify-center rounded border ${levelColor(story.cefr_level)}`}>
                                            {story.cefr_level}
                                        </span>
                                        <span className="text-[9px] font-mono-num text-text-muted uppercase tracking-[0.1em]">
                                            {story.word_count} W
                                        </span>
                                        {story.times_read > 0 && (
                                            <span className="flex items-center gap-1.5 text-[9px] font-mono-num text-text-muted uppercase tracking-[0.1em] ml-auto bg-background px-2 py-1 rounded border border-border">
                                                <Users className="w-3 h-3 text-[#E8521A]/50" />
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
                    <Card className="p-16 flex flex-col items-center justify-center text-center bg-surface border-dashed border-border rounded-3xl mt-6 shadow-sm">
                        <BookOpen className="w-10 h-10 text-border-strong mb-6" />
                        <h3 className="text-xl font-serif text-text-primary mb-3">No Stories Yet</h3>
                        <p className="text-sm font-sans text-text-secondary max-w-sm leading-relaxed">
                            We couldn't find any stories here. Be the first to create one!
                        </p>
                    </Card>
                )}

                {isLoading && stories.length > 0 && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-gold animate-spin" />
                    </div>
                )}

                {hasMore && <div ref={sentinelRef} className="h-10 w-full" />}
                
                {!hasMore && stories.length > 0 && (
                    <p className="text-center text-[10px] font-mono-num uppercase tracking-[0.2em] text-text-muted py-8 border-t border-border mt-4">
                        No more stories
                    </p>
                )}
            </div>
        </div>
    );
}
