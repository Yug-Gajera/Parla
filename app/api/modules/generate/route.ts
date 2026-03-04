// ============================================================
// FluentLoop — Module Generate API
// ============================================================
// Generates or retrieves cached learning module content for a scenario.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callChatGPT } from '@/lib/openai/client';
import { SCENARIOS } from '@/lib/data/scenarios';
import {
    DIALOGUE_GENERATION_PROMPT,
    PHRASE_SET_GENERATION_PROMPT,
    MINI_CHALLENGE_GENERATION_PROMPT,
} from '@/lib/claude/prompts';

function fillPrompt(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
}

async function generateJSON(prompt: string): Promise<any> {
    const { content } = await callChatGPT(
        [{ role: 'user', content: 'Generate the content now.' }],
        prompt,
        { temperature: 0.8, maxTokens: 4000, model: 'gpt-4o-mini' }
    );

    // Strip potential markdown fencing
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
    }

    return JSON.parse(cleaned);
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { scenario_type, language_id } = body;

        if (!scenario_type || !language_id) {
            return NextResponse.json({ error: 'Missing scenario_type or language_id' }, { status: 400 });
        }

        // 1. Check cache
        const { data: existing } = await (supabase as any)
            .from('scenario_modules')
            .select('*')
            .eq('scenario_type', scenario_type)
            .eq('language_id', language_id)
            .maybeSingle();

        if (existing?.dialogue_content && existing?.phrase_set && existing?.challenge_content) {
            return NextResponse.json({ success: true, data: existing });
        }

        // 2. Find scenario metadata
        const scenario = SCENARIOS.find(s => s.id === scenario_type || s.type === scenario_type);
        if (!scenario) {
            return NextResponse.json({ error: 'Unknown scenario' }, { status: 404 });
        }

        const vars = {
            SCENARIO_NAME: scenario.name,
            SCENARIO_CONTEXT: `${scenario.setting} — ${scenario.description}. User role: ${scenario.user_role}. Character: ${scenario.character_name} (${scenario.character_role}).`,
            LEVEL: 'A1',
        };

        // 3. Generate all 3 in parallel
        console.log(`[modules/generate] Generating module for ${scenario.name}...`);

        const [dialogue, phrases] = await Promise.all([
            generateJSON(fillPrompt(DIALOGUE_GENERATION_PROMPT, vars)),
            generateJSON(fillPrompt(PHRASE_SET_GENERATION_PROMPT, vars)),
        ]);

        // Challenge needs dialogue + phrase context
        const challengeVars = {
            ...vars,
            DIALOGUE_SUMMARY: dialogue.lines
                ?.slice(0, 5)
                .map((l: any) => `${l.speaker}: ${l.spanish} (${l.english})`)
                .join('\n') || '',
            PHRASES_SUMMARY: phrases.phrases
                ?.slice(0, 5)
                .map((p: any) => `${p.spanish} — ${p.english}`)
                .join('\n') || '',
        };

        const challenge = await generateJSON(
            fillPrompt(MINI_CHALLENGE_GENERATION_PROMPT, challengeVars)
        );

        console.log(`[modules/generate] All content generated for ${scenario.name}`);

        // 4. Upsert into scenario_modules
        const { data: saved, error: saveError } = await (supabase as any)
            .from('scenario_modules')
            .upsert({
                scenario_type,
                language_id,
                dialogue_content: dialogue,
                phrase_set: phrases,
                challenge_content: challenge,
                target_level: 'A1',
            }, { onConflict: 'scenario_type, language_id' })
            .select()
            .single();

        if (saveError) {
            console.error('[modules/generate] Save error:', saveError);
            // Return generated content even if cache save fails
            return NextResponse.json({
                success: true,
                data: {
                    scenario_type,
                    language_id,
                    dialogue_content: dialogue,
                    phrase_set: phrases,
                    challenge_content: challenge,
                },
            });
        }

        return NextResponse.json({ success: true, data: saved });

    } catch (error) {
        console.error('[modules/generate] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate module' },
            { status: 500 }
        );
    }
}
