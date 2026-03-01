import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { BADGES, computeEarnedBadges } from '@/lib/data/badges';
import { getWeekStartDate } from '@/lib/utils/level';

export function useProfile() {
    const supabase = createClient();

    const [user, setUser] = useState<any>(null);
    const [userLanguage, setUserLanguage] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);

    // Aggregates
    const [stats, setStats] = useState<any>(null);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [badges, setBadges] = useState<any[]>([]);
    const [activityData, setActivityData] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const weekStart = getWeekStartDate(new Date()).toISOString().split('T')[0];

            const [
                { data: userData },
                { data: settingsData },
                { data: langData },
                { data: certs },
                { data: sessionsData },
                { data: currentWeekEntry },
                { count: wordsCount },
                { count: convCount },
                { data: firstConvo }
            ] = await Promise.all([
                supabase.from('users').select('*').eq('id', authUser.id).single(),
                supabase.from('user_settings').select('*').eq('user_id', authUser.id).single(),
                supabase.from('user_languages').select('*, languages(*)').eq('user_id', authUser.id).order('last_study_date', { ascending: false }).limit(1).maybeSingle(),
                supabase.from('certificates').select('*, languages(*)').eq('user_id', authUser.id),
                supabase.from('study_sessions').select('created_at, duration_minutes, session_type').eq('user_id', authUser.id).gte('created_at', oneYearAgo.toISOString()),
                supabase.from('leaderboard_entries').select('*').eq('user_id', authUser.id).eq('week_start_date', weekStart).maybeSingle(),
                supabase.from('user_vocabulary').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id).in('status', ['learning', 'familiar', 'mastered']),
                supabase.from('conversation_sessions').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id),
                supabase.from('conversation_sessions').select('created_at').eq('user_id', authUser.id).order('created_at', { ascending: true }).limit(1).maybeSingle()
            ]);

            const primaryLang = langData as any;
            let totalMins = 0;
            (sessionsData || []).forEach((s: any) => { totalMins += (s.duration_minutes || 0); });

            const statsObj = {
                total_hours: Math.round(totalMins / 60),
                conversations: convCount || 0,
                vocab_known: wordsCount || 0,
                streak: primaryLang?.streak_days || 0
            };
            setStats(statsObj);

            const earned = computeEarnedBadges({
                conversationCount: statsObj.conversations,
                streakDays: statsObj.streak,
                firstConversationAt: (firstConvo as any)?.created_at,
                vocabLearnedThisWeek: (currentWeekEntry as any)?.vocabulary_learned,
                conversationCountThisWeek: (currentWeekEntry as any)?.conversation_count
            });
            setBadges(BADGES.map((b) => ({ ...b, earned: earned.find((e) => e.badgeId === b.id) })));

            setUser(userData);
            setSettings(settingsData);
            setUserLanguage(primaryLang);
            setCertificates((certs || []).map((c: any) => ({ ...c, languages: c.languages })));
            setActivityData(sessionsData || []);

        } catch (err) {
            console.error('Failed to load profile', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = async (updates: { full_name?: string, native_language?: string, avatar_url?: string }) => {
        try {
            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error();
            await fetchProfile(); // refresh local state
            toast.success("Profile updated");
            return true;
        } catch (e) {
            toast.error("Failed to update profile");
            return false;
        }
    };

    const updateSettings = async (updates: any) => {
        try {
            // Optimistic background save
            const res = await fetch('/api/settings/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error();
            // Just merge local state to avoid jumpy reloads
            setSettings((prev: any) => ({ ...prev, ...updates }));
            return true;
        } catch (e) {
            toast.error("Failed to save setting");
            return false;
        }
    };

    return {
        user,
        userLanguage,
        settings,
        stats,
        certificates,
        badges,
        activityData,
        isLoading,
        updateProfile,
        updateSettings,
        refresh: fetchProfile
    };
}
