export const dynamic = "force-dynamic";
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, language } = await request.json();

        if (!email || !email.includes('@') || !language) {
            return NextResponse.json(
                { error: 'Valid email and language are required' },
                { status: 400 }
            );
        }

        const allowedLanguages = ['ja', 'zh', 'fr', 'de'];
        if (!allowedLanguages.includes(language)) {
            return NextResponse.json(
                { error: 'Invalid language' },
                { status: 400 }
            );
        }

        // Use service role to bypass RLS (safe — this is a server-side route with validation)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase
            .from('language_waitlist')
            .upsert(
                { email: email.toLowerCase().trim(), language },
                { onConflict: 'email,language' }
            );

        if (error) {
            console.error('Waitlist insert error:', error);
            return NextResponse.json(
                { error: 'Failed to join waitlist' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Waitlist API error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
