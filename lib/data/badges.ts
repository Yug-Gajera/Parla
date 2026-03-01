import type { LucideIcon } from 'lucide-react';
import { MessageSquare, BookOpen, Award, Flame, CalendarCheck, Star, Hash, Globe } from 'lucide-react';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    earnedCriteria: string;
}

// All possible badges, matching the task spec
export const BADGES: Badge[] = [
    {
        id: 'first_conversation',
        name: 'First Conversation',
        description: 'Complete your first conversation',
        icon: MessageSquare,
        earnedCriteria: 'Complete 1 conversation'
    },
    {
        id: 'conversationalist',
        name: 'Conversationalist',
        description: 'Complete 5 conversations in a week',
        icon: MessageSquare,
        earnedCriteria: 'Complete 5 conversations in one week'
    },
    {
        id: 'word_collector',
        name: 'Word Collector',
        description: 'Learn 30 new words in a week',
        icon: BookOpen,
        earnedCriteria: 'Learn 30 words in one week'
    },
    {
        id: 'high_achiever',
        name: 'High Achiever',
        description: 'Score 85+ in any conversation',
        icon: Award,
        earnedCriteria: 'Score 85+ in a conversation'
    },
    {
        id: 'iron_discipline',
        name: 'Iron Discipline',
        description: 'Practice every day for 7 days',
        icon: Flame,
        earnedCriteria: 'Practice 7 days in a row'
    },
    {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Complete your daily goal 5 days in a week',
        icon: CalendarCheck,
        earnedCriteria: 'Hit daily goal 5 days in a week'
    },
    {
        id: 'perfect_week',
        name: 'Perfect Week',
        description: 'Hit daily goal every day for 7 days',
        icon: Star,
        earnedCriteria: 'Hit daily goal all 7 days'
    },
    {
        id: 'century',
        name: 'Century',
        description: 'Complete 100 conversations',
        icon: Hash,
        earnedCriteria: 'Complete 100 conversations'
    },
    {
        id: 'polyglot_preview',
        name: 'Polyglot Preview',
        description: 'Unlock second language (coming soon)',
        icon: Globe,
        earnedCriteria: 'Coming soon'
    }
];

export interface UserBadgeEarned {
    badgeId: string;
    earnedAt: string; // ISO date
}

/** Compute which badges the user has earned from their stats. */
export function computeEarnedBadges(stats: {
    conversationCount: number;
    streakDays: number;
    vocabLearnedThisWeek?: number;
    hasHighScore?: boolean;
    dailyGoalDaysThisWeek?: number;
    dailyGoalStreakDays?: number;
    firstConversationAt?: string;
    conversationCountThisWeek?: number;
}): UserBadgeEarned[] {
    const earned: UserBadgeEarned[] = [];
    const now = new Date().toISOString();

    if (stats.conversationCount >= 1 && stats.firstConversationAt) {
        earned.push({ badgeId: 'first_conversation', earnedAt: stats.firstConversationAt });
    }
    if (stats.conversationCount >= 100) {
        earned.push({ badgeId: 'century', earnedAt: now });
    }
    if (stats.streakDays >= 7) {
        earned.push({ badgeId: 'iron_discipline', earnedAt: now });
    }
    if (stats.vocabLearnedThisWeek && stats.vocabLearnedThisWeek >= 30) {
        earned.push({ badgeId: 'word_collector', earnedAt: now });
    }
    if (stats.hasHighScore) {
        earned.push({ badgeId: 'high_achiever', earnedAt: now });
    }
    if (stats.dailyGoalDaysThisWeek && stats.dailyGoalDaysThisWeek >= 5) {
        earned.push({ badgeId: 'week_warrior', earnedAt: now });
    }
    if (stats.dailyGoalStreakDays && stats.dailyGoalStreakDays >= 7) {
        earned.push({ badgeId: 'perfect_week', earnedAt: now });
    }
    if (stats.conversationCountThisWeek && stats.conversationCountThisWeek >= 5) {
        earned.push({ badgeId: 'conversationalist', earnedAt: now });
    } else if (stats.conversationCount >= 5) {
        earned.push({ badgeId: 'conversationalist', earnedAt: now });
    }

    return earned;
}
