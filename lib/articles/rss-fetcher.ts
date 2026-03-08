// ============================================================
// Parlova — RSS Feed Fetcher (Cost-Optimized)
// ============================================================

import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { RSSFeed, RSS_FEEDS } from '@/lib/data/rss-feeds';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface RawArticle {
    title: string;
    original_url: string;
    content: string;
    summary: string;
    word_count: number;
    published_at: string | null;
    image_url: string | null;
    source_name: string;
    source_url: string;
}

const parser = new Parser({
    timeout: 10000, // 10s timeout — don't let one slow feed hang the job
    headers: { 'User-Agent': 'Parlova/1.0 (Language Learning App)' },
});

// Common Spanish words for language detection
const SPANISH_MARKERS = ['el', 'la', 'los', 'las', 'de', 'en', 'que', 'es', 'un', 'una', 'por', 'con', 'para', 'del'];

/**
 * Check if text contains Spanish by looking for common Spanish words.
 * Returns true if at least 5 marker words are found.
 */
export function isSpanishContent(text: string): boolean {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);
    const wordSet = new Set(words);
    let count = 0;
    for (const marker of SPANISH_MARKERS) {
        if (wordSet.has(marker)) count++;
    }
    return count >= 5;
}

/**
 * Clean HTML content into plain readable text.
 * Truncates to 800 words max (shorter = cheaper Claude calls).
 */
export function cleanArticleContent(html: string): string {
    if (!html) return '';

    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, aside, iframe, form, button, .ad, .advertisement, .social-share').remove();

    let text = $.text();
    text = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length >= 30)
        .join('\n\n');
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    // Truncate to 800 words (keeps Claude costs low)
    const words = text.split(/\s+/);
    if (words.length > 800) {
        text = words.slice(0, 800).join(' ');
    }

    return text;
}

/**
 * Fetch and parse articles from a single RSS feed.
 */
export async function fetchFeedArticles(feed: RSSFeed): Promise<RawArticle[]> {
    try {
        const feedData = await parser.parseURL(feed.url);
        const articles: RawArticle[] = [];

        for (const item of feedData.items || []) {
            if (!item.title || !item.link) continue;

            const rawContent = item['content:encoded'] || item.content || item.contentSnippet || item.summary || '';
            const cleanContent = cleanArticleContent(rawContent);
            const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;

            // Pre-filter: skip short articles
            if (wordCount < 200) continue;

            // Pre-filter: must be Spanish
            if (!isSpanishContent(cleanContent)) continue;

            // Pre-filter: must be published within last 7 days
            const pubDate = item.pubDate || item.isoDate || null;
            if (pubDate) {
                const published = new Date(pubDate);
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                if (published < sevenDaysAgo) continue;
            }

            // Extract image
            let imageUrl: string | null = null;
            if (item.enclosure?.url) {
                imageUrl = item.enclosure.url;
            } else if (rawContent) {
                const $img = cheerio.load(rawContent);
                const firstImg = $img('img').first().attr('src');
                if (firstImg) imageUrl = firstImg;
            }

            const summaryText = item.contentSnippet || item.summary || cleanContent.slice(0, 300);

            articles.push({
                title: item.title.trim(),
                original_url: item.link.trim(),
                content: cleanContent,
                summary: summaryText.slice(0, 500),
                word_count: wordCount,
                published_at: pubDate,
                image_url: imageUrl,
                source_name: feed.name,
                source_url: feed.url,
            });
        }

        console.log(`[RSS] ${feed.name}: ${articles.length} articles passed pre-filters`);
        return articles;
    } catch (err) {
        console.error(`[RSS] Failed to fetch ${feed.name}:`, err);
        return []; // Graceful failure
    }
}

function getServiceClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * Fetch all feeds, deduplicate, and filter out articles already in the DB.
 * Returns { newArticles, skippedDuplicates, skippedFilter }.
 */
export async function fetchAllNewArticles(): Promise<{
    newArticles: RawArticle[];
    totalFetched: number;
    skippedDuplicates: number;
}> {
    // Fetch all 3 feeds in parallel
    const results = await Promise.all(
        RSS_FEEDS.map(feed => fetchFeedArticles(feed))
    );

    const allArticles = results.flat();

    // Deduplicate by URL within this batch
    const seen = new Set<string>();
    const unique = allArticles.filter(a => {
        if (seen.has(a.original_url)) return false;
        seen.add(a.original_url);
        return true;
    });

    // Check which URLs already exist in the database
    // Uses the idx_articles_original_url index for fast lookups
    const supabase = getServiceClient();
    const urls = unique.map(a => a.original_url);

    let existingUrls = new Set<string>();
    if (urls.length > 0) {
        const { data: existing } = await supabase
            .from('articles')
            .select('original_url')
            .in('original_url', urls);
        existingUrls = new Set(
            (existing || []).map((r: { original_url: string }) => r.original_url)
        );
    }

    const newArticles = unique.filter(a => !existingUrls.has(a.original_url));
    const skippedDuplicates = unique.length - newArticles.length;

    console.log(`[RSS] Total: ${allArticles.length} fetched, ${newArticles.length} new, ${skippedDuplicates} duplicates skipped`);

    return { newArticles, totalFetched: allArticles.length, skippedDuplicates };
}
