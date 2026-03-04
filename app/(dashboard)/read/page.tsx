import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ImmersionLibrary from '@/components/read/ImmersionLibrary';

export default async function ReadPage() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        redirect('/login');
    }

    // Get active language
    const { data: userLanguage } = await supabase
        .from('user_languages')
        .select('*, languages(*)')
        .eq('user_id', user.id)
        .single();

    if (!userLanguage) {
        redirect('/onboarding');
    }

    const languageId = (userLanguage as any).language_id;
    const languageName = (userLanguage as any).languages?.name || 'Spanish';
    const level = (userLanguage as any).current_level || 'A1';

    return (
        <ImmersionLibrary
            languageId={languageId}
            languageName={languageName}
            level={level}
        />
    );
}
