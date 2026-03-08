"use client";

// ============================================================
// Parlova — Article Browser (Cost-Optimized, 3 feeds)
// ============================================================

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useArticles } from '@/hooks/useArticles';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Loader2, Newspaper, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ArticleReader = dynamic(() => import('./ArticleReader'), { ssr: false });

interface ArticleBrowserProps {
    languageId: string;
    userLevel: string;
}

const TOPIC_CHIPS = ['all', 'news', 'politics', 'culture', 'science', 'lifestyle', 'environment'];

// Source badge colors matching the 3 launch feeds
const SOURCE_COLORS: Record<string, string> = {
    'BBC Mundo': 'bg-red-600',
    'DW Español': 'bg-yellow-500',
    '20 Minutos': 'bg-blue-500',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
}

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
        { value: 'easier', label: 'Easier' },
        { value: userLevel, label: userLevel },
        { value: 'harder', label: 'Harder' },
        { value: 'all', label: 'All' },
    ];

    return (
        <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full">
            <AnimatePresence>
                {activeArticleId && (
                    <ArticleReader
                        articleId={activeArticleId}
                        onClose={() => setActiveArticleId(null)}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <Newspaper className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Read</h2>
                        <p className="text-sm text-muted-foreground">
                            Real Spanish articles updated daily
                        </p>
                    </div>
                </div>
            </div>

            {/* Level filter tabs */}
            <div className="flex gap-2">
                {levelTabs.map(tab => (
                    <Button
                        key={tab.value}
                        size="sm"
                        variant={levelFilter === tab.value ? 'default' : 'outline'}
                        onClick={() => setLevelFilter(tab.value)}
                        className={`text-xs font-bold rounded-full ${levelFilter === tab.value ? 'bg-primary' : 'bg-card border-border'}`}
                    >
                        {tab.label}
                    </Button>
                ))}
            </div>

            {/* Topic filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {TOPIC_CHIPS.map(topic => (
                    <button
                        key={topic}
                        onClick={() => setTopicFilter(topic)}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all ${topicFilter === topic
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {topic === 'all' ? 'All Topics' : topic}
                    </button>
                ))}
            </div>

            {error && (
                <Card className="p-6 text-center border-destructive/30">
                    <p className="text-destructive font-medium">{error}</p>
                </Card>
            )}

            {/* Article cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading && articles.length === 0 && (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={`skeleton-${i}`} className="p-5 animate-pulse">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-full bg-muted" />
                                <div className="h-3 w-20 rounded bg-muted" />
                            </div>
                            <div className="h-5 w-3/4 rounded bg-muted mb-2" />
                            <div className="h-3 w-full rounded bg-muted mb-1" />
                            <div className="h-3 w-5/6 rounded bg-muted mb-4" />
                            <div className="flex gap-2">
                                <div className="h-5 w-10 rounded-full bg-muted" />
                                <div className="h-5 w-16 rounded-full bg-muted" />
                            </div>
                        </Card>
                    ))
                )}

                {articles.map((article, i) => {
                    const isCompleted = !!article.user_progress?.completed_at;
                    const isStarted = !!article.user_progress?.started_at && !isCompleted;

                    return (
                        <motion.div
                            key={article.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card
                                className={`p-5 cursor-pointer transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : ''
                                    }`}
                                onClick={() => handleArticleClick(article.id)}
                            >
                                {isCompleted && (
                                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        {article.user_progress?.comprehension_score !== null && (
                                            <span className="text-[10px] font-bold text-emerald-500">
                                                {article.user_progress?.comprehension_score}%
                                            </span>
                                        )}
                                    </div>
                                )}
                                {isStarted && (
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">
                                            In Progress
                                        </span>
                                    </div>
                                )}

                                {/* Source badge */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${SOURCE_COLORS[article.source_name] || 'bg-muted'}`}>
                                        {article.source_name.charAt(0)}
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {article.source_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground/50">•</span>
                                    <span className="text-xs text-muted-foreground/70">
                                        {article.published_at ? timeAgo(article.published_at) : ''}
                                    </span>
                                </div>

                                <h3 className="font-bold text-foreground mb-2 line-clamp-2 leading-snug">
                                    {article.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {article.summary}
                                </p>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelColor(article.cefr_level)}`}>
                                        {article.cefr_level}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {article.estimated_read_minutes} min
                                    </span>
                                    {article.topics?.[0] && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-muted-foreground capitalize">
                                            {article.topics[0]}
                                        </span>
                                    )}
                                    <span className="text-[11px] text-muted-foreground/60 ml-auto">
                                        {article.word_count} words
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Empty state */}
            {!isLoading && articles.length === 0 && !error && (
                <Card className="p-12 flex flex-col items-center justify-center text-center bg-card/50 border-dashed border-2">
                    <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-bold mb-2">No articles at this level yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-4">
                        Check back tomorrow — new articles are added daily.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setLevelFilter('all')}
                        className="text-sm"
                    >
                        Try All Levels
                    </Button>
                </Card>
            )}

            {isLoading && articles.length > 0 && (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
            )}

            {hasMore && <div ref={sentinelRef} className="h-4" />}

            {!hasMore && articles.length > 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">
                    You&apos;ve seen all available articles
                </p>
            )}
        </div>
    );
}
