import React from 'react';
import { HeaderSkeleton } from '@/components/dashboard/Header';
import { GoalProgressSkeleton } from '@/components/dashboard/GoalProgress';
import { QuickActionsSkeleton } from '@/components/dashboard/QuickActions';
import { WeeklyStatsSkeleton } from '@/components/dashboard/WeeklyStats';
import { LevelProgressSkeleton } from '@/components/dashboard/LevelProgress';
import { RecentActivitySkeleton } from '@/components/dashboard/RecentActivity';

export default function Loading() {
    return (
        <div className="flex flex-col w-full">
            <HeaderSkeleton />
            <div className="w-full flex justify-center p-4 md:p-8">
                <div className="w-full max-w-[1000px] flex flex-col gap-6 lg:gap-8">
                    <div className="flex flex-col lg:flex-row gap-6 w-full">
                        <div className="w-full lg:w-1/3"><GoalProgressSkeleton /></div>
                        <div className="w-full lg:w-2/3 flex flex-col"><QuickActionsSkeleton /></div>
                    </div>
                    <div className="w-full"><WeeklyStatsSkeleton /></div>
                    <div className="flex flex-col lg:flex-row gap-6 w-full">
                        <div className="w-full lg:w-1/3 flex flex-col gap-6"><LevelProgressSkeleton /></div>
                        <div className="w-full lg:w-2/3"><RecentActivitySkeleton /></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
