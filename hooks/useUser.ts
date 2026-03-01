'use client';

// ============================================================
// FluentLoop — useUser Hook
// ============================================================

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { User as DbUser, UserLanguage, Language } from '@/types';

interface UserProfile extends DbUser {
    active_language: (UserLanguage & { language: Language }) | null;
}

interface UseUserReturn {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
}

export function useUser(): UseUserReturn {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Fetch profile with active language
        async function fetchProfile(userId: string) {
            try {
                // Get user row
                const { data: userRow, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (userError) {
                    setError(userError.message);
                    return;
                }

                // Get the most recently studied language (or first one)
                const { data: userLang, error: langError } = await supabase
                    .from('user_languages')
                    .select('*, language:languages(*)')
                    .eq('user_id', userId)
                    .order('last_study_date', { ascending: false, nullsFirst: false })
                    .limit(1)
                    .maybeSingle();

                if (langError) {
                    setError(langError.message);
                    return;
                }

                const activeLanguage = userLang
                    ? {
                        ...(userLang as Record<string, any>),
                        language: (userLang as any).language as unknown as Language,
                    }
                    : null;

                setProfile({
                    ...(userRow as unknown as DbUser),
                    active_language:
                        activeLanguage as (UserLanguage & { language: Language }) | null,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load profile');
            }
        }

        // Get initial session
        supabase.auth.getUser().then(({ data: { user: authUser }, error: authError }) => {
            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            setUser(authUser);

            if (authUser) {
                fetchProfile(authUser.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Listen for auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const authUser = session?.user ?? null;
            setUser(authUser);

            if (authUser) {
                setLoading(true);
                fetchProfile(authUser.id).finally(() => setLoading(false));
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { user, profile, loading, error };
}
