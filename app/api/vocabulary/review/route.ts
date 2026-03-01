import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateSM2, getWordStatus } from '@/lib/utils/vocabulary';

// ============================================================
// GET: Fetch due words for review
// ============================================================
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const languageId = searchParams.get('language_id');
        const limit = parseInt(searchParams.get('limit') || '20');

        const today = new Date().toISOString().split('T')[0];

        let query = (supabase as any)
            .from('user_vocabulary')
            .select('*, vocabulary_words!inner(*)')
            .eq('user_id', user.id)
            .lte('next_review_date', today)
            .order('next_review_date', { ascending: true })
            .limit(limit);

        if (languageId) {
            query = query.eq('vocabulary_words.language_id', languageId);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Vocabulary Review GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// ============================================================
// POST: Submit a review result
// ============================================================
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, quality, sessionComplete, xpEarned, durationMinutes, languageId } = body; // user_vocabulary row ID

        if (!id || typeof quality !== 'number' || quality < 0 || quality > 5) {
            return NextResponse.json({ error: 'Invalid parameters: id and quality (0-5) are required' }, { status: 400 });
        }

        // 1. Get current row
        const { data: currentItem, error: fetchError } = await (supabase as any)
            .from('user_vocabulary')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !currentItem) {
            return NextResponse.json({ error: 'Vocabulary item not found' }, { status: 404 });
        }

        // 2. SM-2 calculation
        const timesSeen = (currentItem.times_seen || 0) + 1;

        // SM-2 parameters
        const prevInterval = currentItem.interval_days || 1;
        const prevEase = currentItem.ease_factor || 2.5;

        // Actual SM-2
        const sm2 = calculateSM2(
            quality,
            prevInterval,
            prevEase,
            timesSeen
        );

        // Calculate if it was correct (quality >= 3)
        const isCorrect = quality >= 3;
        const timesCorrect = (currentItem.times_correct || 0) + (isCorrect ? 1 : 0);

        // Calculate new status
        const newStatus = getWordStatus(timesCorrect, sm2.next_review_date, sm2.interval_days);

        // 3. Update row
        const { data: updatedItem, error: updateError } = await (supabase as any)
            .from('user_vocabulary')
            .update({
                interval_days: sm2.interval_days,
                ease_factor: sm2.ease_factor,
                next_review_date: sm2.next_review_date,
                times_seen: timesSeen,
                times_correct: timesCorrect,
                status: newStatus,
                last_reviewed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 4. If this is the last item and session complete flag is set, log study session
        if (sessionComplete && languageId) {
            const { error: sessionError } = await (supabase as any)
                .from('study_sessions')
                .insert({
                    user_id: user.id,
                    language_id: languageId,
                    session_type: 'vocabulary',
                    duration_minutes: durationMinutes || 1,
                    xp_earned: xpEarned || 0
                });
            if (sessionError) console.error("Failed to log study session:", sessionError);

            // Calculate leaderboard points and trigger an internal fetch to update the weekly leaderboard scores.
            // Assuming 1 point per XP earned for leaderboard for now, or a fixed amount per session.
            // Using xpEarned from the session for leaderboard points.
            const leaderboardPoints = xpEarned || 0; // Or a fixed value like 10 points per session

            if (leaderboardPoints > 0) {
                try {
                    // Internal fetch to update leaderboard
                    const host = req.headers.get('host') || 'localhost:3000';
                    const protocol = host.includes('localhost') ? 'http' : 'https';
                    await fetch(`${protocol}://${host}/api/leaderboard/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: user.id,
                            language_id: languageId,
                            points_to_add: leaderboardPoints,
                            type: 'vocabulary',
                            level: 'A1' // Defaulting to wide band if specific level isn't passed here
                        })
                    });
                } catch (lbErr) {
                    console.error('Failed to update leaderboard via fetch', lbErr);
                }
            }
        }

        return NextResponse.json({ success: true, data: updatedItem });
    } catch (error) {
        console.error('Vocabulary Review POST Error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
    }
}
