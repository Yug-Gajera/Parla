// ============================================================
// Parlai — Video Processor (YouTube transcript + Haiku)
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { VIDEO_ANALYSIS_PROMPT } from '@/lib/claude/prompts';
import { createClient } from '@supabase/supabase-js';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

interface TranscriptSegment {
    start_time: number;
    end_time: number;
    text: string;
}

/**
 * Fetch YouTube auto-generated captions by scraping the video page.
 * Returns null if captions are not available.
 */
export async function getYouTubeTranscript(youtubeId: string): Promise<TranscriptSegment[] | null> {
    try {
        // Fetch the video page HTML
        const pageRes = await fetch(`https://www.youtube.com/watch?v=${youtubeId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'es,en;q=0.9',
            },
        });

        if (!pageRes.ok) return null;
        const html = await pageRes.text();

        // Extract captionTracks from the page's player config
        const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
        if (!captionMatch) {
            console.log(`[VideoProcessor] No captions found for ${youtubeId}`);
            return null;
        }

        let captionTracks;
        try {
            captionTracks = JSON.parse(captionMatch[1]);
        } catch {
            return null;
        }

        // Find Spanish caption track
        const spanishTrack = captionTracks.find(
            (t: any) =>
                t.languageCode === 'es' ||
                t.languageCode === 'es-419' ||
                t.languageCode === 'es-ES' ||
                (t.name?.simpleText || '').toLowerCase().includes('spanish') ||
                (t.name?.simpleText || '').toLowerCase().includes('español')
        );

        // Fallback: try auto-generated track
        const track = spanishTrack || captionTracks.find(
            (t: any) => t.kind === 'asr' && (t.languageCode === 'es' || t.languageCode?.startsWith('es'))
        );

        if (!track?.baseUrl) {
            console.log(`[VideoProcessor] No Spanish captions for ${youtubeId}`);
            return null;
        }

        // Fetch the caption XML
        const captionRes = await fetch(track.baseUrl);
        if (!captionRes.ok) return null;
        const xml = await captionRes.text();

        // Parse XML transcript
        const segments: TranscriptSegment[] = [];
        const regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g;
        let match;

        while ((match = regex.exec(xml)) !== null) {
            const start = parseFloat(match[1]);
            const dur = parseFloat(match[2]);
            let text = match[3]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/<[^>]+>/g, '') // strip any nested tags
                .trim();

            if (text) {
                segments.push({
                    start_time: Math.round(start * 10) / 10,
                    end_time: Math.round((start + dur) * 10) / 10,
                    text,
                });
            }
        }

        console.log(`[VideoProcessor] Got ${segments.length} caption segments for ${youtubeId}`);
        return segments.length > 0 ? segments : null;
    } catch (err) {
        console.error(`[VideoProcessor] Transcript error for ${youtubeId}:`, err);
        return null;
    }
}

/**
 * Get video metadata from YouTube oEmbed (no API key needed).
 */
async function getVideoMetadata(youtubeId: string): Promise<{
    title: string;
    author_name: string;
    thumbnail_url: string;
} | null> {
    try {
        const res = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
        );
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

/**
 * Process a single YouTube video: metadata + transcript + Haiku analysis.
 */
export async function processVideo(
    youtubeId: string,
    languageId: string,
    overrides?: {
        title?: string;
        channel_name?: string;
        channel_url?: string;
        cefr_level?: string;
        topics?: string[];
    }
): Promise<{ success: boolean; videoId?: string; error?: string }> {
    const serviceClient = getServiceClient();

    // 1. Check if already processed
    const { data: existing } = await serviceClient
        .from('videos')
        .select('id')
        .eq('youtube_id', youtubeId)
        .single();

    if (existing) {
        console.log(`[VideoProcessor] Skipping ${youtubeId} — already exists`);
        return { success: true, videoId: existing.id };
    }

    console.log(`[VideoProcessor] Processing video ${youtubeId}...`);

    // 2. Get metadata
    const meta = await getVideoMetadata(youtubeId);
    const title = overrides?.title || meta?.author_name || youtubeId;
    const channelName = overrides?.channel_name || meta?.author_name || 'Unknown';
    const thumbnailUrl = meta?.thumbnail_url || `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;

    // 3. Get transcript
    const transcript = await getYouTubeTranscript(youtubeId);

    // 4. Analyze with Claude Haiku (if transcript available)
    let analysis: any = null;
    if (transcript && transcript.length > 0) {
        const plainText = transcript.map(s => s.text).join(' ').slice(0, 3000);

        try {
            const anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });

            const response = await anthropic.messages.create({
                model: HAIKU_MODEL,
                max_tokens: 800,
                system: VIDEO_ANALYSIS_PROMPT,
                messages: [{
                    role: 'user',
                    content: `Video: "${overrides?.title || title}"\nChannel: ${channelName}\n\nTranscript:\n${plainText}`,
                }],
            });

            const textBlock = response.content.find(b => b.type === 'text');
            if (textBlock && textBlock.type === 'text') {
                try {
                    analysis = JSON.parse(textBlock.text);
                } catch {
                    console.error(`[VideoProcessor] JSON parse failed for ${youtubeId}`);
                }
            }
        } catch (err) {
            console.error(`[VideoProcessor] Haiku error for ${youtubeId}:`, err);
        }
    }

    // 5. Insert into database
    const { data: video, error } = await serviceClient
        .from('videos')
        .insert({
            language_id: languageId,
            youtube_id: youtubeId,
            title: overrides?.title || title,
            channel_name: channelName,
            channel_url: overrides?.channel_url || null,
            thumbnail_url: thumbnailUrl,
            cefr_level: overrides?.cefr_level || analysis?.cefr_level || 'B1',
            topics: overrides?.topics || analysis?.topics || [],
            transcript: transcript,
            vocabulary_items: analysis?.vocabulary_items?.slice(0, 5) || null,
            comprehension_questions: analysis?.comprehension_questions?.slice(0, 3) || null,
            summary: analysis?.summary || null,
            processed: !!analysis,
            is_published: !!analysis,
        })
        .select()
        .single();

    if (error) {
        console.error(`[VideoProcessor] Insert error:`, error);
        return { success: false, error: error.message };
    }

    console.log(`[VideoProcessor] ✅ ${youtubeId} — "${overrides?.title || title}" processed`);
    return { success: true, videoId: video.id };
}
