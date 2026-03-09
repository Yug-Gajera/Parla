export const dynamic = "force-dynamic";
// Temporary seeder route — delete after use
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

    const articles = [
        {
            language_id: lid, source_name: 'BBC Mundo', source_url: 'https://feeds.bbci.co.uk/mundo/rss.xml',
            original_url: 'https://bbc.com/mundo/seed-001', title: 'Los mejores cafés de Madrid: una guía para amantes del café',
            summary: 'A guide to the best coffee shops in Madrid, exploring traditional cafeterías and modern specialty coffee houses.',
            content: 'Madrid es una ciudad que ama el café. Desde los cafés tradicionales del centro hasta las nuevas cafeterías de especialidad, la capital española ofrece una experiencia única para los amantes de esta bebida.\n\nEn el barrio de Malasaña, se encuentran algunas de las cafeterías más modernas de la ciudad. Aquí, los baristas preparan café de origen único con métodos como el pour-over y el aeropress. Los precios son razonables: un café con leche cuesta entre 2 y 4 euros.\n\nPero no todo es moderno en Madrid. Los cafés históricos, como el Café Gijón fundado en 1888, mantienen viva la tradición de las tertulias literarias. En estos lugares, el tiempo parece detenerse mientras disfrutas de un cortado perfecto.\n\nPara los que prefieren algo diferente, hay cafeterías que combinan café con libros, arte o incluso gatos. Los españoles generalmente toman el café después de las comidas. El desayuno típico incluye un café con leche y tostadas con aceite de oliva y tomate.\n\nSi visitas Madrid, no te pierdas la oportunidad de probar un carajillo, una mezcla de café espresso con brandy o licor que es perfecta para después de cenar.',
            word_count: 210, cefr_level: 'B1', level_score: 85, topics: ['culture', 'lifestyle'],
            vocabulary_items: [
                { word: 'cafetería', translation: 'coffee shop', part_of_speech: 'noun', difficulty: 'A2', in_context: 'las nuevas cafeterías de especialidad', note: '' },
                { word: 'barista', translation: 'barista', part_of_speech: 'noun', difficulty: 'A2', in_context: 'los baristas preparan café de origen único', note: '' },
                { word: 'tertulia', translation: 'literary gathering', part_of_speech: 'noun', difficulty: 'B2', in_context: 'la tradición de las tertulias literarias', note: 'Uniquely Spanish tradition' },
                { word: 'cortado', translation: 'espresso with milk', part_of_speech: 'noun', difficulty: 'B1', in_context: 'disfrutas de un cortado perfecto', note: '' },
                { word: 'tostada', translation: 'toast', part_of_speech: 'noun', difficulty: 'A2', in_context: 'tostadas con aceite de oliva', note: '' },
                { word: 'carajillo', translation: 'coffee with brandy', part_of_speech: 'noun', difficulty: 'B2', in_context: 'probar un carajillo', note: 'After-dinner drink' },
            ],
            comprehension_questions: [
                { id: 1, question: 'What type of coffee shops are in Malasaña?', options: ['Traditional cafés', 'Modern specialty coffee', 'Cat cafés only', 'Chain shops'], correct: 1, explanation: "Malasaña has 'las cafeterías más modernas de la ciudad'" },
                { id: 2, question: 'What is a tertulia?', options: ['A coffee drink', 'A literary gathering', 'A neighborhood', 'A brewing method'], correct: 1, explanation: "Mentioned as 'tertulias literarias'" },
                { id: 3, question: 'What is a carajillo?', options: ['Cold coffee', 'Coffee with milk', 'Espresso with brandy', 'A pastry'], correct: 2, explanation: "'café espresso con brandy o licor'" },
            ],
            published_at: new Date(Date.now() - 3 * 3600000).toISOString(), processed: true, estimated_read_minutes: 3, image_url: null,
        },
        {
            language_id: lid, source_name: 'DW Español', source_url: 'https://rss.dw.com/rdf/rss-es-all',
            original_url: 'https://dw.com/es/seed-002', title: 'Cómo la inteligencia artificial cambia la educación en América Latina',
            summary: 'AI is transforming education across Latin America with personalized learning tools.',
            content: 'La inteligencia artificial está revolucionando la forma en que los estudiantes aprenden en América Latina. Desde aplicaciones que enseñan idiomas hasta plataformas que adaptan el contenido al nivel de cada alumno, la tecnología está cerrando brechas educativas en la región.\n\nEn México, Colombia y Argentina, varias startups han desarrollado herramientas educativas basadas en IA que ya utilizan millones de estudiantes. Estas aplicaciones pueden identificar las debilidades de cada alumno y crear planes de estudio personalizados.\n\nUna de las innovaciones más interesantes es el uso de chatbots para practicar idiomas. Los estudiantes pueden mantener conversaciones naturales con la inteligencia artificial, que corrige sus errores en tiempo real.\n\nSin embargo, algunos profesores argumentan que la tecnología no puede reemplazar la interacción humana en el aula. La empatía y el pensamiento crítico son habilidades que solo pueden desarrollarse con un maestro presente.\n\nLos expertos predicen que para 2030, el 60% de las escuelas en América Latina utilizarán alguna forma de inteligencia artificial.',
            word_count: 200, cefr_level: 'B2', level_score: 80, topics: ['technology', 'science'],
            vocabulary_items: [
                { word: 'brecha', translation: 'gap/divide', part_of_speech: 'noun', difficulty: 'B2', in_context: 'cerrando brechas educativas', note: '' },
                { word: 'herramienta', translation: 'tool', part_of_speech: 'noun', difficulty: 'B1', in_context: 'herramientas educativas basadas en IA', note: '' },
                { word: 'debilidad', translation: 'weakness', part_of_speech: 'noun', difficulty: 'B1', in_context: 'identificar las debilidades', note: '' },
                { word: 'corregir', translation: 'to correct', part_of_speech: 'verb', difficulty: 'B1', in_context: 'corrige sus errores en tiempo real', note: '' },
                { word: 'aula', translation: 'classroom', part_of_speech: 'noun', difficulty: 'A2', in_context: 'la interacción humana en el aula', note: 'Uses: el aula' },
                { word: 'capacitar', translation: 'to train', part_of_speech: 'verb', difficulty: 'B2', in_context: 'capacitando a sus profesores', note: '' },
            ],
            comprehension_questions: [
                { id: 1, question: 'What is the article mainly about?', options: ['Sports', 'AI in Latin American education', 'Politics', 'Environment'], correct: 1, explanation: 'Article focuses on AI transforming education' },
                { id: 2, question: 'What concern do teachers have?', options: ['Cost', 'AI cannot replace human interaction', 'Students prefer traditional', 'Too many errors'], correct: 1, explanation: 'Teachers worry technology cannot replace human interaction' },
                { id: 3, question: 'What do experts predict for 2030?', options: ['Schools close', '60% of schools use AI', 'AI replaces teachers', 'Only private schools'], correct: 1, explanation: '60% of schools will use some form of AI' },
            ],
            published_at: new Date(Date.now() - 6 * 3600000).toISOString(), processed: true, estimated_read_minutes: 4, image_url: null,
        },
        {
            language_id: lid, source_name: '20 Minutos', source_url: 'https://www.20minutos.es/rss/',
            original_url: 'https://20minutos.es/seed-003', title: 'El mercado central de Valencia celebra su centenario',
            summary: "Valencia's Central Market celebrates 100 years with a special exhibition.",
            content: 'El Mercado Central de Valencia, uno de los edificios modernistas más emblemáticos de Europa, celebra este año su centenario con una exposición que recorre su fascinante historia.\n\nInaugurado en 1928, el mercado fue diseñado por los arquitectos Alejandro Soler March y Francisco Guardia Vial. Su estructura de hierro y cristal es considerada una obra maestra del modernismo valenciano.\n\nCon más de 300 puestos, el mercado ofrece productos frescos de la huerta valenciana: naranjas, tomates, alcachofas y las famosas chufas con las que se prepara la horchata.\n\nLa exposición incluye fotografías antiguas y testimonios de familias que han vendido en el mercado durante generaciones. Algunos puestos han pasado de padres a hijos durante más de 80 años.\n\nEl mercado no es solo un lugar para comprar alimentos. Es un espacio social donde los valencianos se encuentran, hablan y comparten recetas. En los últimos años ha incorporado un servicio de entrega a domicilio y pedidos online.',
            word_count: 200, cefr_level: 'A2', level_score: 90, topics: ['culture', 'lifestyle'],
            vocabulary_items: [
                { word: 'mercado', translation: 'market', part_of_speech: 'noun', difficulty: 'A1', in_context: 'El Mercado Central de Valencia', note: '' },
                { word: 'centenario', translation: '100th anniversary', part_of_speech: 'noun', difficulty: 'B1', in_context: 'celebra su centenario', note: '' },
                { word: 'puesto', translation: 'stall/stand', part_of_speech: 'noun', difficulty: 'A2', in_context: 'más de 300 puestos', note: '' },
                { word: 'huerta', translation: 'vegetable garden', part_of_speech: 'noun', difficulty: 'B1', in_context: 'la huerta valenciana', note: '' },
                { word: 'horchata', translation: 'tiger nut drink', part_of_speech: 'noun', difficulty: 'B1', in_context: 'se prepara la horchata', note: '' },
                { word: 'pedido', translation: 'order', part_of_speech: 'noun', difficulty: 'A2', in_context: 'pedidos online', note: '' },
            ],
            comprehension_questions: [
                { id: 1, question: 'When was the market inaugurated?', options: ['1888', '1928', '1968', '2028'], correct: 1, explanation: "'Inaugurado en 1928'" },
                { id: 2, question: 'What is horchata made from?', options: ['Oranges', 'Almonds', 'Tiger nuts', 'Coconut'], correct: 2, explanation: "Made from 'chufas'" },
                { id: 3, question: 'How many stalls?', options: ['100+', '200+', '300+', '500+'], correct: 2, explanation: "'más de 300 puestos'" },
            ],
            published_at: new Date(Date.now() - 24 * 3600000).toISOString(), processed: true, estimated_read_minutes: 3, image_url: null,
        },
        {
            language_id: lid, source_name: 'BBC Mundo', source_url: 'https://feeds.bbci.co.uk/mundo/rss.xml',
            original_url: 'https://bbc.com/mundo/seed-004', title: 'Descubren nueva especie de rana en los bosques de Ecuador',
            summary: 'Scientists discovered a new glass frog with transparent skin in Ecuador.',
            content: 'Un equipo internacional de biólogos ha descubierto una nueva especie de rana de cristal en los bosques nubosos del noreste de Ecuador. Esta pequeña rana tiene la piel transparente que permite ver sus órganos internos.\n\nLa nueva especie fue encontrada durante una expedición nocturna en la provincia de Napo. Los investigadores la identificaron por su canto único, diferente al de todas las especies conocidas.\n\nLas ranas de cristal son famosas por su piel translúcida, pero esta especie es especialmente notable porque su corazón e intestinos son visibles desde abajo. Los científicos creen que esta transparencia les ayuda a camuflarse entre las hojas.\n\nEl descubrimiento demuestra que los bosques nubosos de Ecuador siguen albergando especies desconocidas. Sin embargo, estos ecosistemas están amenazados por la deforestación y el cambio climático.\n\nEl equipo planea regresar para buscar más poblaciones y estudiar su comportamiento reproductivo.',
            word_count: 200, cefr_level: 'B1', level_score: 82, topics: ['science', 'environment'],
            vocabulary_items: [
                { word: 'especie', translation: 'species', part_of_speech: 'noun', difficulty: 'B1', in_context: 'una nueva especie de rana', note: '' },
                { word: 'rana de cristal', translation: 'glass frog', part_of_speech: 'phrase', difficulty: 'B1', in_context: 'especie de rana de cristal', note: '' },
                { word: 'bosque nuboso', translation: 'cloud forest', part_of_speech: 'phrase', difficulty: 'B2', in_context: 'los bosques nubosos', note: '' },
                { word: 'órgano', translation: 'organ', part_of_speech: 'noun', difficulty: 'B1', in_context: 'ver sus órganos internos', note: '' },
                { word: 'amenazado', translation: 'threatened', part_of_speech: 'adjective', difficulty: 'B1', in_context: 'ecosistemas amenazados', note: '' },
                { word: 'deforestación', translation: 'deforestation', part_of_speech: 'noun', difficulty: 'B1', in_context: 'amenazados por la deforestación', note: '' },
            ],
            comprehension_questions: [
                { id: 1, question: 'What makes this frog special?', options: ['Largest ever', 'Transparent skin', 'Can fly', 'Changes color'], correct: 1, explanation: 'Transparent skin shows organs' },
                { id: 2, question: 'How was it identified?', options: ['Color', 'Size', 'Unique call', 'DNA only'], correct: 2, explanation: "'su canto único'" },
                { id: 3, question: 'What threatens these forests?', options: ['Volcanoes', 'Deforestation & climate change', 'Flooding', 'Invasive species'], correct: 1, explanation: 'Deforestation and climate change' },
            ],
            published_at: new Date(Date.now() - 12 * 3600000).toISOString(), processed: true, estimated_read_minutes: 3, image_url: null,
        },
    ];

    // Delete old seed articles first, then insert new ones
    for (const a of articles) {
        await supabase.from('articles').delete().eq('original_url', a.original_url);
    }
    // Also delete the old seed articles from the prior version
    const oldUrls = ['https://bbc.com/mundo/sample-001', 'https://cnnespanol.com/sample-002', 'https://elpais.com/sample-003', 'https://natgeo.es/sample-004'];
    for (const url of oldUrls) {
        await supabase.from('articles').delete().eq('original_url', url);
    }

    let inserted = 0;
    const errors: string[] = [];
    for (const article of articles) {
        const { error } = await supabase.from('articles').insert(article);
        if (error) {
            errors.push(`${article.title.slice(0, 30)}: ${error.message}`);
        } else {
            inserted++;
        }
    }

    return NextResponse.json({ success: true, inserted, total: articles.length, errors });
}
