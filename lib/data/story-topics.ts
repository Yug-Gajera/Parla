// ============================================================
// Parlova — Story Topics & Content Types
// ============================================================

export interface TopicCategory {
    id: string;
    name: string;
    emoji: string;
    topics: string[];
}

export interface ContentType {
    id: string;
    label: string;
    description: string;
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
    {
        id: 'daily_life',
        name: 'Daily Life',
        emoji: '🏠',
        topics: ['morning routine', 'cooking at home', 'grocery shopping', 'family dinner', 'weekend plans', 'getting ready for work'],
    },
    {
        id: 'travel',
        name: 'Travel',
        emoji: '✈️',
        topics: ['arriving in a new city', 'getting lost', 'finding accommodation', 'local food', 'missing transport', 'meeting locals'],
    },
    {
        id: 'food',
        name: 'Food',
        emoji: '🍕',
        topics: ['learning a recipe', 'cooking mistake', 'market visit', 'restaurant experience', 'street food', 'food traditions'],
    },
    {
        id: 'work',
        name: 'Work',
        emoji: '💼',
        topics: ['first day at job', 'difficult coworker', 'working from home', 'career decision', 'team project', 'asking for raise'],
    },
    {
        id: 'health',
        name: 'Health',
        emoji: '🏃',
        topics: ['starting exercise', 'doctor visit', 'trying new diet', 'sleep problems', 'healthy habits', 'sports injury'],
    },
    {
        id: 'relationships',
        name: 'Relationships',
        emoji: '👥',
        topics: ['making friends', 'family disagreement', 'helping neighbor', 'cultural misunderstanding', 'reconnecting with friend', 'generational gap'],
    },
];

export const CONTENT_TYPES: ContentType[] = [
    { id: 'short_story', label: 'Story', description: 'Narrative with characters and simple plot' },
    { id: 'dialogue', label: 'Dialogue', description: 'Natural conversation between 2 people' },
    { id: 'letter', label: 'Letter', description: 'Personal letter or email' },
    { id: 'journal', label: 'Journal', description: 'Diary entry from a character' },
];

export function getRandomTopic(categoryId: string): string {
    const cat = TOPIC_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return 'daily life';
    return cat.topics[Math.floor(Math.random() * cat.topics.length)];
}
