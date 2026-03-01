'use client';

// ============================================================
// FluentLoop — Onboarding Step 6: Result
// ============================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/store/onboarding';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StepResult() {
    const router = useRouter();
    const supabase = createClient();
    const {
        assessedLevel,
        levelScore,
        selectedLanguageId,
        selectedLanguageCode,
        dailyGoalMinutes,
    } = useOnboardingStore();

    const [isSaving, setIsSaving] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        // Small delay for the confetti burst effect
        const t = setTimeout(() => setShowConfetti(true), 400);
        return () => clearTimeout(t);
    }, []);

    const handleStartLearning = async () => {
        setIsSaving(true);
        console.log('[StepResult] Starting save process...');

        try {
            console.log('[StepResult] Fetching user...');
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            console.log('[StepResult] User result:', user?.id, authError);
            if (authError || !user) throw new Error('Not authenticated');

            console.log('[StepResult] Fetching real language ID for:', selectedLanguageCode);
            const { data: langData, error: langFindError } = await (supabase as any)
                .from('languages')
                .select('id')
                .eq('code', selectedLanguageCode)
                .single();

            if (langFindError || !langData) throw new Error('Language not found in database');
            const dbLanguageId = langData.id;

            console.log('[StepResult] Saving language:', dbLanguageId, assessedLevel, levelScore);
            // 1. Save language
            const { error: langSaveError } = await (supabase as any)
                .from('user_languages')
                .upsert({
                    user_id: user.id,
                    language_id: dbLanguageId,
                    current_level: assessedLevel || 'A1',
                    level_score: levelScore || 0,
                }, { onConflict: 'user_id, language_id' });

            console.log('[StepResult] Language save error:', langSaveError);
            if (langSaveError) throw new Error(langSaveError.message);

            console.log('[StepResult] Saving daily goal:', dailyGoalMinutes);
            // 2. Save daily goal
            const { error: settingsError } = await (supabase as any)
                .from('user_settings')
                .update({
                    daily_goal_minutes: dailyGoalMinutes || 20,
                })
                .eq('user_id', user.id);

            console.log('[StepResult] Settings save error:', settingsError);
            if (settingsError) throw new Error(settingsError.message);

            console.log('[StepResult] Success! Redirecting to /home');
            // Success
            toast.success('Your personalized plan is ready!');
            router.push('/home');

        } catch (err) {
            console.error('[StepResult] Error caught:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to save progress');
            setIsSaving(false);
        }
    };

    const getLevelName = (lvl: string) => {
        const map: Record<string, string> = {
            'A1': 'Beginner',
            'A2': 'Upper Beginner',
            'B1': 'Intermediate',
            'B2': 'Upper Intermediate',
            'C1': 'Advanced',
            'C2': 'Mastery'
        };
        return map[lvl] || 'Beginner';
    };

    return (
        <div className="flex flex-col items-center w-full animation-fade-in pt-10 pb-20 relative">

            {/* ── Background Effects ── */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none flex justify-center items-center overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                opacity: 1,
                                x: 0,
                                y: 0,
                                scale: 0,
                                rotate: 0
                            }}
                            animate={{
                                opacity: 0,
                                x: (Math.random() - 0.5) * 500,
                                y: (Math.random() - 0.5) * 500,
                                scale: Math.random() * 1.5 + 0.5,
                                rotate: Math.random() * 360
                            }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            className="absolute w-3 h-3 rounded-full"
                            style={{
                                backgroundColor: ['#7c3aed', '#a78bfa', '#fcd34d', '#34d399', '#f472b6'][Math.floor(Math.random() * 5)]
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ── Header ── */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-center text-balance z-10">
                Your Spanish Level
            </h1>

            {/* ── Badge ── */}
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-primary/60 flex flex-col items-center justify-center p-1 shadow-[0_0_40px_rgba(124,58,237,0.4)] mb-3 z-10"
            >
                <div className="w-full h-full rounded-full bg-card flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/60">
                        {assessedLevel || 'A1'}
                    </span>
                </div>
            </motion.div>

            <div className="flex flex-col items-center z-10 mb-8">
                <h2 className="text-2xl font-semibold mb-1">{getLevelName(assessedLevel || 'A1')}</h2>
                <p className="text-muted-foreground text-center max-w-sm">
                    You've got a great foundation. We'll build on what you know and fix the gaps in your grammar.
                </p>
            </div>

            {/* ── Capabilities ── */}
            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6 z-10 mb-12">

                <div className="p-6 rounded-2xl bg-card border border-border">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle2 className="text-primary" size={20} /> What you can do
                    </h3>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                            <span>Understand the main points of clear standard input on familiar matters</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                            <span>Deal with most situations likely to arise while traveling</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                            <span>Produce simple connected text on topics that are familiar</span>
                        </li>
                    </ul>
                </div>

                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Sparkles className="text-primary" size={20} /> Next level goals
                    </h3>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <span>Understand the main ideas of complex text on both concrete and abstract topics</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <span>Interact with a degree of fluency and spontaneity</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <span>Produce clear, detailed text on a wide range of subjects</span>
                        </li>
                    </ul>
                </div>

            </div>

            {/* ── Start Button ── */}
            <div className="w-full max-w-md z-10">
                <Button
                    onClick={handleStartLearning}
                    disabled={isSaving}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg py-7 rounded-xl shadow-[0_10px_20px_-10px_rgba(124,58,237,0.5)]"
                >
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Start Learning
                </Button>
            </div>

        </div>
    );
}
