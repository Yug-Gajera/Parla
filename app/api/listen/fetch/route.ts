export const dynamic = "force-dynamic";
// POST /api/listen/fetch — Fetch & process new podcast episodes
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAndProcessAllShows } from '@/lib/listen/podcast-processor';
import { PODCAST_SHOWS } from '@/lib/data/podcast-shows';

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

    const { language_id, seed_shows } = await req.json();
    if (!language_id) {
        return NextResponse.json({ error: 'Missing language_id' }, { status: 400 });
    }

    // If seed_shows: insert podcast shows first
    if (seed_shows) {
        const serviceClient = getServiceClient();

        // Mark all current shows as inactive to start. Configured ones will be reactivated.
        await serviceClient.from('podcast_shows').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

        for (const show of PODCAST_SHOWS) {
            const { data: existingArray } = await serviceClient
                .from('podcast_shows')
                .select('id')
                .eq('name', show.name)
                .limit(1);
            const existing = existingArray?.[0];

            if (!existing) {
                await serviceClient.from('podcast_shows').insert({
                    language_id,
                    name: show.name,
                    description: show.description,
                    rss_url: show.rss_url,
                    cover_color: show.cover_color,
                    cefr_level_range: show.cefr_level_range,
                    topics: show.topics,
                    has_transcripts: show.has_transcripts,
                    is_active: true,
                });
                console.log(`[ListenFetch] Seeded show: ${show.name}`);
            } else {
                await serviceClient.from('podcast_shows').update({
                    description: show.description,
                    rss_url: show.rss_url,
                    cover_color: show.cover_color,
                    cefr_level_range: show.cefr_level_range,
                    topics: show.topics,
                    has_transcripts: show.has_transcripts,
                    is_active: true,
                }).eq('id', existing.id);
                console.log(`[ListenFetch] Updated existing show: ${show.name}`);
            }
        }
    }

    const result = await fetchAndProcessAllShows(language_id);
    return NextResponse.json(result);
}

// GET for Vercel cron
export async function GET(req: Request) {
    return POST(req);
}
