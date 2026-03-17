"use client";

// ============================================================
// Parlova — Watch Browser (Redesigned)
// ============================================================

import React from 'react';
import { useWatch } from '@/hooks/useWatch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle, Clock, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

interface WatchBrowserProps {
    languageId: string;
    onSelectVideo: (videoId: string) => void;
}

const LEVELS = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVEL_LABELS: Record<string, string> = { '': 'All Levels', 'A1': 'A1', 'A2': 'A2', 'B1': 'B1', 'B2': 'B2', 'C1': 'C1', 'C2': 'C2' };
const TOPICS = ['', 'basics', 'conversation', 'culture', 'news', 'documentary', 'stories'];
const TOPIC_LABELS: Record<string, string> = {
    '': 'All', 'basics': 'Basics', 'conversation': 'Conversation', 'culture': 'Culture',
    'news': 'News', 'documentary': 'Documentary', 'stories': 'Stories',
};

function formatDuration(s: number): string {
    if (!s) return '';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `0:${String(sec).padStart(2, '0')}`;
}

export default function WatchBrowser({ languageId, onSelectVideo }: WatchBrowserProps) {
    const { videos, isLoading, hasMore, levelFilter, topicFilter, setLevelFilter, setTopicFilter, fetchMore } = useWatch(languageId);

    return (
        <div className="font-sans">
            {/* Filters Header */}
            <div className="flex flex-col gap-4 mb-8 bg-card border border-border p-5 rounded-[18px] shadow-sm">
                {/* Level filter */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono-num shrink-0 mr-2">Proficiency</span>
                    {LEVELS.map(l => (
                        <button
                            key={l}
                            onClick={() => setLevelFilter(l)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-mono-num tracking-wider uppercase whitespace-nowrap transition-all border ${
                                levelFilter === l 
                                    ? 'bg-gold-subtle text-gold border-gold-border' 
                                    : 'bg-surface text-text-muted border-border hover:border-border-strong hover:text-text-primary'
                                }`}
                        >{LEVEL_LABELS[l]}</button>
                    ))}
                </div>

                {/* Topic filter */}
                <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar mt-1">
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono-num shrink-0 mr-2">Categories </span>
                    {TOPICS.map(t => (
                        <button
                            key={t}
                            onClick={() => setTopicFilter(t)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-mono-num tracking-wider uppercase whitespace-nowrap transition-all border ${
                                topicFilter === t
                                    ? 'bg-text-primary text-background border-text-primary'
                                    : 'bg-transparent text-text-muted border-border hover:border-border-strong hover:text-text-primary'
                                }`}
                        >{TOPIC_LABELS[t]}</button>
                    ))}
                </div>
            </div>

            {/* Video grid */}
            {isLoading && videos.length === 0 ? (
                <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
            ) : videos.length === 0 ? (
                <div className="text-center py-24 border border-border border-dashed rounded-[18px] bg-card shadow-sm">
                    <Monitor className="w-12 h-12 mx-auto text-text-muted mb-4" />
                    <p className="text-text-muted font-display text-lg">No content found matching criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video, i) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card
                                className="overflow-hidden cursor-pointer border-border bg-card hover:border-accent-border transition-all duration-500 group rounded-[18px] h-full flex flex-col shadow-sm"
                                onClick={() => onSelectVideo(video.id)}
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-background overflow-hidden">
                                    <img
                                        src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                                    
                                    {/* Play overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-14 h-14 rounded-full bg-text-primary/10 backdrop-blur-md border border-text-primary/30 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                                            <Play className="w-5 h-5 text-text-primary ml-1" fill="currentColor" />
                                        </div>
                                    </div>

                                    {/* Duration badge */}
                                    {video.duration_seconds > 0 && (
                                        <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm border border-border-strong text-text-primary font-mono-num text-[9px] px-2 py-1 rounded">
                                            {formatDuration(video.duration_seconds)}
                                        </div>
                                    )}
                                    
                                    {/* Completed status */}
                                    {video.user_progress?.completed && (
                                        <div className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm border border-border rounded-full px-2 py-1 flex items-center gap-1.5">
                                            <CheckCircle className="w-3 h-3 text-gold" />
                                            <span className="text-[9px] font-mono-num uppercase tracking-wider text-gold">Viewed</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] mb-2 font-mono-num truncate">{video.channel_name}</p>
                                    <h3 className="font-display text-lg text-text-primary leading-snug mb-4 line-clamp-2 group-hover:text-gold transition-colors">{video.title}</h3>
                                    
                                    <div className="mt-auto flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-mono-num tracking-widest uppercase border border-border px-2 py-1 rounded-md text-gold bg-gold-subtle`}>
                                            {video.cefr_level || 'ALL'}
                                        </span>
                                        {video.topics?.slice(0, 2).map(t => (
                                            <span key={t} className="text-[9px] font-mono-num uppercase tracking-wider text-text-muted border border-border bg-surface px-2 py-1 rounded-md">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Load more */}
            {hasMore && (
                <div className="flex justify-center mt-12 mb-8">
                    <Button onClick={fetchMore} disabled={isLoading} className="btn-action w-fit px-8 h-12">
                        {isLoading && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                        Expand Library
                    </Button>
                </div>
            )}
        </div>
    );
}
