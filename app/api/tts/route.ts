export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';
import { getUserPlan } from '@/lib/planLimits';
import { checkRateLimit, recordUsage as recordRateUsage } from '@/lib/rateLimits';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

export async function POST(req: NextRequest) {
    try {
        // Parse body and create supabase client in parallel
        const [supabase, body] = await Promise.all([
            createClient(),
            req.json(),
        ]);

        const { text, speed, voice } = body;

        if (!text || text.length > 500) {
            return NextResponse.json(
                { error: 'Invalid text' },
                { status: 400 }
            );
        }

        // Auth check
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorised' },
                { status: 401 }
            );
        }

        const selectedVoice = voice || 'nova';
        const selectedSpeed = speed || 1.0;

        const cacheKey = createHash('md5')
            .update(`${text}-${selectedSpeed}-${selectedVoice}`)
            .digest('hex');

        const plan = await getUserPlan(session.user.id);
        const rateLimit = await checkRateLimit(
            session.user.id,
            session.user.email || '',
            plan as 'free' | 'pro' | 'pro_plus',
            'tts'
        );
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'daily_rate_limit_reached',
                    rateLimit,
                    upgrade_url: '/pricing',
                },
                { status: 429 }
            );
        }
        const nextCurrent = rateLimit.current + 1;
        const nextRemaining = Math.max(0, rateLimit.limit - nextCurrent);
        const isWarning =
            nextCurrent >= Math.floor(rateLimit.limit * 0.8) &&
            nextCurrent < rateLimit.limit;

        // Run cache lookup first so we do not generate uncached audio unnecessarily
        const cachePromise = supabase.storage
            .from('tts-cache')
            .download(`${cacheKey}.mp3`)
            .catch(() => ({ data: null }));

        // Check cache (may already be resolved)
        const cacheResult = await cachePromise;
        const cached = (cacheResult as any)?.data;

        if (cached) {
            await recordRateUsage(session.user.id, 'tts');
            // Cancel the TTS promise (it'll run but we won't use it)
            const buffer = await cached.arrayBuffer();
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Cache-Control': 'public, max-age=604800, immutable',
                    'X-RateLimit-Limit': String(rateLimit.limit),
                    'X-RateLimit-Remaining': String(nextRemaining),
                    'X-RateLimit-Current': String(nextCurrent),
                    'X-RateLimit-Reset': rateLimit.resetAt,
                    'X-RateLimit-Warning': String(isWarning),
                },
            });
        }

        const mp3Response = await getOpenAI().audio.speech.create({
            model: 'tts-1',
            voice: selectedVoice as any,
            input: text,
            speed: selectedSpeed,
            response_format: 'mp3',
        });

        // Wait for TTS (already started, so minimal extra wait)
        const audioBuffer = Buffer.from(
            await mp3Response.arrayBuffer()
        );
        await recordRateUsage(session.user.id, 'tts');

        // Cache + log usage (fire and forget — don't block response)
        supabase.storage
            .from('tts-cache')
            .upload(`${cacheKey}.mp3`, audioBuffer, { contentType: 'audio/mpeg' })
            .catch(() => { });

        (supabase as any).from('tts_usage').insert({
            user_id: session.user.id,
            character_count: text.length,
            speed: selectedSpeed,
            voice: selectedVoice,
            cached: false,
            created_at: new Date().toISOString()
        }).then(({ error }: { error: any }) => {
            if (error) console.error('TTS usage log error:', error);
        });

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=604800, immutable',
                'X-RateLimit-Limit': String(rateLimit.limit),
                'X-RateLimit-Remaining': String(nextRemaining),
                'X-RateLimit-Current': String(nextCurrent),
                'X-RateLimit-Reset': rateLimit.resetAt,
                'X-RateLimit-Warning': String(isWarning),
            },
        });

    } catch (error) {
        console.error('TTS error:', error);
        return NextResponse.json(
            { error: 'TTS failed' },
            { status: 500 }
        );
    }
}
