export const dynamic = "force-dynamic";
import { createClient } from '@/lib/supabase/server';
import { streamClaude } from '@/lib/claude/client';
import { FIRST_CONVERSATION_SYSTEM_PROMPT } from '../start/route';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await (supabase.auth as any).getUser();

        if (authError || !user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { session_id, user_message, conversation_history } = body;

        if (!session_id || !user_message) {
            return new Response('Missing required fields', { status: 400 });
        }

        // Validate session belongs to user
        const { data: session, error: sessionFetchError } = await (supabase as any)
            .from('conversation_sessions')
            .select('id, messages')
            .eq('id', session_id)
            .eq('user_id', user.id)
            .single();

        if (sessionFetchError || !session) {
            return new Response('Session not found', { status: 404 });
        }

        // Build Claude message array
        const apiMessages = [
            ...conversation_history.map((m: any) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            })),
            { role: 'user' as const, content: user_message }
        ];

        // Update local session with user's message
        const updatedMessagesLocal = [
            ...(session.messages || []),
            { role: 'user', content: user_message, timestamp: new Date().toISOString() }
        ];

        // Create a ReadableStream to stream Claude response chunks
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const claudeStream = await streamClaude(
                        apiMessages,
                        FIRST_CONVERSATION_SYSTEM_PROMPT,
                        { temperature: 0.7, maxTokens: 300, model: 'sonnet' }
                    );

                    let fullAiResponse = '';

                    claudeStream.on('text', (text) => {
                        fullAiResponse += text;
                        controller.enqueue(new TextEncoder().encode(text));
                    });

                    // Wait for the stream to finish
                    await claudeStream.finalMessage();

                    // Save both messages to DB
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
        console.error('First Conversation Message Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
