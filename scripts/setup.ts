import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setup() {
    console.log('🚀 Starting Parlova Environment Setup...');

    // 1. Verify connection
    const { data: health, error: healthError } = await supabase.from('languages').select('count', { count: 'exact', head: true });
    if (healthError) {
        console.error('❌ Failed to connect to Supabase or tables not found:', healthError.message);
        console.log('💡 Tip: Ensure you have run the migrations in Supabase SQL Editor first.');
        process.exit(1);
    }
    console.log('✅ Connected to Supabase.');

    // 2. Seed Languages if empty
    const { data: langs } = await supabase.from('languages').select('id');
    if (!langs || langs.length === 0) {
        console.log('🌱 Seeding initial languages...');
        const { error: seedError } = await supabase.from('languages').insert([
            { code: 'es', name: 'Spanish', native_name: 'Español' },
            { code: 'fr', name: 'French', native_name: 'Français' },
            { code: 'de', name: 'German', native_name: 'Deutsch' },
            { code: 'it', name: 'Italian', native_name: 'Italiano' },
            { code: 'pt', name: 'Portuguese', native_name: 'Português' }
        ]);
        if (seedError) console.error('❌ Error seeding languages:', seedError);
        else console.log('✅ Languages seeded.');
    } else {
        console.log('ℹ️ Languages already exist, skipping seed.');
    }

    // 3. Verify other tables
    const tables = ['users', 'user_languages', 'vocabulary_words', 'user_vocabulary', 'study_sessions', 'conversation_sessions', 'level_tests', 'certificates'];
    console.log('🔍 Checking required tables...');
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true }).limit(1);
        if (error) {
            console.warn(`⚠️ Table "${table}" might be missing or inaccessible:`, error.message);
        } else {
            console.log(`  - ${table}: OK`);
        }
    }

    console.log('\n✨ Setup complete! Parlova is ready for development.');
    console.log('👉 Run "npm run dev" to start the application.');
}

setup();
