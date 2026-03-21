export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

interface IncomingWord {
    spanish: string;
    english: string;
    interval?: number;
    familiarity?: number;
    cefr_level?: string;
    part_of_speech?: string;
    example_sentence?: string;
}

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
        const { words, importSource, languageId = 'es', enrichedCount = 0 } = body;

        if (!words || !Array.isArray(words) || words.length === 0) {
            return NextResponse.json({ error: 'No words provided' }, { status: 400 });
        }

        // Deduplicate incoming array by Spanish word (lowercase, trimmed)
        const uniqueWordsMap = new Map<string, IncomingWord>();
        for (const w of words) {
            const cleanSp = w.spanish?.trim().toLowerCase() || '';
            if (cleanSp && !uniqueWordsMap.has(cleanSp)) {
                uniqueWordsMap.set(cleanSp, w);
            }
        }
        
        const uniqueWords = Array.from(uniqueWordsMap.values());
        const spanishStrings = uniqueWords.map(w => w.spanish.trim().toLowerCase());

        const serviceClient = getServiceClient();

        // 0. Resolve language code to UUID if needed
        let languageUuid = languageId;
        if (languageId.length <= 3) {
            const { data: langData, error: langError } = await serviceClient
                .from('languages')
                .select('id')
                .eq('code', languageId)
                .single();
            
            if (langError || !langData) {
                console.error('Language resolution failed:', langError);
                return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
            }
            languageUuid = langData.id;
        }

        // 1. Fetch currently existing global words
        const { data: existingGlobalWords } = await serviceClient
            .from('vocabulary_words')
            .select('id, word')
            .eq('language_id', languageUuid)
            .in('word', spanishStrings);

        const globalWordMap = new Map<string, string>();
        if (existingGlobalWords) {
            for (const row of existingGlobalWords) {
                globalWordMap.set(row.word.toLowerCase(), row.id);
            }
        }

        // 2. Identify missing words to insert globally
        const wordsToInsertGlobal = [];
        for (const w of uniqueWords) {
            const cleanSp = w.spanish.trim().toLowerCase();
            if (!globalWordMap.has(cleanSp)) {
                wordsToInsertGlobal.push({
                    language_id: languageUuid,
                    word: cleanSp,
                    translation: w.english.trim(),
                    part_of_speech: w.part_of_speech || 'noun',
                    cefr_level: w.cefr_level || 'A1',
                    example_sentence: w.example_sentence || '',
                });
            }
        }

        if (wordsToInsertGlobal.length > 0) {
            const { data: newlyInsertedGlobal, error: insertError } = await serviceClient
                .from('vocabulary_words')
                .insert(wordsToInsertGlobal)
                .select('id, word');
            
            if (insertError) {
                console.error('Global Word Insert Error:', insertError);
                return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
            }

            if (newlyInsertedGlobal) {
                for (const row of newlyInsertedGlobal) {
                    globalWordMap.set(row.word.toLowerCase(), row.id);
                }
            }
        }

        // 3. Fetch existing user_vocabulary to handle skips and updates
        const wordIds = Array.from(globalWordMap.values());
        
        const { data: existingUserVocab } = await serviceClient
            .from('user_vocabulary')
            .select('id, word_id, interval_days')
            .eq('user_id', user.id)
            .in('word_id', wordIds);
            
        const existingUserVocabMap = new Map<string, any>();
        if (existingUserVocab) {
            for (const row of existingUserVocab) {
                existingUserVocabMap.set(row.word_id, row);
            }
        }

        // 4. Prepare records for insertion and updates
        const recordsToInsert = [];
        const recordsToUpdate = [];
        let skippedCount = 0;
        let updatedCount = 0;

        for (const w of uniqueWords) {
            const cleanSp = w.spanish.trim().toLowerCase();
            const wordId = globalWordMap.get(cleanSp);
            if (!wordId) continue;

            let familiarity = w.familiarity || 2;
            let status = 'new';
            let mappedInterval = w.interval || 1;
            
            if (w.interval !== undefined && w.interval !== null) {
                if (w.interval > 21) {
                    familiarity = 5;
                    status = 'learned';
                }
                else if (w.interval >= 7) {
                    familiarity = 3;
                    status = 'learning';
                }
                else {
                    familiarity = 1;
                    status = 'learning';
                }
                mappedInterval = w.interval;
            }

            const existingRow = existingUserVocabMap.get(wordId);

            if (existingRow) {
                // Word is already in user's deck
                // Check if Anki import and interval is strictly greater than current interval_days
                if (importSource === 'anki_import' && mappedInterval > (existingRow.interval_days || 0)) {
                    recordsToUpdate.push({
                        id: existingRow.id,
                        status: status,
                        interval_days: mappedInterval,
                        anki_interval: mappedInterval,
                        next_review_date: new Date(Date.now() + mappedInterval * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                // New word for the user
                recordsToInsert.push({
                    user_id: user.id,
                    word_id: wordId,
                    status: status,
                    interval_days: mappedInterval,
                    added_at: new Date().toISOString(),
                    next_review_date: new Date(Date.now() + mappedInterval * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    import_source: importSource || 'manual',
                    anki_interval: w.interval || null,
                    is_frequency_seeded: false,
                    imported_at: new Date().toISOString()
                });
            }
        }

        let insertedCount = 0;

        // 5. Execute Updates
        if (recordsToUpdate.length > 0) {
            for (const updateData of recordsToUpdate) {
                await serviceClient
                    .from('user_vocabulary')
                    .update({
                        status: updateData.status,
                        interval_days: updateData.interval_days,
                        anki_interval: updateData.anki_interval,
                        next_review_date: updateData.next_review_date
                    })
                    .eq('id', updateData.id);
            }
        }

        // 6. Execute Inserts
        if (recordsToInsert.length > 0) {
            const { data: insertedUserVocab, error: userVocabError } = await serviceClient
                .from('user_vocabulary')
                .upsert(recordsToInsert, { onConflict: 'user_id, word_id', ignoreDuplicates: true })
                .select('id');

            if (userVocabError) {
                console.error('User Vocabulary Insert Error:', userVocabError);
                return NextResponse.json({ error: 'Failed to bind vocabulary to user deck' }, { status: 500 });
            }
            insertedCount = insertedUserVocab?.length || 0;
        }

        // Determine estimated CEFR from the imported distribution
        const levelCounts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
        for (const w of uniqueWords) {
            const lvl = w.cefr_level?.toUpperCase();
            if (lvl && levelCounts[lvl] !== undefined) {
                levelCounts[lvl]++;
            }
        }

        let estimatedLevel = 'A1';
        const total = uniqueWords.length;
        
        const levelsRev = ['C2', 'C1', 'B2', 'B1', 'A2', 'A1'];
        for (const lvl of levelsRev) {
            const pct = levelCounts[lvl] / total;
            if (pct >= 0.05) {
                estimatedLevel = lvl;
                break;
            }
        }

        const wordsWithIntervals = recordsToInsert.filter((r: any) => r.anki_interval !== null).length;
        const highConfidence = wordsWithIntervals >= 500;

        // Update User Profile
        const { error: profileError } = await serviceClient
            .from('users')
            .update({
                vocabulary_import_method: importSource,
                vocabulary_import_count: (insertedCount + updatedCount),
                estimated_level_from_import: estimatedLevel,
                last_vocabulary_import: new Date().toISOString()
            })
            .eq('id', user.id);

        if (profileError) {
             console.error('Profile update failed:', profileError);
        }

        return NextResponse.json({
            success: true,
            imported_count: insertedCount, // added
            skipped_count: skippedCount,
            updated_count: updatedCount,
            enriched_count: enrichedCount,
            estimated_level: estimatedLevel,
            high_confidence: highConfidence
        });

    } catch (error) {
        console.error('Import Batch Exception:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
