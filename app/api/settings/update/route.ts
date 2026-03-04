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
        const { daily_goal_minutes, notification_enabled, preferred_content_types } = body;

        const updates: any = {};
        if (daily_goal_minutes !== undefined) updates.daily_goal_minutes = daily_goal_minutes;
        if (notification_enabled !== undefined) updates.notification_enabled = notification_enabled;
        if (preferred_content_types !== undefined) updates.preferred_content_types = preferred_content_types;

        // Verify if a setting row exists via Upsert using on_conflict
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error('Error updating user settings:', error);
            return NextResponse.json({ error: 'Failed to update user settings' }, { status: 500 });
        }

        return NextResponse.json({ success: true, settings: data });

    } catch (error) {
        console.error('API Error /settings/update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
