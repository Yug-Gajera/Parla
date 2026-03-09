// ============================================================
// Parlova — Test Generation API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() { if (!_openai) { _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); } return _openai; }

// CEFR level order
const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type CEFRLevel = typeof CEFR_ORDER[number];

interface TestQuestion {
    id: string;
    type: 'reading' | 'vocabulary' | 'grammar';
    question: string;
    options?: string[];
    correct_answer?: string | number;
    context?: string;
    points: number;
}

interface WritingPrompt {
    id: string;
    type: 'writing';
    prompt: string;
    min_words: number;
    max_words: number;
    points: number;
}

interface GeneratedTest {
    reading: TestQuestion[];
    vocabulary: TestQuestion[];
    grammar: TestQuestion[];
    writing: WritingPrompt;
}

const TEST_GENERATION_PROMPT = `You are a language proficiency test generator for Parlova.

Generate a CEFR-aligned level test for a learner attempting to advance to level {LEVEL} in {LANGUAGE}.

You MUST return valid JSON and nothing else — no markdown fencing, no explanation text.

Return a single JSON object with this exact structure:
{
  "reading": [
    {
      "id": "r1",
      "type": "reading",
      "context": "A short paragraph (3-5 sentences) in {LANGUAGE} at the {LEVEL} level",
      "question": "A comprehension question about the context",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_answer": 0,
      "points": 10
    }
    // 5 total reading questions, each with different contexts
  ],
  "vocabulary": [
    {
      "id": "v1",
      "type": "vocabulary",
      "question": "What does [word] mean in this context? OR Choose the word that best completes the sentence",
      "context": "Short sentence in {LANGUAGE} with a blank or highlighted word",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_answer": 0,
      "points": 10
    }
    // 5 total vocabulary questions
  ],
  "grammar": [
    {
      "id": "g1",
      "type": "grammar",
      "question": "Choose the correct form to complete the sentence",
      "context": "Sentence in {LANGUAGE} with a blank: 'Yo ____ estudiante.'",
      "options": ["soy", "estoy", "ser", "estar"],
      "correct_answer": 0,
      "points": 10
    }
    // 3 total grammar questions
  ],
  "writing": {
    "id": "w1",
    "type": "writing",
    "prompt": "Write a short response in {LANGUAGE} (75-150 words) about: [topic appropriate for {LEVEL} level]",
    "min_words": 75,
    "max_words": 150,
    "points": 40
  }
}

Rules:
- correct_answer is a 0-based index (0-3) for multiple choice
- Questions must genuinely test {LEVEL}-level proficiency
- Reading passages should test comprehension, not just vocabulary
- Vocabulary should test meaning in context, not isolated definitions
- Grammar should test structures appropriate for {LEVEL}
- Writing prompt should allow demonstration of {LEVEL} grammar and vocabulary
- All questions in the target language ({LANGUAGE}) with English question text
- Do NOT include any text outside the JSON object.`;

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { language_id, level } = body as { language_id: string; level: CEFRLevel };

        if (!language_id || !level) {
            return NextResponse.json({ error: 'Missing language_id or level' }, { status: 400 });
        }

        // Validate level
        if (!CEFR_ORDER.includes(level)) {
            return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
        }

        // Get language info
        const { data: language, error: langError } = await (supabase as any)
            .from('languages')
            .select('id, code, name')
            .eq('id', language_id)
            .single();

        if (langError || !language) {
            return NextResponse.json({ error: 'Language not found' }, { status: 404 });
        }

        // Verify user is studying this language
        const { data: userLanguage, error: ulError } = await (supabase as any)
            .from('user_languages')
            .select('current_level, level_score')
            .eq('user_id', user.id)
            .eq('language_id', language_id)
            .single();

        if (ulError || !userLanguage) {
            return NextResponse.json({ error: 'You are not studying this language' }, { status: 403 });
        }

        // Verify the user is at the previous level
        const currentLevelIndex = CEFR_ORDER.indexOf(userLanguage.current_level as CEFRLevel);
        const targetLevelIndex = CEFR_ORDER.indexOf(level);

        if (targetLevelIndex !== currentLevelIndex + 1) {
            return NextResponse.json({
                error: `You can only test for the next level (${CEFR_ORDER[currentLevelIndex + 1]})`,
            }, { status: 400 });
        }

        // Generate the test using OpenAI
        const prompt = TEST_GENERATION_PROMPT
            .replace(/{LEVEL}/g, level)
            .replace(/{LANGUAGE}/g, language.name);

        const completion = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const responseContent = completion.choices[0].message.content || '{}';
        let testContent: GeneratedTest;

        try {
            testContent = JSON.parse(responseContent);
        } catch (e) {
            console.error('Failed to parse test JSON:', responseContent);
            return NextResponse.json({ error: 'Failed to generate valid test' }, { status: 500 });
        }

        // Validate the generated test has all required sections
        if (!testContent.reading?.length || !testContent.vocabulary?.length ||
            !testContent.grammar?.length || !testContent.writing) {
            console.error('Incomplete test generated:', testContent);
            return NextResponse.json({ error: 'Generated test is incomplete' }, { status: 500 });
        }

        // Create the test record in the database
        const { data: testRecord, error: insertError } = await (supabase as any)
            .from('level_tests')
            .insert({
                user_id: user.id,
                language_id: language_id,
                level_tested: level,
                detailed_results: {
                    questions: testContent,
                    answers: null,
                    writing_response: null,
                    status: 'in_progress',
                    started_at: new Date().toISOString(),
                },
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('Failed to create test record:', insertError);
            return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
        }

        // Return the test without correct answers (client shouldn't see them)
        const clientTest = {
            test_id: testRecord.id,
            level: level,
            language: language,
            reading: testContent.reading.map(q => ({
                id: q.id,
                type: q.type,
                context: q.context,
                question: q.question,
                options: q.options,
                points: q.points,
            })),
            vocabulary: testContent.vocabulary.map(q => ({
                id: q.id,
                type: q.type,
                question: q.question,
                context: q.context,
                options: q.options,
                points: q.points,
            })),
            grammar: testContent.grammar.map(q => ({
                id: q.id,
                type: q.type,
                question: q.question,
                context: q.context,
                options: q.options,
                points: q.points,
            })),
            writing: {
                id: testContent.writing.id,
                type: testContent.writing.type,
                prompt: testContent.writing.prompt,
                min_words: testContent.writing.min_words,
                max_words: testContent.writing.max_words,
                points: testContent.writing.points,
            },
            total_points: 140, // 50 reading + 50 vocabulary + 30 grammar + 40 writing
        };

        return NextResponse.json(clientTest);

    } catch (error) {
        console.error('Test generation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}