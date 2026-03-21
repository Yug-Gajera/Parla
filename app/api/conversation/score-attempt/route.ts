export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { target_text, spoken_text, user_level, session_id, attempt_number, skipped } = body;

        if (!target_text) {
            return NextResponse.json({ error: 'Missing target_text' }, { status: 400 });
        }

        let score = 0;
        let feedback_level = 'try_again';
        let matched_words: string[] = [];
        let missed_words: string[] = [];
        let corrected_phonetic: string | null = null;

        if (!skipped && spoken_text) {
            // Text Normalization function
            const normalize = (str: string) => {
                let s = str.toLowerCase();
                // Remove punctuation
                s = s.replace(/[.,/#!$%^&*;:{}=\-_`~()¡¿?"']/g, '');
                // Remove accents
                s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return s.trim();
            };

            const targetNorm = normalize(target_text);
            const spokenNorm = normalize(spoken_text);

            const targetWords = targetNorm.split(/\s+/).filter(Boolean);
            const spokenWords = spokenNorm.split(/\s+/).filter(Boolean);

            let matchCount = 0;
            const tempSpokenWords = [...spokenWords];

            for (const word of targetWords) {
                const idx = tempSpokenWords.indexOf(word);
                if (idx !== -1) {
                    matchCount++;
                    matched_words.push(word);
                    tempSpokenWords.splice(idx, 1);
                } else {
                    missed_words.push(word);
                }
            }

            if (targetWords.length > 0) {
                score = Math.round((matchCount / targetWords.length) * 100);
            }

            // Apply level adjustment
            if (user_level === 'A1') {
                score += 15;
            } else if (user_level === 'A2') {
                score += 10;
            }

            score = Math.min(100, score); // Cap at 100

            if (score >= 85) {
                feedback_level = 'excellent';
            } else if (score >= 65) {
                feedback_level = 'good';
            } else if (score >= 45) {
                feedback_level = 'very_close';
            } else {
                feedback_level = 'try_again';
            }

            // Provide dummy phonetic if very_close or try_again (could be a real API call later)
            if (feedback_level === 'very_close' || feedback_level === 'try_again') {
                // To do this perfectly we'd call an LLM. For MVP, we will just return a placeholder.
                corrected_phonetic = "sounds like: " + missed_words.join(" ");
            }
        } else {
            // Skipped or no speech
            score = 0;
            feedback_level = 'try_again';
            missed_words = normalize(target_text).split(/\s+/).filter(Boolean);
        }

        // Save to speak_attempts table
        await supabase.from('speak_attempts').insert({
            user_id: user.id,
            conversation_session_id: session_id || null,
            target_text,
            spoken_text: skipped ? null : spoken_text,
            score,
            feedback_level,
            attempt_number: attempt_number || 1,
            skipped: !!skipped
        });

        return NextResponse.json({
            success: true,
            score,
            feedback_level,
            matched_words,
            missed_words,
            corrected_phonetic
        });

    } catch (e) {
        console.error('Score Attempt Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
