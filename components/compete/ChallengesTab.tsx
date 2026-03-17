"use client";

// ============================================================
// Parlova — Challenges Tab (Redesigned)
// ============================================================

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CHALLENGE_TEMPLATES, Challenge } from '@/lib/data/challenges';
import { CheckCircle2, Clock, XCircle, Trophy, Medal } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ChallengesTabProps {
    activeChallenge: Challenge;
    userProgress: number; // Raw metric (e.g. 2 conversations done)
    pastChallenges: any[]; // e.g. [{ challenge_id, complete: true }]
}

export function ChallengesTab({ activeChallenge, userProgress, pastChallenges }: ChallengesTabProps) {
    const isComplete = userProgress >= activeChallenge.progress_target;
    const progressPercent = Math.min(100, Math.round((userProgress / activeChallenge.progress_target) * 100));

    // Time remaining until Sunday night
    function getDaysRemaining() {
        const now = new Date();
        const daysToSunday = 7 - now.getDay();
        return daysToSunday === 7 ? 0 : daysToSunday; // If sunday, 0 days remaining (just hours)
    }

    return (
        <div className="flex flex-col w-full max-w-3xl mx-auto gap-12 pb-16 font-sans">

            {/* Active Challenge */}
            <div className="flex flex-col gap-6">
                <h2 className="text-2xl text-text-primary flex items-center gap-3 font-display">
                    <Trophy className="w-5 h-5 text-[#E8521A]" /> Weekly Challenge
                </h2>

                <Card className={`relative overflow-hidden transition-colors duration-500 rounded-2xl ${
                    isComplete 
                        ? 'border-[#E8521A]/30 bg-[#E8521A]/8 shadow-[0_0_30px_rgba(232,82,26,0.05)]' 
                        : 'border-border bg-card hover:border-border-strong'
                }`}>

                    {/* Background Graphic */}
                    {isComplete && (
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 transform rotate-12">
                            <CheckCircle2 className="w-64 h-64 text-[#E8521A]" />
                        </div>
                    )}

                    <div className="p-8 sm:p-10 flex flex-col relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <span className={`text-[10px] uppercase tracking-[0.2em] font-medium mb-3 block ${isComplete ? 'text-[#E8521A]' : 'text-text-muted'}`}>
                                    {isComplete ? 'Completed' : 'In Progress'}
                                </span>
                                <h3 className="text-3xl text-text-primary mb-2 font-display">{activeChallenge.name}</h3>
                                <p className="text-text-secondary text-sm leading-relaxed max-w-sm">{activeChallenge.description}</p>
                            </div>

                            <div className="flex flex-col items-end text-right">
                                <div className="flex items-center gap-2 text-[#E8521A] mb-2 font-mono-num text-lg">
                                    <Medal className="w-4 h-4 text-[#E8521A]" />
                                    +{activeChallenge.reward_xp} XP
                                </div>
                                <span className="text-[10px] text-text-muted uppercase tracking-widest border border-border bg-background px-3 py-1.5 rounded-full">
                                    "{activeChallenge.reward_badge}" Badge
                                </span>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="flex flex-col gap-4 my-6">
                            <div className="flex justify-between text-xs tracking-widest uppercase font-medium">
                                <span className="text-text-primary">Progress</span>
                                <span className={`font-mono-num ${isComplete ? 'text-gold' : 'text-text-muted'}`}>
                                    {userProgress} / {activeChallenge.progress_target}
                                </span>
                            </div>
                            <Progress 
                                value={progressPercent} 
                                className={`h-1 bg-border [&>div]:bg-[#E8521A] transition-all duration-1000 ease-in-out`} 
                            />
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-border">
                            <div className="flex items-center gap-2 text-xs font-mono-num text-text-muted uppercase tracking-wider">
                                <Clock className="w-3.5 h-3.5" />
                                {getDaysRemaining()} days remaining
                            </div>
                            {!isComplete && (
                                <Link href={activeChallenge.action_url}>
                                <Button className="bg-text-primary text-background hover:bg-[#E8521A] transition-colors rounded-full px-8 h-10 text-xs tracking-widest uppercase font-medium">
                                    Take Action
                                </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Past Challenges History */}
            <div className="flex flex-col gap-6 mt-4">
                <h3 className="text-sm uppercase tracking-[0.2em] text-text-muted font-medium">History</h3>
                <div className="flex flex-col gap-3">
                    {/* Render a mock history for the UI completeness */}
                    {[1, 2].map((i) => {
                        const chal = CHALLENGE_TEMPLATES[(i + 1) % 4];
                        const completed = i === 1; // mock
                        return (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="flex items-center justify-between p-5 bg-surface rounded-xl border border-border hover:border-border-strong transition-colors"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${completed ? 'bg-[#E8521A]/10 border-[#E8521A]/20 text-[#E8521A]' : 'bg-card border-border text-text-muted'}`}>
                                        {completed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-sm ${completed ? 'text-text-primary' : 'text-text-muted line-through'}`}>
                                            {chal.name}
                                        </span>
                                        <span className="text-[10px] font-mono-num text-text-muted uppercase tracking-widest">Week {52 - i}</span>
                                    </div>
                                </div>
                                {completed && (
                                    <span className="text-[10px] font-medium bg-background border border-border text-[#E8521A] px-3 py-1 rounded-full uppercase tracking-widest">
                                        Earned
                                    </span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
