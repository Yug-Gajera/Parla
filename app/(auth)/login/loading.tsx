// ============================================================
// Parlova — Login Loading Skeleton
// ============================================================

import { AudioLines } from 'lucide-react';

export default function LoginLoading() {
    return (
        <div className="w-full flex flex-col gap-6 p-8 bg-card rounded-2xl border border-border shadow-2xl animate-pulse">
            {/* ── Header ── */}
            <div className="flex flex-col items-center gap-2 text-center mb-2">
                <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-2 opacity-50">
                    <AudioLines size={28} />
                    <span>Parlova</span>
                </div>
                <div className="h-8 w-40 bg-muted rounded-md mb-1" />
                <div className="h-4 w-56 bg-muted rounded-md" />
            </div>

            {/* ── Google OAuth ── */}
            <div className="h-10 w-full bg-muted rounded-md" />

            {/* ── Divider ── */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-card px-2 h-4 w-6 rounded text-muted-foreground" />
                </div>
            </div>

            {/* ── Email Form ── */}
            <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                    <div className="h-4 w-12 bg-muted rounded" />
                    <div className="h-10 w-full bg-muted rounded-md" />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="h-4 w-16 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                    <div className="h-10 w-full bg-muted rounded-md" />
                </div>

                {/* Submit Button */}
                <div className="h-10 w-full bg-muted rounded-md mt-2" />
            </div>

            {/* ── Footer Link ── */}
            <div className="mt-2 flex justify-center">
                <div className="h-4 w-48 bg-muted rounded" />
            </div>
        </div>
    );
}
