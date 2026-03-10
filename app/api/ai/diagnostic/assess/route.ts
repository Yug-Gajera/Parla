export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude/client';
import { DiagnosticResult, DiagnosticQuestion } from '@/types';

const LEVEL_ASSESSMENT_SYSTEM_PROMPT = `You are a language level assessor for Parlova — a premium language learning platform.

You will receive a learner's answers to a fun diagnostic quiz. Based on their performance, assess their CEFR level.

You MUST return valid JSON and nothing else — no markdown fencing, no explanation text.

Return a single JSON object:
{
  "assessed_level": "A1",
  "confidence": 85,
  "score": 70,
  "breakdown": {
    "reading": 75,
    "vocabulary": 60,
    "grammar": 65
  },
  "explanation": "string — 2-3 sentences. Be warm and encouraging! Mention one strength and one growth area. Use their name if available.",
  "fun_fact": "string — one cool fact about the language at their level, like 'At A2, you can already understand 70% of everyday conversations!'"
}

Rules:
- "assessed_level" must be one of: A1, A2, B1, B2, C1, C2.
- "confidence" is 0–100 representing how confident you are.
- "score" is 0–100 representing overall performance.
- "breakdown" has three keys (reading, vocabulary, grammar), each 0–100.
- "explanation" should be encouraging but honest.
- "fun_fact" adds a motivational language fact.
- Do NOT include any text outside the JSON object.`;

export async function POST(req: Request) {
    try {
        const { answers, questions } = await req.json() as {
            answers: Record<string, number>;
            questions: DiagnosticQuestion[];
        };

        if (!answers || !questions) {
            return NextResponse.json(
                { error: 'Missing answers or questions' },
                { status: 400 }
            );
        }

        const evaluationData = questions.map((q) => {
            const userAnswerIndex = answers[q.id];
            const isCorrect = userAnswerIndex === Number(q.correct_answer);

            return {
                questionId: q.id,
                level: q.level,
                topic_implied: q.explanation,
                userAnsweredCorrectly: isCorrect,
            };
        });

        const promptMessage = `Here are the results of the 10-question diagnostic test:\n${JSON.stringify(evaluationData, null, 2)}`;

        const response = await callClaude(
            [{ role: 'user', content: promptMessage }],
            LEVEL_ASSESSMENT_SYSTEM_PROMPT,
            { temperature: 0.5, maxTokens: 1000, model: 'sonnet' }
        );

        let assessment: DiagnosticResult;
        try {
            const cleanedContent = response.content.replace(/```json\n?|\n?```/g, '').trim();
            assessment = JSON.parse(cleanedContent);

            if (!assessment.assessed_level || !assessment.breakdown) {
                throw new Error('Missing fields in Claude response');
            }
        } catch (parseError) {
            console.error('Failed to parse Claude assessment:', response.content, parseError);
            return NextResponse.json(
                { error: 'Failed to parse assessment results' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: assessment });

    } catch (error) {
        console.error('Diagnostic assess error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
