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

        const { scenarioOrder } = await req.json();

        if (!scenarioOrder || typeof scenarioOrder !== 'number') {
            return NextResponse.json({ error: 'Invalid scenario order' }, { status: 400 });
        }

        // Fetch current completed count
        const { data } = await supabase
            .from('users')
            .select('guided_scenarios_completed')
            .eq('id', user.id)
            .single();

        const currentCompleted = (data as any)?.guided_scenarios_completed || 0;

        // Only update if this is a new completion (prevents going backwards)
        if (scenarioOrder > currentCompleted) {
            const { error: updateError } = await (supabase as any)
                .from('users')
                .update({ guided_scenarios_completed: scenarioOrder })
                .eq('id', user.id);

            if (updateError) {
                console.error('Failed to update guided_scenarios_completed:', updateError);
                return NextResponse.json({ error: 'Update failed' }, { status: 500 });
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
