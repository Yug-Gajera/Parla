export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await (supabase.auth as any).getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Mark user as having completed first conversation via skip
        await (supabase as any)
            .from('users')
            .update({
                has_completed_first_conversation: true,
                first_conversation_completed_at: new Date().toISOString()
            })
            .eq('id', user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('First Conversation Skip Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
