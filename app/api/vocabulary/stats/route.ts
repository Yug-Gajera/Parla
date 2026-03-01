import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const languageId = searchParams.get('language_id');

        if (!languageId) {
            return NextResponse.json({ error: 'language_id is required' }, { status: 400 });
        }

        // We can do a single query grouping by status, or multiple counts. 
        // Grouping by status:
        const { data, error } = await supabase
            .from('user_vocabulary')
            .select('status')
            .eq('user_id', user.id)
            .eq('vocabulary_words.language_id', languageId)
        // Implicit join isn't easily grouped in PostgREST unless we use a rpc.
        // Let's do it simply by fetching statuses for this user.
        // Actually, we can just fetch all 'status' and 'next_review_date' for the user 
        // and do the aggregation in JS since decks usually aren't millions of rows per user.

        const { data: rows, error: rowsError } = await (supabase as any)
            .from('user_vocabulary')
            .select('status, next_review_date, vocabulary_words!inner(language_id)')
            .eq('user_id', user.id)
            .eq('vocabulary_words.language_id', languageId);

        if (rowsError) throw rowsError;

        const stats = {
            total: rows.length,
            new: 0,
            learning: 0,
            familiar: 0,
            mastered: 0,
            dueToday: 0
        };

        const today = new Date().toISOString().split('T')[0];

        (rows as any[]).forEach((row) => {
            if (stats[row.status as keyof typeof stats] !== undefined) {
                stats[row.status as keyof typeof stats]++;
            }
            if (row.next_review_date && row.next_review_date <= today) {
                stats.dueToday++;
            }
        });

        return NextResponse.json({ success: true, data: stats });
    } catch (error) {
        console.error('Vocabulary Stats GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
