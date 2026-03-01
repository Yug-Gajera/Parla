'use client';

// ============================================================
// FluentLoop — Global Error Boundary
// ============================================================

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Optionally log the error to an error reporting service
        console.error('Global Error Boundary Caught:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
                <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
                    <AlertTriangle size={40} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
                    <p className="text-muted-foreground text-sm">
                        We encountered an unexpected error while loading this page. Our team has been notified.
                    </p>
                </div>

                <div className="flex flex-col w-full gap-3 sm:flex-row sm:justify-center">
                    <Button
                        onClick={() => reset()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
                    >
                        Try again
                    </Button>
                    <Button
                        variant="outline"
                        asChild
                        className="min-w-[140px] border-border hover:bg-secondary/50 text-foreground"
                    >
                        <Link href="/">
                            Go Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
