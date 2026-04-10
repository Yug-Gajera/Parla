export const dynamic = "force-dynamic";
// ============================================================
// Parlova — Story Generate API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStory } from '@/lib/stories/story-generator';
import { getRandomTopic } from '@/lib/data/story-topics';

import { getUserPlan, checkLimit, recordUsage as recordPlanUsage } from '@/lib/planLimits';
import { checkRateLimit, recordUsage as recordRateUsage } from '@/lib/rateLimits';

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
        const rateLimit = await checkRateLimit(
            user.id,
            user.email || '',
            plan as 'free' | 'pro' | 'pro_plus',
            'story'
        );
        if (!rateLimit.allowed) {
            return NextResponse.json({
                error: 'daily_rate_limit_reached',
                plan,
                rateLimit,
                upgrade_url: '/pricing',
            }, { status: 429 });
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
            languageUuid = (langData as any).id;
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
        await recordPlanUsage(user.id, 'story');
        await recordRateUsage(user.id, 'story');
        const nextCurrent = rateLimit.current + 1;
        const nextRemaining = Math.max(0, rateLimit.limit - nextCurrent);
        const isWarning =
            nextCurrent >= Math.floor(rateLimit.limit * 0.8) &&
            nextCurrent < rateLimit.limit;

        return NextResponse.json({
            story: result.story,
            was_generated: result.wasGenerated,
            daily_generations_remaining: Math.min(result.dailyRemaining, nextRemaining),
            rateLimit: {
                current: nextCurrent,
                limit: rateLimit.limit,
                remaining: nextRemaining,
                isWarning,
                resetAt: rateLimit.resetAt,
                operation: 'story',
            },
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
