// GET /api/books — Browse books library
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient(accessToken: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
}

export async function GET(req: Request) {
    try {
        const { createClient: createServerClient } = await import('@/lib/supabase/server');
        const serverSupabase = await createServerClient();
        const { data: { session } } = await serverSupabase.auth.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user;
        const supabase = getSupabaseClient(session.access_token);

        const url = new URL(req.url);
        const languageId = url.searchParams.get('language_id');
        const level = url.searchParams.get('level');
        const bookType = url.searchParams.get('book_type');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '12');
        const offset = (page - 1) * limit;

        // Build books query
        let query = supabase
            .from('books')
            .select('*')
            .eq('is_available', true)
            .order('cefr_level')
            .range(offset, offset + limit - 1);

        if (languageId) query = query.eq('language_id', languageId);
        if (level) query = query.eq('cefr_level', level);
        if (bookType) query = query.eq('book_type', bookType);

        const { data: books, error } = await query;
        if (error) throw error;

        // Fetch user progress for these books
        const bookIds = (books || []).map((b: any) => b.id);
        let progressMap: Record<string, any> = {};

        if (bookIds.length > 0) {
            const { data: progress } = await supabase
                .from('user_book_progress')
                .select('*')
                .eq('user_id', user.id)
                .in('book_id', bookIds);

            if (progress) {
                for (const p of progress as any[]) {
                    progressMap[p.book_id] = p;
                }
            }
        }

        // Sort: in-progress books first
        const sortedBooks = (books || []).sort((a: any, b: any) => {
            const aInProgress = progressMap[a.id] && !progressMap[a.id].completed_at;
            const bInProgress = progressMap[b.id] && !progressMap[b.id].completed_at;
            if (aInProgress && !bInProgress) return -1;
            if (!aInProgress && bInProgress) return 1;
            return 0;
        });

        return NextResponse.json({
            books: sortedBooks.map((book: any) => ({
                ...book,
                user_progress: progressMap[book.id] || null,
            })),
            page,
            hasMore: (books?.length || 0) === limit,
        });
    } catch (error) {
        console.error('[books] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
    }
}
