export const dynamic = "force-dynamic";
// ============================================================
// Parlova — Story Generate API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStory } from '@/lib/stories/story-generator';
import { getRandomTopic } from '@/lib/data/story-topics';

import { getUserPlan, checkLimit, recordUsage } from '@/lib/planLimits';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await (supabase.auth as any).getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── Tier Enforcement ────────────────────────────────────
        const plan = await getUserPlan(user.id);
        const { allowed, remaining } = await checkLimit(user.id, 'story', plan);

        if (!allowed) {
            return NextResponse.json({
                error: 'limit_reached',
                plan,
                remaining: 0,
                upgrade_url: '/pricing',
            }, { status: 403 });
        }

        const body = await req.json();
        const { language_id, topic_category, content_type } = body;

        // 0. Resolve language code to UUID if needed
        let languageUuid = language_id;
        if (language_id && language_id.length <= 3) {
            const { data: langData, error: langError } = await supabase
                .from('languages')
                .select('id')
                .eq('code', language_id)
                .single();
            
            if (langError || !langData) {
                console.error('[stories/generate] Language resolution failed:', langError);
                return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
            }
            languageUuid = langData.id;
        }

        if (!language_id || !topic_category || !content_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user's level
        const { data: userLang } = await (supabase as any)
            .from('user_languages')
            .select('current_level')
            .eq('user_id', user.id)
            .eq('language_id', languageUuid)
            .single();
        const level = userLang?.current_level || 'B1';

        // Pick a random topic from the category
        const topic = body.topic || getRandomTopic(topic_category);

        const result = await getStory(
            user.id, languageUuid, level,
            topic, topic_category, content_type
        );

        // ── Record Usage ────────────────────────────────────────
        await recordUsage(user.id, 'story');

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
