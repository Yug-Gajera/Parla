export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

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

        // Auth check — run in parallel with cache key generation
        const authPromise = supabase.auth.getSession();

        const selectedVoice = voice || 'nova';
        const selectedSpeed = speed || 1.0;

        const cacheKey = createHash('md5')
            .update(`${text}-${selectedSpeed}-${selectedVoice}`)
            .digest('hex');

        // Run auth check + cache lookup + start TTS generation all in parallel
        // TTS generation is the slowest part, so start it immediately
        const ttsPromise = getOpenAI().audio.speech.create({
            model: 'tts-1',
            voice: selectedVoice as any,
            input: text,
            speed: selectedSpeed,
            response_format: 'mp3',
        });

        const cachePromise = supabase.storage
            .from('tts-cache')
            .download(`${cacheKey}.mp3`)
            .catch(() => ({ data: null }));

        // Wait for auth first (fast)
        const { data: { session } } = await authPromise;
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorised' },
                { status: 401 }
            );
        }

        // Check cache (may already be resolved)
        const cacheResult = await cachePromise;
        const cached = (cacheResult as any)?.data;

        if (cached) {
            // Cancel the TTS promise (it'll run but we won't use it)
            const buffer = await cached.arrayBuffer();
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Cache-Control': 'public, max-age=604800, immutable',
                },
            });
        }

        // Wait for TTS (already started, so minimal extra wait)
        const mp3Response = await ttsPromise;
        const audioBuffer = Buffer.from(
            await mp3Response.arrayBuffer()
        );

        // Cache + log usage (fire and forget — don't block response)
        supabase.storage
            .from('tts-cache')
            .upload(`${cacheKey}.mp3`, audioBuffer, { contentType: 'audio/mpeg' })
            .catch(() => {});

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
