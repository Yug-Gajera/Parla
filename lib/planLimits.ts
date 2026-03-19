// ============================================================
// Parlova — Plan Limits & Usage Helper
// ============================================================

import { createClient } from '@/lib/supabase/server';

export const FREE_LIMITS = {
  conversations_per_week: 3,
  articles_per_week: 5,
  stories_per_week: 3,
  word_lookups_per_day: 10,
};

/**
 * Retrieves the current plan for a user and handles expiration logic.
 */
export async function getUserPlan(userId: string) {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from('user_profiles')
    .select('plan, plan_expires_at, is_beta_user')
    .eq('id', userId)
    .single();

  if (!data) return 'free';

  // Check for expiration
  if (data.plan_expires_at && new Date(data.plan_expires_at) < new Date()) {
    await (supabase as any)
      .from('user_profiles')
      .update({ plan: 'free', plan_expires_at: null } as any)
      .eq('id', userId);
    return 'free';
  }

  return data.plan || 'free';
}

/**
 * Checks if a user is within their tier limits for a specific metric.
 */
export async function checkLimit(
  userId: string,
  metric: 'conversation' | 'article' | 'story' | 'word_lookup',
  plan: string
): Promise<{ allowed: boolean; remaining: number }> {
  // Pro and Pro Plus have unlimited access to standard features
  if (plan === 'pro' || plan === 'pro_plus') {
    return { allowed: true, remaining: 999 };
  }

  const supabase = await createClient();
  const now = new Date();
  const week = getWeekNumber(now);
  const year = now.getFullYear();

  const limitKey = metric === 'word_lookup'
    ? 'word_lookups_per_day'
    : `${metric}s_per_week`;

  const limit = FREE_LIMITS[limitKey as keyof typeof FREE_LIMITS];

  let query = (supabase as any)
    .from('usage_tracking')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('metric', metric);

  if (metric === 'word_lookup') {
    // Check usage for today (UTC date string)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    query = query.gte('counted_at', todayStart.toISOString());
  } else {
    // Check usage for current week/year
    query = query
      .eq('week_number', week)
      .eq('year_number', year);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`[checkLimit] Error checking ${metric} limit:`, error);
    return { allowed: false, remaining: 0 };
  }

  const used = count || 0;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    remaining,
  };
}

/**
 * Records a usage event in the tracking table.
 */
export async function recordUsage(userId: string, metric: string) {
  const supabase = await createClient();
  const now = new Date();

  const { error } = await (supabase as any).from('usage_tracking').insert({
    user_id: userId,
    metric,
    counted_at: now.toISOString(),
    week_number: getWeekNumber(now),
    year_number: now.getFullYear(),
  } as any);

  if (error) {
    console.error(`[recordUsage] Error recording ${metric} usage:`, error);
  }
}

/**
 * Calculates ISO week number.
 */
function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 
    - 3 + (week1.getDay() + 6) % 7) / 7
  );
}
