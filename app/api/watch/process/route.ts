export const dynamic = "force-dynamic";
// POST /api/watch/process — Add & process a single video
import { NextResponse } from 'next/server';
import { processVideo } from '@/lib/watch/video-processor';
import { CURATED_VIDEOS } from '@/lib/data/curated-videos';

export const maxDuration = 60;

export async function POST(req: Request) {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.ARTICLE_FETCH_SECRET;
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { youtube_id, language_id, import_all } = body;

    // Bulk import: process all curated videos
    if (import_all && language_id) {
        const results = [];
        let newlyProcessedCount = 0;
        const MAX_NEW_VIDEOS = 10; // allow more videos during this fix session
        
        for (const video of CURATED_VIDEOS) {
            if (newlyProcessedCount >= MAX_NEW_VIDEOS) {
                console.log('[WatchProcess] Reached limit of new videos for this run.');
                break;
            }
            
            const result = await processVideo(video.youtube_id, language_id, {
                title: video.title,
                channel_name: video.channel_name,
                channel_url: video.channel_url,
                cefr_level: video.cefr_level,
                topics: video.topics,
            });
            results.push({ youtube_id: video.youtube_id, ...result });
            
            if (!(result as any).existing) {
                newlyProcessedCount++;
            }
            
            await new Promise(r => setTimeout(r, 5000));
        }
        return NextResponse.json({ results });
    }

    // Single video import
    if (!youtube_id || !language_id) {
        return NextResponse.json({ error: 'Missing youtube_id or language_id' }, { status: 400 });
    }

    // Check if it's in curated list for metadata
    const curated = CURATED_VIDEOS.find(v => v.youtube_id === youtube_id);
    const result = await processVideo(youtube_id, language_id, curated ? {
        title: curated.title,
        channel_name: curated.channel_name,
        channel_url: curated.channel_url,
        cefr_level: curated.cefr_level,
        topics: curated.topics,
    } : undefined);

    return NextResponse.json(result);
}
