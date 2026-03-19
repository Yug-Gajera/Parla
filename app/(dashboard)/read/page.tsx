"use client";

import React, { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import ImmersionLibrary from '@/components/read/ImmersionLibrary';

export default function ReadPage() {
    const { isPro, isLoading: planLoading } = usePlanLimits();
    const [userData, setUserData] = useState<any>(null);
    const [userLanguageData, setUserLanguageData] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [languageLoading, setLanguageLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();

            // Get user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                window.location.href = '/login';
                return;
            }
            setUserData(user);
            setAuthLoading(false);

            // Get active language
            const { data: userLanguage, error: languageError } = await supabase
                .from('user_languages')
                .select('*, languages(*)')
                .eq('user_id', user.id)
                .single();

            if (languageError || !userLanguage) {
                window.location.href = '/onboarding';
                return;
            }
            setUserLanguageData(userLanguage);
            setLanguageLoading(false);
        }
        fetchData();
    }, []);

    const isLoading = planLoading || authLoading || languageLoading;

    if (isLoading) {
        return <div className="p-20 text-center font-mono-num text-[10px] uppercase tracking-widest text-text-muted">Loading Library...</div>;
    }

    if (!isPro) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-[#E8521A]/10 flex items-center justify-center mb-8 border border-[#E8521A]/20 shadow-inner">
                    <Lock className="w-8 h-8 text-[#E8521A]" />
                </div>
                <h1 className="text-4xl font-display text-text-primary mb-4 tracking-tight">Book Reader is for Pro Users</h1>
                <p className="text-text-secondary max-w-md mb-10 leading-relaxed">
                    Unlock our full library of interactive books, graded readers, and classic literature with a Pro subscription.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="btn-action px-10 h-14 rounded-[18px]">
                        <Link href="/pricing">Upgrade to Pro</Link>
                    </Button>
                    <Button variant="ghost" asChild className="h-14 px-10 rounded-[18px] text-[11px] font-mono-num font-bold uppercase tracking-widest text-text-muted">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const languageId = userLanguageData?.language_id;
    const languageName = userLanguageData?.languages?.name || 'Spanish';
    const level = userLanguageData?.current_level || 'A1';

    return (
        <ImmersionLibrary
            languageId={languageId}
            languageName={languageName}
            level={level}
        />
    );
}
