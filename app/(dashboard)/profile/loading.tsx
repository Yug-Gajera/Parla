import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex flex-col w-full max-w-5xl mx-auto gap-8 px-4 sm:px-6 py-8">
            <div className="flex gap-6 items-center">
                <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-full" />
                <div className="flex flex-col gap-3 flex-1">
                    <Skeleton className="h-8 w-48 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
            </div>

            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
    );
}
