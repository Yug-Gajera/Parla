export const dynamic = "force-dynamic";
// GET /api/books/[id] — Single book with chapter list + user progress
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient(accessToken: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
}

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { createClient: createServerClient } = await import('@/lib/supabase/server');
        const serverSupabase = await createServerClient();
        const { data: { session } } = await serverSupabase.auth.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user;
        const supabase = getSupabaseClient(session.access_token);
        const bookId = params.id;

        // Fetch book
        const { data: book, error: bookErr } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (bookErr || !book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        // Fetch chapters (metadata only, not full content)
        const { data: chapters } = await supabase
            .from('book_chapters')
            .select('id, chapter_number, title, word_count, processed, summary, cefr_level')
            .eq('book_id', bookId)
            .order('chapter_number');

        // Fetch user book progress
        const { data: bookProgress } = await supabase
            .from('user_book_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('book_id', bookId)
            .single();

        // Fetch user chapter progress
        const chapterIds = (chapters || []).map((c: any) => c.id);
        let chapterProgressMap: Record<string, any> = {};

        if (chapterIds.length > 0) {
            const { data: cProgress } = await supabase
                .from('user_chapter_progress')
                .select('*')
                .eq('user_id', user.id)
                .in('chapter_id', chapterIds);

            if (cProgress) {
                for (const cp of cProgress as any[]) {
                    chapterProgressMap[cp.chapter_id] = cp;
                }
            }
        }

        return NextResponse.json({
            book,
            chapters: (chapters || []).map((ch: any) => ({
                ...ch,
                user_progress: chapterProgressMap[ch.id] || null,
                estimated_minutes: Math.ceil((ch.word_count || 0) / 150),
            })),
            user_progress: bookProgress || null,
        });
    } catch (error) {
        console.error('[books/id] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 });
    }
}
