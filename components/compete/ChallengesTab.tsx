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
                <h2 className="text-2xl text-[#f0ece4] flex items-center gap-3 font-serif">
                    <Trophy className="w-5 h-5 text-[#c9a84c]" /> Weekly Challenge
                </h2>

                <Card className={`relative overflow-hidden transition-colors duration-500 rounded-2xl ${
                    isComplete 
                        ? 'border-[#c9a84c]/50 bg-[#c9a84c]/5 shadow-[0_0_30px_rgba(201,168,76,0.05)]' 
                        : 'border-[#1e1e1e] bg-[#141414] hover:border-[#2a2a2a]'
                }`}>

                    {/* Background Graphic */}
                    {isComplete && (
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 transform rotate-12">
                            <CheckCircle2 className="w-64 h-64 text-[#c9a84c]" />
                        </div>
                    )}

                    <div className="p-8 sm:p-10 flex flex-col relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <span className={`text-[10px] uppercase tracking-[0.2em] font-medium mb-3 block ${isComplete ? 'text-[#c9a84c]' : 'text-[#9a9590]'}`}>
                                    {isComplete ? 'Completed' : 'In Progress'}
                                </span>
                                <h3 className="text-3xl text-[#f0ece4] mb-2 font-serif">{activeChallenge.name}</h3>
                                <p className="text-[#9a9590] text-sm leading-relaxed max-w-sm">{activeChallenge.description}</p>
                            </div>

                            <div className="flex flex-col items-end text-right">
                                <div className="flex items-center gap-2 text-[#c9a84c] mb-2 font-mono text-lg">
                                    <Medal className="w-4 h-4 text-[#c9a84c]" />
                                    +{activeChallenge.reward_xp} XP
                                </div>
                                <span className="text-[10px] text-[#9a9590] uppercase tracking-widest border border-[#1e1e1e] bg-[#0f0f0f] px-3 py-1.5 rounded-full">
                                    "{activeChallenge.reward_badge}" Badge
                                </span>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="flex flex-col gap-4 my-6">
                            <div className="flex justify-between text-xs tracking-widest uppercase font-medium">
                                <span className="text-[#f0ece4]">Progress</span>
                                <span className={`font-mono ${isComplete ? 'text-[#c9a84c]' : 'text-[#9a9590]'}`}>
                                    {userProgress} / {activeChallenge.progress_target}
                                </span>
                            </div>
                            <Progress 
                                value={progressPercent} 
                                className={`h-1 bg-[#1e1e1e] [&>div]:bg-[#c9a84c] transition-all duration-1000 ease-in-out`} 
                            />
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-[#1e1e1e]">
                            <div className="flex items-center gap-2 text-xs font-mono text-[#5a5652] uppercase tracking-wider">
                                <Clock className="w-3.5 h-3.5" />
                                {getDaysRemaining()} days remaining
                            </div>
                            {!isComplete && (
                                <Link href={activeChallenge.action_url}>
                                    <Button className="bg-[#f0ece4] text-[#080808] hover:bg-[#c9a84c] hover:text-[#080808] transition-colors rounded-full px-8 h-10 text-xs tracking-widest uppercase font-medium">
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
                <h3 className="text-sm uppercase tracking-[0.2em] text-[#5a5652] font-medium">History</h3>
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
                                className="flex items-center justify-between p-5 bg-[#0f0f0f] rounded-xl border border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${completed ? 'bg-[#c9a84c]/10 border-[#c9a84c]/20 text-[#c9a84c]' : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#5a5652]'}`}>
                                        {completed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-sm ${completed ? 'text-[#f0ece4]' : 'text-[#5a5652] line-through'}`}>
                                            {chal.name}
                                        </span>
                                        <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest">Week {52 - i}</span>
                                    </div>
                                </div>
                                {completed && (
                                    <span className="text-[10px] font-medium bg-[#141414] border border-[#2a2a2a] text-[#c9a84c] px-3 py-1 rounded-full uppercase tracking-widest">
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
