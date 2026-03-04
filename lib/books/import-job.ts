// ============================================================
// Parlai — Classic Book Import Job
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { CLASSIC_BOOKS, ClassicBookConfig } from '@/lib/data/classic-books';
import { downloadBookText, splitIntoChapters } from '@/lib/books/gutenberg-client';
import { processBookChapters } from '@/lib/books/chapter-processor';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * Import a single classic book from Project Gutenberg.
 * Downloads text, splits into chapters, inserts into database,
 * processes first 3 chapters immediately so book is readable.
 */
export async function importClassicBook(
    config: ClassicBookConfig,
    languageId: string
): Promise<{ success: boolean; bookId?: string; error?: string }> {
    const serviceClient = getServiceClient();

    // 1. Check if already imported
    const { data: existing } = await serviceClient
        .from('books')
        .select('id')
        .eq('gutenberg_id', config.gutenbergId)
        .limit(1)
        .single();

    if (existing) {
        console.log(`[Import] Skipping "${config.title}" — already exists`);
        return { success: true, bookId: existing.id };
    }

    console.log(`[Import] Importing "${config.title}" (Gutenberg #${config.gutenbergId})...`);

    try {
        // 2. Download full text
        const rawText = await downloadBookText(config.gutenbergId);
        console.log(`[Import] Downloaded ${rawText.length} chars`);

        // 3. Split into chapters
        const chapters = splitIntoChapters(rawText);
        console.log(`[Import] Split into ${chapters.length} chapters`);

        if (chapters.length === 0) {
            return { success: false, error: 'No chapters found' };
        }

        // 4. Calculate total word count
        const totalWords = chapters.reduce((sum, ch) => {
            return sum + ch.content.split(/\s+/).length;
        }, 0);

        // 5. Insert book record
        const { data: book, error: bookErr } = await serviceClient
            .from('books')
            .insert({
                language_id: languageId,
                title: config.title,
                author: config.author,
                book_type: 'classic',
                cefr_level: config.cefr_level,
                description: config.description,
                cover_color: config.cover_color,
                total_chapters: chapters.length,
                gutenberg_id: config.gutenbergId,
                gutenberg_url: `https://www.gutenberg.org/ebooks/${config.gutenbergId}`,
                is_available: false,
                word_count_total: totalWords,
                estimated_hours: Math.round((totalWords / 150 / 60) * 10) / 10,
                topics: config.topics,
            })
            .select()
            .single();

        if (bookErr || !book) {
            return { success: false, error: bookErr?.message || 'Insert failed' };
        }

        // 6. Insert all chapters (unprocessed)
        const chapterRows = chapters.map((ch, i) => ({
            book_id: book.id,
            chapter_number: i + 1,
            title: ch.title,
            content: ch.content,
            word_count: ch.content.split(/\s+/).length,
            processed: false,
        }));

        await serviceClient.from('book_chapters').insert(chapterRows);

        // 7. Process first 3 chapters immediately
        console.log(`[Import] Processing first 3 chapters...`);

        const { data: firstChapters } = await serviceClient
            .from('book_chapters')
            .select('id, chapter_number, content')
            .eq('book_id', book.id)
            .order('chapter_number')
            .limit(3);

        if (firstChapters) {
            const { processChapter } = await import('@/lib/books/chapter-processor');
            for (const ch of firstChapters) {
                await processChapter(ch.id, ch.content, ch.chapter_number);
                await new Promise(r => setTimeout(r, 300));
            }
        }

        // 8. Mark book available
        await serviceClient
            .from('books')
            .update({ is_available: true })
            .eq('id', book.id);

        console.log(`[Import] ✅ "${config.title}" — ${chapters.length} chapters, ${totalWords} words`);
        return { success: true, bookId: book.id };
    } catch (err) {
        console.error(`[Import] ❌ "${config.title}" failed:`, err);
        return { success: false, error: String(err) };
    }
}

/**
 * Import all classic books from the curated list.
 */
export async function importAllClassicBooks(languageId: string): Promise<{
    imported: number;
    skipped: number;
    failed: number;
}> {
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const config of CLASSIC_BOOKS) {
        const result = await importClassicBook(config, languageId);
        if (result.success) {
            if (result.bookId) imported++;
            else skipped++;
        } else {
            failed++;
        }

        // 2 second delay between imports
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`[Import] All done: ${imported} imported, ${skipped} skipped, ${failed} failed`);
    return { imported, skipped, failed };
}
