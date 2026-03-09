export const dynamic = "force-dynamic";
// ============================================================
// Parlova — Article Fetch API (cron + manual trigger)
// ============================================================

import { NextResponse } from 'next/server';
import { runArticleFetchJob } from '@/lib/articles/fetch-job';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function isAuthorized(req: Request): boolean {
    const secret = process.env.ARTICLE_FETCH_SECRET;
    if (!secret) return false;
    const authHeader = req.headers.get('Authorization');
    return authHeader === `Bearer ${secret}`;
}

/**
 * POST: Trigger the fetch job.
 * Vercel cron calls this at midnight UTC.
 * Can also be triggered manually via curl.
 */
export async function POST(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await runArticleFetchJob();
        return NextResponse.json(result);
    } catch (error) {
        console.error('[fetch] Job error:', error);
        return NextResponse.json(
            { error: 'Fetch job failed', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET: Return today's daily_fetch_log.
 * Useful for checking if the job ran and monitoring costs.
 * Same auth required.
 *
 * Vercel cron hits GET — so also trigger the job here.
 * Note: Vercel cron requires Pro plan.
 * Free alternative: cron-job.org → POST to this URL with auth header, daily at midnight.
 */
export async function GET(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If called by Vercel cron (no query params), trigger the job
    const { searchParams } = new URL(req.url);
    const statusOnly = searchParams.get('status') === 'true';

    if (statusOnly) {
        // Just return today's log
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const today = new Date().toISOString().split('T')[0];
        const { data: log } = await supabase
            .from('daily_fetch_log')
            .select('*')
            .eq('date', today)
            .single();

        return NextResponse.json({ today, log: log || null });
    }

    // Trigger the job (for Vercel cron compatibility)
    try {
        const result = await runArticleFetchJob();
        return NextResponse.json(result);
    } catch (error) {
        console.error('[fetch] Job error:', error);
        return NextResponse.json(
            { error: 'Fetch job failed', details: String(error) },
            { status: 500 }
        );
    }
}

// Increase timeout for this route (article processing can take a while)
export const maxDuration = 120;
