"use client";

import { useEffect } from 'react';
import { SectionError } from '@/components/shared/ErrorBoundary';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return <SectionError reset={reset} sectionName="Dashboard" />;
}
