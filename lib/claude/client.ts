// ============================================================
// Parlova — Claude AI Client (Haiku + Sonnet)
// ============================================================

import Anthropic from '@anthropic-ai/sdk';

const HAIKU = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-4-20250514';

// Lazy singleton
let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
    if (!_anthropic) {
        _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return _anthropic;
}

export { getClient, HAIKU, SONNET };

interface CallClaudeOptions {
    temperature?: number;
    maxTokens?: number;
    model?: 'haiku' | 'sonnet';
}

/**
 * Non-streaming Claude call. Returns the full text response.
 * Use `model: 'haiku'` for simple tasks (word lookup, module gen).
 * Use `model: 'sonnet'` for complex tasks (diagnostic, conversations, scoring).
 */
export async function callClaude(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string,
    options: CallClaudeOptions = {}
) {
    const {
        temperature = 0.7,
        maxTokens = 2000,
        model = 'sonnet',
    } = options;

    const modelId = model === 'haiku' ? HAIKU : SONNET;

    try {
        const response = await getClient().messages.create({
            model: modelId,
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt,
            messages,
        });

        const textBlock = response.content.find(b => b.type === 'text');
        const content = textBlock && textBlock.type === 'text' ? textBlock.text : '';

        return {
            content,
            usage: response.usage,
        };
    } catch (error) {
        console.error(`Claude API Error (${modelId}):`, error);
        throw new Error(`Failed to communicate with Claude (${model})`);
    }
}

/**
 * Streaming Claude call. Returns an async iterator of text chunks.
 * Used for conversation message streaming.
 */
export async function streamClaude(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string,
    options: Omit<CallClaudeOptions, 'model'> & { model?: 'haiku' | 'sonnet' } = {}
) {
    const {
        temperature = 0.7,
        maxTokens = 300,
        model = 'sonnet',
    } = options;

    const modelId = model === 'haiku' ? HAIKU : SONNET;

    return getClient().messages.stream({
        model: modelId,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages,
    });
}
