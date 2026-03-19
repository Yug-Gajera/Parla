// ============================================================
// Parlova — User Plan & Usage API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, checkLimit, FREE_LIMITS } from '@/lib/planLimits';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const plan = await getUserPlan(user.id);
        
        // Fetch all relevant limits
        const [conv, art, story, lookup] = await Promise.all([
            checkLimit(user.id, 'conversation', plan),
            checkLimit(user.id, 'article', plan),
            checkLimit(user.id, 'story', plan),
            checkLimit(user.id, 'word_lookup', plan),
        ]);

        return NextResponse.json({
            plan,
            limits: {
                conversation: conv,
                article: art,
                story: story,
                word_lookup: lookup,
            },
            free_limits: FREE_LIMITS
        });

    } catch (error) {
        console.error('[api/user/plan] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
