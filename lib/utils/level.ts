// Points within each CEFR level (0-100)
export const LEVEL_POINTS = 100;

// Points granted for different user actions
export const SCORING = {
    CONVERSATION_BASE: 50,
    CONVERSATION_SCORE_MULTIPLIER: 0.5, // (overall_score / 2)
    CONVERSATION_PERFECT_BONUS: 75, // Score >= 100
    VOCABULARY_REVIEW: 20, // Per 10 cards
    DAILY_GOAL_MET: 100,
    STREAK_7_DAY_BONUS: 50
};

// Calculate the start of the week (Monday) local time
export function getWeekStartDate(date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Calculate the end of the week (Sunday at 23:59:59.999)
export function getWeekEndDate(weekStartDate: Date): Date {
    const end = new Date(weekStartDate);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}

// Map the granular CEFR levels into Competition Bands
// For example, if there aren't enough C2 players, they compete against C1.
export function getLevelBand(level: string): string {
    if (['A1', 'A2'].includes(level)) return 'Beginner (A1-A2)';
    if (['B1', 'B2'].includes(level)) return 'Intermediate (B1-B2)';
    if (['C1', 'C2'].includes(level)) return 'Advanced (C1-C2)';
    return 'Beginner (A1-A2)';
}
