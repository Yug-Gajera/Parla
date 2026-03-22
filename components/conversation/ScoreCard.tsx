"use client";

// ============================================================
// Parlova — Score Card (Redesigned)
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCcw, LayoutGrid, MessageSquareQuote, Shuffle, Sparkles, AlertTriangle, Volume2 } from 'lucide-react';
import { speakSpanish } from '@/lib/webSpeech';
import { SCENARIOS } from '@/lib/data/scenarios';

interface ScoreCardProps {
    scoring: any;
    xpEarned: number;
    scenario: any;
    onClose: () => void;
    situationName?: string | null;
    situationTwist?: string | null;
    situationId?: string | null;
    onReplay?: () => void;
    onTryAnother?: () => void;
    completedSituationIds?: string[];
    situationBestScores?: Record<string, number | null>;
    inputMode?: string;
}

import { usePlanLimits } from '@/hooks/usePlanLimits';

export function ScoreCard({
    scoring,
    scenario,
    onClose,
    situationName,
    situationTwist,
    situationId,
    onReplay,
    onTryAnother,
    completedSituationIds = [],
    situationBestScores = {},
    inputMode,
}: ScoreCardProps) {

    const { isPro } = usePlanLimits();
    const fullScenario = SCENARIOS.find(s => s.id === scenario?.id);
    const situations = fullScenario?.situations || [];

    const allCompletedIds = new Set([...completedSituationIds]);
    if (situationId) allCompletedIds.add(situationId);

    const containerV: any = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
    };
    const itemV: any = {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.4 } }
    };

    const speakCorrection = (text: string) => {
        speakSpanish(text, 0.7);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-background overflow-y-auto w-full pt-10 pb-20">
            <div className="max-w-[700px] mx-auto w-full px-6 flex flex-col items-center">

                {/* Header & Overall Score */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ease: "easeOut", duration: 0.6 }}
                    className="flex flex-col items-center text-center mb-10"
                >
                    <span className="label-upper mb-2">
                        Conversation Finished
                    </span>
                    <h1 className="font-display text-heading-lg font-semibold text-text-primary mb-8">
                        {scenario?.name}
                    </h1>

                    <div className="score-card flex flex-col items-center justify-center p-10 min-w-[280px]">
                        <span className="score-main mb-1">
                            {scoring.overall_score}
                        </span>
                        <span className="score-label m-0">
                            Your Score
                        </span>
                    </div>
                </motion.div>

                {/* Metrics Breakdown */}
                <motion.div variants={containerV} initial="hidden" animate="show" className="w-full flex flex-col gap-8">

                    {/* Situation Reveal */}
                    {situationName && (
                        <motion.div variants={itemV}>
                            <div className="parlova-card-accent text-center flex flex-col items-center p-8">
                                <span className="label-upper mb-3">You just finished</span>
                                <h2 className="text-xl font-semibold text-text-primary mb-3">{situationName}</h2>
                                {situationTwist && (
                                    <span className="px-2 py-0.5 rounded-sm bg-[#E8521A]/10 border border-[#E8521A]/30 text-[#E8521A] text-[9px] font-mono-num font-bold uppercase tracking-widest">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        {situationTwist}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Progress Bars */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 parlova-card p-6">
                        {[
                            { label: 'Grammar', score: scoring.grammar_score },
                            { label: 'Vocabulary', score: scoring.vocabulary_score },
                            { label: 'Flow', score: scoring.naturalness_score },
                        ].map((metric, i) => (
                            <motion.div variants={itemV} key={i} className="flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <span className="label-upper">{metric.label}</span>
                                    <span className="pill-score">{metric.score}%</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${metric.score}%` }} />
                                </div>
                            </motion.div>
                        ))}

                        {/* Pronunciation */}
                        <motion.div variants={itemV} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <span className="label-upper">Pronunciation</span>
                                {isPro ? (
                                    inputMode === 'voice' && scoring.pronunciation_score != null ? (
                                        <span className="pill-score">{scoring.pronunciation_score}%</span>
                                    ) : (
                                        <span className="font-mono-num font-medium text-[13px] text-text-muted">N/A</span>
                                    )
                                ) : (
                                    <span className="text-[9px] font-mono-num font-bold text-[#E8521A] uppercase tracking-widest mb-1">PRO Only</span>
                                )}
                            </div>
                            {isPro ? (
                                inputMode === 'voice' && scoring.pronunciation_score != null ? (
                                    <>
                                        <div className="progress-track">
                                            <div className="progress-fill" style={{ width: `${scoring.pronunciation_score}%` }} />
                                        </div>
                                        {scoring.clarity_issues && scoring.clarity_issues.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {scoring.clarity_issues.map((word: string, i: number) => (
                                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-warning/10 text-warning border border-warning/20 font-mono-num">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="progress-track opacity-50"><div className="progress-fill w-0" /></div>
                                )
                            ) : (
                                <div className="bg-[#E8521A]/5 border border-[#E8521A]/20 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-[#E8521A] font-medium leading-relaxed font-mono-num uppercase tracking-wider">
                                        Upgrade to Pro to get feedback on your pronunciation
                                    </p>
                                </div>
                            )}
                        </motion.div>

                        <motion.div variants={itemV} className="sm:col-span-2 pt-4 mt-2 border-t border-border flex items-center justify-between">
                            <span className="text-[15px] font-medium text-text-primary">Goal Met</span>
                            {scoring.goal_completed ? (
                                <Badge label="Yes" type="success" icon={CheckCircle2} />
                            ) : (
                                <Badge label="No" type="error" icon={XCircle} />
                            )}
                        </motion.div>
                    </div>

                    {/* AI Feedback */}
                    <motion.div variants={itemV}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MessageSquareQuote size={20} className="text-[#E8521A]" />
                            Feedback from your Coach
                        </h3>
                        <div className="parlova-card-accent p-8">
                            <p className="text-base leading-relaxed text-text-primary mb-6">
                                {scoring.feedback?.summary}
                            </p>
                            <div className="bg-[#E8521A]/8 border border-[#E8521A]/22 p-4 rounded-xl mb-6 font-medium italic text-[#D94A15] text-[15px]">
                                &ldquo;{scoring.feedback?.encouragement}&rdquo;
                            </div>
                            <div className="flex items-start gap-3 pt-6 border-t border-[#E8521A]/22">
                                <div className="w-8 h-8 rounded-full bg-error-subtle text-error flex items-center justify-center shrink-0 border border-error-border">
                                    <AlertTriangle size={14} />
                                </div>
                                <div className="pt-1">
                                    <span className="label-upper mb-1 block text-error">What to practice next</span>
                                    <p className="text-sm leading-relaxed text-text-primary">{scoring.feedback?.next_focus}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Grammar Corrections */}
                    {scoring.feedback?.grammar_errors && scoring.feedback.grammar_errors.length > 0 && (
                        <motion.div variants={itemV}>
                            <h3 className="text-lg font-semibold mb-4">How to fix your grammar</h3>
                            <div className="flex flex-col gap-3">
                                {scoring.feedback.grammar_errors.map((err: any, i: number) => (
                                    <div key={i} className="parlova-card p-5 bg-error-subtle border border-error-border">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-2">
                                            <span className="text-[15px] line-through text-error opacity-90 font-medium font-mono-num">
                                                {err.error}
                                            </span>
                                            <span className="hidden lg:inline text-text-muted">→</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[15px] font-bold text-success font-mono-num">{err.correction}</span>
                                                <button 
                                                    onClick={() => speakCorrection(err.correction)}
                                                    className="p-1 rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors"
                                                >
                                                    <Volume2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-text-secondary leading-relaxed">{err.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div variants={itemV} className="flex flex-col sm:flex-row gap-3 mt-8 w-full justify-center">
                        {onReplay && (
                            <button className="btn-action flex-1 h-12" onClick={onReplay}>
                                <RefreshCcw size={18} /> Play again
                            </button>
                        )}
                        {onTryAnother && (
                            <button className="btn-action flex-1 h-12" onClick={onTryAnother}>
                                <Shuffle size={18} /> Try another topic
                            </button>
                        )}
                        <button className="btn-action flex-1 h-12" onClick={onClose}>
                            <LayoutGrid size={18} /> Choose new topic
                        </button>
                    </motion.div>

                </motion.div>
            </div>
        </div>
    );
}

// Internal reusable badge
function Badge({ label, type, icon: Icon }: any) {
    const classMap: any = {
        success: 'bg-success-subtle text-success border-success/20',
        error: 'bg-error-subtle text-error border-error/20',
    };
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold uppercase tracking-wider border font-mono-num ${classMap[type]}`}>
            {Icon && <Icon size={14} />}
            {label}
        </div>
    );
}
