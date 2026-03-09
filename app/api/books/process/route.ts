export const dynamic = "force-dynamic";
// POST /api/books/process — Daily cron: process unprocessed chapters
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processBookChapters } from '@/lib/books/chapter-processor';

export const maxDuration = 120;

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: Request) {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.ARTICLE_FETCH_SECRET;
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = getServiceClient();

    // Find books with unprocessed chapters
    const { data: books } = await serviceClient
        .from('books')
        .select('id, title')
        .eq('is_available', true);

    if (!books?.length) {
        return NextResponse.json({ message: 'No books to process' });
    }

    const results = [];
    for (const book of books) {
        const result = await processBookChapters(book.id);
        if (result.processed > 0) {
            results.push({ book: book.title, ...result });
        }
    }

    return NextResponse.json({ processed_books: results });
}

// GET handler for Vercel cron
export async function GET(req: Request) {
    return POST(req);
}
