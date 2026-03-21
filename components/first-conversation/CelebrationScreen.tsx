"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function CelebrationScreen({ languageId }: { languageId: string }) {
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).posthog) {
            (window as any).posthog.capture('first_conversation_completed', {
                duration_seconds: 180, // Default mock value if not tracked from window
                total_exchanges: 6,
                used_voice: true,
                used_text: true,
            });
        }
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-[480px] flex flex-col items-center text-center">
                {/* Floating Mascot */}
                <motion.div 
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="w-28 h-28 bg-[#FFF5F0] rounded-full flex items-center justify-center mb-6 border border-[#FFE0D1] shadow-lg shadow-[#E8521A]/10"
                >
                    <Bot className="w-14 h-14 text-[#E8521A]" />
                </motion.div>

                <h1 className="font-display font-semibold text-[36px] text-text-primary mb-4 leading-tight">
                    You just spoke Spanish!
                </h1>
                
                <p className="font-body text-[16px] text-text-secondary mb-10">
                    Your very first AI Spanish conversation is complete. That took courage and you did brilliantly.
                </p>

                {/* Stats Row */}
                <div className="flex w-full justify-between items-center mb-10 px-4 bg-surface py-5 rounded-2xl border border-border">
                    <div className="flex flex-col items-center">
                        <span className="font-mono-num font-medium text-[28px] text-[#E8521A]">6</span>
                        <span className="font-body text-[12px] text-text-muted mt-1 uppercase tracking-wider font-bold">exchanges</span>
                    </div>
                    <div className="w-[1px] h-10 bg-border"></div>
                    <div className="flex flex-col items-center">
                        <span className="font-mono-num font-medium text-[28px] text-[#E8521A]">34</span>
                        <span className="font-body text-[12px] text-text-muted mt-1 uppercase tracking-wider font-bold">words</span>
                    </div>
                    <div className="w-[1px] h-10 bg-border"></div>
                    <div className="flex flex-col items-center">
                        <span className="font-mono-num font-medium text-[28px] text-[#E8521A] flex items-center gap-1">1 <span className="text-xl">✓</span></span>
                        <span className="font-body text-[12px] text-text-muted mt-1 uppercase tracking-wider font-bold">First session</span>
                    </div>
                </div>

                <p className="font-body text-[14px] text-text-secondary mb-8 italic">
                    "Every fluent Spanish speaker had a first conversation. Yours just happened."
                </p>

                <div className="w-full flex gap-3 flex-col sm:flex-row">
                    <button 
                        onClick={() => router.push('/practice')}
                        className="btn-primary flex-1 h-14 rounded-2xl font-bold text-[15px]"
                    >
                        Start practicing for real &rarr;
                    </button>
                    <button 
                        onClick={() => router.push('/learn')}
                        className="btn-secondary flex-1 h-14 rounded-2xl font-bold text-[15px]"
                    >
                        See my vocabulary
                    </button>
                </div>

                <p className="text-[12px] text-text-muted mt-8">
                    This special first session is saved in your conversation history.
                </p>
            </div>
        </div>
    );
}
