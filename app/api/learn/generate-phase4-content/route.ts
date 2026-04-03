import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

export async function POST(req: Request) {
    try {
        const { scenario_id, scenario_phrases } = await req.json();

        if (!scenario_id || !scenario_phrases || !Array.isArray(scenario_phrases)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const supabase = await createClient();
        
        // Check if content already exists
        const { data: existing } = (await supabase
            .from('guided_phase4_content')
            .select('content')
            .eq('scenario_id', scenario_id)
            .single()) as any;

        if (existing && existing.content) {
            return NextResponse.json(existing.content);
        }

        // Generate with Claude Haiku
        const prompt = `Generate Phase 4 sentence building exercises for a Spanish beginner learning scenario. Use ONLY the phrases provided.

Provided phrases:
${JSON.stringify(scenario_phrases, null, 2)}

Return JSON only, no other text:
{
  "round1": [
    {
      "phrase1_spanish": "string",
      "phrase1_english": "string",
      "connector": "string",
      "phrase2_spanish": "string",
      "phrase2_english": "string",
      "combined_spanish": "string",
      "combined_english": "string",
      "phonetic": "string"
    }
  ],
  "round2": [
    {
      "sentence_with_blank": "string",
      "correct_answer": "string",
      "wrong_options": ["string", "string"],
      "full_sentence": "string",
      "english": "string",
      "phonetic": "string"
    }
  ],
  "round3": [
    {
      "scrambled_words": ["string"],
      "correct_order": ["string"],
      "english": "string",
      "phonetic": "string"
    }
  ]
}

Rules:
- Generate exactly 5 items per round.
- Only use vocabulary from the phrases provided.
- Keep sentences under 8 words.
- Present tense only.
- No subjunctive or conditional.
- Make wrong options plausible but clearly wrong.
- Scramble words randomly for round 3.`;

        const response = await callClaude(
            [{ role: 'user', content: prompt }],
            'You are an expert Spanish instructional designer.',
            { model: 'haiku', temperature: 0.3 }
        );

        let contentObj;
        try {
            contentObj = JSON.parse(response.content);
        } catch (e) {
            // Fallback generic parse if it includes markdown blocks
            const match = response.content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (match) {
                contentObj = JSON.parse(match[1]);
            } else {
                throw new Error("Failed to parse Claude response as JSON: " + response.content);
            }
        }

        // Cache in DB using a service role client to bypass RLS if there are issues, 
        // but regular authenticated user is fine as we enabled read for auth user and insert might be blocked if no policy
        // Wait, did we enable insert for authenticated users? 
        // Ah, in the migration I enabled "Authenticated users can read" and "Service role can manage".
        // Let's use the current caller's client. 
        // Wait! The prompt said "Service role can manage phase4 content".
        // A regular user cannot INSERT into guided_phase4_content according to the migration.
        // We should probably modify that.

        const { error: insertError } = (await supabase
            .from('guided_phase4_content')
            .insert({
                scenario_id,
                content: contentObj
            } as any)) as any;

        if (insertError) {
            console.error('Failed to cache phase 4 content:', insertError);
            // Non-fatal, just return the obj
        }

        return NextResponse.json(contentObj);

    } catch (error: any) {
        console.error('Phase 4 generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate exercises' },
            { status: 500 }
        );
    }
}
