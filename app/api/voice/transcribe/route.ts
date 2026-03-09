export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() { if (!_openai) { _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); } return _openai; }

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File | null;
        const language = (formData.get('language') as string) || 'es';

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        if (audioFile.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'Audio file too large. Maximum 5MB (about 30 seconds).' },
                { status: 413 }
            );
        }

        // Call OpenAI Whisper API with verbose_json for word-level data
        const transcription = await getOpenAI().audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language,
            response_format: 'verbose_json',
            timestamp_granularities: ['word'],
        });

        // Extract word-level confidence data
        const words = (transcription as any).words || [];
        const wordConfidences = words.map((w: any) => ({
            word: w.word,
            confidence: w.confidence ?? 0.85, // Not all responses include confidence
        }));

        // Calculate overall confidence
        const avgConfidence = wordConfidences.length > 0
            ? wordConfidences.reduce((acc: number, w: any) => acc + w.confidence, 0) / wordConfidences.length
            : 0.85;

        return NextResponse.json({
            transcript: transcription.text,
            confidence: Math.round(avgConfidence * 100) / 100,
            wordConfidences,
            duration: (transcription as any).duration || 0,
            language: (transcription as any).language || language,
        });

    } catch (error: any) {
        console.error('Whisper Transcription Error:', error);

        if (error?.status === 413) {
            return NextResponse.json({ error: 'Audio file too large' }, { status: 413 });
        }

        return NextResponse.json(
            { error: 'Transcription failed' },
            { status: 500 }
        );
    }
}
