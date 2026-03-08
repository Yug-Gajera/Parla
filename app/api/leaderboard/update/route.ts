import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Bypass RLS auth check with service role
import { getWeekStartDate, getLevelBand } from '@/lib/utils/level';

// This is an internal endpoint only meant to be called by other server routes on the Node process.
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { user_id, language_id, points_to_add, type, level } = body;

        // Verify request comes from internal (could use a secret header here, for MVP just check parameters)
        if (!user_id || !language_id || !points_to_add) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Must use admin client to upsert into leaderboards outside of RLS user context potentially
        // E.g., if called via chron job or a webhook from a different service.
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const weekStartIso = getWeekStartDate(new Date()).toISOString().split('T')[0];
        const band = getLevelBand(level || 'A1');

        // 1. Check if user already has an entry this week
        const { data: existingEntry } = await supabaseAdmin
            .from('leaderboard_entries')
            .select('*')
            .eq('user_id', user_id)
            .eq('language_id', language_id)
            .eq('week_start_date', weekStartIso)
            .single();

        let newRow;

        if (existingEntry) {
            // Update
            const updates: any = {
                weekly_score: existingEntry.weekly_score + points_to_add,
                total_score: existingEntry.total_score + points_to_add
            };

            // Track metrics for Weekly Challenges
            if (type === 'conversation') updates.conversation_count = existingEntry.conversation_count + 1;
            if (type === 'vocabulary') updates.vocabulary_learned = existingEntry.vocabulary_learned + 1;

            const { data, error } = await supabaseAdmin
                .from('leaderboard_entries')
                .update(updates)
                .eq('id', existingEntry.id)
                .select()
                .single();
            if (error) throw error;
            newRow = data;
        } else {
            // Insert
            const inserts: any = {
                user_id,
                language_id,
                level_band: band,
                week_start_date: weekStartIso,
                weekly_score: points_to_add,
                total_score: points_to_add,
                conversation_count: type === 'conversation' ? 1 : 0,
                vocabulary_learned: type === 'vocabulary' ? 1 : 0
            };

            const { data, error } = await supabaseAdmin
                .from('leaderboard_entries')
                .insert(inserts)
                .select()
                .single();
            if (error) throw error;
            newRow = data;
        }

        // Also increment user_languages.level_score (0-100 scale)
        // Scale: every 25 leaderboard points = 1 level point, capped at 100
        try {
            const levelIncrement = Math.max(1, Math.round(points_to_add / 25));

            const { data: currentLang } = await supabaseAdmin
                .from('user_languages')
                .select('level_score')
                .eq('user_id', user_id)
                .eq('language_id', language_id)
                .single();

            if (currentLang) {
                const newScore = Math.min(100, (currentLang.level_score || 0) + levelIncrement);
                await supabaseAdmin
                    .from('user_languages')
                    .update({ level_score: newScore })
                    .eq('user_id', user_id)
                    .eq('language_id', language_id);
            }
        } catch (levelErr) {
            console.error('Failed to update level_score:', levelErr);
        }

        return NextResponse.json({ success: true, entry: newRow });

    } catch (error) {
        console.error('Leaderboard Update Error:', error);
        return NextResponse.json({ error: 'Failed to update leaderboard' }, { status: 500 });
    }
}
