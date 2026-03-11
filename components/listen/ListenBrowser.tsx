"use client";

// ============================================================
// Parlova — Listen Browser (Redesigned)
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
        <div className="font-sans">
            {/* Shows row */}
            {shows.length > 0 && (
                <div className="mb-10">
                    <h3 className="text-[10px] font-mono font-bold text-[#5a5652] uppercase tracking-[0.2em] mb-4">Current Series</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                        {/* All shows chip */}
                        <button
                            onClick={() => setShowFilter('')}
                            className={`shrink-0 transition-all rounded-2xl border ${!showFilter
                                    ? 'bg-[#141414] border-[#c9a84c]'
                                    : 'bg-[#0f0f0f] border-[#1e1e1e] hover:border-[#2a2a2a]'
                                }`}
                        >
                            <div className="p-4 w-32 h-32 flex flex-col items-center justify-center gap-3">
                                <Radio className={`w-6 h-6 ${!showFilter ? 'text-[#c9a84c]' : 'text-[#5a5652]'}`} />
                                <span className={`text-[10px] font-mono tracking-widest uppercase ${!showFilter ? 'text-[#c9a84c]' : 'text-[#9a9590]'}`}>Master Feed</span>
                            </div>
                        </button>

                        {shows.map((show: any) => (
                            <button
                                key={show.id}
                                onClick={() => setShowFilter(show.id === showFilter ? '' : show.id)}
                                className={`shrink-0 transition-all rounded-2xl overflow-hidden border ${showFilter === show.id
                                        ? 'border-[#c9a84c] ring-1 ring-[#c9a84c]/20'
                                        : 'border-[#1e1e1e] hover:border-[#2a2a2a]'
                                    }`}
                            >
                                <div className="w-32 h-32 flex flex-col items-center justify-center gap-3 relative bg-[#141414]">
                                    <div
                                        className="absolute inset-0 opacity-10"
                                        style={{ backgroundColor: show.cover_color || '#c9a84c' }}
                                    />
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 shadow-lg mb-2"
                                            style={{ backgroundColor: show.cover_color || '#1e1e1e' }}
                                        >
                                            <Headphones className="w-4 h-4 text-white/90" />
                                        </div>
                                        <span className={`text-[10px] font-mono tracking-widest uppercase text-center line-clamp-2 px-2 ${showFilter === show.id ? 'text-[#c9a84c]' : 'text-[#f0ece4]'}`}>{show.name}</span>
                                        <span className="text-[9px] text-[#5a5652] mt-1 font-mono tracking-wider">{show.episode_count} ep</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Episodes */}
            <h3 className="text-[10px] font-mono font-bold text-[#5a5652] uppercase tracking-[0.2em] mb-4">Episodes</h3>

            {isLoading && episodes.length === 0 ? (
                <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#c9a84c]" /></div>
            ) : episodes.length === 0 ? (
                <div className="text-center py-24 border border-[#1e1e1e] border-dashed rounded-2xl bg-[#0f0f0f]">
                    <Headphones className="w-12 h-12 mx-auto text-[#5a5652] mb-4" />
                    <p className="text-[#9a9590] font-serif text-lg">No episodes indexed for this selection.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {episodes.map((ep: any, i: number) => (
                        <motion.div
                            key={ep.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card
                                className="p-4 flex items-center gap-4 cursor-pointer bg-[#141414] border-[#1e1e1e] hover:border-[#c9a84c]/50 transition-all duration-300 group rounded-2xl h-full"
                                onClick={() => onSelectEpisode(ep.id)}
                            >
                                {/* Show color dot */}
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform duration-500 shadow-md"
                                    style={{ backgroundColor: ep.show?.cover_color || '#1e1e1e' }}
                                >
                                    <Play className="w-5 h-5 text-white/90 ml-1" fill="currentColor" />
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <p className="text-[9px] font-mono uppercase tracking-widest text-[#9a9590] mb-0.5">{ep.show?.name}</p>
                                    <h4 className="font-serif text-base text-[#f0ece4] line-clamp-1 mb-2 group-hover:text-[#c9a84c] transition-colors">{ep.title}</h4>
                                    
                                    <div className="flex items-center gap-3">
                                        {ep.cefr_level && (
                                            <span className="text-[9px] font-mono tracking-widest uppercase border border-[#1e1e1e] px-1.5 py-0.5 rounded text-[#c9a84c] bg-[#c9a84c]/5">
                                                {ep.cefr_level}
                                            </span>
                                        )}
                                        {ep.duration_seconds > 0 && (
                                            <span className="text-[10px] font-mono text-[#5a5652] flex items-center gap-1 uppercase tracking-wider">
                                                <Clock className="w-3 h-3 text-[#5a5652]" /> {formatDuration(ep.duration_seconds)}
                                            </span>
                                        )}
                                        {ep.published_at && (
                                            <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-wider">{formatDate(ep.published_at)}</span>
                                        )}
                                    </div>
                                </div>

                                {ep.user_progress?.completed && (
                                    <div className="shrink-0 bg-[#0f0f0f] border border-[#1e1e1e] rounded-full p-2">
                                        <CheckCircle className="w-4 h-4 text-[#c9a84c]" />
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {hasMore && (
                <div className="flex justify-center mt-10 mb-6">
                    <Button variant="outline" onClick={fetchMore} disabled={isLoading} className="gap-3 rounded-full bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#141414] hover:border-[#2a2a2a] uppercase text-[10px] tracking-widest h-10 px-8">
                        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-[#c9a84c]" />}
                        Access Archive
                    </Button>
                </div>
            )}
        </div>
    );
}
