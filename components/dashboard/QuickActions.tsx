"use client";

// ============================================================
// Parlova — Quick Actions Grid (Redesigned)
// ============================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { Mic2, Layers, BookOpen, Trophy, ArrowRight } from 'lucide-react';
import { TinySittingFigure } from '@/components/illustrations';

type VariantName = 'gold' | 'success' | 'warning' | 'error' | 'neutral';

const ACTIONS = [
    {
        href: '/practice',
        icon: Mic2,
        title: 'Practice Conversation',
        subtitle: '3 scenarios available',
        variant: 'gold' as VariantName,
    },
    {
        href: '/learn',
        icon: Layers,
        title: 'Study Vocabulary',
        subtitle: '12 words due today',
        variant: 'neutral' as VariantName,
    },
    {
        href: '/learn?tab=lessons',
        icon: BookOpen,
        title: 'Take a Lesson',
        subtitle: 'Grammar: Past Tense',
        variant: 'success' as VariantName,
    },
    {
        href: '/compete',
        icon: Trophy,
        title: 'Leaderboard',
        subtitle: 'Rank #4 in Silver',
        variant: 'gold' as VariantName,
    }
];

const VARIANT_STYLES: Record<VariantName, { bg: string, border: string, color: string }> = {
    gold: { bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.2)', color: '#c9a84c' },
    success: { bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)', color: '#4ade80' },
    warning: { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)', color: '#fb923c' },
    error: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', color: '#f87171' },
    neutral: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', color: '#9a9590' },
};

export default function QuickActions() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[12px] w-full">
            {ACTIONS.map((action, i) => {
                const Icon = action.icon;
                const v = VARIANT_STYLES[action.variant];
                
                const isConversation = action.href === '/practice';

                const cardContent = (
                    <Link
                        href={action.href}
                        className="group flex flex-col p-4 rounded-xl bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#2a2a2a] transition-all duration-300 relative overflow-hidden w-full h-full"
                    >
                        <div className="flex items-center justify-between mb-3 w-full">
                            <div 
                                className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center transition-all duration-300 border border-transparent bg-transparent group-hover:border-solid"
                                style={{} as React.CSSProperties} // Dynamic styles via inline hover trick below (using a wrapper state if needed, but since it's group hover CSS is easier)
                            >
                                {/* We inject a style tag for the group-hover pseudo classes specific to this variant since React inline styles don't support pseudo selectors */}
                                <style>{`
                                    .qa-card-${i}:hover .qa-icon-container-${i} {
                                        background-color: ${v.bg} !important;
                                        border-color: ${v.border} !important;
                                    }
                                    .qa-card-${i}:hover .qa-icon-${i} {
                                        color: ${v.color} !important;
                                    }
                                `}</style>
                                {/* Workaround applied via class injection above */}
                                <div className={`qa-card-${i} hidden`} />
                            </div>
                            
                            {/* Actual Container relying on the style block */}
                            <div className={`qa-icon-container-${i} absolute top-4 left-4 w-[40px] h-[40px] rounded-[10px] flex items-center justify-center transition-all duration-300 bg-transparent border border-transparent`}>
                                <Icon size={18} strokeWidth={1.5} color="#5a5652" className={`qa-icon-${i} transition-colors duration-300`} />
                            </div>

                            <div className="text-transparent flex items-center justify-center -mr-2 group-hover:mr-0 group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                                <ArrowRight size={11} strokeWidth={2} style={{ color: v.color }} className={`qa-icon-${i} transition-colors duration-300`} />
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="font-serif text-[#f0ece4] text-base mb-1 group-hover:text-white transition-colors">{action.title}</div>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#5a5652]">{action.subtitle}</div>
                        </div>
                        
                        {/* Hidden anchor for the hover styles to trigger cleanly */}
                        <div className={`qa-card-${i} absolute inset-0 z-[-1] pointer-events-none`} />
                    </Link>
                );

                if (isConversation) {
                    return (
                        <div key={i} style={{ position: "relative" }} className="w-full h-full">
                            <div style={{ display: "none" }} className="md:block">
                                <div style={{
                                    position: "absolute",
                                    top: "-35px", right: "16px",
                                    opacity: 0.6,
                                    pointerEvents: "none",
                                    zIndex: 10
                                }}>
                                    <TinySittingFigure />
                                </div>
                            </div>
                            {cardContent}
                        </div>
                    );
                }

                return (
                    <div key={i} className="w-full h-full">
                        {cardContent}
                    </div>
                );
            })}
        </div>
    );
}

// ── SKELETON ──
export function QuickActionsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[12px] w-full">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col p-4 rounded-xl bg-[#0f0f0f] border border-[#1e1e1e] animate-pulse">
                    <div className="w-[40px] h-[40px] rounded-[10px] bg-[#141414] mb-8" />
                    <div className="h-[16px] w-[140px] bg-[#1e1e1e] rounded mb-[8px]" />
                    <div className="h-[10px] w-[100px] bg-[#141414] rounded" />
                </div>
            ))}
        </div>
    );
}
