// ============================================================
// Parlova — Single Story API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const storyId = params.id;

        const { data: story, error } = await (supabase as any)
            .from('generated_stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (error || !story) {
            return NextResponse.json({ error: 'Story not found' }, { status: 404 });
        }

        // Get user progress
        const { data: progress } = await (supabase as any)
            .from('user_story_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('story_id', storyId)
            .single();

        return NextResponse.json({
            story,
            user_progress: progress || null,
        });
    } catch (error) {
        console.error('[stories/id] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
