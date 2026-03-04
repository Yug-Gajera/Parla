// ============================================================
// Parlai — Gutenberg Client (free, no API key)
// ============================================================

const GUTENDEX_BASE = 'https://gutendex.com/books/';

export interface GutenbergBook {
    id: number;
    title: string;
    authors: { name: string; birth_year: number | null; death_year: number | null }[];
    formats: Record<string, string>;
    download_count: number;
}

/**
 * Search for Spanish books on Project Gutenberg via Gutendex.
 */
export async function searchSpanishBooks(query?: string): Promise<GutenbergBook[]> {
    let url = `${GUTENDEX_BASE}?languages=es`;
    if (query) url += `&search=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gutendex search failed: ${res.status}`);

    const data = await res.json();
    // Only books with text/plain available
    return (data.results || []).filter((b: GutenbergBook) =>
        Object.keys(b.formats).some(k => k.includes('text/plain'))
    );
}

/**
 * Get a single book's metadata by Gutenberg ID.
 */
export async function getBookById(gutenbergId: number): Promise<GutenbergBook | null> {
    const res = await fetch(`${GUTENDEX_BASE}${gutenbergId}`);
    if (!res.ok) return null;
    return res.json();
}

/**
 * Download the raw text of a Gutenberg book.
 * Prefers text/plain; charset=utf-8.
 */
export async function downloadBookText(gutenbergId: number): Promise<string> {
    const book = await getBookById(gutenbergId);
    if (!book) throw new Error(`Book ${gutenbergId} not found`);

    // Find best text format
    const formats = book.formats;
    const textUrl =
        formats['text/plain; charset=utf-8'] ||
        formats['text/plain; charset=us-ascii'] ||
        Object.entries(formats).find(([k]) => k.includes('text/plain'))?.[1];

    if (!textUrl) throw new Error(`No text format for book ${gutenbergId}`);

    const res = await fetch(textUrl);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    return res.text();
}

/**
 * Strip Gutenberg header and footer boilerplate.
 */
function stripBoilerplate(text: string): string {
    // Remove everything before "*** START OF" marker
    const startMatch = text.match(/\*\*\*\s*START OF.*?\*\*\*/i);
    if (startMatch && startMatch.index !== undefined) {
        text = text.slice(startMatch.index + startMatch[0].length);
    }

    // Remove everything after "*** END OF" marker
    const endMatch = text.match(/\*\*\*\s*END OF/i);
    if (endMatch && endMatch.index !== undefined) {
        text = text.slice(0, endMatch.index);
    }

    return text.trim();
}

/**
 * Split raw book text into chapters.
 * 1. Detect chapter markers (CAPÍTULO, Capítulo, PARTE, etc.)
 * 2. If none found, split by word count (every 800 words)
 * 3. Cap each chapter at 1000 words (split long chapters into parts)
 */
export function splitIntoChapters(rawText: string): { title: string; content: string }[] {
    const cleaned = stripBoilerplate(rawText);

    // Clean excessive blank lines
    const text = cleaned.replace(/\n{4,}/g, '\n\n\n');

    // Try to detect chapter markers
    const chapterRegex = /^(CAPÍTULO|Capítulo|CAPITULO|Capitulo|PARTE|Parte|LIBRO|Libro|CHAPTER|Chapter)\s+[\dIVXLCDM]+[.:\s—–-]*/gm;
    const markers = Array.from(text.matchAll(chapterRegex));

    let rawChapters: { title: string; content: string }[] = [];

    if (markers.length >= 3) {
        // Split by chapter markers
        for (let i = 0; i < markers.length; i++) {
            const start = markers[i].index!;
            const end = i < markers.length - 1 ? markers[i + 1].index! : text.length;
            const chapterText = text.slice(start, end).trim();

            // Extract title (first line) and content (rest)
            const lines = chapterText.split('\n');
            const title = lines[0].trim();
            const content = lines.slice(1).join('\n').trim();

            if (content.length > 50) {
                rawChapters.push({ title, content });
            }
        }
    } else {
        // No chapter markers — split by word count
        const words = text.split(/\s+/);
        const CHUNK_SIZE = 800;
        let chapterNum = 1;

        for (let i = 0; i < words.length; i += CHUNK_SIZE) {
            const chunk = words.slice(i, i + CHUNK_SIZE).join(' ').trim();
            if (chunk.length > 50) {
                rawChapters.push({
                    title: `Capítulo ${chapterNum}`,
                    content: chunk,
                });
                chapterNum++;
            }
        }
    }

    // Cap each chapter at 1000 words, split long ones into parts
    const finalChapters: { title: string; content: string }[] = [];

    for (const ch of rawChapters) {
        const words = ch.content.split(/\s+/);
        if (words.length <= 1000) {
            finalChapters.push(ch);
        } else {
            // Split into parts
            let partNum = 1;
            for (let i = 0; i < words.length; i += 1000) {
                const partWords = words.slice(i, i + 1000);
                finalChapters.push({
                    title: `${ch.title} (Parte ${partNum})`,
                    content: partWords.join(' '),
                });
                partNum++;
            }
        }
    }

    return finalChapters;
}
