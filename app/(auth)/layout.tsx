// ============================================================
// Parlova — Auth Layout
// ============================================================

import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Subtle Dot Grid Background Pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle at center, hsl(var(--muted-foreground)) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Center content with z-index above background */}
            <div className="relative z-10 w-full max-w-[400px]">
                {children}
            </div>
        </div>
    );
}
