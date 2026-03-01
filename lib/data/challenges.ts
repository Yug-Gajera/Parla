import { getWeekStartDate } from '@/lib/utils/level';

export interface Challenge {
    id: string;
    name: string;
    description: string;
    reward_xp: number;
    reward_badge: string;
    progress_target: number;
    completion_criteria: 'conversation_count' | 'vocabulary_learned' | 'high_score' | 'consistency';
    action_url: string;
}

// 4 Rotating weekly challenges
export const CHALLENGE_TEMPLATES: Challenge[] = [
    {
        id: 'challenge-1-conversation',
        name: 'Conversation Week',
        description: 'Complete 5 conversation sessions this week',
        reward_xp: 200,
        reward_badge: 'Conversationalist',
        progress_target: 5,
        completion_criteria: 'conversation_count',
        action_url: '/practice'
    },
    {
        id: 'challenge-2-vocabulary',
        name: 'Vocabulary Builder',
        description: 'Learn 30 new words this week',
        reward_xp: 150,
        reward_badge: 'Word Collector',
        progress_target: 30,
        completion_criteria: 'vocabulary_learned',
        action_url: '/learn'
    },
    {
        id: 'challenge-3-perfect',
        name: 'Perfect Score',
        description: 'Achieve a score of 85 or higher in any conversation',
        reward_xp: 250,
        reward_badge: 'High Achiever',
        progress_target: 1, // binary 0 or 1
        completion_criteria: 'high_score',
        action_url: '/practice'
    },
    {
        id: 'challenge-4-consistency',
        name: 'Consistency',
        description: 'Practice every day for 7 days',
        reward_xp: 300,
        reward_badge: 'Iron Discipline',
        progress_target: 7,
        completion_criteria: 'consistency',
        action_url: '/home'
    }
];

// Resolves which template is active based on the week of the year
export function getActiveChallengeForWeek(date = new Date()): Challenge {
    const startDate = getWeekStartDate(date);
    // Simple rough week number calculation
    const startOfYear = new Date(startDate.getFullYear(), 0, 1);
    const days = Math.floor((startDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((startDate.getDay() + 1 + days) / 7);

    // Rotate through the 4 templates based on modulo math
    const templateIndex = weekNumber % 4;
    return CHALLENGE_TEMPLATES[templateIndex];
}
