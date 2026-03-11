"use client";

// ============================================================
// Parlova — Score Card (Redesigned)
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCcw, LayoutGrid, MessageSquareQuote, Shuffle, Sparkles, AlertTriangle } from 'lucide-react';
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

    return (
        <div className="fixed inset-0 z-[60] bg-[#080808] overflow-y-auto w-full pt-[40px] pb-[80px]">
            <div className="max-w-[700px] mx-auto w-full px-[24px] flex flex-col items-center">

                {/* Header & Overall Score */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ease: "easeOut", duration: 0.6 }}
                    className="flex flex-col items-center text-center mb-[40px]"
                >
                    <span className="label-upper mb-[8px]">
                        Scenario Complete
                    </span>
                    <h1 className="font-display text-heading-lg font-semibold text-[#f0ece4] mb-[32px]">
                        {scenario?.name}
                    </h1>

                    <div className="score-card flex flex-col items-center justify-center p-[40px] min-w-[280px]">
                        <span className="score-main mb-[4px]">
                            {scoring.overall_score}
                        </span>
                        <span className="score-label m-0">
                            Overall Score
                        </span>
                    </div>
                </motion.div>

                {/* Metrics Breakdown */}
                <motion.div variants={containerV} initial="hidden" animate="show" className="w-full flex flex-col gap-[32px]">

                    {/* Situation Reveal */}
                    {situationName && (
                        <motion.div variants={itemV}>
                            <div className="parlova-card parlova-card-accent text-center flex flex-col items-center p-[32px]">
                                <span className="label-upper mb-[12px]">You just completed</span>
                                <h2 className="text-[20px] font-semibold text-[#f0ece4] mb-[12px]">{situationName}</h2>
                                {situationTwist && (
                                    <span className="badge-gold">
                                        <Sparkles className="w-[12px] h-[12px] mr-[4px]" />
                                        {situationTwist}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Progress Bars */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-[16px] parlova-card p-[24px]">
                        {[
                            { label: 'Grammar', score: scoring.grammar_score },
                            { label: 'Vocabulary', score: scoring.vocabulary_score },
                            { label: 'Naturalness', score: scoring.naturalness_score },
                        ].map((metric, i) => (
                            <motion.div variants={itemV} key={i} className="flex flex-col gap-[8px]">
                                <div className="flex justify-between items-end">
                                    <span className="label-upper">{metric.label}</span>
                                    <span className="font-mono-num font-medium text-[15px]">{metric.score}</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${metric.score}%` }} />
                                </div>
                            </motion.div>
                        ))}

                        {/* Pronunciation */}
                        <motion.div variants={itemV} className="flex flex-col gap-[8px]">
                            <div className="flex justify-between items-end">
                                <span className="label-upper">Pronunciation</span>
                                {inputMode === 'voice' && scoring.pronunciation_score != null ? (
                                    <span className="font-mono-num font-medium text-[15px]">{scoring.pronunciation_score}</span>
                                ) : (
                                    <span className="font-mono-num font-medium text-[13px] text-[#5a5652]">N/A</span>
                                )}
                            </div>
                            {inputMode === 'voice' && scoring.pronunciation_score != null ? (
                                <>
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{ width: `${scoring.pronunciation_score}%` }} />
                                    </div>
                                    {scoring.clarity_issues && scoring.clarity_issues.length > 0 && (
                                        <div className="flex flex-wrap gap-[4px] mt-[4px]">
                                            {scoring.clarity_issues.map((word: string, i: number) => (
                                                <span key={i} className="text-[10px] px-[6px] py-[2px] rounded-md bg-[rgba(251,146,60,0.1)] text-[#fb923c] border border-[rgba(251,146,60,0.2)]">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="progress-track opacity-50"><div className="progress-fill w-0" /></div>
                            )}
                        </motion.div>

                        <motion.div variants={itemV} className="sm:col-span-2 pt-[16px] mt-[8px] border-t border-[#1e1e1e] flex items-center justify-between">
                            <span className="text-[15px] font-medium text-[#f0ece4]">Goal Completed</span>
                            {scoring.goal_completed ? (
                                <Badge label="Yes" type="success" icon={CheckCircle2} />
                            ) : (
                                <Badge label="No" type="error" icon={XCircle} />
                            )}
                        </motion.div>
                    </div>

                    {/* AI Feedback */}
                    <motion.div variants={itemV}>
                        <h3 className="text-[18px] font-semibold mb-[16px] flex items-center gap-[8px]">
                            <MessageSquareQuote size={20} className="text-[#c9a84c]" />
                            Coach Feedback
                        </h3>
                        <div className="parlova-card parlova-card-accent p-[32px]">
                            <p className="text-[16px] leading-relaxed text-[#f0ece4] mb-[24px]">
                                {scoring.feedback?.summary}
                            </p>
                            <div className="bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] p-[16px] rounded-[10px] mb-[24px] font-medium italic text-[#e4c76b] text-[15px]">
                                &ldquo;{scoring.feedback?.encouragement}&rdquo;
                            </div>
                            <div className="flex items-start gap-[12px] pt-[24px] border-t border-[rgba(201,168,76,0.15)]">
                                <div className="w-[32px] h-[32px] rounded-pill bg-[rgba(251,146,60,0.15)] text-[#fb923c] flex items-center justify-center shrink-0 border border-[rgba(251,146,60,0.2)]">
                                    <AlertTriangle size={14} />
                                </div>
                                <div className="pt-[4px]">
                                    <span className="label-upper mb-[4px] block text-[#fb923c]">Next Focus</span>
                                    <p className="text-[14px] leading-relaxed text-[#f0ece4]">{scoring.feedback?.next_focus}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Grammar Corrections */}
                    {scoring.feedback?.grammar_errors && scoring.feedback.grammar_errors.length > 0 && (
                        <motion.div variants={itemV}>
                            <h3 className="text-[18px] font-semibold mb-[16px]">Grammar Corrections</h3>
                            <div className="flex flex-col gap-[12px]">
                                {scoring.feedback.grammar_errors.map((err: any, i: number) => (
                                    <div key={i} className="parlova-card p-[20px] bg-[rgba(248,113,113,0.03)] border border-[rgba(248,113,113,0.15)]">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-[8px] lg:gap-[16px] mb-[8px]">
                                            <span className="text-[15px] line-through text-[#f87171] opacity-90 font-medium">
                                                {err.error}
                                            </span>
                                            <span className="hidden lg:inline text-[#5a5652]">→</span>
                                            <span className="text-[15px] font-semibold text-[#4ade80]">{err.correction}</span>
                                        </div>
                                        <p className="text-[14px] text-[#9a9590] leading-relaxed">{err.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div variants={itemV} className="flex flex-col sm:flex-row gap-[12px] mt-[32px] w-full justify-center">
                        {onReplay && (
                            <button className="btn btn-secondary btn-lg" onClick={onReplay}>
                                <RefreshCcw size={18} /> Replay
                            </button>
                        )}
                        {onTryAnother && (
                            <button className="btn btn-secondary btn-lg" onClick={onTryAnother}>
                                <Shuffle size={18} /> Try Another Version
                            </button>
                        )}
                        <button className="btn btn-primary btn-lg" onClick={onClose}>
                            <LayoutGrid size={18} /> New Scenario
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
        success: 'bg-[rgba(74,222,128,0.1)] text-[#4ade80]',
        error: 'bg-[rgba(248,113,113,0.1)] text-[#f87171]',
    };
    return (
        <div className={`flex items-center gap-[6px] px-[12px] py-[6px] rounded-md text-[13px] font-medium ${classMap[type]}`}>
            {Icon && <Icon size={16} />}
            {label}
        </div>
    );
}
