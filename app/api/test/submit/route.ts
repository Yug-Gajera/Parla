export const dynamic = "force-dynamic";
// ============================================================
// Parlova — Test Submission & Scoring API (Claude Sonnet)
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

// CEFR level order
const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type CEFRLevel = typeof CEFR_ORDER[number];

interface TestAnswer {
    [questionId: string]: string | number;
}

interface WritingScore {
    score: number;
    grammar: number;
    vocabulary: number;
    coherence: number;
    task_completion: number;
    feedback: string;
}

const WRITING_SCORING_PROMPT = `You are an expert language assessor for Parlova.

Score the following writing response from a learner attempting to achieve {LEVEL} level in {LANGUAGE}.

WRITING PROMPT:
{PROMPT}

LEARNER'S RESPONSE:
{RESPONSE}

You MUST return valid JSON and nothing else — no markdown fencing, no explanation text.

Return a single JSON object with this exact structure:
{
  "score": 75,
  "grammar": 80,
  "vocabulary": 70,
  "coherence": 75,
  "task_completion": 80,
  "feedback": "2-3 sentences of specific, constructive feedback on strengths and areas for improvement"
}

Scoring Guidelines for {LEVEL} level:
- score: 0-100 overall score for the writing
- grammar: 0-100 based on accuracy and complexity appropriate for {LEVEL}
- vocabulary: 0-100 based on range and appropriateness of vocabulary for {LEVEL}
- coherence: 0-100 based on organization, transitions, and clarity
- task_completion: 0-100 based on how well the prompt was addressed

To pass (score >= 75), the writing should demonstrate:
- A1-A2: Basic sentences, simple vocabulary, understandable despite errors
- B1-B2: Connected paragraphs, varied vocabulary, mostly accurate grammar
- C1-C2: Complex structures, sophisticated vocabulary, minimal errors, native-like flow

Be strict but fair. A score of 75 means the learner is ready for the next level.`;

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { test_id, answers, writing_response } = body as {
            test_id: string;
            answers: TestAnswer;
            writing_response: string;
        };

        if (!test_id || !answers || !writing_response) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: testRecord, error: fetchError } = await (supabase as any)
            .from('level_tests')
            .select('*')
            .eq('id', test_id)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !testRecord) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        const detailedResults = testRecord.detailed_results as Record<string, unknown>;
        if (detailedResults?.status === 'completed') {
            return NextResponse.json({ error: 'Test already submitted' }, { status: 400 });
        }

        const questions = detailedResults?.questions as Record<string, unknown>;
        if (!questions) {
            return NextResponse.json({ error: 'Test questions not found' }, { status: 500 });
        }

        // Score objective questions
        const readingQuestions = questions.reading as Array<{ id: string; correct_answer: number; points: number }>;
        const vocabularyQuestions = questions.vocabulary as Array<{ id: string; correct_answer: number; points: number }>;
        const grammarQuestions = questions.grammar as Array<{ id: string; correct_answer: number; points: number }>;
        const writingPrompt = questions.writing as { prompt: string; min_words: number; max_words: number; points: number };

        let readingScore = 0, readingTotal = 0;
        let readingDetails: Array<{ id: string; correct: boolean; user_answer: string | number }> = [];
        for (const q of readingQuestions || []) {
            readingTotal += q.points;
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct_answer;
            if (isCorrect) readingScore += q.points;
            readingDetails.push({ id: q.id, correct: isCorrect, user_answer: userAnswer });
        }

        let vocabularyScore = 0, vocabularyTotal = 0;
        let vocabularyDetails: Array<{ id: string; correct: boolean; user_answer: string | number }> = [];
        for (const q of vocabularyQuestions || []) {
            vocabularyTotal += q.points;
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct_answer;
            if (isCorrect) vocabularyScore += q.points;
            vocabularyDetails.push({ id: q.id, correct: isCorrect, user_answer: userAnswer });
        }

        let grammarScore = 0, grammarTotal = 0;
        let grammarDetails: Array<{ id: string; correct: boolean; user_answer: string | number }> = [];
        for (const q of grammarQuestions || []) {
            grammarTotal += q.points;
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct_answer;
            if (isCorrect) grammarScore += q.points;
            grammarDetails.push({ id: q.id, correct: isCorrect, user_answer: userAnswer });
        }

        // Score writing with Claude Sonnet
        const languageId = testRecord.language_id;
        const level = testRecord.level_tested as CEFRLevel;

        const { data: language } = await (supabase as any)
            .from('languages')
            .select('name')
            .eq('id', languageId)
            .single();

        const writingPromptText = WRITING_SCORING_PROMPT
            .replace(/{LEVEL}/g, level)
            .replace(/{LANGUAGE}/g, language?.name || 'Spanish')
            .replace('{PROMPT}', writingPrompt?.prompt || '')
            .replace('{RESPONSE}', writing_response);

        let writingScoreResult: WritingScore;

        try {
            const response = await callClaude(
                [{ role: 'user', content: writingPromptText }],
                'You are a writing assessor. Return valid JSON only.',
                { temperature: 0.3, maxTokens: 500, model: 'haiku' }
            );

            const scoreContent = response.content.replace(/```json\n?|\n?```/g, '').trim();
            writingScoreResult = JSON.parse(scoreContent) as WritingScore;
        } catch (e) {
            console.error('Failed to score writing:', e);
            writingScoreResult = {
                score: 0, grammar: 0, vocabulary: 0,
                coherence: 0, task_completion: 0,
                feedback: 'Unable to score writing response.',
            };
        }

        const readingPercent = readingTotal > 0 ? Math.round((readingScore / readingTotal) * 100) : 0;
        const vocabularyPercent = vocabularyTotal > 0 ? Math.round((vocabularyScore / vocabularyTotal) * 100) : 0;
        const grammarPercent = grammarTotal > 0 ? Math.round((grammarScore / grammarTotal) * 100) : 0;
        const writingPercent = Math.min(100, Math.max(0, writingScoreResult.score || 0));

        const overallScore = Math.round(
            readingPercent * 0.25 +
            vocabularyPercent * 0.25 +
            grammarPercent * 0.15 +
            writingPercent * 0.35
        );

        const passed = overallScore >= 75;

        const { error: updateError } = await (supabase as any)
            .from('level_tests')
            .update({
                reading_score: readingPercent,
                vocabulary_score: vocabularyPercent,
                writing_score: writingPercent,
                overall_score: overallScore,
                passed: passed,
                detailed_results: {
                    ...detailedResults,
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    answers, writing_response,
                    reading_details: readingDetails,
                    vocabulary_details: vocabularyDetails,
                    grammar_details: grammarDetails,
                    grammar_score: grammarPercent,
                    writing_details: writingScoreResult,
                },
            })
            .eq('id', test_id);

        if (updateError) {
            console.error('Failed to update test record:', updateError);
            return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
        }

        if (passed) {
            const { error: levelUpdateError } = await (supabase as any)
                .from('user_languages')
                .update({ current_level: level, level_score: 0 })
                .eq('user_id', user.id)
                .eq('language_id', languageId);

            if (levelUpdateError) {
                console.error('Failed to update user level:', levelUpdateError);
            }

            await (supabase as any)
                .from('study_sessions')
                .insert({
                    user_id: user.id,
                    language_id: languageId,
                    session_type: 'test',
                    duration_minutes: 30,
                    xp_earned: 100,
                });
        }

        return NextResponse.json({
            success: true,
            test_id, level_tested: level, passed, overall_score: overallScore,
            passing_threshold: 75,
            sections: {
                reading: { score: readingPercent, points_earned: readingScore, points_possible: readingTotal, details: readingDetails },
                vocabulary: { score: vocabularyPercent, points_earned: vocabularyScore, points_possible: vocabularyTotal, details: vocabularyDetails },
                grammar: { score: grammarPercent, points_earned: grammarScore, points_possible: grammarTotal, details: grammarDetails },
                writing: {
                    score: writingPercent,
                    breakdown: { grammar: writingScoreResult.grammar, vocabulary: writingScoreResult.vocabulary, coherence: writingScoreResult.coherence, task_completion: writingScoreResult.task_completion },
                    feedback: writingScoreResult.feedback,
                },
            },
            new_level: passed ? level : null,
        });

    } catch (error) {
        console.error('Test submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}