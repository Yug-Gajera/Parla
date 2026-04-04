import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function cleanup() {
    console.log('🧹 Deduplicating podcast shows...');
    
    // 1. Get all shows
    const { data: shows } = await supabase.from('podcast_shows').select('id, name, created_at').order('created_at', { ascending: false });
    
    if (!shows) return;

    const seen = new Set();
    const toDelete = [];

    for (const show of shows) {
        if (seen.has(show.name)) {
            toDelete.push(show.id);
        } else {
            seen.add(show.name);
        }
    }

    if (toDelete.length > 0) {
        console.log(`🗑️ Deleting ${toDelete.length} duplicate shows...`);
        const { error } = await supabase.from('podcast_shows').delete().in('id', toDelete);
        if (error) console.error('Delete error:', error.message);
        else console.log('✅ Duplicates removed.');
    }

    // 2. Reactivate all current shows
    console.log('🚀 Reactivating all shows...');
    await supabase.from('podcast_shows').update({ is_active: true }).neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ All shows reactivated.');
}

cleanup();
