import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SCENARIOS } from '@/lib/data/scenarios';
import { CONVERSATION_SCORING_PROMPT } from '@/lib/claude/prompts';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { session_id, scenario_id, level, duration_minutes } = body;

        if (!session_id || !scenario_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get the session history
        const { data: session, error: sessionFetchError } = await (supabase as any)
            .from('conversation_sessions')
            .select('*')
            .eq('id', session_id)
            .eq('user_id', user.id)
            .single();

        if (sessionFetchError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const transcript = (session.messages || [])
            .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n');

        const scenario = SCENARIOS.find(s => s.id === scenario_id);
        const scoringPrompt = CONVERSATION_SCORING_PROMPT
            .replace('{TRANSCRIPT}', transcript)
            .replace('{GOAL}', scenario?.goal || '')
            .replace('{LEVEL}', level || 'A2');

        // 2. Score via OpenAI JSON mode
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: scoringPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3, // Lower temp for factual JSON extraction
        });

        const scoreJsonString = completion.choices[0].message.content || '{}';
        let scoringResult;

        try {
            scoringResult = JSON.parse(scoreJsonString);
        } catch (e) {
            console.error('Failed to parse scoring JSON', scoreJsonString);
            return NextResponse.json({ error: 'Failed to generate valid scores' }, { status: 500 });
        }

        // Normalizing potentially missing fields
        const finalScores = {
            grammar_score: scoringResult.grammar_score || 0,
            vocabulary_score: scoringResult.vocabulary_score || 0,
            naturalness_score: scoringResult.naturalness_score || 0,
            goal_completed: scoringResult.goal_completed || false,
            overall_score: scoringResult.overall_score || 0,
            feedback: {
                grammar_errors: scoringResult.grammar_errors || [],
                vocabulary_highlights: scoringResult.vocabulary_highlights || [],
                vocabulary_suggestions: scoringResult.vocabulary_suggestions || [],
                summary: scoringResult.summary || '',
                encouragement: scoringResult.encouragement || '',
                next_focus: scoringResult.next_focus || ''
            }
        };

        // 3. Update the conversation session
        const { error: updateError } = await (supabase as any)
            .from('conversation_sessions')
            .update({
                duration_seconds: (duration_minutes || Math.ceil((session.messages.length * 30) / 60)) * 60,
                goal_completed: finalScores.goal_completed,
                grammar_score: finalScores.grammar_score,
                vocabulary_score: finalScores.vocabulary_score,
                naturalness_score: finalScores.naturalness_score,
                feedback: finalScores.feedback,
            })
            .eq('id', session_id);

        if (updateError) throw updateError;

        // 4. Log a generic study session (adds overall lifetime XP)
        const xpEarned = Math.round(finalScores.overall_score / 2) + (finalScores.goal_completed ? 25 : 0);

        await (supabase as any)
            .from('study_sessions')
            .insert({
                user_id: user.id,
                language_id: session.language_id,
                session_type: 'conversation',
                duration_minutes: duration_minutes || 5,
                xp_earned: xpEarned
            });

        // 5. Update Weekly Leaderboard Points
        const leaderboardPoints = 50 + Math.round(finalScores.overall_score / 2) + (finalScores.goal_completed ? 75 : 0);

        try {
            // Internal fetch to the leaderboard upsert endpoint
            const host = req.headers.get('host') || 'localhost:3000';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            await fetch(`${protocol}://${host}/api/leaderboard/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    language_id: session.language_id,
                    points_to_add: leaderboardPoints,
                    type: 'conversation',
                    level: level
                })
            });
        } catch (lbErr) {
            console.error('Failed to update leaderboard via fetch', lbErr);
        }

        return NextResponse.json({
            success: true,
            scoring: finalScores,
            xpEarned
        });

    } catch (error) {
        console.error('Conversation End Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
