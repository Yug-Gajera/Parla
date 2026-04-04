// ============================================================
// Parlai — Chapter Processor (Claude Haiku — Cost-Optimized)
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { CHAPTER_ANALYSIS_PROMPT } from '@/lib/claude/prompts';
import { createClient } from '@supabase/supabase-js';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export interface ProcessedChapter {
    cefr_level: string;
    summary: string;
    vocabulary_items: unknown[];
    comprehension_questions: unknown[];
}

/**
 * Process a single chapter through Claude Haiku.
 * Checks if already processed first — never reprocesses.
 */
export async function processChapter(
    chapterId: string,
    chapterText: string,
    chapterNumber: number
): Promise<ProcessedChapter | null> {
    const serviceClient = getServiceClient();

    // Check if already processed
    const { data: existing } = await serviceClient
        .from('book_chapters')
        .select('processed, vocabulary_items, comprehension_questions, summary, cefr_level')
        .eq('id', chapterId)
        .single();

    if (existing?.processed) {
        return {
            cefr_level: existing.cefr_level,
            summary: existing.summary,
            vocabulary_items: existing.vocabulary_items,
            comprehension_questions: existing.comprehension_questions,
        };
    }

    // Call Claude Haiku
    try {
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const response = await anthropic.messages.create({
            model: HAIKU_MODEL,
            max_tokens: 1500,
            system: CHAPTER_ANALYSIS_PROMPT,
            messages: [{
                role: 'user',
                content: `Chapter ${chapterNumber}:\n\n${chapterText}`,
            }],
        });

        const textBlock = response.content.find(b => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') return null;

        let analysis;
        try {
            let rawText = textBlock.text.trim();
            rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            analysis = JSON.parse(rawText);
        } catch {
            console.error(`[ChapterProcessor] JSON parse failed for chapter ${chapterNumber}`);
            return null;
        }

        // Update chapter in database
        await serviceClient
            .from('book_chapters')
            .update({
                cefr_level: analysis.chapter_cefr_level || analysis.cefr_level,
                summary: analysis.summary,
                vocabulary_items: (analysis.vocabulary_items || []).slice(0, 6),
                comprehension_questions: (analysis.comprehension_questions || []).slice(0, 3),
                processed: true,
                processed_at: new Date().toISOString(),
            })
            .eq('id', chapterId);

        return {
            cefr_level: analysis.chapter_cefr_level || analysis.cefr_level,
            summary: analysis.summary,
            vocabulary_items: analysis.vocabulary_items || [],
            comprehension_questions: analysis.comprehension_questions || [],
        };
    } catch (err) {
        console.error(`[ChapterProcessor] Error processing chapter ${chapterNumber}:`, err);
        return null;
    }
}

/**
 * Process all unprocessed chapters for a book.
 * ONE at a time, 300ms delay, 20-chapter safety cap.
 */
export async function processBookChapters(bookId: string): Promise<{
    processed: number;
    failed: number;
}> {
    const serviceClient = getServiceClient();

    const { data: chapters } = await serviceClient
        .from('book_chapters')
        .select('id, chapter_number, content')
        .eq('book_id', bookId)
        .eq('processed', false)
        .order('chapter_number');

    if (!chapters?.length) return { processed: 0, failed: 0 };

    let processed = 0;
    let failed = 0;
    const cap = 20;

    for (const ch of chapters) {
        if (processed >= cap) {
            console.log(`[ChapterProcessor] Safety cap (${cap}) reached for book ${bookId}`);
            break;
        }

        const result = await processChapter(ch.id, ch.content, ch.chapter_number);
        if (result) {
            processed++;
        } else {
            failed++;
        }

        // 300ms delay between calls
        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`[ChapterProcessor] Book ${bookId}: ${processed} processed, ${failed} failed`);
    return { processed, failed };
}
