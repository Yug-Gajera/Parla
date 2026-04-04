// ============================================================
// Parlai — Curated Podcast Shows
// ============================================================

export interface PodcastShowConfig {
    name: string;
    description: string;
    rss_url: string;
    cover_color: string;
    cefr_level_range: string[];
    topics: string[];
    has_transcripts: boolean;
}

export const PODCAST_SHOWS: PodcastShowConfig[] = [
    {
        name: 'Coffee Break Spanish',
        description: 'Learn Spanish with Mark and his teacher Kara. Structured lessons from absolute beginner to advanced, with grammar explanations and cultural insights.',
        rss_url: 'https://feeds.acast.com/public/shows/coffee-break-spanish',
        cover_color: '#8b1a1a',
        cefr_level_range: ['A1', 'A2', 'B1', 'B2'],
        topics: ['grammar', 'conversation', 'travel'],
        has_transcripts: true,
    },
    {
        name: 'Notes in Spanish',
        description: 'Ben and Marina discuss daily life, culture, and current events in Spain. Authentic conversations between a native speaker and a learner.',
        rss_url: 'https://www.notesinspanish.com/category/intermediate-spanish-podcast/feed/',
        cover_color: '#1a4a8b',
        cefr_level_range: ['A2', 'B1', 'B2', 'C1'],
        topics: ['culture', 'conversation', 'spain'],
        has_transcripts: true,
    },
    {
        name: 'Dreaming Spanish Podcast',
        description: 'Comprehensible input in Spanish. Topics range from daily life to science and history, all spoken clearly for learners.',
        rss_url: 'https://rss.buzzsprout.com/1770956.rss',
        cover_color: '#1a8b4a',
        cefr_level_range: ['A2', 'B1', 'B2', 'C1'],
        topics: ['culture', 'stories', 'comprehensible input'],
        has_transcripts: false,
    },
    {
        name: 'Radio Ambulante',
        description: 'Award-winning Latin American journalism. Long-form storytelling from across the Spanish-speaking world. For advanced learners.',
        rss_url: 'https://feeds.npr.org/510315/podcast.xml',
        cover_color: '#8b4a1a',
        cefr_level_range: ['C1', 'C2'],
        topics: ['latin america', 'journalism', 'stories'],
        has_transcripts: true,
    },
];
