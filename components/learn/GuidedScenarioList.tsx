"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CheckCircle2, Play, MoveRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { GUIDED_SCENARIOS } from '@/lib/data/guided_scenarios';

interface GuidedScenarioListProps {
    languageId: string;
    level: string;
    completedCount: number;
}

export default function GuidedScenarioList({ languageId, level, completedCount }: GuidedScenarioListProps) {
    const router = useRouter();

    return (
        <div className="max-w-4xl mx-auto py-4 font-sans pb-32">
            <div className="mb-10 p-6 sm:p-8 bg-surface border border-[#E8521A]/20 rounded-3xl relative overflow-hidden text-center shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8521A]/10 rounded-bl-full -z-10 blur-2xl" />
                <h2 className="text-2xl font-serif text-text-primary mb-2">Your Path to Conversation</h2>
                <p className="text-text-secondary text-sm leading-relaxed max-w-lg mx-auto">
                    Complete these structured scenarios to learn the essential phrases for everyday interactions. Finish at least 3 to unlock free open voice conversation practice.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 bg-background border border-border rounded-full shadow-inner">
                        <span className="text-[#E8521A] font-bold">{completedCount}</span> / 10 Completed
                    </span>
                    {completedCount >= 3 && (
                        <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Ready for free Practice
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {GUIDED_SCENARIOS.map((scenario, index) => {
                    const isCompleted = index < completedCount;
                    const isNext = index === completedCount;
                    const isLocked = index > completedCount;

                    return (
                        <motion.div
                            key={scenario.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card 
                                onClick={() => {
                                    if (!isLocked) {
                                        router.push(`/learn/guided/${scenario.id}`);
                                    }
                                }}
                                className={`
                                    p-6 rounded-[24px] border transition-all cursor-pointer relative overflow-hidden group
                                    ${isLocked ? 'bg-card/40 border-border/50 opacity-60 cursor-not-allowed' : ''}
                                    ${isNext ? 'bg-surface border-[#E8521A]/30 shadow-[0_4px_20px_rgba(232,82,26,0.05)] hover:border-[#E8521A]/50 hover:-translate-y-1' : ''}
                                    ${isCompleted ? 'bg-card border-border hover:border-border-strong hover:-translate-y-1' : ''}
                                `}
                            >
                                <div className="flex items-center gap-5 sm:gap-6 relative z-10">
                                    <div className={`
                                        w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0
                                        ${isLocked ? 'bg-background border border-border hue-rotate-180 saturate-0' : 'bg-background border border-[#E8521A]/20'}
                                    `}>
                                        {scenario.icon}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-mono-num font-bold uppercase tracking-widest text-[#E8521A]">
                                                Scenario {scenario.order}
                                            </span>
                                            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" strokeWidth={3} />}
                                            {isLocked && <Lock className="w-3.5 h-3.5 text-text-muted" />}
                                        </div>
                                        <h3 className="font-display text-lg sm:text-xl text-text-primary group-hover:text-[#E8521A] transition-colors line-clamp-1">
                                            {scenario.title}
                                        </h3>
                                        <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                                            {scenario.description}
                                        </p>
                                    </div>

                                    <div className="shrink-0 pl-2">
                                        {isLocked ? (
                                            <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                                                <Lock className="w-4 h-4 text-text-muted" />
                                            </div>
                                        ) : isNext ? (
                                            <Button className="w-10 h-10 sm:w-auto sm:h-10 rounded-full bg-[#E8521A] text-background hover:bg-[#E8521A]/90 p-0 sm:px-5">
                                                <span className="hidden sm:inline font-mono text-[10px] uppercase font-bold tracking-widest mr-2">Start</span>
                                                <Play className="w-4 h-4 ml-0.5 sm:ml-0 fill-current" />
                                            </Button>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full border border-border-strong text-text-secondary flex items-center justify-center group-hover:bg-[#E8521A] group-hover:border-[#E8521A] group-hover:text-bg transition-colors">
                                                <MoveRight className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {isNext && (
                                    <div className="absolute top-0 right-0 -m-4 w-32 h-32 bg-[#E8521A]/10 blur-3xl rounded-full" />
                                )}
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
