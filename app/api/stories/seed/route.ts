export const dynamic = "force-dynamic";
// Temporary seeder for sample stories — delete after use
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET() {
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: lang } = await supabase
        .from('languages').select('id').eq('code', 'es').single();
    if (!lang) return NextResponse.json({ error: 'No Spanish language found' }, { status: 400 });
    const lid = lang.id;

    const stories = [
        {
            language_id: lid, content_type: 'short_story', topic: 'cooking at home', topic_category: 'daily_life',
            title: 'La sopa de la abuela',
            content: 'María entra en la cocina. Hoy quiere cocinar la sopa de su abuela. Abre el libro de recetas y busca la página correcta.\n\nPrimero, necesita las verduras: tomates, cebollas y zanahorias. Va al mercado y compra todo. Las verduras están muy frescas hoy.\n\nEn casa, María lava las verduras con agua fría. Después, corta los tomates en pedazos pequeños. Las cebollas la hacen llorar, pero no importa.\n\nPone una olla grande en el fuego con un poco de aceite. Primero echa las cebollas. Después de cinco minutos, añade los tomates y las zanahorias. Todo huele muy bien.\n\nMaría añade agua caliente y sal. La sopa necesita cocinar durante una hora. Mientras espera, limpia la cocina y pone la mesa.\n\nCuando la sopa está lista, María la prueba. Está perfecta, igual que la de su abuela. Sonríe y sirve dos platos: uno para ella y otro para su madre.',
            word_count: 160, cefr_level: 'A2', summary: 'María cooks her grandmother\'s soup recipe from scratch.',
            vocabulary_items: [
                { word: 'receta', translation: 'recipe', part_of_speech: 'noun', in_context: 'Abre el libro de recetas', note: '' },
                { word: 'verdura', translation: 'vegetable', part_of_speech: 'noun', in_context: 'necesita las verduras', note: '' },
                { word: 'cortar', translation: 'to cut', part_of_speech: 'verb', in_context: 'corta los tomates en pedazos pequeños', note: '' },
                { word: 'olla', translation: 'pot', part_of_speech: 'noun', in_context: 'Pone una olla grande en el fuego', note: '' },
                { word: 'probar', translation: 'to taste/try', part_of_speech: 'verb', in_context: 'María la prueba', note: '' },
            ],
            comprehension_questions: [
                { id: 1, question: 'Where does María get the vegetables?', options: ['From her garden', 'From the market', 'From a neighbor', 'From a supermarket'], correct: 1, explanation: 'She goes to the market (mercado)' },
                { id: 2, question: 'What makes María cry?', options: ['The recipe', 'The onions', 'The tomatoes', 'The heat'], correct: 1, explanation: 'The onions make her cry' },
                { id: 3, question: 'How does the soup taste?', options: ['Too salty', 'Perfect, like grandmother\'s', 'Needs more time', 'Terrible'], correct: 1, explanation: 'Perfect, just like her grandmother\'s' },
            ],
            times_read: 23,
        },
        {
            language_id: lid, content_type: 'dialogue', topic: 'restaurant experience', topic_category: 'food',
            title: 'En el restaurante nuevo',
            content: 'Carlos: ¡Hola, Ana! ¿Has estado en este restaurante antes?\n\nAna: No, es la primera vez. Me han dicho que la comida es excelente.\n\nCarlos: Sí, un amigo me lo recomendó. Dice que el pescado es increíble.\n\nAna: Perfecto. A mí me encanta el pescado. ¿Qué vas a pedir tú?\n\nCarlos: Creo que voy a probar la paella. Es la especialidad de la casa.\n\nAna: Buena elección. Yo quiero el salmón a la plancha con ensalada.\n\nCarlos: ¿Y para beber? ¿Un vino blanco?\n\nAna: Mejor agua con gas. Tengo que conducir después.\n\nCarlos: Tienes razón. Yo también pido agua entonces.\n\nAna: Mira, aquí viene el camarero. ¡Vamos a pedir!\n\nCarlos: Disculpe, queremos pedir. Para mí la paella, por favor.\n\nAna: Y para mí el salmón a la plancha. ¿Viene con ensalada?\n\nCarlos: La comida ha llegado rápido. ¡Qué buena pinta tiene todo!\n\nAna: Mmm, el salmón está delicioso. ¿Cómo está tu paella?\n\nCarlos: Increíble. Tenemos que volver pronto.',
            word_count: 170, cefr_level: 'B1', summary: 'Carlos and Ana try a new restaurant and enjoy their meal.',
            vocabulary_items: [
                { word: 'recomendar', translation: 'to recommend', part_of_speech: 'verb', in_context: 'un amigo me lo recomendó', note: '' },
                { word: 'especialidad', translation: 'specialty', part_of_speech: 'noun', in_context: 'la especialidad de la casa', note: '' },
                { word: 'a la plancha', translation: 'grilled', part_of_speech: 'phrase', in_context: 'el salmón a la plancha', note: '' },
                { word: 'conducir', translation: 'to drive', part_of_speech: 'verb', in_context: 'Tengo que conducir después', note: '' },
                { word: 'buena pinta', translation: 'looks good', part_of_speech: 'phrase', in_context: '¡Qué buena pinta tiene todo!', note: 'Colloquial' },
            ],
            comprehension_questions: [
                { id: 1, question: 'Why does Ana order water instead of wine?', options: ['She dislikes wine', 'She needs to drive', 'It is too expensive', 'She is allergic'], correct: 1, explanation: 'She has to drive afterwards' },
                { id: 2, question: 'What is the restaurant\'s specialty?', options: ['Salmon', 'Paella', 'Steak', 'Salad'], correct: 1, explanation: 'Paella is the house specialty' },
                { id: 3, question: 'How is the food?', options: ['Mediocre', 'Terrible', 'Delicious', 'Too salty'], correct: 2, explanation: 'Both describe it positively' },
            ],
            times_read: 47,
        },
        {
            language_id: lid, content_type: 'letter', topic: 'reconnecting with friend', topic_category: 'relationships',
            title: 'Querida Elena',
            content: 'Querida Elena,\n\nEspero que estés bien. Ha pasado mucho tiempo desde la última vez que hablamos, y quiero pedirte disculpas por eso. La vida ha sido muy ocupada con el trabajo nuevo y la mudanza a Barcelona.\n\nTe escribo porque he estado pensando mucho en nuestros años en la universidad. ¿Te acuerdas de las tardes en la cafetería estudiando para los exámenes? Eran tiempos difíciles pero también muy divertidos.\n\nHe visto que ahora vives en Madrid. ¡Qué coincidencia! Voy a estar allí la semana que viene por trabajo. Me encantaría verte para tomar un café y ponernos al día.\n\nTengo tantas cosas que contarte. He empezado a aprender a cocinar platos mexicanos, ¿puedes creerlo? También adopté un gato que se llama Manchas, porque tiene manchas negras por todo el cuerpo.\n\nSi tienes tiempo el jueves o viernes, avísame. Conozco un café muy bonito cerca de la Gran Vía.\n\nTe echo de menos.\n\nCon mucho cariño,\nLaura',
            word_count: 180, cefr_level: 'B1', summary: 'Laura writes to her old university friend Elena to reconnect.',
            vocabulary_items: [
                { word: 'mudanza', translation: 'move (house)', part_of_speech: 'noun', in_context: 'la mudanza a Barcelona', note: '' },
                { word: 'ponerse al día', translation: 'to catch up', part_of_speech: 'phrase', in_context: 'ponernos al día', note: '' },
                { word: 'adoptar', translation: 'to adopt', part_of_speech: 'verb', in_context: 'adopté un gato', note: '' },
                { word: 'mancha', translation: 'spot/stain', part_of_speech: 'noun', in_context: 'tiene manchas negras', note: '' },
                { word: 'echar de menos', translation: 'to miss', part_of_speech: 'phrase', in_context: 'Te echo de menos', note: '' },
            ],
            comprehension_questions: [
                { id: 1, question: 'Why has Laura been too busy to write?', options: ['She was traveling', 'New job and moving', 'She was ill', 'She forgot'], correct: 1, explanation: 'New job and moving to Barcelona' },
                { id: 2, question: 'What is Manchas?', options: ['A dog', 'A cat', 'A friend', 'A restaurant'], correct: 1, explanation: 'A cat with black spots' },
                { id: 3, question: 'Where does Laura suggest meeting?', options: ['Barcelona', 'University', 'A café near Gran Vía', 'Elena\'s house'], correct: 2, explanation: 'A café near Gran Vía in Madrid' },
            ],
            times_read: 31,
        },
        {
            language_id: lid, content_type: 'journal', topic: 'first day at job', topic_category: 'work',
            title: 'Diario: Mi primer día',
            content: 'Lunes, 15 de marzo, Madrid\n\nHoy fue mi primer día en la empresa nueva. Estaba tan nervioso que no pude desayunar. Solo tomé un café rápido antes de salir de casa a las siete de la mañana.\n\nLlegué a la oficina veinte minutos antes. El edificio es moderno y tiene muchas plantas verdes en la entrada. Me gustó inmediatamente.\n\nMi jefa, Carmen, me recibió con una sonrisa grande. Me presentó a todo el equipo: hay quince personas en mi departamento. Todos parecen muy amables, especialmente Rodrigo, que se sentó conmigo durante el almuerzo.\n\nLa mañana fue un poco confusa. Tuve que instalar muchos programas en mi ordenador y leer documentos sobre las reglas de la empresa. Pero Carmen me explicó todo con paciencia.\n\nDespués del almuerzo, asistí a mi primera reunión. No entendí todo, pero tomé muchas notas. Rodrigo me dijo que las primeras semanas siempre son así.\n\nVolví a casa agotado pero contento. Creo que este trabajo va a ser bueno para mí.',
            word_count: 175, cefr_level: 'B1', summary: 'A nervous first day at a new office job in Madrid.',
            vocabulary_items: [
                { word: 'nervioso', translation: 'nervous', part_of_speech: 'adjective', in_context: 'Estaba tan nervioso', note: '' },
                { word: 'jefa', translation: 'boss (female)', part_of_speech: 'noun', in_context: 'Mi jefa, Carmen', note: '' },
                { word: 'departamento', translation: 'department', part_of_speech: 'noun', in_context: 'quince personas en mi departamento', note: '' },
                { word: 'reunión', translation: 'meeting', part_of_speech: 'noun', in_context: 'asistí a mi primera reunión', note: '' },
                { word: 'agotado', translation: 'exhausted', part_of_speech: 'adjective', in_context: 'Volví a casa agotado', note: '' },
            ],
            comprehension_questions: [
                { id: 1, question: 'Why couldn\'t the writer eat breakfast?', options: ['No food at home', 'Too nervous', 'Woke up late', 'Not hungry'], correct: 1, explanation: 'Too nervous to eat' },
                { id: 2, question: 'Who helped the writer at lunch?', options: ['Carmen', 'Rodrigo', 'The whole team', 'Nobody'], correct: 1, explanation: 'Rodrigo sat with them at lunch' },
                { id: 3, question: 'How does the writer feel at the end?', options: ['Disappointed', 'Angry', 'Tired but happy', 'Indifferent'], correct: 2, explanation: 'Exhausted but content' },
            ],
            times_read: 15,
        },
    ];

    // Clean old seeds
    for (const s of stories) {
        await supabase.from('generated_stories').delete().eq('title', s.title);
    }

    let inserted = 0;
    const errors: string[] = [];
    for (const story of stories) {
        const { error } = await supabase.from('generated_stories').insert(story);
        if (error) errors.push(`${story.title}: ${error.message}`);
        else inserted++;
    }

    return NextResponse.json({ success: true, inserted, total: stories.length, errors });
}
