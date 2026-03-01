// ============================================================
// FluentLoop — SM-2 Spaced Repetition Algorithm
// ============================================================

export interface SM2Result {
    interval_days: number;
    ease_factor: number;
    next_review_date: string;
}

/**
 * Calculates the next interval and ease factor based on the SM-2 algorithm.
 * 
 * Quality ratings:
 * 0: Complete blackout
 * 1: Incorrect response; remembered reading it
 * 2: Incorrect response; where the correct one seemed easy to recall
 * 3: Correct response recalled with serious difficulty (Hard)
 * 4: Correct response after a hesitation (Good)
 * 5: Perfect response (Easy)
 */
export function calculateSM2(
    quality: number,
    previousInterval: number,
    previousEaseFactor: number,
    timesSeen: number
): SM2Result {
    let interval: number;
    let easeFactor = previousEaseFactor;

    // 1. Calculate new Interval
    if (quality < 3) {
        // Failed recall: reset interval to 1 day
        interval = 1;
    } else {
        // Successful recall
        if (timesSeen === 0 || timesSeen === 1) {
            interval = 1;
        } else if (timesSeen === 2) {
            interval = 6;
        } else {
            interval = Math.round(previousInterval * previousEaseFactor);
        }
    }

    // 2. Calculate new Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Minimum ease factor is 1.3
    if (easeFactor < 1.3) {
        easeFactor = 1.3;
    }

    // 3. Calculate next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    // Return just the date string (YYYY-MM-DD format works well with Postgres date type)
    const next_review_date = nextDate.toISOString().split('T')[0];

    return {
        interval_days: interval,
        ease_factor: Number(easeFactor.toFixed(3)),
        next_review_date
    };
}

/**
 * Helper to get the status text for a word based on its SRS states
 */
export function getWordStatus(timesCorrect: number, nextReviewDate: string, intervalDays: number): 'new' | 'learning' | 'familiar' | 'mastered' {
    if (timesCorrect === 0) return 'new';
    if (intervalDays >= 21) return 'mastered';
    if (intervalDays >= 7) return 'familiar';
    return 'learning';
}
