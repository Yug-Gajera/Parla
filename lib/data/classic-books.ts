// ============================================================
// Parlai — Classic Books from Project Gutenberg (Verified IDs)
// ============================================================

export interface ClassicBookConfig {
    gutenbergId: number;
    title: string;
    author: string;
    cefr_level: string;
    description: string;
    cover_color: string;
    topics: string[];
}

export const CLASSIC_BOOKS: ClassicBookConfig[] = [
    // ── A2 — Simpler, poetic prose ──
    {
        gutenbergId: 9980,
        title: 'Platero y yo',
        author: 'Juan Ramón Jiménez',
        cefr_level: 'A2',
        description: 'A poet and his small silver donkey explore the countryside of Moguer, Andalusia. Short lyrical chapters perfect for beginners.',
        cover_color: '#0891b2',
        topics: ['poetry', 'nature', 'classic'],
    },

    // ── B1 — Picaresque and comedy ──
    {
        gutenbergId: 320,
        title: 'Lazarillo de Tormes',
        author: 'Anónimo',
        cefr_level: 'B1',
        description: 'The original picaresque novel. Young Lázaro survives by his wits, serving a series of masters across 16th-century Spain.',
        cover_color: '#d97706',
        topics: ['picaresque', 'classic', 'humor'],
    },
    {
        gutenbergId: 29506,
        title: 'El sombrero de tres picos',
        author: 'Pedro Antonio de Alarcón',
        cefr_level: 'B1',
        description: 'A tale of mistaken identities in 1800s Granada. A corrupt magistrate schemes to seduce a miller\'s wife, with hilarious consequences.',
        cover_color: '#7c3aed',
        topics: ['comedy', 'classic', 'Spain'],
    },

    // ── B2 — Richer vocabulary, complex themes ──
    {
        gutenbergId: 17223,
        title: 'Pepita Jiménez',
        author: 'Juan Valera',
        cefr_level: 'B2',
        description: 'A young seminarian returns to his village and meets a widow his father plans to marry. A psychological novel about faith versus desire.',
        cover_color: '#dc2626',
        topics: ['romance', 'classic', 'Spain'],
    },
    {
        gutenbergId: 1619,
        title: 'La Celestina',
        author: 'Fernando de Rojas',
        cefr_level: 'B2',
        description: 'The great tragicomedy of Calisto and Melibea. A matchmaker weaves a web of love, deception, and tragedy in medieval Spain.',
        cover_color: '#059669',
        topics: ['drama', 'classic', 'Spain'],
    },

    // ── C1 — Sophisticated realism ──
    {
        gutenbergId: 17073,
        title: 'La Regenta',
        author: 'Leopoldo Alas (Clarín)',
        cefr_level: 'C1',
        description: 'Ana Ozores is trapped in a loveless marriage in provincial Vetusta. Two men compete for her attention in this masterpiece of Spanish realism.',
        cover_color: '#0891b2',
        topics: ['realism', 'classic', 'Spain'],
    },

    // ── C2 — The masterpiece ──
    {
        gutenbergId: 2000,
        title: 'Don Quijote',
        author: 'Miguel de Cervantes',
        cefr_level: 'C2',
        description: 'The founding work of Western literature. A nobleman loses his sanity reading romances and sets out as a knight-errant with his squire Sancho.',
        cover_color: '#d97706',
        topics: ['adventure', 'classic', 'masterpiece'],
    },
];
