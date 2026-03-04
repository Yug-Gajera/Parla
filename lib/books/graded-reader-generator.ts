// ============================================================
// Parlai — Graded Reader Generator (Claude Haiku)
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { GRADED_READER_CHAPTER_PROMPT } from '@/lib/claude/prompts';
import { createClient } from '@supabase/supabase-js';

const HAIKU_MODEL = 'claude-haiku-4-5-20241022';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

interface BookOutline {
    title: string;
    author_pseudonym: string;
    description: string;
    characters: { name: string; description: string }[];
    chapter_outlines: { number: number; title: string; summary: string }[];
}

const GENRE_CYCLE = [
    { genre: 'mystery', setting: 'Mexico City' },
    { genre: 'romance', setting: 'Buenos Aires' },
    { genre: 'adventure', setting: 'Barcelona' },
    { genre: 'family drama', setting: 'Madrid' },
];

/**
 * Generate a complete 8-chapter graded reader.
 */
export async function generateGradedReader(
    languageId: string,
    level: string,
    genre: string,
    setting: string
): Promise<string | null> {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
    const serviceClient = getServiceClient();

    // Step 1: Generate book outline
    console.log(`[GradedReader] Generating outline: ${level} ${genre} in ${setting}`);

    const outlineRes = await anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 600,
        system: 'You design book outlines for Spanish graded readers. Return ONLY valid JSON.',
        messages: [{
            role: 'user',
            content: `Create an 8-chapter Spanish graded reader outline.
Level: ${level} | Genre: ${genre} | Setting: ${setting}

Return JSON:
{
  "title": "title in Spanish",
  "author_pseudonym": "a realistic Spanish author name",
  "description": "2 sentence English description",
  "characters": [{"name": "name", "description": "brief"}],
  "chapter_outlines": [{"number": 1, "title": "chapter title in Spanish", "summary": "one sentence"}]
}`,
        }],
    });

    const outlineText = outlineRes.content.find(b => b.type === 'text');
    if (!outlineText || outlineText.type !== 'text') return null;

    let outline: BookOutline;
    try {
        outline = JSON.parse(outlineText.text);
    } catch {
        console.error('[GradedReader] Failed to parse outline');
        return null;
    }

    // Determine cover color based on genre
    const genreColors: Record<string, string> = {
        mystery: '#7c3aed',
        romance: '#dc2626',
        adventure: '#d97706',
        'family drama': '#0891b2',
    };

    // Step 2: Insert book record
    const { data: book, error: bookErr } = await serviceClient
        .from('books')
        .insert({
            language_id: languageId,
            title: outline.title,
            author: outline.author_pseudonym,
            book_type: 'graded_reader',
            cefr_level: level,
            description: outline.description,
            cover_color: genreColors[genre] || '#7c3aed',
            total_chapters: 8,
            is_available: false,
            topics: [genre, setting.toLowerCase()],
            generated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (bookErr || !book) {
        console.error('[GradedReader] Failed to insert book:', bookErr);
        return null;
    }

    // Step 3: Generate each chapter sequentially
    let previousCliffhanger = '';
    let totalWords = 0;
    const chapters = [];

    for (let i = 1; i <= 8; i++) {
        const chOutline = outline.chapter_outlines.find(c => c.number === i);
        const contextMsg = previousCliffhanger
            ? `Previous chapter ended with: "${previousCliffhanger}"\n\n`
            : '';

        console.log(`[GradedReader] Generating chapter ${i}/8...`);

        const chRes = await anthropic.messages.create({
            model: HAIKU_MODEL,
            max_tokens: 1200,
            system: GRADED_READER_CHAPTER_PROMPT,
            messages: [{
                role: 'user',
                content: `${contextMsg}Book: "${outline.title}" by ${outline.author_pseudonym}
Genre: ${genre} | Setting: ${setting} | Level: ${level}
Characters: ${outline.characters.map(c => `${c.name} (${c.description})`).join(', ')}
Chapter ${i} outline: ${chOutline?.summary || `Chapter ${i}`}

Write chapter ${i} of 8.${i === 8 ? ' This is the FINAL chapter — resolve the story.' : ''}`,
            }],
        });

        const chText = chRes.content.find(b => b.type === 'text');
        if (!chText || chText.type !== 'text') continue;

        let chData;
        try {
            chData = JSON.parse(chText.text);
        } catch {
            console.error(`[GradedReader] Failed to parse chapter ${i}`);
            continue;
        }

        const wordCount = (chData.content || '').split(/\s+/).length;
        totalWords += wordCount;
        previousCliffhanger = chData.cliffhanger || '';

        chapters.push({
            book_id: book.id,
            chapter_number: i,
            title: chData.chapter_title || chOutline?.title || `Capítulo ${i}`,
            content: chData.content,
            word_count: wordCount,
            cefr_level: level,
            vocabulary_items: (chData.vocabulary_items || []).slice(0, 6),
            comprehension_questions: (chData.comprehension_questions || []).slice(0, 3),
            summary: chData.summary,
            processed: true,
            processed_at: new Date().toISOString(),
        });

        // 500ms delay between Claude calls
        await new Promise(r => setTimeout(r, 500));
    }

    // Step 4: Insert all chapters
    if (chapters.length > 0) {
        await serviceClient
            .from('book_chapters')
            .insert(chapters);
    }

    // Step 5: Mark book available
    await serviceClient
        .from('books')
        .update({
            is_available: true,
            total_chapters: chapters.length,
            word_count_total: totalWords,
            estimated_hours: Math.round((totalWords / 150) * 10) / 600, // reading speed ~150 wpm
        })
        .eq('id', book.id);

    console.log(`[GradedReader] Complete: "${outline.title}" — ${chapters.length} chapters, ${totalWords} words`);
    return book.id;
}

/**
 * Generate monthly graded readers (2 per month: A2 + B1).
 */
export async function generateMonthlyGradedReaders(languageId: string): Promise<void> {
    const month = new Date().getMonth(); // 0-11
    const cycleIdx = month % GENRE_CYCLE.length;
    const { genre, setting } = GENRE_CYCLE[cycleIdx];

    console.log(`[GradedReader] Monthly generation: ${genre} in ${setting}`);

    // A2 graded reader
    await generateGradedReader(languageId, 'A2', genre, setting);

    // 2s delay
    await new Promise(r => setTimeout(r, 2000));

    // B1 graded reader
    await generateGradedReader(languageId, 'B1', genre, setting);

    console.log('[GradedReader] Monthly generation complete');
}
