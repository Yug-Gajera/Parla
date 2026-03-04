"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeckViewer } from '../vocabulary/DeckViewer';
import dynamic from 'next/dynamic';
const ReviewSession = dynamic(() => import('../vocabulary/ReviewSession').then(mod => mod.ReviewSession), {
    loading: () => <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center">Loading session...</div>,
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
import { useEffect } from 'react';

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
        <div className="flex flex-col w-full h-full relative">

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

                <div className="flex items-center justify-between px-4 md:px-8 py-6 pb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1">Learning Hub</h1>
                        <p className="text-muted-foreground text-sm">Master {languageName} ({level}) step by step.</p>
                    </div>

                    <TabsList className="bg-card border border-border">
                        <TabsTrigger value="learn" className="data-[state=active]:bg-secondary">Learn</TabsTrigger>
                        <TabsTrigger value="read" className="data-[state=active]:bg-secondary">Read</TabsTrigger>
                        <TabsTrigger value="stories" className="data-[state=active]:bg-secondary">Stories</TabsTrigger>
                        <TabsTrigger value="vocabulary" className="data-[state=active]:bg-secondary">Vocabulary</TabsTrigger>
                        <TabsTrigger value="lessons" className="data-[state=active]:bg-secondary">Lessons</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 w-full px-4 md:px-8 py-4 pb-20 overflow-hidden relative">

                    <TabsContent value="learn" className="h-full m-0 data-[state=inactive]:hidden flex flex-col overflow-y-auto">
                        <LearnTab languageId={languageId} languageName={languageName} level={level} />
                    </TabsContent>

                    <TabsContent value="read" className="h-full m-0 data-[state=inactive]:hidden flex flex-col overflow-y-auto">
                        <ArticleBrowser languageId={languageId} userLevel={level} />
                    </TabsContent>

                    <TabsContent value="stories" className="h-full m-0 data-[state=inactive]:hidden flex flex-col overflow-y-auto">
                        <StoryBrowser languageId={languageId} />
                    </TabsContent>

                    <TabsContent value="vocabulary" className="h-full m-0 data-[state=inactive]:hidden flex flex-col">
                        <ActionBanner languageId={languageId} onStart={handleStartReview} />
                        <DeckViewer languageId={languageId} onStartReview={handleStartReview} />
                    </TabsContent>

                    <TabsContent value="lessons" className="m-0 data-[state=inactive]:hidden h-full flex flex-col overflow-y-auto">
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
            className="w-full bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(124,58,237,0.15)]"
        >
            <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {dueWords.length}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-foreground">Cards due for review</h3>
                    <p className="text-sm text-muted-foreground">Keep your streak alive and master these words.</p>
                </div>
            </div>

            <Button
                onClick={() => onStart(dueWords)}
                className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold px-8 hover:bg-primary/90 rounded-xl"
            >
                Start Review
            </Button>
        </motion.div>
    );
}

function LessonsPlaceholder() {
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pt-4">
            <Card className="p-12 flex flex-col items-center justify-center text-center bg-card/50 border-dashed border-2">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-6" />
                <h3 className="text-2xl font-bold mb-2">Grammar Lessons</h3>
                <p className="text-muted-foreground max-w-md">
                    Structured grammar lessons matched to your CEFR level are coming soon.
                </p>
                <Button className="mt-8" variant="outline" disabled>Coming in v2.0</Button>
            </Card>

            <h3 className="text-xl font-bold mt-4 flex items-center gap-2">
                <AlertTriangle className="text-amber-500 w-5 h-5" />
                Suggested Focus Areas
            </h3>
            <p className="text-muted-foreground text-sm mb-2">Based on your recent AI conversations, you should review these topics:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { t: "Preterite vs Imperfect", d: "You made 4 errors with past tense verbs yesterday." },
                    { t: "Por vs Para", d: "Mixed up prepositions in the Restaurant scenario." },
                    { t: "Subjunctive Mood", d: "Missing subjunctive triggers like 'Espero que...'." }
                ].map((item, i) => (
                    <Card key={i} className="p-5 flex flex-col border-border/50 bg-card hover:border-primary/50 transition-colors">
                        <span className="font-bold text-foreground mb-2">{item.t}</span>
                        <span className="text-sm text-muted-foreground flex-1">{item.d}</span>
                        <Button variant="link" className="p-0 h-auto self-start mt-4 text-primary">View practice tips</Button>
                    </Card>
                ))}
            </div>
        </div>
    );
}
