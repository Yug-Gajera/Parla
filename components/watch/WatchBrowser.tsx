"use client";

// ============================================================
// Parlai — Watch Browser (Video Grid)
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

const LEVEL_COLORS: Record<string, string> = {
    A1: 'bg-emerald-500/20 text-emerald-300', A2: 'bg-teal-500/20 text-teal-300',
    B1: 'bg-blue-500/20 text-blue-300', B2: 'bg-violet-500/20 text-violet-300',
    C1: 'bg-amber-500/20 text-amber-300', C2: 'bg-rose-500/20 text-rose-300',
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
        <div>
            {/* Level filter */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                {LEVELS.map(l => (
                    <button
                        key={l}
                        onClick={() => setLevelFilter(l)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${levelFilter === l ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                            }`}
                    >{LEVEL_LABELS[l]}</button>
                ))}
            </div>

            {/* Topic filter */}
            <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
                {TOPICS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTopicFilter(t)}
                        className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all border ${topicFilter === t
                                ? 'border-primary/30 bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted'
                            }`}
                    >{TOPIC_LABELS[t]}</button>
                ))}
            </div>

            {/* Video grid */}
            {isLoading && videos.length === 0 ? (
                <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : videos.length === 0 ? (
                <div className="text-center py-20">
                    <Monitor className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No videos yet. Check back soon!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {videos.map((video, i) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card
                                className="overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all group"
                                onClick={() => onSelectVideo(video.id)}
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-muted">
                                    <img
                                        src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {/* Play overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                                            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                                        </div>
                                    </div>
                                    {/* Duration badge */}
                                    {video.duration_seconds > 0 && (
                                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                            {formatDuration(video.duration_seconds)}
                                        </div>
                                    )}
                                    {/* Completed */}
                                    {video.user_progress?.completed && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle className="w-5 h-5 text-emerald-400" fill="rgba(16,185,129,0.3)" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className="text-xs text-muted-foreground mb-1">{video.channel_name}</p>
                                    <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{video.title}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${LEVEL_COLORS[video.cefr_level] || 'bg-muted text-muted-foreground'}`}>
                                            {video.cefr_level}
                                        </span>
                                        {video.topics?.slice(0, 2).map(t => (
                                            <span key={t} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize">
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
                <div className="flex justify-center mt-6">
                    <Button variant="outline" onClick={fetchMore} disabled={isLoading} className="gap-2">
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Load More
                    </Button>
                </div>
            )}
        </div>
    );
}
