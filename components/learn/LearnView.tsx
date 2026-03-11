"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeckViewer } from '../vocabulary/DeckViewer';
import dynamic from 'next/dynamic';
const ReviewSession = dynamic(() => import('../vocabulary/ReviewSession').then(mod => mod.ReviewSession), {
    loading: () => <div className="fixed inset-0 bg-[#080808]/80 backdrop-blur-sm z-[60] flex items-center justify-center text-[#c9a84c] font-mono text-xs uppercase tracking-widest">Loading protocol...</div>,
    ssr: false
});
import LearnTab from './LearnTab';
import ArticleBrowser from '../articles/ArticleBrowser';
import StoryBrowser from '../stories/StoryBrowser';
import { VocabularyWord } from '@/hooks/useVocabulary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LearnViewProps {
    languageId: string;
    languageName: string;
    level: string;
}

export default function LearnView({ languageId, languageName, level }: LearnViewProps) {
    const [reviewWords, setReviewWords] = useState<VocabularyWord[] | null>(null);

    // Default tab: "learn" for A1/A2, "read" for B1+
    const isBeginnerLevel = level === 'A1' || level === 'A2';
    const defaultTab = isBeginnerLevel ? 'learn' : 'read';

    const handleStartReview = (words: VocabularyWord[]) => {
        setReviewWords(words);
    };

    return (
        <div className="flex flex-col w-full h-full relative font-sans bg-[#080808]">

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

            {/* Main Tabs UI */}
            <Tabs defaultValue={defaultTab} className="w-full flex-1 flex flex-col h-full">

                <div className="flex flex-col md:flex-row md:items-end justify-between px-6 sm:px-10 py-8 pb-4 gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-serif text-[#f0ece4] tracking-tight mb-2">Acquisition Center</h1>
                        <p className="text-[#9a9590] text-xs uppercase tracking-widest font-mono">
                            Mastering {languageName} <span className="mx-2 text-[#2a2a2a]">|</span> Target: {level}
                        </p>
                    </div>

                    <TabsList className="bg-[#141414] border border-[#1e1e1e] p-1 rounded-xl shrink-0 hide-scrollbar overflow-x-auto justify-start self-start md:self-auto">
                        {['learn', 'read', 'stories', 'vocabulary', 'lessons'].map(tab => (
                            <TabsTrigger 
                                key={tab}
                                value={tab} 
                                className="capitalize font-mono text-[10px] tracking-widest px-6 py-2 rounded-lg data-[state=active]:bg-[#0f0f0f] data-[state=active]:text-[#c9a84c] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#2a2a2a] text-[#5a5652] transition-all"
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
            className="w-full bg-[#141414]/80 backdrop-blur-md border border-[#c9a84c]/20 shadow-[0_0_30px_rgba(201,168,76,0.05)] rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/5 rounded-bl-full -z-10 group-hover:bg-[#c9a84c]/10 transition-colors duration-700" />
            
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="bg-[#080808] border border-[#2a2a2a] text-[#c9a84c] w-16 h-16 rounded-full flex items-center justify-center font-mono text-2xl shadow-inner relative z-10">
                    {dueWords.length}
                </div>
                <div className="relative z-10">
                    <h3 className="font-serif text-2xl text-[#f0ece4] mb-1">Lexical Review Active</h3>
                    <p className="text-xs font-mono text-[#5a5652] uppercase tracking-widest mt-2">{dueWords.length} pending items require reinforcement.</p>
                </div>
            </div>

            <Button
                onClick={() => onStart(dueWords)}
                className="w-full sm:w-auto bg-[#c9a84c] text-[#080808] font-mono text-xs uppercase tracking-widest font-bold px-10 h-12 hover:bg-[#b98e72] rounded-full transition-colors relative z-10 shadow-[0_4px_20px_rgba(201,168,76,0.3)] hover:shadow-[0_4px_25px_rgba(201,168,76,0.4)]"
            >
                Initiate Protocol
            </Button>
        </motion.div>
    );
}

function LessonsPlaceholder() {
    return (
        <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full pt-4 pb-12">
            <Card className="p-16 flex flex-col items-center justify-center text-center bg-[#0f0f0f] border-dashed border-[#1e1e1e] rounded-3xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent opacity-50" />
                <BookOpen className="w-16 h-16 text-[#2a2a2a] mb-6 relative z-10 group-hover:text-[#c9a84c] transition-colors duration-500" />
                <h3 className="text-3xl font-serif text-[#f0ece4] mb-4 relative z-10">Structural Analytics</h3>
                <p className="text-[#9a9590] max-w-md font-sans leading-relaxed relative z-10">
                    Diagnostic grammar pathways matched to your exact acquisition tier are currently indexing.
                </p>
                <div className="mt-8 relative z-10 bg-[#141414] border border-[#2a2a2a] px-6 py-2 rounded-full text-[10px] font-mono text-[#5a5652] uppercase tracking-widest">Available in V2 Architecture</div>
            </Card>

            <div className="pt-6 border-t border-[#1e1e1e]">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#5a5652] mb-6 flex items-center gap-3">
                    <AlertTriangle className="text-[#c9a84c] w-4 h-4" />
                    Recommended Adjustments
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { t: "Preterite vs Imperfect", d: "You made 4 errors with past tense verbs yesterday." },
                        { t: "Por vs Para", d: "Mixed up prepositions in the Restaurant scenario." },
                        { t: "Subjunctive Mood", d: "Missing subjunctive triggers like 'Espero que...'." }
                    ].map((item, i) => (
                        <Card key={i} className="p-6 flex flex-col border-[#1e1e1e] bg-[#141414] hover:border-[#c9a84c]/30 hover:bg-[#171717] transition-all rounded-2xl group">
                            <span className="font-serif text-lg text-[#f0ece4] mb-3 group-hover:text-[#c9a84c] transition-colors">{item.t}</span>
                            <span className="text-sm text-[#9a9590] flex-1 leading-relaxed mb-6">{item.d}</span>
                            <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest cursor-pointer group-hover:text-[#f0ece4] transition-colors">Apply Fix &rarr;</span>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
