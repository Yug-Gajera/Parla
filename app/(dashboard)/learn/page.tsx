export const dynamic = "force-dynamic";
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LearnView from '@/components/learn/LearnView';

export default async function LearnPage() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        redirect('/login');
    }

    // Get active language and user settings
    const [
        { data: userLanguage },
        { data: userRecord },
        { data: userSettings }
    ] = await Promise.all([
        supabase.from('user_languages').select('*, languages(*)').eq('user_id', user.id).single(),
        supabase.from('users').select('guided_scenarios_completed, conversation_unlocked').eq('id', user.id).single(),
        supabase.from('user_settings').select('guided_learning_enabled').eq('user_id', user.id).single()
    ]);

    if (!userLanguage) {
        redirect('/onboarding');
    }

    const languageId = (userLanguage as any).language_id;
    const languageName = (userLanguage as any).languages?.name || 'Spanish';
    const level = (userLanguage as any).current_level || 'A1';
    
    // Default logic: ON for A1, OFF for B1+ unless explicitly set
    const isBeginner = level === 'A1' || level === 'A2';
    const guidedEnabled = (userSettings as any)?.guided_learning_enabled !== undefined 
        ? (userSettings as any).guided_learning_enabled 
        : isBeginner;

    const guidedScenariosCompleted = (userRecord as any)?.guided_scenarios_completed || 0;

    return (
        <LearnView
            languageId={languageId}
            languageName={languageName}
            level={level}
            guidedEnabled={guidedEnabled}
            guidedScenariosCompleted={guidedScenariosCompleted}
        />
    );
}
