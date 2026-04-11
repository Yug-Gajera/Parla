export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: userData, error } = await supabase
            .from('users')
            .select('has_seen_tour')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching tour status:', error);
            return NextResponse.json({ error: 'Failed to fetch tour status' }, { status: 500 });
        }

        return NextResponse.json({ has_seen_tour: userData?.has_seen_tour ?? false });

    } catch (error) {
        console.error('API Error /tour/status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { has_seen_tour } = body;

        if (typeof has_seen_tour !== 'boolean') {
            return NextResponse.json({ error: 'has_seen_tour must be a boolean' }, { status: 400 });
        }

        const { error } = await supabase
            .from('users')
            .update({ has_seen_tour })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating tour status:', error);
            return NextResponse.json({ error: 'Failed to update tour status' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('API Error /tour/status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}