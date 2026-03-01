"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Share, RefreshCcw, LayoutGrid, MessageSquareQuote } from 'lucide-react';
import { toast } from 'sonner';

interface ScoreCardProps {
    scoring: any;
    xpEarned: number;
    scenario: any;
    onClose: () => void;
}

export function ScoreCard({ scoring, xpEarned, scenario, onClose }: ScoreCardProps) {

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-violet-500';
        if (score >= 70) return 'text-emerald-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreProgressColor = (score: number) => {
        if (score >= 85) return '[&>div]:bg-violet-500 bg-violet-500/20';
        if (score >= 70) return '[&>div]:bg-emerald-500 bg-emerald-500/20';
        if (score >= 50) return '[&>div]:bg-amber-500 bg-amber-500/20';
        return '[&>div]:bg-red-500 bg-red-500/20';
    };

    const handleShare = () => {
        const text = `I just scored ${scoring.overall_score}% on the '${scenario?.name}' Spanish scenario in FluentLoop! 🗣️✨`;
        navigator.clipboard.writeText(text);
        toast.success("Score copied to clipboard!");
    };

    // Staggered animation variants
    const containerV: any = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } }
    };

    const itemV: any = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-background overflow-y-auto w-full pt-safe-top pb-safe-bottom">
            <div className="max-w-3xl mx-auto w-full px-6 py-12 flex flex-col items-center">

                {/* Header & Overall Score */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                    className="flex flex-col items-center text-center mb-12"
                >
                    <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-2">
                        Scenario Complete
                    </span>
                    <h1 className="text-3xl font-bold mb-8">{scenario?.name}</h1>

                    <div className="relative flex items-center justify-center w-48 h-48 rounded-full border-4 border-border/40 shadow-2xl bg-card">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-border/20" />
                            <motion.circle
                                cx="50" cy="50" r="46" fill="transparent"
                                stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                                className={getScoreColor(scoring.overall_score)}
                                strokeDasharray="289"
                                initial={{ strokeDashoffset: 289 }}
                                animate={{ strokeDashoffset: 289 - (289 * scoring.overall_score) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                            />
                        </svg>
                        <div className="flex flex-col items-center justify-center z-10">
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className={`text-6xl font-black tracking-tighter ${getScoreColor(scoring.overall_score)}`}
                            >
                                {scoring.overall_score}
                            </motion.span>
                            <span className="text-sm font-medium text-muted-foreground mt-1">OVERALL</span>
                        </div>
                    </div>
                </motion.div>

                {/* Metrics Breakdown */}
                <motion.div variants={containerV} initial="hidden" animate="show" className="w-full flex flex-col gap-10">

                    {/* Progress Bars */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 bg-card border border-border/50 p-6 rounded-3xl">
                        <motion.div variants={itemV} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Grammar</span>
                                <span className="font-bold">{scoring.grammar_score}</span>
                            </div>
                            <Progress value={scoring.grammar_score} className={`h-2 ${getScoreProgressColor(scoring.grammar_score)}`} />
                        </motion.div>

                        <motion.div variants={itemV} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vocabulary</span>
                                <span className="font-bold">{scoring.vocabulary_score}</span>
                            </div>
                            <Progress value={scoring.vocabulary_score} className={`h-2 ${getScoreProgressColor(scoring.vocabulary_score)}`} />
                        </motion.div>

                        <motion.div variants={itemV} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Naturalness</span>
                                <span className="font-bold">{scoring.naturalness_score}</span>
                            </div>
                            <Progress value={scoring.naturalness_score} className={`h-2 ${getScoreProgressColor(scoring.naturalness_score)}`} />
                        </motion.div>

                        <motion.div variants={itemV} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Goal Completed</span>
                                {scoring.goal_completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                            <div className={`h-2 rounded-full w-full ${scoring.goal_completed ? 'bg-emerald-500' : 'bg-red-500/20'}`} />
                        </motion.div>
                    </div>

                    {/* AI Feedback Summary */}
                    <motion.div variants={itemV}>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <MessageSquareQuote className="w-5 h-5 text-primary" />
                            Coach Feedback
                        </h3>
                        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 sm:p-8">
                            <p className="text-lg leading-relaxed text-foreground mb-4">
                                {scoring.feedback?.summary}
                            </p>
                            <div className="bg-primary text-primary-foreground p-4 rounded-2xl mb-4 font-medium italic">
                                "{scoring.feedback?.encouragement}"
                            </div>
                            <div className="flex items-start gap-3 mt-6 pt-6 border-t border-primary/10">
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-amber-500 font-bold">!</span>
                                </div>
                                <div>
                                    <span className="block text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">Next Focus</span>
                                    <p className="text-foreground">{scoring.feedback?.next_focus}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Grammar Errors */}
                    {scoring.feedback?.grammar_errors && scoring.feedback.grammar_errors.length > 0 && (
                        <motion.div variants={itemV}>
                            <h3 className="text-xl font-bold mb-4">Grammar Corrections</h3>
                            <div className="flex flex-col gap-3">
                                {scoring.feedback.grammar_errors.map((err: any, i: number) => (
                                    <Card key={i} className="p-5 border-destructive/20 bg-destructive/5 flex flex-col gap-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                                            <span className="line-through text-destructive decoration-2 opacity-80 font-medium">
                                                {err.error}
                                            </span>
                                            <span className="hidden sm:inline text-muted-foreground">→</span>
                                            <span className="text-emerald-500 font-bold">
                                                {err.correction}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/80">{err.explanation}</p>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Vocabulary Highlights */}
                    <motion.div variants={itemV} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {scoring.feedback?.vocabulary_highlights && scoring.feedback.vocabulary_highlights.length > 0 && (
                            <div className="flex flex-col bg-card border border-border p-6 rounded-3xl">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-500 mb-4">Great Vocabulary</h4>
                                <div className="flex flex-wrap gap-2">
                                    {scoring.feedback.vocabulary_highlights.map((word: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-medium border border-emerald-500/20">
                                            {word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {scoring.feedback?.vocabulary_suggestions && scoring.feedback.vocabulary_suggestions.length > 0 && (
                            <div className="flex flex-col bg-card border border-border p-6 rounded-3xl">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4">Try Using Next Time</h4>
                                <div className="flex flex-wrap gap-2">
                                    {scoring.feedback.vocabulary_suggestions.map((word: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-sm font-medium border border-amber-500/20">
                                            {word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div variants={itemV} className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center pb-20">
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 px-8 rounded-full border-2 border-primary/20 hover:bg-primary/5 text-primary"
                            onClick={() => window.location.reload()} // Quick hack to retry, normally would reset state
                        >
                            <RefreshCcw className="w-5 h-5 mr-2" /> Try Again
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="h-14 px-8 rounded-full"
                            onClick={handleShare}
                        >
                            <Share className="w-5 h-5 mr-2" /> Share Score
                        </Button>
                        <Button
                            size="lg"
                            className="h-14 px-8 rounded-full bg-primary text-primary-foreground font-bold"
                            onClick={onClose}
                        >
                            <LayoutGrid className="w-5 h-5 mr-2" /> Browse Scenarios
                        </Button>
                    </motion.div>

                </motion.div>
            </div>
        </div>
    );
}
