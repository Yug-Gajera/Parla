"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeckViewer } from '../vocabulary/DeckViewer';
import dynamic from 'next/dynamic';
const ReviewSession = dynamic(() => import('../vocabulary/ReviewSession').then(mod => mod.ReviewSession), {
    loading: () => <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center text-[#E8521A] font-mono text-xs uppercase tracking-widest">Loading protocol...</div>,
    ssr: false
});
import LearnTab from './LearnTab';
import ArticleBrowser from '../articles/ArticleBrowser';
import StoryBrowser from '../stories/StoryBrowser';
import GuidedScenarioList from './GuidedScenarioList';
import { trackEvent } from '@/lib/posthog';
import { VocabularyWord } from '@/hooks/useVocabulary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LearnViewProps {
    languageId: string;
    languageName: string;
    level: string;
    guidedEnabled?: boolean;
    guidedScenariosCompleted?: number;
}

export default function LearnView({ languageId, languageName, level, guidedEnabled = false, guidedScenariosCompleted = 0 }: LearnViewProps) {
    const [reviewWords, setReviewWords] = useState<VocabularyWord[] | null>(null);
    const [completedCount, setCompletedCount] = useState(guidedScenariosCompleted);

    useEffect(() => {
        setCompletedCount(guidedScenariosCompleted);
    }, [guidedScenariosCompleted]);

    useEffect(() => {
        const setupRealtime = async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            
            if (!userId) return;

            const channel = supabase
                .channel('user-progress')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'users',
                        filter: `id=eq.${userId}`,
                    },
                    (payload) => {
                        const newData = payload.new as any;
                        if (newData.guided_scenarios_completed !== undefined) {
                            setCompletedCount(newData.guided_scenarios_completed);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };
        
        const cleanup = setupRealtime();
        return () => {
            cleanup.then(fn => fn && fn());
        };
    }, []);

    // Two main tabs: Guided and Free Practice
    // Default to guided if enabled
    const [mainTab, setMainTab] = useState<'guided' | 'free_practice'>(guidedEnabled ? 'guided' : 'free_practice');

    // Default Sub-tab: "learn" for A1/A2, "read" for B1+
    const isBeginnerLevel = level === 'A1' || level === 'A2';
    const defaultTab = isBeginnerLevel ? 'learn' : 'read';

    const handleStartReview = (words: VocabularyWord[]) => {
        setReviewWords(words);
    };

    return (
        <div className="flex flex-col w-full h-full relative font-sans bg-background">

            {/* Overlay Review Session if active */}
            <AnimatePresence>
                {reviewWords && (
                    <div className="fixed inset-0 z-50">
                        <ReviewSession
                            wordsToReview={reviewWords}
                            languageId={languageId}
                            onClose={() => setReviewWords(null)}
                            onCompletion={() => { }}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content UI */}

                <div className="flex flex-col md:flex-row md:items-end justify-between px-6 sm:px-10 py-8 pb-4 gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-display text-text-primary tracking-tight mb-2">Learning Hub</h1>
                        <p className="text-text-secondary text-xs uppercase tracking-widest font-mono-num">
                            {languageName} <span className="mx-2 text-border-strong">|</span> Goal: {level}
                        </p>
                    </div>
                </div>

                {/* ── Main Top Tabs (Guided vs Free Practice) ── */}
                <div className="flex items-center gap-6 px-6 sm:px-10 overflow-x-auto custom-scrollbar border-b border-[#1e1e1e]">
                    <button
                        onClick={() => {
                            setMainTab('guided');
                            trackEvent('learn_main_tab_switched', { tab: 'guided' });
                        }}
                        className={`text-[11px] font-mono-num tracking-widest uppercase py-3 border-b-2 whitespace-nowrap transition-all ${mainTab === 'guided'
                                ? 'border-[#E8521A] text-[#E8521A]'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Guided
                    </button>
                    <button
                        onClick={() => {
                            setMainTab('free_practice');
                            trackEvent('learn_main_tab_switched', { tab: 'free_practice' });
                        }}
                        className={`text-[11px] font-mono-num tracking-widest uppercase py-3 border-b-2 whitespace-nowrap transition-all ${mainTab === 'free_practice'
                                ? 'border-[#E8521A] text-[#E8521A]'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Free Practice
                    </button>
                </div>

                <div className="flex-1 w-full flex flex-col overflow-hidden relative">
                    
                    {mainTab === 'guided' && (
                        <div className="flex-1 w-full px-6 sm:px-10 py-6 pb-20 overflow-y-auto custom-scrollbar">
                            <GuidedScenarioList 
                                languageId={languageId} 
                                level={level}
                                completedCount={completedCount}
                            />
                        </div>
                    )}

                    {mainTab === 'free_practice' && (
                        <Tabs defaultValue={defaultTab} className="w-full flex-1 flex flex-col h-full">
                            <div className="px-6 sm:px-10 py-4 pb-0 flex overflow-x-auto hide-scrollbar">
                                <TabsList className="bg-surface border border-border p-1.5 rounded-2xl shrink-0 h-auto gap-1">
                                    {['learn', 'read', 'stories', 'vocabulary', 'lessons'].map(tab => (
                                        <TabsTrigger 
                                            key={tab}
                                            value={tab} 
                                            className="capitalize font-mono-num text-[10px] tracking-widest px-6 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-accent data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border-strong text-text-muted hover:text-text-secondary transition-all"
                                        >
                                            {tab}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <div className="flex-1 w-full px-6 sm:px-10 py-6 pb-20 overflow-hidden relative">
                                <TabsContent value="learn" className="h-full m-0 data-[state=inactive]:hidden flex flex-col overflow-y-auto custom-scrollbar">
                                    <LearnTab languageId={languageId} languageName={languageName} level={level} />
                                </TabsContent>

                                <TabsContent value="read" className="h-full m-0 data-[state=inactive]:hidden flex flex-col overflow-y-auto custom-scrollbar">
                                    <ArticleBrowser languageId={languageId} userLevel={level} />
                                </TabsContent>

                                <TabsContent value="stories" className="h-full m-0 data-[state=inactive]:hidden flex flex-col overflow-y-auto custom-scrollbar">
                                    <StoryBrowser languageId={languageId} />
                                </TabsContent>

                                <TabsContent value="vocabulary" className="h-full m-0 data-[state=inactive]:hidden flex flex-col">
                                    <ActionBanner languageId={languageId} onStart={handleStartReview} />
                                    <DeckViewer languageId={languageId} onStartReview={handleStartReview} />
                                </TabsContent>

                                <TabsContent value="lessons" className="m-0 data-[state=inactive]:hidden h-full flex flex-col overflow-y-auto custom-scrollbar">
                                    <LessonsPlaceholder />
                                </TabsContent>
                            </div>
                        </Tabs>
                    )}
                </div>
        </div>
    );
}

// ── Supporting Components ──

function ActionBanner({ languageId, onStart }: any) {
    const [dueWords, setDueWords] = useState<VocabularyWord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDue = async () => {
            try {
                const res = await fetch(`/api/vocabulary/review?language_id=${languageId}&limit=20`);
                if (res.ok) {
                    const json = await res.json();
                    setDueWords(json.data || []);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchDue();
    }, [languageId]);

    if (isLoading || dueWords.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-surface/80 backdrop-blur-md border border-[#E8521A]/20 shadow-[0_4px_20px_rgba(232,82,26,0.15)] rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8521A]/5 rounded-bl-full -z-10 group-hover:bg-[#E8521A]/10 transition-colors duration-700" />
            
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="bg-background border border-border-strong text-[#E8521A] w-16 h-16 rounded-full flex items-center justify-center font-mono-num text-2xl shadow-inner relative z-10">
                    {dueWords.length}
                </div>
                <div className="relative z-10">
                    <h3 className="font-display text-2xl text-text-primary mb-1">Words to Review</h3>
                    <p className="text-xs font-mono-num text-text-muted uppercase tracking-widest mt-2">{dueWords.length} words are ready for you to practice.</p>
                </div>
            </div>

            <Button
                onClick={() => onStart(dueWords)}
                className="w-full sm:w-auto bg-[#E8521A] text-background font-mono-num text-xs uppercase tracking-widest font-bold px-10 h-12 hover:brightness-110 rounded-full transition-all relative z-10 shadow-[0_4px_20px_rgba(232,82,26,0.2)] hover:shadow-[0_6px_25px_rgba(232,82,26,0.25)]"
            >
                Start Review
            </Button>
        </motion.div>
    );
}

function LessonsPlaceholder() {
    return (
        <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full pt-4 pb-12">
            <Card className="p-16 flex flex-col items-center justify-center text-center bg-card border-dashed border-border rounded-3xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-50" />
                <BookOpen className="w-16 h-16 text-border-strong mb-6 relative z-10 group-hover:text-[#E8521A] transition-colors duration-500" />
                <h3 className="text-3xl font-display text-text-primary mb-4 relative z-10">Grammar Lessons</h3>
                <p className="text-text-secondary max-w-md font-sans leading-relaxed relative z-10">
                    We are building grammar lessons that match your level.
                </p>
                <div className="mt-8 relative z-10 bg-surface border border-border-strong px-6 py-2 rounded-full text-[10px] font-mono-num text-text-muted uppercase tracking-widest">Coming soon</div>
            </Card>

            <div className="pt-6 border-t border-border">
                <h3 className="text-xs font-mono-num font-bold uppercase tracking-widest text-text-muted mb-6 flex items-center gap-3">
                    <AlertTriangle className="text-[#E8521A] w-4 h-4" />
                    Things to practice
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { t: "Preterite vs Imperfect", d: "You made 4 errors with past tense verbs yesterday." },
                        { t: "Por vs Para", d: "Mixed up prepositions in the Restaurant scenario." },
                        { t: "Subjunctive Mood", d: "Missing subjunctive triggers like 'Espero que...'." }
                    ].map((item, i) => (
                        <Card key={i} className="p-6 flex flex-col border-border bg-surface hover:border-[#E8521A]/30 hover:bg-card-hover transition-all rounded-2xl group">
                            <span className="font-display text-lg text-text-primary mb-3 group-hover:text-[#E8521A] transition-colors">{item.t}</span>
                            <span className="text-sm text-text-secondary flex-1 leading-relaxed mb-6">{item.d}</span>
                            <span className="text-[10px] font-mono-num text-text-muted uppercase tracking-widest cursor-pointer group-hover:text-text-primary transition-colors">Apply Fix &rarr;</span>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
