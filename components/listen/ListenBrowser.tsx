"use client";

// ============================================================
// Parlai — Listen Browser (Podcast shows + episodes)
// ============================================================

import React from 'react';
import { useListen } from '@/hooks/useListen';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle, Clock, Radio, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

interface ListenBrowserProps {
    languageId: string;
    onSelectEpisode: (episodeId: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
    A1: 'bg-emerald-500/20 text-emerald-300', A2: 'bg-teal-500/20 text-teal-300',
    B1: 'bg-blue-500/20 text-blue-300', B2: 'bg-violet-500/20 text-violet-300',
    C1: 'bg-amber-500/20 text-amber-300', C2: 'bg-rose-500/20 text-rose-300',
};

function formatDuration(s: number): string {
    if (!s) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ListenBrowser({ languageId, onSelectEpisode }: ListenBrowserProps) {
    const { shows, episodes, isLoading, hasMore, showFilter, setShowFilter, fetchMore } = useListen(languageId);

    return (
        <div>
            {/* Shows row */}
            {shows.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Shows</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                        {/* All shows chip */}
                        <button
                            onClick={() => setShowFilter('')}
                            className={`shrink-0 transition-all ${!showFilter
                                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl'
                                    : ''
                                }`}
                        >
                            <Card className="p-3 w-28 h-28 flex flex-col items-center justify-center gap-2 bg-muted/50">
                                <Radio className="w-5 h-5 text-muted-foreground" />
                                <span className="text-xs font-medium text-center">All Shows</span>
                            </Card>
                        </button>

                        {shows.map((show: any) => (
                            <button
                                key={show.id}
                                onClick={() => setShowFilter(show.id === showFilter ? '' : show.id)}
                                className={`shrink-0 transition-all ${showFilter === show.id
                                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl'
                                        : ''
                                    }`}
                            >
                                <Card className="w-28 h-28 flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                                    <div
                                        className="absolute inset-0 opacity-20"
                                        style={{ backgroundColor: show.cover_color || '#666' }}
                                    />
                                    <div className="relative z-10 flex flex-col items-center gap-1.5">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: show.cover_color || '#666' }}
                                        >
                                            <Headphones className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-[10px] font-bold text-center line-clamp-2 px-1">{show.name}</span>
                                        <span className="text-[9px] text-muted-foreground">{show.episode_count} ep</span>
                                    </div>
                                </Card>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Episodes */}
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Episodes</h3>

            {isLoading && episodes.length === 0 ? (
                <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : episodes.length === 0 ? (
                <div className="text-center py-20">
                    <Headphones className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No episodes yet. Check back soon!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {episodes.map((ep: any, i: number) => (
                        <motion.div
                            key={ep.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card
                                className="p-3 flex items-center gap-3 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all group"
                                onClick={() => onSelectEpisode(ep.id)}
                            >
                                {/* Show color dot */}
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                                    style={{ backgroundColor: ep.show?.cover_color || '#666' }}
                                >
                                    <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground">{ep.show?.name}</p>
                                    <h4 className="text-sm font-medium line-clamp-1">{ep.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        {ep.cefr_level && (
                                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${LEVEL_COLORS[ep.cefr_level] || 'bg-muted text-muted-foreground'}`}>
                                                {ep.cefr_level}
                                            </span>
                                        )}
                                        {ep.duration_seconds > 0 && (
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                <Clock className="w-3 h-3" /> {formatDuration(ep.duration_seconds)}
                                            </span>
                                        )}
                                        {ep.published_at && (
                                            <span className="text-[10px] text-muted-foreground">{formatDate(ep.published_at)}</span>
                                        )}
                                    </div>
                                </div>

                                {ep.user_progress?.completed && (
                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" fill="rgba(16,185,129,0.3)" />
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

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
