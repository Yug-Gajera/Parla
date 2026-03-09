export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { callChatGPT } from '@/lib/openai/client';
import { LEVEL_ASSESSMENT_SYSTEM_PROMPT } from '@/lib/openai/prompts';
import { DiagnosticResult, DiagnosticQuestion } from '@/types';

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

        // Prepare the payload to send to Claude
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

        const response = await callChatGPT(
            [{ role: 'user', content: promptMessage }],
            LEVEL_ASSESSMENT_SYSTEM_PROMPT,
            { temperature: 0.5, maxTokens: 1000 }
        );

        // Parse the JSON output from Claude
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
