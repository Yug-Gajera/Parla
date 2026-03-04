// ============================================================
// FluentLoop — Article Processor (Claude Haiku — Cost-Optimized)
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { ARTICLE_ANALYSIS_PROMPT } from '@/lib/claude/prompts';
import { RawArticle } from './rss-fetcher';

// Use Haiku — roughly 10x cheaper than Sonnet
const HAIKU_MODEL = 'claude-haiku-4-5-20241022';

// Haiku pricing per token
const HAIKU_INPUT_COST = 0.00000025;   // $0.25 per 1M input tokens
const HAIKU_OUTPUT_COST = 0.00000125;  // $1.25 per 1M output tokens

export interface ProcessedArticle {
    title: string;
    original_url: string;
    content: string;
    summary: string;
    word_count: number;
    published_at: string | null;
    image_url: string | null;
    source_name: string;
    source_url: string;
    cefr_level: string;
    level_score: number;
    topics: string[];
    vocabulary_items: unknown[];
    comprehension_questions: unknown[];
    estimated_read_minutes: number;
}

export interface ProcessResult {
    article: ProcessedArticle | null;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    error?: string;
}

/**
 * Process a single article through Claude Haiku.
 * max_tokens capped at 800 to prevent runaway output costs.
 */
export async function processArticle(
    raw: RawArticle,
    _languageId: string
): Promise<ProcessResult> {
    try {
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const userMessage = `Title: ${raw.title}\n\nContent: ${raw.content}`;

        const response = await anthropic.messages.create({
            model: HAIKU_MODEL,
            max_tokens: 800,
            system: ARTICLE_ANALYSIS_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
        });

        const inputTokens = response.usage?.input_tokens || 0;
        const outputTokens = response.usage?.output_tokens || 0;
        const cost = (inputTokens * HAIKU_INPUT_COST) + (outputTokens * HAIKU_OUTPUT_COST);

        // Extract text from response
        const textBlock = response.content.find(b => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            return { article: null, inputTokens, outputTokens, cost, error: 'No text in response' };
        }

        // Parse JSON — if it fails, skip this article, don't crash the job
        let analysis;
        try {
            analysis = JSON.parse(textBlock.text);
        } catch {
            console.error(`[Processor] JSON parse failed for: ${raw.title}`);
            console.error(`[Processor] Raw response: ${textBlock.text.slice(0, 200)}`);
            return { article: null, inputTokens, outputTokens, cost, error: 'JSON parse failed' };
        }

        const processed: ProcessedArticle = {
            title: raw.title,
            original_url: raw.original_url,
            content: raw.content,
            summary: analysis.summary || raw.summary,
            word_count: raw.word_count,
            published_at: raw.published_at,
            image_url: raw.image_url,
            source_name: raw.source_name,
            source_url: raw.source_url,
            cefr_level: analysis.cefr_level || 'B1',
            level_score: analysis.level_score || 50,
            topics: analysis.topics || [],
            vocabulary_items: (analysis.vocabulary_items || []).slice(0, 6),
            comprehension_questions: (analysis.comprehension_questions || []).slice(0, 3),
            estimated_read_minutes: analysis.estimated_read_minutes || Math.ceil(raw.word_count / 150),
        };

        return { article: processed, inputTokens, outputTokens, cost };
    } catch (err) {
        console.error(`[Processor] Error processing: ${raw.title}`, err);
        return { article: null, inputTokens: 0, outputTokens: 0, cost: 0, error: String(err) };
    }
}

/**
 * Process articles ONE AT A TIME with 500ms delay between calls.
 * Stops immediately if daily cap (20) is reached.
 */
export async function processArticleBatch(
    rawArticles: RawArticle[],
    languageId: string,
    currentProcessed: number,
    dailyCap: number = 20
): Promise<{
    results: ProcessResult[];
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    processedCount: number;
    skippedCap: number;
}> {
    const results: ProcessResult[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;
    let processedCount = 0;
    let skippedCap = 0;

    for (let i = 0; i < rawArticles.length; i++) {
        // Hard daily cap check
        if (currentProcessed + processedCount >= dailyCap) {
            skippedCap = rawArticles.length - i;
            console.log(`[Processor] Daily cap reached (${dailyCap}). Skipping ${skippedCap} remaining articles.`);
            break;
        }

        const result = await processArticle(rawArticles[i], languageId);
        results.push(result);

        totalInputTokens += result.inputTokens;
        totalOutputTokens += result.outputTokens;
        totalCost += result.cost;

        if (result.article) {
            processedCount++;
        }

        // 500ms delay between Claude calls (rate limit safety)
        if (i < rawArticles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    console.log(`[Processor] Batch done: ${processedCount} processed, ${totalInputTokens + totalOutputTokens} total tokens, $${totalCost.toFixed(4)} estimated cost`);

    return { results, totalInputTokens, totalOutputTokens, totalCost, processedCount, skippedCap };
}
