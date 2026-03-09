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
        const { full_name, native_language, avatar_url } = body;

        const updates: any = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (native_language !== undefined) updates.native_language = native_language;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;

        // Perform update on users table
        const { data, error } = await (supabase
            .from('users') as any)
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating user profile:', error);
            return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: data });

    } catch (error) {
        console.error('API Error /profile/update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
