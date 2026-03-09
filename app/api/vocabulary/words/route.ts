export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// GET: Global Vocabulary Bank Search
// ============================================================
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const languageId = searchParams.get('language_id');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!languageId) {
            return NextResponse.json({ error: 'language_id is required' }, { status: 400 });
        }

        let query = (supabase as any)
            .from('vocabulary_words')
            .select('*')
            .eq('language_id', languageId);

        if (search) {
            query = query.ilike('word', `${search}%`); // Prefix search for performance
        }

        const { data, error } = await query
            .order('frequency_rank', { ascending: true, nullsFirst: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        // Optimization: we could also return whether these are already in the user's deck
        const { data: userVars } = await (supabase as any)
            .from('user_vocabulary')
            .select('word_id')
            .eq('user_id', user.id)
            .in('word_id', data.map((w: any) => w.id));

        const addedSet = new Set((userVars || []).map((uv: any) => uv.word_id));

        const enhancedData = data.map((word: any) => ({
            ...word,
            is_added: addedSet.has(word.id)
        }));

        return NextResponse.json({ success: true, data: enhancedData });
    } catch (error) {
        console.error('Vocabulary Search GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
