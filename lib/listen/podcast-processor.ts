// ============================================================
// Parlai — Podcast Processor (RSS + Haiku)
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { PODCAST_ANALYSIS_PROMPT } from '@/lib/claude/prompts';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

const HAIKU_MODEL = 'claude-haiku-4-5-20241022';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

const parser = new Parser({
    customFields: {
        item: ['itunes:duration', 'itunes:episode', 'itunes:season'],
    },
});

/**
 * Parse duration string (HH:MM:SS or MM:SS or seconds) to seconds.
 */
function parseDuration(dur: string | number | undefined): number {
    if (!dur) return 0;
    if (typeof dur === 'number') return dur;
    const parts = dur.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseInt(dur) || 0;
}

/**
 * Fetch latest episodes from a podcast RSS feed.
 * Deduplicates by audio_url.
 */
export async function fetchLatestEpisodes(
    showId: string,
    rssUrl: string,
    limit: number = 5
): Promise<any[]> {
    const serviceClient = getServiceClient();

    let feed;
    try {
        feed = await parser.parseURL(rssUrl);
    } catch (err) {
        console.error(`[PodcastProcessor] Failed to parse RSS: ${rssUrl}`, err);
        return [];
    }

    const items = (feed.items || []).slice(0, limit * 2); // fetch extra to handle dupes

    // Get existing audio_urls for this show
    const { data: existing } = await serviceClient
        .from('podcast_episodes')
        .select('audio_url')
        .eq('show_id', showId);

    const existingUrls = new Set(
        (existing || []).map((e: any) => e.audio_url)
    );

    const newEpisodes: any[] = [];
    for (const item of items) {
        const audioUrl = item.enclosure?.url || item.link;
        if (!audioUrl || existingUrls.has(audioUrl)) continue;

        newEpisodes.push({
            show_id: showId,
            title: item.title || 'Untitled Episode',
            description: item.contentSnippet || item.content || item.summary || '',
            audio_url: audioUrl,
            duration_seconds: parseDuration(
                (item as any)['itunes:duration']
            ),
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            episode_number: parseInt((item as any)['itunes:episode']) || null,
            season_number: parseInt((item as any)['itunes:season']) || null,
        });

        if (newEpisodes.length >= limit) break;
    }

    return newEpisodes;
}

/**
 * Try to extract a transcript from the episode description.
 */
export function extractTranscriptFromDescription(description: string): string | null {
    if (!description || description.length < 100) return null;

    // Look for transcript markers
    const markers = [
        /TRANSCRIPT:?\s*\n([\s\S]+)/i,
        /Full [Tt]ranscript:?\s*\n([\s\S]+)/i,
        /Transcript\s*:\s*\n([\s\S]+)/i,
        /TRANSCRIPCIÓN:?\s*\n([\s\S]+)/i,
    ];

    for (const regex of markers) {
        const match = description.match(regex);
        if (match?.[1] && match[1].length > 200) {
            return match[1].trim();
        }
    }

    // If description itself is long enough (>500 chars), use it as fallback text
    if (description.length > 500) {
        return description;
    }

    return null;
}

/**
 * Process a single podcast episode through Claude Haiku.
 */
export async function processEpisode(
    episode: any,
    showName: string,
    cefrLevel: string,
    languageId: string
): Promise<{ success: boolean; episodeId?: string; error?: string }> {
    const serviceClient = getServiceClient();

    // Get text to analyze (transcript or description)
    const text =
        extractTranscriptFromDescription(episode.description) ||
        episode.description ||
        '';

    if (text.length < 50) {
        // Not enough text to analyze — insert without processing
        const { data: ep } = await serviceClient
            .from('podcast_episodes')
            .insert({
                ...episode,
                cefr_level: cefrLevel,
                processed: false,
                is_published: true, // Still available, just without vocab/questions
            })
            .select()
            .single();

        return { success: true, episodeId: ep?.id };
    }

    // Claude Haiku analysis
    let analysis: any = null;
    try {
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const truncatedText = text.slice(0, 3000);
        const response = await anthropic.messages.create({
            model: HAIKU_MODEL,
            max_tokens: 800,
            system: PODCAST_ANALYSIS_PROMPT,
            messages: [{
                role: 'user',
                content: `Podcast: "${showName}"\nEpisode: "${episode.title}"\nLevel: ${cefrLevel}\n\nContent:\n${truncatedText}`,
            }],
        });

        const textBlock = response.content.find(b => b.type === 'text');
        if (textBlock && textBlock.type === 'text') {
            try {
                analysis = JSON.parse(textBlock.text);
            } catch {
                console.error(`[PodcastProcessor] JSON parse failed for "${episode.title}"`);
            }
        }
    } catch (err) {
        console.error(`[PodcastProcessor] Haiku error:`, err);
    }

    // Insert episode
    const { data: ep, error } = await serviceClient
        .from('podcast_episodes')
        .insert({
            ...episode,
            cefr_level: cefrLevel,
            transcript_text: text.length > 200 ? text : null,
            vocabulary_items: analysis?.vocabulary_items?.slice(0, 5) || null,
            comprehension_questions: analysis?.comprehension_questions?.slice(0, 3) || null,
            processed: !!analysis,
            is_published: true,
        })
        .select()
        .single();

    if (error) {
        console.error(`[PodcastProcessor] Insert error:`, error);
        return { success: false, error: error.message };
    }

    console.log(`[PodcastProcessor] ✅ "${episode.title}" processed`);
    return { success: true, episodeId: ep?.id };
}

/**
 * Fetch and process new episodes for all active shows.
 * Max 3 new episodes per call.
 */
export async function fetchAndProcessAllShows(languageId: string): Promise<{
    fetched: number;
    processed: number;
    failed: number;
}> {
    const serviceClient = getServiceClient();

    const { data: shows } = await serviceClient
        .from('podcast_shows')
        .select('*')
        .eq('is_active', true);

    if (!shows?.length) return { fetched: 0, processed: 0, failed: 0 };

    let totalFetched = 0;
    let totalProcessed = 0;
    let totalFailed = 0;
    const MAX_TOTAL = 3;

    for (const show of shows as any[]) {
        if (totalFetched >= MAX_TOTAL) break;

        const remaining = MAX_TOTAL - totalFetched;
        const episodes = await fetchLatestEpisodes(show.id, show.rss_url, remaining);

        for (const ep of episodes) {
            if (totalFetched >= MAX_TOTAL) break;

            const defaultLevel = show.cefr_level_range?.[0] || 'B1';
            const result = await processEpisode(ep, show.name, defaultLevel, languageId);
            totalFetched++;
            if (result.success) totalProcessed++;
            else totalFailed++;

            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log(`[PodcastProcessor] Done: ${totalFetched} fetched, ${totalProcessed} processed, ${totalFailed} failed`);
    return { fetched: totalFetched, processed: totalProcessed, failed: totalFailed };
}
