import { NextResponse } from 'next/server';
import { callChatGPT } from '@/lib/openai/client';
import { DIAGNOSTIC_SYSTEM_PROMPT } from '@/lib/openai/prompts';
import { DiagnosticQuestion } from '@/types';

export async function POST(req: Request) {
    try {
        const { selfReportedLevel, languageCode } = await req.json();

        if (!selfReportedLevel || !languageCode) {
            return NextResponse.json(
                { error: 'Missing selfReportedLevel or languageCode' },
                { status: 400 }
            );
        }

        const promptMessage = `The learner wants to learn language code "${languageCode}" and self-reports their level as ${selfReportedLevel} on the CEFR scale. Generate 10 adaptive diagnostic questions.`;

        const response = await callChatGPT(
            [{ role: 'user', content: promptMessage }],
            DIAGNOSTIC_SYSTEM_PROMPT,
            { temperature: 0.7, maxTokens: 2000 }
        );

        // Parse the JSON output from Claude
        let questions: DiagnosticQuestion[] = [];
        try {
            // Claude might wrap the JSON in markdown blocks
            const cleanedContent = response.content.replace(/```json\n?|\n?```/g, '').trim();
            questions = JSON.parse(cleanedContent);

            if (!Array.isArray(questions) || questions.length !== 10) {
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
