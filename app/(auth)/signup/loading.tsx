// ============================================================
// Parlova — Signup Loading Skeleton
// ============================================================

import { AudioLines } from 'lucide-react';

export default function SignupLoading() {
    return (
        <div className="w-full flex flex-col gap-6 p-8 bg-card rounded-2xl border border-border shadow-2xl animate-pulse">
            {/* ── Header ── */}
            <div className="flex flex-col items-center gap-2 text-center mb-2">
                <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-2 opacity-50">
                    <AudioLines size={28} />
                    <span>Parlova</span>
                </div>
                <div className="h-8 w-48 bg-muted rounded-md mb-1" />
                <div className="h-4 w-64 bg-muted rounded-md mb-2" />
            </div>

            {/* ── Google OAuth ── */}
            <div className="h-10 w-full bg-muted rounded-md" />

            {/* ── Divider ── */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-card px-2 h-4 w-32 rounded bg-muted" />
                </div>
            </div>

            {/* ── Form Inputs ── */}
            <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-10 w-full bg-muted rounded-md" />
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <div className="h-4 w-12 bg-muted rounded" />
                    <div className="h-10 w-full bg-muted rounded-md" />
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-10 w-full bg-muted rounded-md" />
                    {/* Strength bar placeholder */}
                    <div className="flex gap-1 mt-2">
                        <div className="h-1.5 w-full bg-border rounded-full" />
                        <div className="h-1.5 w-full bg-border rounded-full" />
                        <div className="h-1.5 w-full bg-border rounded-full" />
                        <div className="h-1.5 w-full bg-border rounded-full" />
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2 mt-2">
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-10 w-full bg-muted rounded-md" />
                </div>

                {/* Terms */}
                <div className="flex items-start space-x-2 pt-2">
                    <div className="mt-1 h-4 w-4 rounded bg-muted" />
                    <div className="h-4 w-full bg-muted rounded" />
                </div>

                {/* Submit */}
                <div className="h-10 w-full bg-muted rounded-md mt-4" />
            </div>

            {/* ── Footer Link ── */}
            <div className="mt-2 flex justify-center">
                <div className="h-4 w-40 bg-muted rounded" />
            </div>
        </div>
    );
}
