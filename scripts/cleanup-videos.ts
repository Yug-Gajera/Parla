import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
    console.log('🧹 Cleaning up failed/restricted video records...');
    
    // Delete videos that were not successfully processed (missing transcripts)
    const { data: deleted, error } = await supabase
        .from('videos')
        .delete()
        .eq('processed', false)
        .select();

    if (error) {
        console.error('Error during cleanup:', error.message);
    } else {
        console.log(`✅ Removed ${deleted?.length || 0} unprocessed video records.`);
    }
}

cleanup();
