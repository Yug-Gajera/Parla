"use client";

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
        <div className="flex flex-col w-full max-w-3xl mx-auto gap-10 pb-12">

            {/* Active Challenge */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-500" /> Active Weekly Challenge
                </h2>

                <Card className={`relative overflow-hidden border-2 ${isComplete ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-primary/30 bg-card'}`}>

                    {/* Background Graphic */}
                    {isComplete && (
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20 transform rotate-12">
                            <CheckCircle2 className="w-64 h-64 text-emerald-500" />
                        </div>
                    )}

                    <div className="p-6 sm:p-8 flex flex-col relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isComplete ? 'text-emerald-500' : 'text-primary'}`}>
                                    {isComplete ? 'Completed!' : 'In Progress'}
                                </span>
                                <h3 className="text-2xl font-black text-foreground mb-1">{activeChallenge.name}</h3>
                                <p className="text-muted-foreground">{activeChallenge.description}</p>
                            </div>

                            <div className="flex flex-col items-end text-right">
                                <div className="flex items-center gap-1.5 text-amber-500 font-bold mb-1">
                                    <Medal className="w-5 h-5 fill-amber-500" />
                                    +{activeChallenge.reward_xp} XP
                                </div>
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider bg-secondary px-2 py-1 rounded-md">
                                    &quot;{activeChallenge.reward_badge}&quot; Badge
                                </span>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="flex flex-col gap-3 my-6">
                            <div className="flex justify-between text-sm font-semibold">
                                <span className="text-foreground">Progress</span>
                                <span className={isComplete ? 'text-emerald-500' : 'text-foreground'}>
                                    {userProgress} / {activeChallenge.progress_target}
                                </span>
                            </div>
                            <Progress value={progressPercent} className={`h-3 ${isComplete ? '[&>div]:bg-emerald-500' : '[&>div]:bg-primary'}`} />
                        </div>

                        <div className="flex justify-between items-center mt-2 pt-6 border-t border-border/50">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {getDaysRemaining()} days remaining
                            </div>
                            {!isComplete && (
                                <Link href={activeChallenge.action_url}>
                                    <Button className="font-bold px-6 rounded-full bg-primary hover:bg-primary/90">
                                        Take Action
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Past Challenges History */}
            <div className="flex flex-col gap-4">
                <h3 className="font-bold text-lg text-muted-foreground">History</h3>
                <div className="flex flex-col gap-3">
                    {/* Render a mock history for the UI completeness since we aren't tracking lifetime badges yet */}
                    {[1, 2].map((i) => {
                        const chal = CHALLENGE_TEMPLATES[(i + 1) % 4];
                        const completed = i === 1; // mock
                        return (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${completed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                                        {completed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-bold ${completed ? 'text-foreground' : 'text-muted-foreground line-through decoration-destructive/50'}`}>
                                            {chal.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">Week {52 - i}</span>
                                    </div>
                                </div>
                                {completed && (
                                    <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full uppercase tracking-wider">
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
