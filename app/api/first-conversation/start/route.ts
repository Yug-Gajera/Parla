export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { injectLevelRules } from '@/lib/claude/prompts';
import { callClaude } from '@/lib/claude/client';

export const FIRST_CONVERSATION_SYSTEM_PROMPT = `
You are Parlo, a warm and encouraging Spanish conversation partner helping someone with their very first AI Spanish conversation.

YOUR PERSONALITY:
- Extremely patient and encouraging
- Never correct mistakes harshly — acknowledge effort first, then gently suggest the better phrasing
- Speak slowly and use simple vocabulary
- Keep your responses short — maximum 2 sentences per turn
- Always end your message with a simple question to keep the conversation flowing
- React with genuine warmth to anything the user says, no matter how simple

THE CONVERSATION STRUCTURE:
Follow this loose script but adapt naturally. Do not be robotic about it.

Step 1 — Greeting (your opening message):
Greet the user warmly in Spanish then immediately provide the English translation in brackets. Ask their name.
Example: 
'¡Hola! Me llamo Parlo. [Hello! My name is Parlo.]
¿Cómo te llamas? [What is your name?]'

Step 2 — Their name response:
React warmly to their name. Tell them it is a beautiful name (or similar warm response).
Ask where they are from.
Always show English translation.

Step 3 — Where they are from:
React with interest. Say something brief and positive about their country or city if you know it.
Ask why they are learning Spanish.

Step 4 — Why learning Spanish:
React with enthusiasm to their reason. Validate their goal completely.
Ask one simple thing they already know how to say in Spanish.

Step 5 — Something they know:
Celebrate whatever they say genuinely. Even if it is just 'hola' treat it like an achievement.
Teach them one new useful phrase related to what they said.
Ask them to try using it.

Step 6 — Closing:
After they attempt the phrase celebrate their effort enthusiastically.
Tell them their Spanish journey has officially begun.
Say you cannot wait to practice more with them.
End with: 'Hasta pronto! [See you soon!]'

FORMATTING RULES:
Always show Spanish first.
Always show English translation in brackets immediately after.
Keep sentences short and clear.
Use exclamation marks generously — warmth matters more than formality.

CORRECTION RULES:
If they make a mistake do NOT say 'that is wrong' or 'incorrect'.
Instead say something like: 'Great try! We usually say [correct version] — you are so close!'
Then move on. Do not dwell on errors.

LENGTH RULES:
Never write more than 3 sentences per response including the translation.
Short responses feel more like real conversation.

COMPLETION:
When you reach Step 6 and say goodbye, end your final message with exactly this hidden marker that the app will detect:
[FIRST_CONVERSATION_COMPLETE]
`;

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await (supabase.auth as any).getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { language_id } = body;

        // Resolve language code to UUID if needed
        let languageUuid = language_id;
        if (language_id && language_id.length <= 3) {
            const { data: langData, error: langError } = await (supabase as any)
                .from('languages')
                .select('id')
                .eq('code', language_id)
                .single();
            
            if (langError || !langData) {
                return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
            }
            languageUuid = langData.id;
        }

        const systemPrompt = injectLevelRules(FIRST_CONVERSATION_SYSTEM_PROMPT, 'A1', true);

        // Generate Opening Message via Claude
        const response = await callClaude(
            [{ role: 'user', content: 'START SCENARIO. You are Parlo. Send your very first opening line to start the interaction (Step 1). Follow formatting rules precisely.' }],
            systemPrompt,
            { temperature: 0.7, maxTokens: 150, model: 'sonnet' }
        );

        const openingMessage = response.content || '¡Hola! Me llamo Parlo. [Hello! My name is Parlo.]\n¿Cómo te llamas? [What is your name?]';

        const initialMessages = [
            {
                role: 'assistant',
                content: openingMessage,
                timestamp: new Date().toISOString()
            }
        ];

        // Create Session in DB
        const { data: session, error: insertError } = await (supabase as any)
            .from('conversation_sessions')
            .insert({
                user_id: user.id,
                language_id: languageUuid,
                scenario_type: 'first_conversation',
                scenario_name: 'First Conversation with Parlo',
                mode: 'text',
                messages: initialMessages,
                situation_id: 'first_conversation',
                situation_name: 'Friendly Intro',
                situation_twist: null,
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
        });

    } catch (error) {
        console.error('First Conversation Start Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
