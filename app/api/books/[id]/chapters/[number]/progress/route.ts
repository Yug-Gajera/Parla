export const dynamic = "force-dynamic";
// POST /api/books/[id]/chapters/[number]/progress — Complete a chapter
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase(accessToken: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
}

export async function POST(
    req: Request,
    { params }: { params: { id: string; number: string } }
) {
    try {
        // Get auth from the server createClient
        const { createClient: createServerClient } = await import('@/lib/supabase/server');
        const serverSupabase = await createServerClient();
        const { data: { session } } = await serverSupabase.auth.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user;
        const supabase = getSupabase(session.access_token);

        const bookId = params.id;
        const chapterNumber = parseInt(params.number);
        const { answers, words_tapped } = await req.json();

        // Fetch chapter
        const { data: chapter } = await supabase
            .from('book_chapters')
            .select('id, word_count, comprehension_questions, book_id')
            .eq('book_id', bookId)
            .eq('chapter_number', chapterNumber)
            .single();

        if (!chapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }

        // Score comprehension
        const questions = ((chapter as any).comprehension_questions || []) as { correct: number }[];
        let correct = 0;
        const total = questions.length;

        if (answers && answers.length > 0) {
            for (let i = 0; i < Math.min(answers.length, total); i++) {
                if (answers[i] === questions[i]?.correct) correct++;
            }
        }

        const score = total > 0 ? Math.round((correct / total) * 100) : 0;

        // XP: 40 base + 20 bonus if score >= 70%
        let xpEarned = 40;
        if (score >= 70) xpEarned += 20;

        // Update chapter progress
        await supabase
            .from('user_chapter_progress')
            .upsert({
                user_id: user.id,
                chapter_id: (chapter as any).id,
                book_id: bookId,
                completed_at: new Date().toISOString(),
                words_tapped: words_tapped || 0,
                comprehension_score: score,
                xp_earned: xpEarned,
            } as any, { onConflict: 'user_id,chapter_id' });

        // Update book progress
        const { data: book } = await supabase
            .from('books')
            .select('total_chapters')
            .eq('id', bookId)
            .single();

        // Count completed chapters
        const { count: completedCount } = await supabase
            .from('user_chapter_progress')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('book_id', bookId)
            .not('completed_at', 'is', null);

        const chaptersCompleted = completedCount || 0;
        const isBookComplete = chaptersCompleted >= ((book as any)?.total_chapters || 999);

        // Completion bonus: 200 XP
        if (isBookComplete) xpEarned += 200;

        await supabase
            .from('user_book_progress')
            .upsert({
                user_id: user.id,
                book_id: bookId,
                current_chapter: chapterNumber + 1,
                chapters_completed: chaptersCompleted,
                total_words_read: ((chapter as any).word_count || 0),
                total_words_tapped: words_tapped || 0,
                last_read_at: new Date().toISOString(),
                ...(isBookComplete ? { completed_at: new Date().toISOString() } : {}),
            } as any, { onConflict: 'user_id,book_id' });

        // Record study session
        const { data: userLang } = await supabase
            .from('user_languages')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (userLang) {
            await supabase.from('study_sessions').insert({
                user_id: user.id,
                user_language_id: (userLang as any).id,
                session_type: 'book_reading',
                xp_earned: xpEarned,
                duration_seconds: Math.ceil(((chapter as any).word_count || 300) / 2.5),
                metadata: {
                    book_id: bookId,
                    chapter_number: chapterNumber,
                    score,
                    words_tapped: words_tapped || 0,
                },
            } as any);
        }

        return NextResponse.json({
            score,
            correct,
            total,
            xp_earned: xpEarned,
            book_completed: isBookComplete,
            chapters_completed: chaptersCompleted,
            message: isBookComplete
                ? `🎉 Book complete! +${xpEarned} XP (includes 200 completion bonus)`
                : score >= 70
                    ? `Great comprehension! +${xpEarned} XP`
                    : `Chapter done. +${xpEarned} XP`,
            next_chapter: isBookComplete ? null : chapterNumber + 1,
        });
    } catch (error) {
        console.error('[chapter progress] Error:', error);
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }
}
