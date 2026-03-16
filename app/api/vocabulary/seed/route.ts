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
        const { tierId, languageId = 'es', preview = false } = body;

        let wordLimit = 0;
        switch (tierId) {
            case 'A1': wordLimit = 300; break;
            case 'A2': wordLimit = 800; break;
            case 'B1': wordLimit = 2000; break;
            case 'B2': wordLimit = 4000; break;
            case 'C1': 
            case 'C2': wordLimit = 8000; break;
            default: wordLimit = 300; break;
        }

        const serviceClient = getServiceClient();

        // 1. Fetch top N words by frequency from global dictionary
        const { data: topWords, error: fetchError } = await serviceClient
            .from('vocabulary_words')
            .select('id')
            .eq('language_id', languageId)
            // If the dictionary lacks frequency_rank we just pull by created_at or limit
            // We assume frequency_rank exists and 1 is most frequent
            .order('frequency_rank', { ascending: true, nullsFirst: false })
            .limit(wordLimit);

        if (fetchError || !topWords || topWords.length === 0) {
            console.error('Seed Target Fetch Error:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch frequency dictionary' }, { status: 500 });
        }

        // 2. Fetch existing words in user deck to calculate skipped count
        const wordIds = topWords.map(w => w.id);
        const { data: existingUserVocab } = await serviceClient
            .from('user_vocabulary')
            .select('word_id')
            .eq('user_id', user.id)
            .in('word_id', wordIds);

        const existingSet = new Set(existingUserVocab?.map(row => row.word_id) || []);
        
        const wordsToSeed = topWords.filter(tw => !existingSet.has(tw.id));
        const skippedCount = existingSet.size;
        const seedCount = wordsToSeed.length;

        // 3. If this is just a preview, return the counts without mutating database
        if (preview) {
             return NextResponse.json({
                 success: true,
                 seeded_count: seedCount,
                 skipped_count: skippedCount,
                 estimated_level: tierId,
                 high_confidence: true
             });
        }

        if (seedCount > 0) {
            const nowIso = new Date().toISOString();

            // 4. Map into user_vocabulary using learning defaults
            const seedRecords = wordsToSeed.map(tw => ({
                user_id: user.id,
                word_id: tw.id,
                status: 'learned',
                ease_factor: 2.8,
                interval_days: 14,             // High familiarity equivalent
                next_review_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                added_at: nowIso,
                import_source: 'frequency_seed',
                is_frequency_seeded: true,
                imported_at: nowIso
            }));

            // 5. Batch upsert to user's SRS deck
            const { error: seedError } = await serviceClient
                .from('user_vocabulary')
                .upsert(seedRecords, { onConflict: 'user_id, word_id', ignoreDuplicates: true });

            if (seedError) {
                console.error('Seed Upsert Error:', seedError);
                return NextResponse.json({ error: 'Database seed failed' }, { status: 500 });
            }
        }

        // 6. Update the user's profile with their import choice
        const { error: profileError } = await serviceClient
            .from('user_profiles')
            .update({
                vocabulary_import_method: 'frequency_seed',
                vocabulary_import_count: seedCount,
                estimated_level_from_import: tierId,
                last_vocabulary_import: new Date().toISOString()
            })
            .eq('id', user.id);

        if (profileError) {
            console.error('Profile update failed:', profileError);
        }

        return NextResponse.json({
            success: true,
            seeded_count: seedCount,
            skipped_count: skippedCount,
            estimated_level: tierId,
            high_confidence: true // Pre-defined frequency bands are highly structured and reliable
        });

    } catch (error) {
        console.error('Seed API Exception:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
