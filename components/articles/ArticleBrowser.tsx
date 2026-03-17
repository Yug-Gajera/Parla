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
    'BBC Mundo': 'bg-border-strong text-text-primary',
    'DW Español': 'bg-[#E8521A]/10 text-[#E8521A]',
    '20 Minutos': 'bg-card text-[#E8521A]',
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full border border-border-strong bg-surface flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[#E8521A]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        < Newspaper className="w-5 h-5 text-[#E8521A] relative z-10" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif text-text-primary tracking-tight mb-1">Immersion Library</h2>
                        <p className="text-[10px] font-mono-num uppercase tracking-[0.2em] text-text-muted">
                            Authentic publications in <span className="text-text-secondary">real-time</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                
                {/* Level Tabs */}
                <div className="flex bg-surface border border-border p-1 rounded-full w-full md:w-auto">
                    {levelTabs.map(tab => {
                        const active = levelFilter === tab.value;
                        return (
                            <Button
                                key={tab.value}
                                variant="ghost"
                                onClick={() => setLevelFilter(tab.value)}
                                className={`flex-1 md:flex-none text-[10px] font-mono-num tracking-widest uppercase rounded-full h-8 px-5 transition-all
                                    ${active ? 'bg-card text-[#E8521A] shadow-md border border-border-strong' : 'text-text-muted hover:text-text-secondary'}
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
                                className={`px-4 py-1.5 rounded-full text-[10px] font-mono-num uppercase tracking-widest whitespace-nowrap transition-all border
                                    ${active
                                        ? 'bg-[#E8521A]/10 text-[#E8521A] border-[#E8521A]/30 shadow-md'
                                        : 'bg-card border-border text-text-muted hover:border-border-strong hover:text-text-secondary hover:bg-surface'
                                    }`}
                            >
                                {topic === 'all' ? 'All Channels' : topic}
                            </button>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl border border-error/20 bg-error/5 text-error text-sm text-center font-mono-num uppercase tracking-widest">
                    <Terminal className="w-4 h-4 inline-block mr-2" /> Error: {error}
                </div>
            )}

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {isLoading && articles.length === 0 && (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={`skeleton-${i}`} className="p-6 bg-surface border-border animate-pulse rounded-2xl flex flex-col h-[280px]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-card border border-border-strong" />
                                <div className="flex-1 flex justify-between">
                                    <div className="h-3 w-20 rounded bg-border" />
                                    <div className="h-3 w-10 rounded bg-card" />
                                </div>
                            </div>
                            <div className="h-6 w-3/4 rounded bg-border mb-3" />
                            <div className="h-6 w-5/6 rounded bg-border mb-6" />
                            <div className="mt-auto flex gap-2">
                                <div className="h-5 w-12 rounded-full bg-card" />
                                <div className="h-5 w-16 rounded-full bg-card" />
                            </div>
                        </Card>
                    ))
                )}

                {articles.map((article, i) => {
                    const isCompleted = !!article.user_progress?.completed_at;
                    const isStarted = !!article.user_progress?.started_at && !isCompleted;
                    const sourceStyle = SOURCE_COLORS[article.source_name] || 'bg-border text-text-muted';

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
                                        ? 'bg-surface border-border-strong opacity-80' 
                                        : 'bg-card border-border hover:border-[#E8521A]/50 hover:bg-surface hover:-translate-y-1 hover:shadow-md'
                                    }
                                `}
                                onClick={() => handleArticleClick(article.id)}
                            >
                                {/* Completion / Status indicator */}
                                {isCompleted && (
                                    <div className="absolute top-4 right-4 bg-background border border-[#E8521A]/30 px-3 py-1 rounded-full flex items-center gap-2 shadow-inner">
                                        <CheckCircle2 className="w-3 h-3 text-[#E8521A]" />
                                        {article.user_progress?.comprehension_score !== null && (
                                            <span className="text-[10px] font-mono-num text-[#E8521A]">
                                                {article.user_progress?.comprehension_score}%
                                            </span>
                                        )}
                                    </div>
                                )}
                                {isStarted && (
                                    <div className="absolute top-4 right-4">
                                        <span className="px-3 py-1 rounded-full text-[9px] font-mono-num uppercase tracking-widest bg-[#E8521A]/10 text-[#E8521A] border border-[#E8521A]/20 shadow-sm">
                                            Active
                                        </span>
                                    </div>
                                )}

                                {/* Source Header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm border border-border-strong shadow-inner ${sourceStyle}`}>
                                        {article.source_name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-mono-num uppercase tracking-widest text-text-secondary">
                                            {article.source_name}
                                        </span>
                                        <span className="text-[9px] font-mono-num text-text-muted tracking-widest">
                                            {article.published_at ? timeAgo(article.published_at) : '—'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className={`font-serif text-lg leading-snug mb-3 line-clamp-2 ${isCompleted ? 'text-text-secondary' : 'text-text-primary group-hover:text-[#E8521A] transition-colors'}`}>
                                    {article.title}
                                </h3>
                                <p className="text-[13px] text-text-muted line-clamp-2 mb-6 font-sans">
                                    {article.summary || "Select to initialize structural analysis and decode content."}
                                </p>

                                {/* Footer Tags */}
                                <div className="mt-auto flex items-center gap-3 flex-wrap">
                                    <span className={`px-2 py-1 rounded text-[9px] font-mono-num font-bold uppercase tracking-[0.2em] border 
                                        ${article.cefr_level === userLevel 
                                            ? 'bg-[#E8521A]/10 text-[#E8521A] border-[#E8521A]/30 shadow-sm' 
                                            : 'bg-background text-text-secondary border-border-strong'
                                        }
                                    `}>
                                        {article.cefr_level}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[9px] font-mono-num uppercase tracking-widest text-text-muted">
                                        <Clock className="w-3 h-3 text-[#E8521A]/50" />
                                        {article.estimated_read_minutes} min
                                    </span>
                                    {article.topics?.[0] && (
                                        <span className="px-2 py-1 rounded text-[9px] font-mono-num uppercase tracking-widest bg-surface border border-border text-text-muted">
                                            {article.topics[0]}
                                        </span>
                                    )}
                                    <span className="text-[9px] font-mono-num text-text-muted uppercase tracking-[0.1em] ml-auto">
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
                <Card className="p-16 flex flex-col items-center justify-center text-center bg-surface border-dashed border-border rounded-3xl min-h-[300px]">
                    <Search className="w-10 h-10 text-border-strong mb-6" />
                    <h3 className="text-xl font-serif text-text-primary mb-3">No Publications Found</h3>
                    <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
                        No articles match the current filter parameters. The intelligence feed updates at 00:00 GMT.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setLevelFilter('all')}
                        className="rounded-full bg-transparent border-border text-text-primary hover:bg-card hover:border-border-strong font-mono-num text-[10px] uppercase tracking-widest px-8 h-10"
                    >
                        Reset Filter
                    </Button>
                </Card>
            )}

            {isLoading && articles.length > 0 && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#E8521A] animate-spin" />
                </div>
            )}

            {hasMore && <div ref={sentinelRef} className="h-10 w-full" />}

            {!hasMore && articles.length > 0 && (
                <p className="text-center text-[10px] font-mono-num uppercase tracking-[0.2em] text-text-muted py-8 border-t border-border mt-4">
                    End of available feed
                </p>
            )}
        </div>
    );
}
