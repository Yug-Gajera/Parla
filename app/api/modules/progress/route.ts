export const dynamic = "force-dynamic";
// ============================================================
// Parlova — Module Progress API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const languageId = searchParams.get('language_id');

        if (!languageId) {
            return NextResponse.json({ error: 'Missing language_id' }, { status: 400 });
        }

        const { data, error } = await (supabase as any)
            .from('user_module_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('language_id', languageId);

        if (error) {
            console.error('[modules/progress] GET error:', error);
            return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });

    } catch (error) {
        console.error('[modules/progress] GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { scenario_type, language_id, step, score, phrases_learned, learned_phrases } = body;

        if (!scenario_type || !language_id || !step) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Build the update payload based on which step was completed
        const now = new Date().toISOString();
        const stepUpdates: Record<string, unknown> = {};

        if (step === 'dialogue') {
            stepUpdates.dialogue_score = score || 0;
            if (score >= 70) {
                stepUpdates.dialogue_completed = true;
                stepUpdates.dialogue_completed_at = now;
            }
        } else if (step === 'phrases') {
            stepUpdates.phrases_learned = phrases_learned || 0;
            if (phrases_learned >= 8) {
                stepUpdates.phrases_completed = true;
                stepUpdates.phrases_completed_at = now;
            }
        } else if (step === 'challenge') {
            stepUpdates.challenge_score = score || 0;
            if (score >= 70) {
                stepUpdates.challenge_completed = true;
                stepUpdates.challenge_completed_at = now;
            }
        }

        // Check if a progress row already exists
        const { data: existing } = await (supabase as any)
            .from('user_module_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('scenario_type', scenario_type)
            .eq('language_id', language_id)
            .maybeSingle();

        let upserted;

        if (existing) {
            // UPDATE only the step-specific fields — this preserves other completed steps
            const { data: updated, error: updateError } = await (supabase as any)
                .from('user_module_progress')
                .update(stepUpdates)
                .eq('id', existing.id)
                .select()
                .single();

            if (updateError) {
                console.error('[modules/progress] Update error:', updateError);
                return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
            }
            upserted = updated;
        } else {
            // INSERT a new row with the step data
            const { data: inserted, error: insertError } = await (supabase as any)
                .from('user_module_progress')
                .insert({
                    user_id: user.id,
                    scenario_type,
                    language_id,
                    ...stepUpdates,
                })
                .select()
                .single();

            if (insertError) {
                console.error('[modules/progress] Insert error:', insertError);
                return NextResponse.json({ error: 'Failed to create progress' }, { status: 500 });
            }
            upserted = inserted;
        }

        // Check if all three steps are now complete → unlock scenario
        if (upserted.dialogue_completed && upserted.phrases_completed && upserted.challenge_completed && !upserted.scenario_unlocked) {
            const { error: unlockError } = await (supabase as any)
                .from('user_module_progress')
                .update({
                    scenario_unlocked: true,
                    scenario_unlocked_at: now,
                })
                .eq('id', upserted.id);

            if (!unlockError) {
                upserted.scenario_unlocked = true;
                upserted.scenario_unlocked_at = now;
            }
        }

        // If phrases step completed with actual phrase data, save to vocabulary
        if (step === 'phrases' && learned_phrases && learned_phrases.length > 0) {
            try {
                const serviceClient = createServiceClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );

                for (const phrase of learned_phrases) {
                    if (!phrase.spanish || !phrase.english) continue;

                    const cleanSpanish = phrase.spanish.trim().toLowerCase();
                    const cleanEnglish = phrase.english.trim();

                    // 1. Upsert into global vocabulary_words bank
                    const { data: existingWord } = await serviceClient
                        .from('vocabulary_words')
                        .select('id')
                        .eq('language_id', language_id)
                        .eq('word', cleanSpanish)
                        .maybeSingle();

                    let wordId = existingWord?.id;

                    if (!wordId) {
                        const { data: newWord, error: insertError } = await serviceClient
                            .from('vocabulary_words')
                            .insert({
                                language_id,
                                word: cleanSpanish,
                                translation: cleanEnglish,
                                pronunciation: phrase.phonetic || null,
                                part_of_speech: 'phrase',
                                cefr_level: 'A1',
                                example_sentence: phrase.usage || null,
                            })
                            .select('id')
                            .single();
                        
                        if (insertError) {
                            console.error('[modules/progress] word insert error:', insertError);
                        }
                        wordId = newWord?.id;
                    }

                    if (!wordId) continue;

                    // 2. Add to user's deck (ignore if already exists)
                    const { error: uvError } = await serviceClient
                        .from('user_vocabulary')
                        .upsert({
                            user_id: user.id,
                            word_id: wordId,
                            status: 'learning',
                            interval_days: 1,
                            added_at: new Date().toISOString(),
                            next_review_date: new Date().toISOString().split('T')[0],
                        }, { onConflict: 'user_id,word_id' });

                    if (uvError) {
                        console.error('[modules/progress] uv upsert error:', uvError);
                    }
                }

                console.log(`[modules/progress] Saved ${learned_phrases.length} phrases to vocabulary for user ${user.id}`);

                // 3. Update leaderboard vocabulary_learned counter
                try {
                    const { data: userLang } = await serviceClient
                        .from('user_languages')
                        .select('current_level')
                        .eq('user_id', user.id)
                        .eq('language_id', language_id)
                        .single();

                    const protocol = req.headers.get('x-forwarded-proto') || 'http';
                    const host = req.headers.get('host') || 'localhost:3000';
                    await fetch(`${protocol}://${host}/api/leaderboard/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: user.id,
                            language_id,
                            points_to_add: learned_phrases.length * 5,
                            type: 'vocabulary',
                            level: userLang?.current_level || 'A1',
                        }),
                    });
                } catch (lbErr) {
                    console.error('[modules/progress] Leaderboard update error:', lbErr);
                }
            } catch (vocabErr) {
                // Don't fail the main request if vocab save fails
                console.error('[modules/progress] Vocab save error:', vocabErr);
            }
        }

        return NextResponse.json({ success: true, data: upserted });

    } catch (error) {
        console.error('[modules/progress] POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
