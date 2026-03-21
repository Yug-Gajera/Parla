export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FirstConversationClient } from '@/components/first-conversation/FirstConversationClient';

export default async function FirstConversationPage() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        redirect('/login');
    }

    // Check if user has already completed the first conversation
    const { data: userData } = await supabase
        .from('users')
        .select('has_completed_first_conversation')
        .eq('id', user.id)
        .single();
    
    if (userData && (userData as any).has_completed_first_conversation) {
        redirect('/practice');
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

    // Check for existing returning session
    const { data: recentSessionsData } = await supabase
        .from('conversation_sessions')
        .select('id, goal_completed')
        .eq('user_id', user.id)
        .eq('scenario_type', 'first_conversation')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const existingSessionId = (recentSessionsData && !(recentSessionsData as any).goal_completed) ? (recentSessionsData as any).id : null;

    return (
        <FirstConversationClient
            languageId={languageId}
            level={level}
            existingSessionId={existingSessionId}
        />
    );
}
