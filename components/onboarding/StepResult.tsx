'use client';

// ============================================================
// Parlova — Onboarding Step 6: Result
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/store/onboarding';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Target, Settings2, Brain } from 'lucide-react';
import { toast } from 'sonner';

export default function StepResult() {
    const {
        assessedLevel,
        levelScore,
        selectedLanguageCode,
        dailyGoalMinutes,
    } = useOnboardingStore();

    const [isSaving, setIsSaving] = useState(false);
    const [showParticles, setShowParticles] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setShowParticles(true), 400);
        return () => clearTimeout(t);
    }, []);

    const handleStartLearning = async () => {
        setIsSaving(true);
        console.log('[StepResult] Starting save via API...');

        try {
            const res = await fetch('/api/onboarding/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                    language_code: selectedLanguageCode,
                    assessed_level: assessedLevel || 'A1',
                    level_score: levelScore || 0,
                    daily_goal_minutes: dailyGoalMinutes || 20,
                }),
            });

            const data = await res.json();
            console.log('[StepResult] API response:', res.status, data);

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save progress');
            }

            console.log('[StepResult] Success! Redirecting to /home');
            toast.success('System Initialized.');
            window.location.href = '/home';

        } catch (err) {
            console.error('[StepResult] Error caught:', err);
            toast.error(err instanceof Error ? err.message : 'Initialization failure');
            setIsSaving(false);
        }
    };

    const getLevelName = (lvl: string) => {
        const map: Record<string, string> = {
            'A1': 'Novice Data State',
            'A2': 'Basic Constructs',
            'B1': 'Intermediate Matrix',
            'B2': 'Advanced Processing',
            'C1': 'Near-Native Ops',
            'C2': 'Mastery'
        };
        return map[lvl] || 'Novice Data State';
    };

    return (
        <div className="flex flex-col items-center w-full animation-fade-in pt-16 pb-20 relative font-sans">

            {/* ── Background Effects ── */}
             {showParticles && (
                <div className="absolute inset-0 pointer-events-none flex justify-center items-center overflow-hidden opacity-30">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                opacity: 1,
                                x: 0,
                                y: 0,
                                scale: 0,
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                x: (Math.random() - 0.5) * 400,
                                y: (Math.random() - 0.5) * 400,
                                scale: Math.random() * 2 + 0.5,
                            }}
                            transition={{ duration: 2.5, ease: 'easeOut', delay: i * 0.1 }}
                            className="absolute w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_15px_rgba(var(--accent),0.8)]"
                        />
                    ))}
                </div>
            )}

            {/* ── Header ── */}
            <h1 className="text-[10px] md:text-sm font-mono uppercase tracking-[0.3em] font-bold mb-10 text-center text-text-muted z-10">
                Diagnostic Conclusion
            </h1>

            {/* ── Badge ── */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
                className="relative flex items-center justify-center mb-8 z-10"
            >
                <div className="absolute inset-0 bg-accent/5 rounded-full blur-2xl" />
                <div className="w-48 h-48 rounded-full border border-accent-border bg-card shadow-lg flex flex-col items-center justify-center ring-1 ring-accent/10 ring-offset-8 ring-offset-background">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2 font-bold">Class</span>
                    <span className="text-7xl font-serif text-text-primary tracking-tight drop-shadow-sm">
                        {assessedLevel || 'A1'}
                    </span>
                    <span className="pill-score text-[10px] mt-3">
                        Score: {levelScore || 0}%
                    </span>
                </div>
            </motion.div>

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center z-10 mb-14 px-4"
            >
                <h2 className="text-3xl font-serif mb-4 text-text-primary tracking-wide">{getLevelName(assessedLevel || 'A1')}</h2>
                <p className="text-text-muted font-sans text-center max-w-sm leading-relaxed">
                    System calibrated. Your unique neural mapping has been defined. We will proceed to integrate missing grammar nodes.
                </p>
            </motion.div>

            {/* ── Capabilities ── */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 z-10 mb-16 px-4"
            >
                 <div className="p-8 rounded-[18px] bg-card border border-border shadow-sm">
                    <h3 className="font-mono text-[11px] font-bold tracking-widest uppercase text-text-muted mb-6 flex items-center gap-3 border-b border-border pb-4">
                        <Target className="text-accent w-4 h-4" /> Current Matrix
                    </h3>
                    <ul className="space-y-4 text-sm font-sans text-text-primary/80">
                        <li className="flex items-start gap-4 group">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent/50 mt-1.5 flex-shrink-0 group-hover:bg-accent transition-colors" />
                            <span className="leading-relaxed">Process primary standard input within familiar domains</span>
                        </li>
                        <li className="flex items-start gap-4 group">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent/50 mt-1.5 flex-shrink-0 group-hover:bg-accent transition-colors" />
                            <span className="leading-relaxed">Navigate standard global transit scenarios</span>
                        </li>
                        <li className="flex items-start gap-4 group">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent/50 mt-1.5 flex-shrink-0 group-hover:bg-accent transition-colors" />
                            <span className="leading-relaxed">Generate basic connected syntax streams</span>
                        </li>
                    </ul>
                </div>

                 <div className="p-8 rounded-[18px] bg-card border border-accent-border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Brain className="w-32 h-32 text-accent" />
                    </div>
                    <h3 className="font-mono text-[11px] font-bold tracking-widest uppercase text-accent mb-6 flex items-center gap-3 border-b border-border pb-4">
                        <Settings2 className="text-accent w-4 h-4" /> Trajectory Targets
                    </h3>
                    <ul className="space-y-4 text-sm font-sans text-text-primary/90 relative z-10">
                        <li className="flex items-start gap-4 group">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0 shadow-sm" />
                            <span className="leading-relaxed">Decode complex abstractions and profound semantics</span>
                        </li>
                        <li className="flex items-start gap-4 group">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0 shadow-sm" />
                            <span className="leading-relaxed">Engage with zero latency and absolute fluidity</span>
                        </li>
                        <li className="flex items-start gap-4 group">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0 shadow-sm" />
                            <span className="leading-relaxed">Synthesize articulate logic structures dynamically</span>
                        </li>
                    </ul>
                </div>
            </motion.div>

            {/* ── Start Button ── */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-sm z-10 px-4"
            >
                <Button
                    onClick={handleStartLearning}
                    disabled={isSaving}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-[12px] font-bold uppercase tracking-widest h-16 rounded-full shadow-lg transition-all flex items-center justify-center gap-3 border border-primary/50"
                >
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    Initialize Interface
                </Button>
            </motion.div>

        </div>
    );
}
