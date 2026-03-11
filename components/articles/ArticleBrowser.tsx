"use client";

// ============================================================
// Parlova — Article Browser (Redesigned)
// ============================================================

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useArticles } from '@/hooks/useArticles';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Loader2, Newspaper, Search, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ArticleReader = dynamic(() => import('./ArticleReader'), { ssr: false });

interface ArticleBrowserProps {
    languageId: string;
    userLevel: string;
}

const TOPIC_CHIPS = ['all', 'news', 'politics', 'culture', 'science', 'lifestyle', 'environment'];

// Neutral, sophisticated source colors
const SOURCE_COLORS: Record<string, string> = {
    'BBC Mundo': 'bg-[#2a2a2a] text-[#f0ece4]',
    'DW Español': 'bg-[#1e1e1e] text-[#e4c76b]',
    '20 Minutos': 'bg-[#141414] text-[#c9a84c]',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
}

export default function ArticleBrowser({ languageId, userLevel }: ArticleBrowserProps) {
    const {
        articles, isLoading, error, hasMore,
        levelFilter, topicFilter,
        setLevelFilter, setTopicFilter, fetchMore,
    } = useArticles(languageId, userLevel);

    const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) fetchMore(); },
            { rootMargin: '200px' }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, fetchMore]);

    const handleArticleClick = useCallback((id: string) => {
        setActiveArticleId(id);
    }, []);

    const levelTabs = [
        { value: 'easier', label: 'Simplified' },
        { value: userLevel, label: `Target (${userLevel})` },
        { value: 'harder', label: 'Advanced' },
        { value: 'all', label: 'Unfiltered' },
    ];

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full font-sans">
            <AnimatePresence>
                {activeArticleId && (
                    <ArticleReader
                        articleId={activeArticleId}
                        onClose={() => setActiveArticleId(null)}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full border border-[#2a2a2a] bg-[#0f0f0f] flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[#c9a84c]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Newspaper className="w-5 h-5 text-[#c9a84c] relative z-10" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif text-[#f0ece4] tracking-tight mb-1">Immersion Library</h2>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a5652]">
                            Authentic publications in <span className="text-[#9a9590]">real-time</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                
                {/* Level Tabs */}
                <div className="flex bg-[#0f0f0f] border border-[#1e1e1e] p-1 rounded-full w-full md:w-auto">
                    {levelTabs.map(tab => {
                        const active = levelFilter === tab.value;
                        return (
                            <Button
                                key={tab.value}
                                variant="ghost"
                                onClick={() => setLevelFilter(tab.value)}
                                className={`flex-1 md:flex-none text-[10px] font-mono tracking-widest uppercase rounded-full h-8 px-5 transition-all
                                    ${active ? 'bg-[#141414] text-[#c9a84c] shadow-md border border-[#2a2a2a]' : 'text-[#5a5652] hover:text-[#9a9590]'}
                                `}
                            >
                                {tab.label}
                            </Button>
                        );
                    })}
                </div>

                {/* Topic Chips */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto mask-fade-right pr-4">
                    {TOPIC_CHIPS.map(topic => {
                        const active = topicFilter === topic;
                        return (
                            <button
                                key={topic}
                                onClick={() => setTopicFilter(topic)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-all border
                                    ${active
                                        ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30'
                                        : 'bg-[#141414] border-[#1e1e1e] text-[#5a5652] hover:border-[#2a2a2a] hover:text-[#9a9590]'
                                    }`}
                            >
                                {topic === 'all' ? 'All Channels' : topic}
                            </button>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 text-[#ef4444] text-sm text-center font-mono uppercase tracking-widest">
                    <Terminal className="w-4 h-4 inline-block mr-2" /> Error: {error}
                </div>
            )}

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {isLoading && articles.length === 0 && (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={`skeleton-${i}`} className="p-6 bg-[#0f0f0f] border-[#1e1e1e] animate-pulse rounded-2xl flex flex-col h-[280px]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#2a2a2a]" />
                                <div className="flex-1 flex justify-between">
                                    <div className="h-3 w-20 rounded bg-[#1e1e1e]" />
                                    <div className="h-3 w-10 rounded bg-[#141414]" />
                                </div>
                            </div>
                            <div className="h-6 w-3/4 rounded bg-[#1e1e1e] mb-3" />
                            <div className="h-6 w-5/6 rounded bg-[#1e1e1e] mb-6" />
                            <div className="mt-auto flex gap-2">
                                <div className="h-5 w-12 rounded-full bg-[#141414]" />
                                <div className="h-5 w-16 rounded-full bg-[#141414]" />
                            </div>
                        </Card>
                    ))
                )}

                {articles.map((article, i) => {
                    const isCompleted = !!article.user_progress?.completed_at;
                    const isStarted = !!article.user_progress?.started_at && !isCompleted;
                    const sourceStyle = SOURCE_COLORS[article.source_name] || 'bg-[#1e1e1e] text-[#5a5652]';

                    return (
                        <motion.div
                            key={article.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <Card
                                className={`p-6 sm:p-7 cursor-pointer transition-all duration-300 rounded-2xl flex flex-col h-[260px] md:h-[280px] group relative overflow-hidden border
                                    ${isCompleted 
                                        ? 'bg-[#0f0f0f] border-[#2a2a2a] opacity-80' 
                                        : 'bg-[#141414] border-[#1e1e1e] hover:border-[#c9a84c]/50 hover:bg-[#171717] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]'
                                    }
                                `}
                                onClick={() => handleArticleClick(article.id)}
                            >
                                {/* Completion / Status indicator */}
                                {isCompleted && (
                                    <div className="absolute top-4 right-4 bg-[#080808] border border-[#c9a84c]/30 px-3 py-1 rounded-full flex items-center gap-2 shadow-inner">
                                        <CheckCircle2 className="w-3 h-3 text-[#c9a84c]" />
                                        {article.user_progress?.comprehension_score !== null && (
                                            <span className="text-[10px] font-mono text-[#c9a84c]">
                                                {article.user_progress?.comprehension_score}%
                                            </span>
                                        )}
                                    </div>
                                )}
                                {isStarted && (
                                    <div className="absolute top-4 right-4">
                                        <span className="px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20">
                                            Active
                                        </span>
                                    </div>
                                )}

                                {/* Source Header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm border border-[#2a2a2a] shadow-inner ${sourceStyle}`}>
                                        {article.source_name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-mono uppercase tracking-widest text-[#9a9590]">
                                            {article.source_name}
                                        </span>
                                        <span className="text-[9px] font-mono text-[#5a5652] tracking-widest">
                                            {article.published_at ? timeAgo(article.published_at) : '—'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className={`font-serif text-lg leading-snug mb-3 line-clamp-2 ${isCompleted ? 'text-[#9a9590]' : 'text-[#f0ece4] group-hover:text-[#c9a84c] transition-colors'}`}>
                                    {article.title}
                                </h3>
                                <p className="text-[13px] text-[#5a5652] line-clamp-2 mb-6 font-sans">
                                    {article.summary || "Select to initialize structural analysis and decode content."}
                                </p>

                                {/* Footer Tags */}
                                <div className="mt-auto flex items-center gap-3 flex-wrap">
                                    <span className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-[0.2em] border 
                                        ${article.cefr_level === userLevel 
                                            ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30' 
                                            : 'bg-[#080808] text-[#9a9590] border-[#2a2a2a]'
                                        }
                                    `}>
                                        {article.cefr_level}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[#5a5652]">
                                        <Clock className="w-3 h-3 text-[#c9a84c]/50" />
                                        {article.estimated_read_minutes} min
                                    </span>
                                    {article.topics?.[0] && (
                                        <span className="px-2 py-1 rounded text-[9px] font-mono uppercase tracking-widest bg-[#0f0f0f] border border-[#1e1e1e] text-[#5a5652]">
                                            {article.topics[0]}
                                        </span>
                                    )}
                                    <span className="text-[9px] font-mono text-[#5a5652] uppercase tracking-[0.1em] ml-auto">
                                        {article.word_count} W
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Empty state */}
            {!isLoading && articles.length === 0 && !error && (
                <Card className="p-16 flex flex-col items-center justify-center text-center bg-[#0f0f0f] border-dashed border-[#1e1e1e] rounded-3xl min-h-[300px]">
                    <Search className="w-10 h-10 text-[#2a2a2a] mb-6" />
                    <h3 className="text-xl font-serif text-[#f0ece4] mb-3">No Publications Found</h3>
                    <p className="text-sm text-[#9a9590] max-w-sm mb-6 leading-relaxed">
                        No articles match the current filter parameters. The intelligence feed updates at 00:00 GMT.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setLevelFilter('all')}
                        className="rounded-full bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#141414] hover:border-[#2a2a2a] font-mono text-[10px] uppercase tracking-widest px-8 h-10"
                    >
                        Reset Filter
                    </Button>
                </Card>
            )}

            {isLoading && articles.length > 0 && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
                </div>
            )}

            {hasMore && <div ref={sentinelRef} className="h-10 w-full" />}

            {!hasMore && articles.length > 0 && (
                <p className="text-center text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a5652] py-8 border-t border-[#1e1e1e] mt-4">
                    End of available feed
                </p>
            )}
        </div>
    );
}
