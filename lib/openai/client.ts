import OpenAI from 'openai';
import { env } from '@/lib/utils/env';

// Singleton instance
const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

/**
 * Helper to call ChatGPT and get a complete string response.
 * Uses gpt-4o-mini by default since it is fast and cheap for onboarding tasks.
 */
export async function callChatGPT(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    systemPrompt: string,
    options: {
        temperature?: number;
        maxTokens?: number;
        model?: string;
    } = {}
) {
    const {
        temperature = 0.7,
        maxTokens = 2000,
        model = 'gpt-4o-mini',
    } = options;

    try {
        const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...messages,
        ];

        const response = await openai.chat.completions.create({
            model,
            messages: formattedMessages,
            temperature,
            max_tokens: maxTokens,
        });

        const content = response.choices[0]?.message?.content || '';

        return {
            content,
            usage: response.usage,
        };
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to communicate with OpenAI');
    }
}
