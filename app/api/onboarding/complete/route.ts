// ============================================================
// FluentLoop — Onboarding Completion API
// ============================================================
// Server-side route to save onboarding data — avoids RLS issues
// that can cause client-side upserts to silently fail.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { language_code, assessed_level, level_score, daily_goal_minutes } = body;

        if (!language_code) {
            return NextResponse.json({ error: 'Missing language_code' }, { status: 400 });
        }

        // 1. Find the language
        const { data: language, error: langError } = await (supabase as any)
            .from('languages')
            .select('id')
            .eq('code', language_code)
            .single();

        if (langError || !language) {
            console.error('[onboarding/complete] Language lookup error:', langError);
            return NextResponse.json({ error: 'Language not found' }, { status: 404 });
        }

        // 2. Save user_languages
        const { data: savedLang, error: langSaveError } = await (supabase as any)
            .from('user_languages')
            .upsert({
                user_id: user.id,
                language_id: (language as any).id,
                current_level: assessed_level || 'A1',
                level_score: level_score || 0,
            }, { onConflict: 'user_id, language_id' })
            .select()
            .single();

        if (langSaveError) {
            console.error('[onboarding/complete] Language save error:', langSaveError);
            return NextResponse.json({ error: 'Failed to save language: ' + langSaveError.message }, { status: 500 });
        }

        console.log('[onboarding/complete] Language saved:', savedLang);

        // 3. Verify the row actually exists
        const { data: verifyRow } = await (supabase as any)
            .from('user_languages')
            .select('id')
            .eq('user_id', user.id)
            .eq('language_id', (language as any).id)
            .single();

        if (!verifyRow) {
            console.error('[onboarding/complete] CRITICAL: Row not found after save!');
            return NextResponse.json({ error: 'Data verification failed — check RLS policies' }, { status: 500 });
        }

        // 4. Save user_settings
        const { error: settingsError } = await (supabase as any)
            .from('user_settings')
            .upsert({
                user_id: user.id,
                daily_goal_minutes: daily_goal_minutes || 20,
            }, { onConflict: 'user_id' });

        if (settingsError) {
            console.error('[onboarding/complete] Settings save error:', settingsError);
            // Non-fatal — language was saved, settings can be updated later
        }

        return NextResponse.json({
            success: true,
            language_id: (language as any).id,
            level: assessed_level || 'A1',
        });

    } catch (error) {
        console.error('[onboarding/complete] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
