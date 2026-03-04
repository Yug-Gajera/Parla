"use client";

// ============================================================
// FluentLoop — Story Browser (Generate + Browse)
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

function levelColor(level: string): string {
    const colors: Record<string, string> = {
        A1: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        A2: 'bg-green-500/10 text-green-400 border-green-500/30',
        B1: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        B2: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
        C1: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        C2: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
    return colors[level] || 'bg-muted text-muted-foreground';
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
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            <AnimatePresence>
                {activeStoryId && (
                    <StoryReader
                        storyId={activeStoryId}
                        onClose={() => setActiveStoryId(null)}
                    />
                )}
            </AnimatePresence>

            {/* ── SECTION 1: Generate a Story ── */}
            <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold">Create a story for your level</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5">
                        Stories are saved and shared — you may get an existing one instantly
                    </p>

                    {/* Step 1: Category */}
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Choose a topic</p>
                    <div className="flex gap-2 flex-wrap mb-4">
                        {TOPIC_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.id
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                                    }`}
                            >
                                {cat.emoji} {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Step 2: Content type */}
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Choose a format</p>
                    <div className="flex gap-2 flex-wrap mb-5">
                        {CONTENT_TYPES.map(type => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedContentType(type.id)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedContentType === type.id
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                                    }`}
                            >
                                {TYPE_EMOJI[type.id]} {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Generate button */}
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={getStory}
                            disabled={!selectedCategory || !selectedContentType || isGenerating}
                            className="bg-primary hover:bg-primary/90 font-bold px-6 gap-2 shadow-lg shadow-primary/20"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Writing your story...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Get Story
                                </>
                            )}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            {dailyGenerationsRemaining === 0
                                ? 'Daily limit reached — browse existing stories below'
                                : `${dailyGenerationsRemaining} of 3 daily generations remaining`
                            }
                        </span>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive mt-3">{error}</p>
                    )}
                </div>
            </Card>

            {/* "Found a story" flash */}
            <AnimatePresence>
                {showFoundFlash && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-background/80 backdrop-blur flex items-center justify-center"
                    >
                        <Card className="p-8 text-center border-primary/30">
                            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                            <h3 className="text-lg font-bold">Found a story for you!</h3>
                            <p className="text-sm text-muted-foreground mt-1">Opening now...</p>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SECTION 2: Browse Stories ── */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-bold">Stories at your level</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    Read by other FluentLoop learners
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading && stories.length === 0 && (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={`skeleton-${i}`} className="p-5 animate-pulse">
                                <div className="h-4 w-16 rounded bg-muted mb-3" />
                                <div className="h-5 w-3/4 rounded bg-muted mb-2" />
                                <div className="h-3 w-full rounded bg-muted mb-3" />
                                <div className="flex gap-2">
                                    <div className="h-5 w-10 rounded-full bg-muted" />
                                    <div className="h-5 w-20 rounded-full bg-muted" />
                                </div>
                            </Card>
                        ))
                    )}

                    {stories.map((story, i) => {
                        const cat = TOPIC_CATEGORIES.find(c => c.id === story.topic_category);
                        return (
                            <motion.div key={story.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}>
                                <Card
                                    className="p-5 cursor-pointer transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                                    onClick={() => setActiveStoryId(story.id)}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                            {TYPE_EMOJI[story.content_type]} {story.content_type.replace('_', ' ')}
                                        </span>
                                        {cat && <span className="text-sm">{cat.emoji}</span>}
                                    </div>

                                    <h4 className="font-bold mb-1 line-clamp-2 leading-snug">
                                        {story.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                        {story.summary}
                                    </p>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelColor(story.cefr_level)}`}>
                                            {story.cefr_level}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {story.word_count} words
                                        </span>
                                        {story.times_read > 0 && (
                                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                                                <Users className="w-3 h-3" />
                                                {story.times_read}
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {!isLoading && stories.length === 0 && (
                    <Card className="p-12 flex flex-col items-center justify-center text-center bg-card/50 border-dashed border-2">
                        <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold mb-2">No stories yet at your level</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Be the first to generate one above!
                        </p>
                    </Card>
                )}

                {isLoading && stories.length > 0 && (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                )}

                {hasMore && <div ref={sentinelRef} className="h-4" />}
            </div>
        </div>
    );
}
