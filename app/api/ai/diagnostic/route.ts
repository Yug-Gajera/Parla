export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude/client';
import { DiagnosticQuestion } from '@/types';

const DIAGNOSTIC_SYSTEM_PROMPT = `You are a language assessment engine for Parlova, a premium language learning platform.

Your job is to generate ENGAGING, FUN diagnostic questions — NOT boring textbook quizzes. Think of it like a game show host meeting a language test.

You MUST return valid JSON and nothing else — no markdown fencing, no explanation text.

Return a JSON array of {QUESTION_COUNT} question objects. Each object:
{
  "id": "q1",
  "question": "string — make questions fun! Use scenarios, pop culture, real-life situations. E.g. 'You're at a tapas bar and the waiter asks \"¿Qué van a tomar?\" — what's he asking?'",
  "options": ["string", "string", "string", "string"],
  "correct_answer": 0,
  "difficulty_level": "A1",
  "explanation": "string — brief, encouraging explanation",
  "emoji": "🎯"
}

Rules:
- Generate exactly {QUESTION_COUNT} questions.
- "correct_answer" is a 0-based index (0–3).
- "difficulty_level" must be one of: A1, A2, B1, B2, C1, C2.
- Adapt difficulty based on the learner's self-reported level. Include a spread: some below, at, and above their level.
- Make questions SCENARIO-BASED: put learners in real situations (ordering food, asking for directions, texting friends, watching a movie).
- Include funny wrong answers that are plausible but clearly wrong to native speakers.
- Add an "emoji" field with a relevant emoji for each question (makes the UI fun).
- Keep questions progressively harder across the array.
- Test real comprehension — reading context, grammar patterns, idiomatic usage — not just isolated vocabulary.
- Do NOT include any text outside the JSON array.`;

export async function POST(req: Request) {
    try {
        const { selfReportedLevel, languageCode, questionCount = 10 } = await req.json();

        if (!selfReportedLevel || !languageCode) {
            return NextResponse.json(
                { error: 'Missing selfReportedLevel or languageCode' },
                { status: 400 }
            );
        }

        const promptMessage = `The learner wants to learn language code "${languageCode}" and self-reports their level as ${selfReportedLevel} on the CEFR scale. Generate ${questionCount} engaging, scenario-based diagnostic questions that feel like a fun game, not a boring test.`;

        const resolvedSystemPrompt = DIAGNOSTIC_SYSTEM_PROMPT.replace(/{QUESTION_COUNT}/g, questionCount.toString());

        const response = await callClaude(
            [{ role: 'user', content: promptMessage }],
            resolvedSystemPrompt,
            { temperature: 0.8, maxTokens: 3000, model: 'sonnet' }
        );

        let questions: DiagnosticQuestion[] = [];
        try {
            const cleanedContent = response.content.replace(/```json\n?|\n?```/g, '').trim();
            questions = JSON.parse(cleanedContent);

            if (!Array.isArray(questions) || questions.length !== questionCount) {
                throw new Error('Invalid response format or length');
            }
        } catch (parseError) {
            console.error('Failed to parse Claude response:', response.content, parseError);
            return NextResponse.json(
                { error: 'Failed to generate valid diagnostic questions' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: questions });

    } catch (error) {
        console.error('Diagnostic generation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
