// GET /api/books/[id]/chapters/[number] — Chapter content (on-demand processing)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processChapter } from '@/lib/books/chapter-processor';

function getSupabaseClient(accessToken: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
}

export async function GET(
    _req: Request,
    { params }: { params: { id: string; number: string } }
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
        const chapterNumber = parseInt(params.number);

        // Fetch chapter
        const { data: rawChapter, error: chErr } = await supabase
            .from('book_chapters')
            .select('*')
            .eq('book_id', bookId)
            .eq('chapter_number', chapterNumber)
            .single();

        if (chErr || !rawChapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }

        const chapter = rawChapter as any;

        // If not processed yet, process on demand
        if (!chapter.processed) {
            const result = await processChapter(chapter.id, chapter.content, chapter.chapter_number);
            if (result) {
                chapter.vocabulary_items = result.vocabulary_items;
                chapter.comprehension_questions = result.comprehension_questions;
                chapter.summary = result.summary;
                chapter.cefr_level = result.cefr_level;
                chapter.processed = true;
            }
        }

        // Fetch user chapter progress
        const { data: userProgress } = await supabase
            .from('user_chapter_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('chapter_id', chapter.id)
            .single();

        // Upsert: mark that user started this chapter
        if (!userProgress) {
            await supabase
                .from('user_chapter_progress')
                .insert({
                    user_id: user.id,
                    chapter_id: chapter.id,
                    book_id: bookId,
                } as any);
        }

        // Ensure book progress exists
        const { data: bookProg } = await supabase
            .from('user_book_progress')
            .select('id')
            .eq('user_id', user.id)
            .eq('book_id', bookId)
            .single();

        if (!bookProg) {
            await supabase
                .from('user_book_progress')
                .insert({
                    user_id: user.id,
                    book_id: bookId,
                    current_chapter: chapterNumber,
                } as any);
        }

        // Get book info for context
        const { data: book } = await supabase
            .from('books')
            .select('title, total_chapters')
            .eq('id', bookId)
            .single();

        return NextResponse.json({
            chapter,
            user_progress: userProgress || null,
            book: { title: (book as any)?.title, total_chapters: (book as any)?.total_chapters },
        });
    } catch (error) {
        console.error('[chapters] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 });
    }
}
