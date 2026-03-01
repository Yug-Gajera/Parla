import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// GET: Fetch user's vocabulary words
// ============================================================
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const status = searchParams.get('status'); // new, learning, familiar, mastered, or due
        const languageId = searchParams.get('language_id');
        const search = searchParams.get('search');

        let query = (supabase as any)
            .from('user_vocabulary')
            .select('*, vocabulary_words(*)', { count: 'exact' })
            .eq('user_id', user.id);

        if (languageId) {
            // Need to filter implicitly through the join, using an inner join
            query = (supabase as any)
                .from('user_vocabulary')
                .select('*, vocabulary_words!inner(*)', { count: 'exact' })
                .eq('user_id', user.id)
                .eq('vocabulary_words.language_id', languageId);
        }

        if (status === 'due') {
            // next_review_date <= today
            const today = new Date().toISOString().split('T')[0];
            query = query.lte('next_review_date', today);
        } else if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.ilike('vocabulary_words.word', `%${search}%`);
        }

        const { data, count, error } = await query
            .order('added_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, data, count, offset, limit });
    } catch (error) {
        console.error('Vocabulary GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// ============================================================
// POST: Add new word to deck
// ============================================================
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { word_id, language_id } = body;

        if (!word_id) {
            return NextResponse.json({ error: 'word_id is required' }, { status: 400 });
        }

        // Insert using defaults defined in schema
        const { data, error } = await (supabase as any)
            .from('user_vocabulary')
            .insert({
                user_id: user.id,
                word_id: word_id,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // unique violation
                return NextResponse.json({ error: 'Word already in deck' }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Vocabulary POST Error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
    }
}

// ============================================================
// DELETE: Remove word from deck
// ============================================================
export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const { error } = await (supabase as any)
            .from('user_vocabulary')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Vocabulary DELETE Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
