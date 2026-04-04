// ============================================================
// Parlova — Article Fetch Job (Cost-Optimized)
// ============================================================

import { fetchAllNewArticles } from './rss-fetcher';
import { processArticleBatch } from './article-processor';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const DAILY_CAP = 10;

function getServiceClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export interface FetchJobResult {
    alreadyRanToday: boolean;
    fetched: number;
    skippedDuplicates: number;
    skippedFilter: number;
    processed: number;
    failed: number;
    skippedCap: number;
    totalTokens: number;
    estimatedCost: number;
    durationMs: number;
}

/**
 * Main daily fetch job.
 * Checks daily log, fetches new articles, processes through Haiku,
 * respects the 20-article daily cap.
 */
export async function runArticleFetchJob(): Promise<FetchJobResult> {
    const startTime = Date.now();
    const supabase = getServiceClient();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`[FetchJob] Starting for ${today}...`);

    // ── Step 1: Check / create daily log ──
    let { data: log } = await supabase
        .from('daily_fetch_log')
        .select('*')
        .eq('date', today)
        .single();

    if (log && log.articles_processed >= DAILY_CAP) {
        console.log(`[FetchJob] Already ran today and hit cap (${log.articles_processed}/${DAILY_CAP}). Skipping.`);
        return {
            alreadyRanToday: true, fetched: 0, skippedDuplicates: 0,
            skippedFilter: 0, processed: log.articles_processed,
            failed: 0, skippedCap: 0, totalTokens: log.total_tokens_used || 0,
            estimatedCost: Number(log.estimated_cost_usd || 0),
            durationMs: Date.now() - startTime,
        };
    }

    if (!log) {
        const { data: newLog } = await supabase
            .from('daily_fetch_log')
            .insert({ date: today })
            .select()
            .single();
        log = newLog;
    }

    // ── Step 2: Fetch new articles ──
    const { newArticles, totalFetched, skippedDuplicates } = await fetchAllNewArticles();

    await supabase
        .from('daily_fetch_log')
        .update({
            articles_fetched: totalFetched,
            articles_skipped_duplicate: skippedDuplicates,
        })
        .eq('date', today);

    if (newArticles.length === 0) {
        console.log('[FetchJob] No new articles to process.');
        await supabase
            .from('daily_fetch_log')
            .update({ completed_at: new Date().toISOString() })
            .eq('date', today);

        return {
            alreadyRanToday: false, fetched: totalFetched,
            skippedDuplicates, skippedFilter: 0, processed: 0,
            failed: 0, skippedCap: 0, totalTokens: 0,
            estimatedCost: 0, durationMs: Date.now() - startTime,
        };
    }

    // ── Step 3: Get Spanish language ID ──
    const { data: language } = await supabase
        .from('languages')
        .select('id')
        .eq('code', 'es')
        .single();

    if (!language?.id) {
        console.error('[FetchJob] Spanish language not found in DB');
        return {
            alreadyRanToday: false, fetched: totalFetched,
            skippedDuplicates, skippedFilter: 0, processed: 0,
            failed: newArticles.length, skippedCap: 0,
            totalTokens: 0, estimatedCost: 0,
            durationMs: Date.now() - startTime,
        };
    }

    const languageId = language.id;

    // ── Step 4: Process through Claude Haiku ──
    const currentProcessed = log?.articles_processed || 0;
    const { results, totalInputTokens, totalOutputTokens, totalCost, processedCount, skippedCap } =
        await processArticleBatch(newArticles, languageId, currentProcessed, DAILY_CAP);

    // ── Step 5: Insert processed articles into DB ──
    let inserted = 0;
    let failed = 0;

    for (const result of results) {
        if (!result.article) {
            failed++;
            continue;
        }

        const { error } = await supabase.from('articles').insert({
            language_id: languageId,
            source_name: result.article.source_name,
            source_url: result.article.source_url,
            original_url: result.article.original_url,
            title: result.article.title,
            summary: result.article.summary,
            content: result.article.content,
            word_count: result.article.word_count,
            cefr_level: result.article.cefr_level,
            level_score: result.article.level_score,
            topics: result.article.topics,
            vocabulary_items: result.article.vocabulary_items,
            comprehension_questions: result.article.comprehension_questions,
            published_at: result.article.published_at,
            image_url: result.article.image_url,
            estimated_read_minutes: result.article.estimated_read_minutes,
            processed: true,
        });

        if (error) {
            if (error.code === '23505') continue; // duplicate — skip silently
            console.error(`[FetchJob] Insert failed: ${result.article.title}`, error);
            failed++;
        } else {
            inserted++;
        }
    }

    // ── Step 6: Update daily log ──
    const totalTokens = totalInputTokens + totalOutputTokens;
    await supabase
        .from('daily_fetch_log')
        .update({
            articles_processed: (log?.articles_processed || 0) + inserted,
            articles_failed: (log?.articles_failed || 0) + failed,
            total_tokens_used: (log?.total_tokens_used || 0) + totalTokens,
            estimated_cost_usd: Number(log?.estimated_cost_usd || 0) + totalCost,
            completed_at: new Date().toISOString(),
        })
        .eq('date', today);

    const durationMs = Date.now() - startTime;
    console.log(
        `[FetchJob] Complete: ${inserted} processed, ${skippedDuplicates} dup skipped, ` +
        `${failed} failed, ${skippedCap} cap skipped. ` +
        `Tokens: ${totalTokens}. Cost: $${totalCost.toFixed(4)}. ` +
        `Duration: ${Math.round(durationMs / 1000)}s`
    );

    return {
        alreadyRanToday: false, fetched: totalFetched,
        skippedDuplicates, skippedFilter: 0,
        processed: inserted, failed,
        skippedCap, totalTokens,
        estimatedCost: totalCost,
        durationMs,
    };
}
