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
            return new Response('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const {
            session_id, user_message, conversation_history, scenario_id, level,
            transcription_confidence, low_confidence_words, used_whisper, recording_duration
        } = body;

        if (!session_id || !user_message || !scenario_id) {
            return new Response('Missing required fields', { status: 400 });
        }

        // Validate session belongs to user
        const { data: session, error: sessionFetchError } = await (supabase as any)
            .from('conversation_sessions')
            .select('id, messages, situation_id, situation_name, situation_twist')
            .eq('id', session_id)
            .eq('user_id', user.id)
            .single();

        if (sessionFetchError || !session) {
            return new Response('Session not found', { status: 404 });
        }

        const scenario = SCENARIOS.find(s => s.id === scenario_id);
        // Find the situation modifier for this session
        const situation = scenario?.situations?.find((s: { id: string }) => s.id === session.situation_id);
        const situationModifier = situation?.modifier || 'Continue the conversation naturally.';
        const difficultyNote = (situation?.difficulty_modifier || 0) > 0
            ? 'This is a more challenging variation — be realistic and do not make it too easy for the user.'
            : '';

        const systemPrompt = CONVERSATION_SYSTEM_PROMPT
            .replace('{CONTEXT}', scenario?.base_context || '')
            .replace('{SITUATION}', situationModifier)
            .replace('{GOAL}', scenario?.goal || '')
            .replace('{LEVEL}', level || 'A2')
            .replace('{DIFFICULTY_NOTE}', difficultyNote);

        // Construct standard OpenAI message array
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            // Add prior history. Format should ideally omit the timestamp for the API.
            ...conversation_history.map((m: any) => ({
                role: m.role,
                content: m.content
            })),
            { role: 'user', content: user_message }
        ];

        // Update local session immediately with the user's message
        const updatedMessagesLocal = [
            ...(session.messages || []),
            { role: 'user', content: user_message, timestamp: new Date().toISOString() }
        ];

        // Create a ReadableStream to stream the OpenAI response chunks back to the client
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const oaiStream = await openai.chat.completions.create({
                        model: 'gpt-4o',
                        messages: apiMessages as any,
                        temperature: 0.7,
                        max_tokens: 300,
                        stream: true,
                    });

                    let fullAiResponse = '';

                    for await (const chunk of oaiStream) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            fullAiResponse += content;
                            controller.enqueue(new TextEncoder().encode(content));
                        }
                    }

                    // After streaming finishes, save both messages to the DB
                    updatedMessagesLocal.push({
                        role: 'assistant',
                        content: fullAiResponse,
                        timestamp: new Date().toISOString()
                    });

                    await (supabase as any)
                        .from('conversation_sessions')
                        .update({
                            messages: updatedMessagesLocal,
                        })
                        .eq('id', session_id);

                } catch (streamErr) {
                    console.error('Streaming error', streamErr);
                    controller.error(streamErr);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/event-stream' }
        });

    } catch (error) {
        console.error('Conversation Message Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
