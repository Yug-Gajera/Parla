export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PracticeView from '@/components/conversation/PracticeView';

export default async function PracticePage() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        redirect('/login');
    }

    // Check if user has completed first conversation
    const { data: userData } = await supabase
        .from('users')
        .select('has_completed_first_conversation, conversation_unlocked, guided_scenarios_completed')
        .eq('id', user.id)
        .single();
    
    if (userData && !(userData as any).has_completed_first_conversation) {
        redirect('/practice/first-conversation');
    }

    // Get active language
    const { data: userLanguage } = await supabase
        .from('user_languages')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!userLanguage) {
        redirect('/onboarding');
    }

    const languageId = (userLanguage as any).language_id;
    const level = (userLanguage as any).current_level || 'A1';

    // Fetch recent sessions
    const { data: recentSessionsData } = await supabase
        .from('conversation_sessions')
        .select('id, scenario_type, created_at, duration_seconds, grammar_score, vocabulary_score, naturalness_score, goal_completed')
        .not('feedback', 'is', null)
        .eq('user_id', user.id)
        .eq('language_id', languageId)
        .order('created_at', { ascending: false })
        .limit(3);

    const recentSessions = (recentSessionsData || []).map((s: any) => ({
        ...s,
        duration_minutes: Math.ceil((s.duration_seconds || 0) / 60) || 1,
        overall_score: Math.round(((s.grammar_score || 0) * 0.3 + (s.vocabulary_score || 0) * 0.3 + (s.naturalness_score || 0) * 0.25 + (s.goal_completed ? 100 : 0) * 0.15)) || 0
    }));

    return (
        <PracticeView
            languageId={languageId}
            level={level}
            recentSessions={recentSessions || []}
            conversationUnlocked={(userData as any)?.conversation_unlocked || false}
            guidedScenariosCompleted={(userData as any)?.guided_scenarios_completed || 0}
        />
    );
}
