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
            <div className="flex flex-col gap-4 mb-8 bg-[#141414] border border-[#1e1e1e] p-5 rounded-2xl">
                {/* Level filter */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    <span className="text-[10px] uppercase tracking-widest text-[#5a5652] font-mono shrink-0 mr-2">Proficiency</span>
                    {LEVELS.map(l => (
                        <button
                            key={l}
                            onClick={() => setLevelFilter(l)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-mono tracking-wider uppercase whitespace-nowrap transition-all border ${
                                levelFilter === l 
                                    ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30' 
                                    : 'bg-[#0f0f0f] text-[#9a9590] border-[#1e1e1e] hover:border-[#2a2a2a] hover:text-[#f0ece4]'
                                }`}
                        >{LEVEL_LABELS[l]}</button>
                    ))}
                </div>

                {/* Topic filter */}
                <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar mt-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#5a5652] font-mono shrink-0 mr-2">Categories </span>
                    {TOPICS.map(t => (
                        <button
                            key={t}
                            onClick={() => setTopicFilter(t)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-mono tracking-wider uppercase whitespace-nowrap transition-all border ${
                                topicFilter === t
                                    ? 'bg-[#f0ece4] text-[#080808] border-[#f0ece4]'
                                    : 'bg-transparent text-[#9a9590] border-[#1e1e1e] hover:border-[#2a2a2a] hover:text-[#f0ece4]'
                                }`}
                        >{TOPIC_LABELS[t]}</button>
                    ))}
                </div>
            </div>

            {/* Video grid */}
            {isLoading && videos.length === 0 ? (
                <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#c9a84c]" /></div>
            ) : videos.length === 0 ? (
                <div className="text-center py-24 border border-[#1e1e1e] border-dashed rounded-2xl bg-[#0f0f0f]">
                    <Monitor className="w-12 h-12 mx-auto text-[#5a5652] mb-4" />
                    <p className="text-[#9a9590] font-serif text-lg">No content found matching criteria.</p>
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
                                className="overflow-hidden cursor-pointer border-[#1e1e1e] bg-[#141414] hover:border-[#c9a84c]/50 transition-all duration-500 group rounded-2xl h-full flex flex-col"
                                onClick={() => onSelectVideo(video.id)}
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-[#080808] overflow-hidden">
                                    <img
                                        src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-80" />
                                    
                                    {/* Play overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-14 h-14 rounded-full bg-[#f0ece4]/10 backdrop-blur-md border border-[#f0ece4]/30 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                                            <Play className="w-5 h-5 text-[#f0ece4] ml-1" fill="currentColor" />
                                        </div>
                                    </div>

                                    {/* Duration badge */}
                                    {video.duration_seconds > 0 && (
                                        <div className="absolute bottom-3 right-3 bg-[#080808]/80 backdrop-blur-sm border border-[#2a2a2a] text-[#f0ece4] font-mono text-[9px] px-2 py-1 rounded">
                                            {formatDuration(video.duration_seconds)}
                                        </div>
                                    )}
                                    
                                    {/* Completed status */}
                                    {video.user_progress?.completed && (
                                        <div className="absolute top-3 right-3 bg-[#141414]/80 backdrop-blur-sm border border-[#1e1e1e] rounded-full px-2 py-1 flex items-center gap-1.5">
                                            <CheckCircle className="w-3 h-3 text-[#c9a84c]" />
                                            <span className="text-[9px] font-mono uppercase tracking-wider text-[#c9a84c]">Viewed</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <p className="text-[10px] text-[#5a5652] uppercase tracking-[0.2em] mb-2 font-mono truncate">{video.channel_name}</p>
                                    <h3 className="font-serif text-lg text-[#f0ece4] leading-snug mb-4 line-clamp-2 group-hover:text-[#c9a84c] transition-colors">{video.title}</h3>
                                    
                                    <div className="mt-auto flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-mono tracking-widest uppercase border border-[#1e1e1e] px-2 py-1 rounded-md text-[#c9a84c] bg-[#c9a84c]/5`}>
                                            {video.cefr_level || 'ALL'}
                                        </span>
                                        {video.topics?.slice(0, 2).map(t => (
                                            <span key={t} className="text-[9px] font-mono uppercase tracking-wider text-[#9a9590] border border-[#1e1e1e] bg-[#0f0f0f] px-2 py-1 rounded-md">
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
                    <Button variant="outline" onClick={fetchMore} disabled={isLoading} className="gap-3 rounded-full bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#141414] hover:border-[#2a2a2a] uppercase text-[10px] tracking-widest h-10 px-8">
                        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-[#c9a84c]" />}
                        Expand Library
                    </Button>
                </div>
            )}
        </div>
    );
}
