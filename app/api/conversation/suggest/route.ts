export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { session_id, conversation_history, level } = body;

        if (!session_id || !conversation_history) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const formattedHistory = conversation_history.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const systemPrompt = `You are a helpful language tutor. Based on the conversation history below, provide 3 suggested replies for the user to say next in Spanish. The replies should be at a ${level || 'beginner'} Spanish level. They cover different intents (e.g. agreeing, asking a related question, expanding). Keep them natural and conversational.

Return ONLY a JSON array of 3 objects, evaluating the current context.
Format:
[
  {
    "spanish": "Spanish reply here",
    "english": "English translation here",
    "phonetic": "sounds like: MAY YA-mo..."
  }
]

Conversation:
${formattedHistory}`;

        const rawResult = await callClaude(
            [{ role: 'user', content: "Generate suggested replies." }],
            systemPrompt,
            { temperature: 0.7, maxTokens: 400, model: 'haiku' }
        );
        const rawContent = rawResult.content;

        let parsed = [];
        try {
            parsed = JSON.parse(rawContent.substring(rawContent.indexOf('['), rawContent.lastIndexOf(']') + 1));
        } catch (e) {
            console.error('Failed to parse suggestions JSON', rawContent);
            return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
        }

        return NextResponse.json({ success: true, suggestions: parsed });

    } catch (e) {
        console.error('Suggest API Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
