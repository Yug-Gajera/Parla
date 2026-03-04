// POST /api/books/import — One-time manual import of classic books
import { NextResponse } from 'next/server';
import { importAllClassicBooks } from '@/lib/books/import-job';

export const maxDuration = 300;

export async function POST(req: Request) {
    // Simple auth check
    const authHeader = req.headers.get('authorization');
    const secret = process.env.ARTICLE_FETCH_SECRET;
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { language_id } = await req.json();
    if (!language_id) {
        return NextResponse.json({ error: 'Missing language_id' }, { status: 400 });
    }

    const result = await importAllClassicBooks(language_id);
    return NextResponse.json(result);
}
