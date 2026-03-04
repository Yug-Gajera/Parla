// ============================================================
// FluentLoop — Story Generate API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStory } from '@/lib/stories/story-generator';
import { getRandomTopic } from '@/lib/data/story-topics';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { language_id, topic_category, content_type } = body;

        if (!language_id || !topic_category || !content_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user's level
        const { data: userLang } = await (supabase as any)
            .from('user_languages')
            .select('current_level')
            .eq('user_id', user.id)
            .eq('language_id', language_id)
            .single();
        const level = userLang?.current_level || 'B1';

        // Pick a random topic from the category
        const topic = body.topic || getRandomTopic(topic_category);

        const result = await getStory(
            user.id, language_id, level,
            topic, topic_category, content_type
        );

        return NextResponse.json({
            story: result.story,
            was_generated: result.wasGenerated,
            daily_generations_remaining: result.dailyRemaining,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage === 'DAILY_LIMIT_REACHED') {
            return NextResponse.json({
                error: 'Daily generation limit reached',
                message: 'You have used all 3 story generations for today. Browse existing stories below!',
                daily_generations_remaining: 0,
            }, { status: 429 });
        }

        console.error('[stories/generate] Error:', error);
        return NextResponse.json({
            error: 'Story generation failed',
            message: 'Something went wrong. Please try again.',
        }, { status: 500 });
    }
}
