export const dynamic = "force-dynamic";

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const FOUNDER_EMAILS = [
  'yuggajera2006@gmail.com',
  'yuggajera66@gmail.com',
  'yuggajerahl@gmail.com',
];

function getLimit(plan: string, operation: string): number {
  const limits: Record<string, Record<string, number>> = {
    free: { conversation: 1, word_lookup: 10, story: 3, article: 5, tts: 50 },
    pro: { conversation: 10, word_lookup: 100, story: 10, article: 999999, tts: 500 },
    pro_plus: { conversation: 20, word_lookup: 200, story: 20, article: 999999, tts: 1000 },
  };
  return limits[plan]?.[operation] ?? limits.free[operation] ?? 1;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !FOUNDER_EMAILS.includes((user.email || '').toLowerCase())) {
    redirect('/home');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: topRows } = await (supabase as any)
    .from('rate_limits')
    .select('operation, count, user_id, users!inner(email, plan)')
    .eq('date', today)
    .order('count', { ascending: false })
    .limit(20);

  const { data: totalsRows } = await (supabase as any)
    .from('rate_limits')
    .select('operation, count, user_id')
    .eq('date', today);

  const totalsMap = (totalsRows || []).reduce((acc: any, row: any) => {
    const key = row.operation;
    if (!acc[key]) acc[key] = { total_calls: 0, users: new Set<string>() };
    acc[key].total_calls += row.count;
    acc[key].users.add(row.user_id);
    return acc;
  }, {} as Record<string, { total_calls: number; users: Set<string> }>);

  const totals = (Object.entries(totalsMap) as Array<[string, { total_calls: number; users: Set<string> }]>)
    .map(([operation, value]) => ({
      operation,
      total_calls: value.total_calls,
      unique_users: value.users.size,
    }))
    .sort((a, b) => b.total_calls - a.total_calls);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-display mb-6 text-text-primary">Rate Limits Dashboard</h1>

      <div className="mb-10 rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold mb-3 text-text-primary">Top Users by Usage Today</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border text-text-muted">
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Operation</th>
                <th className="py-2 pr-3">Count today</th>
                <th className="py-2">% of limit</th>
              </tr>
            </thead>
            <tbody>
              {(topRows || []).map((row: any, idx: number) => {
                const plan = row.users?.plan || 'free';
                const limit = getLimit(plan, row.operation);
                const percent = Math.min(100, Math.round((row.count / Math.max(1, limit)) * 100));
                const isHot = row.count / Math.max(1, limit) > 0.8;
                return (
                  <tr key={`${row.user_id}-${row.operation}-${idx}`} className={isHot ? 'bg-[#E8521A]/10' : ''}>
                    <td className="py-2 pr-3 text-text-primary">{row.users?.email}</td>
                    <td className="py-2 pr-3 text-text-secondary">{plan}</td>
                    <td className="py-2 pr-3 text-text-secondary">{row.operation}</td>
                    <td className="py-2 pr-3 text-text-primary">{row.count}</td>
                    <td className="py-2 text-text-secondary">{percent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold mb-3 text-text-primary">Total API Calls Today</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border text-text-muted">
                <th className="py-2 pr-3">Operation</th>
                <th className="py-2 pr-3">Total calls</th>
                <th className="py-2">Unique users</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((row) => (
                <tr key={row.operation}>
                  <td className="py-2 pr-3 text-text-secondary">{row.operation}</td>
                  <td className="py-2 pr-3 text-text-primary">{row.total_calls}</td>
                  <td className="py-2 text-text-primary">{row.unique_users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
