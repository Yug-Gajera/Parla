import { createClient } from '@/lib/supabase/server';

export type RateLimitOperation =
  | 'conversation'
  | 'word_lookup'
  | 'story'
  | 'article'
  | 'tts';

type PlanKey = 'free' | 'pro' | 'pro_plus';

const LIMITS: Record<PlanKey, Record<RateLimitOperation, number>> = {
  free: {
    conversation: 1,
    word_lookup: 10,
    story: 3,
    article: 5,
    tts: 50,
  },
  pro: {
    conversation: 10,
    word_lookup: 100,
    story: 10,
    article: 999999,
    tts: 500,
  },
  pro_plus: {
    conversation: 20,
    word_lookup: 200,
    story: 20,
    article: 999999,
    tts: 1000,
  },
};

const TEST_EMAILS = [
  'yuggajera2006@gmail.com',
  'yuggajera66@gmail.com',
  'yuggajerahl@gmail.com',
];

const WARNING_THRESHOLD = 0.8;

function normalizePlan(userPlan: string): PlanKey {
  if (userPlan === 'pro' || userPlan === 'pro_plus') return userPlan;
  return 'free';
}

function getTodayUtcDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowMidnightUTC(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

export async function checkRateLimit(
  userId: string,
  userEmail: string,
  userPlan: 'free' | 'pro' | 'pro_plus',
  operation: RateLimitOperation
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  isWarning: boolean;
  resetAt: string;
}> {
  const supabase = await createClient();
  const today = getTodayUtcDate();

  const basePlan = normalizePlan(userPlan);
  const baseLimit = LIMITS[basePlan][operation];
  const isTestAccount = TEST_EMAILS.includes((userEmail || '').toLowerCase());
  const limit = isTestAccount ? baseLimit * 10 : baseLimit;

  const { data: rateLimitRow } = await (supabase as any)
    .from('rate_limits')
    .select('count')
    .eq('user_id', userId)
    .eq('operation', operation)
    .eq('date', today)
    .maybeSingle();

  const current = rateLimitRow?.count || 0;
  const remaining = Math.max(0, limit - current);
  const isWarning =
    current >= Math.floor(limit * WARNING_THRESHOLD) && current < limit;

  return {
    allowed: isTestAccount ? true : current < limit,
    current,
    limit,
    remaining,
    isWarning,
    resetAt: getTomorrowMidnightUTC(),
  };
}

export async function recordUsage(
  userId: string,
  operation: RateLimitOperation
): Promise<void> {
  const supabase = await createClient();
  const today = getTodayUtcDate();

  const { error } = await (supabase as any).rpc('increment_rate_limit', {
    p_user_id: userId,
    p_operation: operation,
    p_date: today,
  });

  if (error) {
    console.error('[rateLimits] increment_rate_limit failed:', error);
  }
}
