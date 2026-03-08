// ============================================================
// Parlova — RSS Feed Configuration (3 Launch Feeds)
// ============================================================

export interface RSSFeed {
    name: string;
    url: string;
    language: string;
    default_level: string;
    level_range: [string, string];
    topics: string[];
    color: string; // for UI source badge
}

export const RSS_FEEDS: RSSFeed[] = [
    {
        name: 'BBC Mundo',
        url: 'https://feeds.bbci.co.uk/mundo/rss.xml',
        language: 'es',
        default_level: 'B2',
        level_range: ['B1', 'C1'],
        topics: ['world news', 'politics', 'culture'],
        color: '#dc2626', // red
    },
    {
        name: 'DW Español',
        url: 'https://rss.dw.com/rdf/rss-es-all',
        language: 'es',
        default_level: 'B1',
        level_range: ['A2', 'B2'],
        topics: ['news', 'science', 'environment'],
        color: '#eab308', // yellow
    },
    {
        name: '20 Minutos',
        url: 'https://www.20minutos.es/rss/',
        language: 'es',
        default_level: 'B1',
        level_range: ['A2', 'B2'],
        topics: ['lifestyle', 'news', 'entertainment'],
        color: '#3b82f6', // blue — simpler Spanish, good for lower levels
    },
];
