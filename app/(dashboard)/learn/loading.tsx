import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex flex-col h-full bg-background pt-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full gap-8">
            <div className="space-y-2">
                <Skeleton className="h-10 w-48 rounded-lg" />
                <Skeleton className="h-4 w-72 rounded" />
            </div>

            <Skeleton className="h-12 w-full max-w-md rounded-xl" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))}
            </div>
        </div>
    );
}
