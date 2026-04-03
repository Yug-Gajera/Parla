export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getServiceClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: Request) {
    try {
        // Auth check via cookie-based client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scenarioOrder } = await req.json();

        if (!scenarioOrder || typeof scenarioOrder !== 'number') {
            return NextResponse.json({ error: 'Invalid scenario order' }, { status: 400 });
        }

        // Use service role client to bypass RLS for the update
        const serviceClient = getServiceClient();

        // Fetch current completed count
        const { data, error: fetchError } = await serviceClient
            .from('users')
            .select('guided_scenarios_completed')
            .eq('id', user.id)
            .single();

        if (fetchError) {
            console.error('Failed to fetch guided_scenarios_completed:', fetchError);
            return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
        }

        const currentCompleted = data?.guided_scenarios_completed || 0;

        // Only update if this is a new completion
        if (scenarioOrder > currentCompleted) {
            const { error: updateError } = await serviceClient
                .from('users')
                .update({ guided_scenarios_completed: scenarioOrder })
                .eq('id', user.id);

            if (updateError) {
                console.error('Failed to update guided_scenarios_completed:', updateError);
                return NextResponse.json({ error: 'Update failed', details: updateError.message }, { status: 500 });
            }
        }

        return NextResponse.json({
            success: true,
            guided_scenarios_completed: Math.max(scenarioOrder, currentCompleted)
        });

    } catch (error) {
        console.error('Guided completion error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
