"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children?: React.ReactNode;
    fallback?: React.ReactNode;
    message?: string;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center p-6 min-h-[400px]">
                    <Card className="max-w-md w-full p-8 border-destructive/20 bg-destructive/5 flex flex-col items-center text-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold mb-2">Something isn&apos;t right</h1>
                            <p className="text-sm text-muted-foreground">
                                {this.props.message || "Something went wrong while loading this page. Our team has been told about it."}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Button
                                onClick={() => this.setState({ hasError: false })}
                                className="flex-1 gap-2 font-bold"
                            >
                                <RotateCcw className="w-4 h-4" /> Try Again
                            </Button>
                            <Button asChild variant="outline" className="flex-1 gap-2 bg-transparent">
                                <Link href="/home">
                                    <Home className="w-4 h-4" /> Go Home
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export function SectionError({ reset, sectionName }: { reset: () => void, sectionName: string }) {
    return (
        <div className="flex items-center justify-center p-6 min-h-[400px]">
            <Card className="max-w-md w-full p-8 border-border bg-card flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-foreground">Error loading {sectionName}</h2>
                    <p className="text-sm text-muted-foreground">
                        We couldn't get the data for this page. Check your internet and try again.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                        onClick={reset}
                        className="flex-1 gap-2 font-bold"
                    >
                        <RotateCcw className="w-4 h-4" /> Try Again
                    </Button>
                    <Button asChild variant="outline" className="flex-1 gap-2">
                        <Link href="/home">
                            <Home className="w-4 h-4" /> Go Home
                        </Link>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
