export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await (supabase.auth as any).getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { session_id, language_id } = body;

        let languageUuid = language_id;
        if (language_id && language_id.length <= 3) {
            const { data: langData } = await (supabase as any)
                .from('languages')
                .select('id')
                .eq('code', language_id)
                .single();
            if (langData) languageUuid = langData.id;
        }

        // 1. Mark session as complete in DB (if session_id provided)
        if (session_id) {
            await (supabase as any)
                .from('conversation_sessions')
                .update({ goal_completed: true, feedback: { summary: "First conversation completed" } })
                .eq('id', session_id);
        }

        // 2. Mark user as having completed first conversation
        await (supabase as any)
            .from('users')
            .update({
                has_completed_first_conversation: true,
                first_conversation_completed_at: new Date().toISOString()
            })
            .eq('id', user.id);

        // 3. Save core vocabulary to deck
        if (languageUuid) {
            const coreWords = [
                { word: 'hola', translation: 'hello' },
                { word: 'me llamo', translation: 'my name is' },
                { word: 'mucho gusto', translation: 'nice to meet you' },
                { word: '¿cómo estás?', translation: 'how are you?' },
                { word: 'estoy bien', translation: 'I am well' },
                { word: 'gracias', translation: 'thank you' },
                { word: 'hasta pronto', translation: 'see you soon' }
            ];

            const deckPayload = coreWords.map(w => ({
                user_id: user.id,
                language_id: languageUuid,
                term: w.word,
                translation: w.translation,
                familiarity: 2,
                import_source: 'first_conversation'
            }));

            // Ignore uniqueness errors by using upsert with the term + language_id constraint 
            // but doing an insert. We'll just ignore errors.
            for (const item of deckPayload) {
                try {
                    await (supabase as any).from('vocabulary_deck').upsert(item, { onConflict: 'user_id, language_id, term' });
                } catch (e) {
                    console.error("Error saving core word:", item.term, e);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('First Conversation Complete Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
