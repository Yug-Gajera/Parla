export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callClaude, HAIKU } from '@/lib/claude/client';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await (supabase.auth as any).getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { words } = await req.json();

        if (!words || !Array.isArray(words) || words.length === 0) {
            return NextResponse.json({ error: 'No words provided' }, { status: 400 });
        }

        // We use Claude Haiku to enrich a batch of words with translations and metadata
        const systemPrompt = `You are a Spanish linguistics API. Given a list of Spanish words or short phrases, return a JSON array of objects representing their translation and linguistic metadata. 
Return ONLY valid JSON. No markdown, no preamble.

Required JSON format:
[
  {
    "spanish": "string",
    "english": "string (clear contextual translation)",
    "part_of_speech": "noun | verb | adjective | adverb | etc",
    "example_sentence": "string (A natural, simple Spanish sentence using the word)",
    "cefr_level": "A1 | A2 | B1 | B2 | C1 | C2"
  }
]`;

        const userPrompt = `Enrich the following Spanish words/phrases:\n${words.join('\n')}`;

        const response = await callClaude(
            [{ role: 'user', content: userPrompt }],
            systemPrompt,
            { temperature: 0.1, maxTokens: 4000, model: 'haiku' }
        );

        let enrichedData = [];
        try {
            const rawJson = response.content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
            enrichedData = JSON.parse(rawJson);
        } catch (e) {
            console.error('Failed to parse Claude JSON response', response.content);
            return NextResponse.json({ error: 'Failed to enrich words via AI' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            enriched: enrichedData
        });

    } catch (error) {
        console.error('Enrichment Exception:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
