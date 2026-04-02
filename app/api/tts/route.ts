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
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorised' },
                { status: 401 }
            );
        }

        const { text, speed, voice } = await req.json();

        if (!text || text.length > 500) {
            return NextResponse.json(
                { error: 'Invalid text' },
                { status: 400 }
            );
        }

        const selectedVoice = voice || 'nova';
        const selectedSpeed = speed || 1.0;

        // Cache key based on text + speed + voice
        const cacheKey = createHash('md5')
            .update(`${text}-${selectedSpeed}-${selectedVoice}`)
            .digest('hex');

        // Try to serve from cache first
        const { data: cached } = await supabase
            .storage
            .from('tts-cache')
            .download(`${cacheKey}.mp3`);

        if (cached) {
            const buffer = await cached.arrayBuffer();
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Cache-Control': 'public, max-age=604800, immutable',
                },
            });
        }

        // Generate via OpenAI TTS
        const mp3Response = await getOpenAI().audio.speech.create({
            model: 'tts-1-hd',
            voice: selectedVoice as any,
            input: text,
            speed: selectedSpeed,
            response_format: 'mp3',
        });

        const audioBuffer = Buffer.from(
            await mp3Response.arrayBuffer()
        );

        // Cache the result in Supabase storage (fire and forget)
        supabase.storage
            .from('tts-cache')
            .upload(
                `${cacheKey}.mp3`,
                audioBuffer,
                { contentType: 'audio/mpeg' }
            )
            .catch((err: any) => console.error('TTS cache upload error:', err));

        // Log usage (fire and forget)
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
