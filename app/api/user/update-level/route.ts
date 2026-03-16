export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function getServiceClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await (supabase.auth as any).getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { targetLevel, languageId = 'es' } = body;

        if (!targetLevel) {
             return NextResponse.json({ error: 'Target level is required' }, { status: 400 });
        }

        const serviceClient = getServiceClient();

        // Update the user's specific language profile
        const { error: updateError } = await serviceClient
            .from('user_languages')
            .update({ current_level: targetLevel })
            .eq('user_id', user.id)
            .eq('language_id', languageId);

        if (updateError) {
            console.error('Update Level Error:', updateError);
            return NextResponse.json({ error: 'Failed to update level' }, { status: 500 });
        }

        return NextResponse.json({ success: true, level: targetLevel });

    } catch (error) {
        console.error('Update Level Exception:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
