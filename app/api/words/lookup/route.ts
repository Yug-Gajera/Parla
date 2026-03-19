export const dynamic = "force-dynamic";
// ============================================================
// Parlova — On-the-fly Word Lookup via Claude Haiku
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const DAILY_LOOKUP_LIMIT = 30;

function getServiceClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

import { getUserPlan, checkLimit, recordUsage } from '@/lib/planLimits';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await (supabase.auth as any).getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { word, context_sentence } = body;
        if (!word) {
            return NextResponse.json({ error: 'Missing word' }, { status: 400 });
        }

        // ── Tier Enforcement ────────────────────────────────────
        const plan = await getUserPlan(user.id);
        const { allowed, remaining } = await checkLimit(user.id, 'word_lookup', plan);

        if (!allowed) {
            return NextResponse.json({
                error: 'limit_reached',
                plan,
                remaining: 0,
                upgrade_url: '/pricing',
            }, { status: 403 });
        }

        const cleanWord = word.toLowerCase().trim();
        const serviceClient = getServiceClient();

        // 1. Check if word already exists in cached lookups
        const { data: cached } = await serviceClient
            .from('word_lookup_cache')
            .select('*')
            .eq('word', cleanWord)
            .limit(1)
            .single();

        if (cached) {
            return NextResponse.json({ word_info: cached, source: 'cache' });
        }

        // 2. We skip the old manual counter check as it's now handled by Tier Enforcement checkLimit above.

        // 3. Call Claude Haiku for word info
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const response = await anthropic.messages.create({
            model: HAIKU_MODEL,
            max_tokens: 200,
            system: 'You explain Spanish words for language learners. Return JSON only, no other text.',
            messages: [{
                role: 'user',
                content: `Explain the Spanish word: "${cleanWord}"\nContext sentence: "${context_sentence || ''}"

Return this JSON:
{
  "word": "${cleanWord}",
  "translation": "English translation",
  "spanish_explanation": "simple Spanish explanation under 15 words",
  "part_of_speech": "noun|verb|adjective|adverb|phrase|preposition|conjunction",
  "note": ""
}`,
            }],
        });

        const textBlock = response.content.find(b => b.type === 'text');
        let rawText = textBlock && textBlock.type === 'text' ? textBlock.text : '{}';
        // Strip markdown fencing if Claude wrapped the JSON
        rawText = rawText.replace(/```json\n?|\n?```/g, '').trim();
        let wordInfo;
        try {
            wordInfo = JSON.parse(rawText);
        } catch {
            console.error('[word/lookup] Failed to parse Claude response:', rawText);
            wordInfo = {
                word: cleanWord,
                translation: 'Translation unavailable',
                spanish_explanation: null,
                part_of_speech: null,
            };
        }

        // 4. Cache the result for future lookups by any user
        wordInfo.word = cleanWord;
        wordInfo.in_context = context_sentence || null;

        await serviceClient
            .from('word_lookup_cache')
            .upsert({
                word: cleanWord,
                translation: wordInfo.translation,
                spanish_explanation: wordInfo.spanish_explanation,
                part_of_speech: wordInfo.part_of_speech,
                note: wordInfo.note || '',
            }, { onConflict: 'word' })
            .select();

        // 5. Record Usage (centralized)
        await recordUsage(user.id, 'word_lookup');

        return NextResponse.json({
            word_info: wordInfo,
            source: 'generated',
            remaining,
        });
    } catch (error) {
        console.error('[word/lookup] Error:', error);
        return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }
}
