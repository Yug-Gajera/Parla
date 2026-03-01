import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SCENARIOS } from '@/lib/data/scenarios';
import { CONVERSATION_SYSTEM_PROMPT } from '@/lib/claude/prompts';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { scenario_id, language_id, level } = body;

        const scenario = SCENARIOS.find(s => s.id === scenario_id);
        if (!scenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        // 1. Generate the opening message from Claude using OpenAI
        const systemPrompt = CONVERSATION_SYSTEM_PROMPT
            .replace('{CONTEXT}', scenario.opening_context)
            .replace('{GOAL}', scenario.goal)
            .replace('{LEVEL}', level || 'A2');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o', // Using GPT-4o instead of Claude as per env
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'START SCENARIO. Send your opening actual dialogue now.' }
            ],
            temperature: 0.7,
            max_tokens: 150,
        });

        const openingMessage = completion.choices[0].message.content || 'Hola.';

        const initialMessages = [
            {
                role: 'assistant',
                content: openingMessage,
                timestamp: new Date().toISOString()
            }
        ];

        // 2. Create the session in DB
        const { data: session, error: insertError } = await (supabase as any)
            .from('conversation_sessions')
            .insert({
                user_id: user.id,
                language_id: language_id,
                scenario_type: scenario.id,
                scenario_name: scenario.name,
                mode: 'text',
                messages: initialMessages
            })
            .select()
            .single();

        if (insertError) {
            console.error("DB Insert Error", insertError);
            throw insertError;
        }

        return NextResponse.json({
            success: true,
            session_id: session.id,
            message: openingMessage,
            scenario
        });

    } catch (error) {
        console.error('Conversation Start Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
