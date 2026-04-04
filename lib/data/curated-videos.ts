// ============================================================
// Parlai — Curated YouTube Videos (Verified IDs)
// ============================================================

export interface CuratedVideo {
    youtube_id: string;
    title: string;
    channel_name: string;
    channel_url: string;
    cefr_level: string;
    topics: string[];
    why_included: string;
}

export const CURATED_VIDEOS: CuratedVideo[] = [
    // ── A1 — Super beginner ──
    {
        youtube_id: 'Irhfx_Zj9sQ',
        title: 'Talk About Yourself In Spanish',
        channel_name: 'Español con Juan',
        channel_url: 'https://www.youtube.com/@espaborjuan',
        cefr_level: 'A1',
        topics: ['basics', 'introduction', 'vocabulary'],
        why_included: 'Very clear speech, designed for total beginners, visual aids',
    },
    {
        youtube_id: 'rqiOwOmYO80',
        title: 'What Is Your Spanish Level? Watch This Video to Find Out!',
        channel_name: 'Dreaming Spanish',
        channel_url: 'https://www.youtube.com/@DreamingSpanish',
        cefr_level: 'A1',
        topics: ['comprehensible input', 'basics', 'assessment'],
        why_included: 'Comprehensible input method, visual context, slow speech',
    },

    // ── A2 — Elementary ──
    {
        youtube_id: '5fJm-0XI1FQ',
        title: 'Learn Spanish: 12 sentences to introduce yourself',
        channel_name: 'Butterfly Spanish',
        channel_url: 'https://www.youtube.com/@ButterflySpanish',
        cefr_level: 'A2',
        topics: ['conversation', 'basics', 'phrases'],
        why_included: 'Clear pronunciation, practical phrases, Mexican Spanish',
    },
    {
        youtube_id: 'yXAw2w11PFE',
        title: 'Spanish Stories for Complete Beginners (1 Hour)',
        channel_name: 'Dreaming Spanish',
        channel_url: 'https://www.youtube.com/@DreamingSpanish',
        cefr_level: 'A2',
        topics: ['stories', 'comprehensible input', 'listening'],
        why_included: 'Long-form comprehensible input, great for immersion sessions',
    },

    // ── B1 — Intermediate ──
    {
        youtube_id: '6qAmPjTXTCI',
        title: "What's a Typical Lunch in Spain?",
        channel_name: 'Easy Spanish',
        channel_url: 'https://www.youtube.com/@EasySpanish',
        cefr_level: 'B1',
        topics: ['culture', 'food', 'street interviews'],
        why_included: 'Real street interviews, natural speech with subtitles',
    },
    {
        youtube_id: 'c4GbuEiTfFY',
        title: 'Noticias del día en 10 minutos',
        channel_name: 'RTVE Noticias',
        channel_url: 'https://www.youtube.com/@rtvenoticias',
        cefr_level: 'B1',
        topics: ['news', 'current events', 'Spain'],
        why_included: 'Professional news delivery, clear Spanish, current events',
    },

    // ── B2 — Upper intermediate ──
    {
        youtube_id: 'pTZQzx7ILpg',
        title: 'El poder económico de China - ¿Qué dependiente es Europa?',
        channel_name: 'DW Documental',
        channel_url: 'https://www.youtube.com/@dwdocumental',
        cefr_level: 'B2',
        topics: ['documentary', 'economics', 'world affairs'],
        why_included: 'Professional narration, complex topics, rich vocabulary',
    },
    {
        youtube_id: '9tWMbi4e1EI',
        title: 'The best way to learn Spanish - El mejor modo de aprender español',
        channel_name: 'Español con Juan',
        channel_url: 'https://www.youtube.com/@espaborjuan',
        cefr_level: 'B2',
        topics: ['education', 'meta-learning', 'culture'],
        why_included: 'Natural conversational Spanish, meta-discussion about learning',
    },

    // ── C1 — Advanced ──
    {
        youtube_id: 'tR-IDHhtHRs',
        title: 'Racismo, odio y terror - Una red mundial de ultraderechistas',
        channel_name: 'DW Documental',
        channel_url: 'https://www.youtube.com/@dwdocumental',
        cefr_level: 'C1',
        topics: ['documentary', 'society', 'investigation'],
        why_included: 'Complex investigative documentary, advanced vocabulary',
    },
    {
        youtube_id: 'i5ui_DrtcpU',
        title: 'Cómo conocer a alguien en 30 segundos',
        channel_name: 'TEDx Talks',
        channel_url: 'https://www.youtube.com/@TEDxTalks',
        cefr_level: 'C1',
        topics: ['TED talk', 'communication', 'psychology'],
        why_included: 'Fast authentic speech, academic register, engaging topic',
    },
];
