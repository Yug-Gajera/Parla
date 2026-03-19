"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
    metric?: 'conversation' | 'article' | 'story' | 'word_lookup';
    plan: string;
}

export function PaywallModal({ isOpen, onClose, metric, plan }: PaywallModalProps) {
    const metricLabels = {
        conversation: 'conversations',
        article: 'articles',
        story: 'stories',
        word_lookup: 'word lookups',
    };

    const label = metric ? metricLabels[metric] : 'this feature';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-card border-border rounded-[24px]">
                <DialogHeader className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#E8521A]/10 flex items-center justify-center mb-2">
                        <BadgeCheck className="w-10 h-10 text-[#E8521A]" />
                    </div>
                    <DialogTitle className="text-2xl font-display text-text-primary tracking-tight">
                        You've reached your free limit
                    </DialogTitle>
                    <DialogDescription className="text-text-secondary text-base leading-relaxed">
                        Upgrade to Pro to get unlimited {label} and unlock advanced AI features like pronunciation scoring and custom scenarios.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button
                        asChild
                        className="btn-action w-full flex-1 h-12 text-sm"
                        onClick={onClose}
                    >
                        <Link href="/pricing">
                            Upgrade to Pro — $9/month
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full sm:w-auto h-12 text-[11px] font-mono-num font-bold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
                    >
                        Maybe later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
