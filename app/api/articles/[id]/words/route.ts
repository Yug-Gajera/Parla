// ============================================================
// Parlova — Article Word Tap API
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const articleId = params.id;
        const body = await req.json();
        const { word, context_sentence } = body;

        if (!word) {
            return NextResponse.json({ error: 'Missing word' }, { status: 400 });
        }

        const normalizedWord = word.toLowerCase().trim();

        // Record the word encounter
        await (supabase as any)
            .from('article_word_encounters')
            .insert({
                user_id: user.id,
                article_id: articleId,
                word: normalizedWord,
            });

        // Get article language
        const { data: article } = await (supabase as any)
            .from('articles')
            .select('language_id, vocabulary_items')
            .eq('id', articleId)
            .single();

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Check article's vocabulary_items for this word's definition
        const vocabItems = (article.vocabulary_items || []) as Array<{
            word: string;
            translation: string;
            part_of_speech: string;
            in_context: string;
            note: string;
        }>;

        const matchedVocab = vocabItems.find(
            v => v.word.toLowerCase() === normalizedWord
        );

        // Check if the word exists in the global vocabulary_words table
        const { data: existingWord } = await (supabase as any)
            .from('vocabulary_words')
            .select('id, word, translation, part_of_speech, example_sentence')
            .eq('language_id', article.language_id)
            .ilike('word', normalizedWord)
            .maybeSingle();

        // Check if user already has this word in their deck
        let inDeck = false;
        if (existingWord) {
            const { data: userVocab } = await (supabase as any)
                .from('user_vocabulary')
                .select('id')
                .eq('user_id', user.id)
                .eq('word_id', existingWord.id)
                .maybeSingle();
            inDeck = !!userVocab;
        }

        // Build response with definition
        const definition = matchedVocab
            ? {
                word: matchedVocab.word,
                translation: matchedVocab.translation,
                part_of_speech: matchedVocab.part_of_speech,
                in_context: matchedVocab.in_context || context_sentence,
                note: matchedVocab.note,
                in_deck: inDeck,
                word_id: existingWord?.id || null,
            }
            : existingWord
                ? {
                    word: existingWord.word,
                    translation: existingWord.translation,
                    part_of_speech: existingWord.part_of_speech,
                    in_context: existingWord.example_sentence || context_sentence,
                    note: '',
                    in_deck: inDeck,
                    word_id: existingWord.id,
                }
                : null;

        return NextResponse.json({
            success: true,
            definition,
            in_deck: inDeck,
        });
    } catch (error) {
        console.error('[articles/words] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
