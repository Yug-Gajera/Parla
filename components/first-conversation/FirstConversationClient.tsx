"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, CheckCircle2 } from 'lucide-react';
import { FirstConversationWindow } from './FirstConversationWindow';
import { CelebrationScreen } from './CelebrationScreen';

interface FirstConversationClientProps {
    languageId: string;
    level: string;
    existingSessionId: string | null;
}

export function FirstConversationClient({ languageId, level, existingSessionId }: FirstConversationClientProps) {
    const router = useRouter();
    const [step, setStep] = useState<'entry' | 'resume_prompt' | 'conversation' | 'celebration'>(
        existingSessionId ? 'resume_prompt' : 'entry'
    );
    const [showSkipModal, setShowSkipModal] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(existingSessionId);

    const trackEvent = (name: string, props?: any) => {
        if (typeof window !== 'undefined' && (window as any).posthog) {
            (window as any).posthog.capture(name, props);
        }
    };

    const handleSkip = async () => {
        trackEvent('first_conversation_skipped');
        try {
            await fetch('/api/first-conversation/skip', { method: 'POST' });
            router.push('/practice');
        } catch (error) {
            console.error('Failed to skip', error);
        }
    };

    const handleStart = () => {
        setSessionId(null);
        setStep('conversation');
        trackEvent('first_conversation_started');
    };

    const handleResume = () => {
        setStep('conversation');
    };

    if (step === 'resume_prompt') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
                <div className="w-full max-w-[480px] text-center">
                    <div className="w-20 h-20 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bot className="w-10 h-10 text-accent" />
                    </div>
                    <h1 className="font-display font-semibold text-[32px] text-text-primary mb-3">
                        Welcome back!
                    </h1>
                    <p className="font-body text-[15px] text-text-secondary mb-8">
                        Want to continue your first conversation with Parlo?
                    </p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleResume} className="btn-primary w-full h-14 rounded-2xl text-[16px]">
                            Continue where I left off
                        </button>
                        <button onClick={handleStart} className="btn-secondary w-full h-14 rounded-2xl text-[16px]">
                            Start fresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'entry') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
                <AnimatePresence>
                    {showSkipModal && (
                        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-surface border border-border rounded-2xl p-6 w-full max-w-[400px] shadow-2xl"
                            >
                                <h2 className="font-display text-xl font-semibold mb-2">Are you sure you want to skip?</h2>
                                <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                                    The first conversation is designed to get you comfortable with Parlo. Most learners find it helpful even if they have some experience.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => setShowSkipModal(false)} className="btn-primary w-full py-3 rounded-xl">
                                        Start the conversation
                                    </button>
                                    <button onClick={handleSkip} className="btn-ghost w-full py-3 rounded-xl">
                                        Skip anyway
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="w-full max-w-[480px] flex flex-col items-center text-center">
                    {/* Mascot Illustration Placeholder */}
                    <div className="w-24 h-24 bg-[#FFF5F0] rounded-full flex items-center justify-center mb-8 border border-[#FFE0D1]">
                        <Bot className="w-12 h-12 text-[#E8521A]" />
                    </div>

                    <h1 className="font-display font-semibold text-[32px] text-text-primary mb-3">
                        Let's have your first conversation
                    </h1>
                    
                    <p className="font-body text-[15px] text-text-secondary mb-8">
                        This is just a friendly chat. There are no wrong answers. Parlo will guide you through everything.
                    </p>

                    <div className="w-full flex flex-col gap-4 mb-10 items-start text-left bg-surface/50 p-6 rounded-2xl border border-border">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#E8521A] shrink-0" />
                            <span className="text-[14px] text-text-primary">Go at your own pace — no time pressure</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#E8521A] shrink-0" />
                            <span className="text-[14px] text-text-primary">Parlo speaks slowly and clearly</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#E8521A] shrink-0" />
                            <span className="text-[14px] text-text-primary">You can type or speak — whatever feels comfortable</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleStart}
                        className="w-full bg-[#E8521A] text-white hover:bg-[#E8521A]/90 h-14 rounded-2xl font-bold text-[16px] transition-colors mb-2"
                    >
                        Start my first conversation
                    </button>
                    <p className="text-[13px] text-text-muted mb-8">Takes about 3 minutes</p>

                    <button 
                        onClick={() => setShowSkipModal(true)}
                        className="text-[12px] text-text-muted hover:text-text-primary transition-colors underline underline-offset-4"
                    >
                        Already comfortable speaking Spanish? Skip the intro &rarr;
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'conversation') {
        return (
            <FirstConversationWindow
                languageId={languageId}
                sessionId={sessionId}
                onComplete={() => setStep('celebration')}
            />
        );
    }

    if (step === 'celebration') {
        return <CelebrationScreen languageId={languageId} />;
    }

    return null;
}
