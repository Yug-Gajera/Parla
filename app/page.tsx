import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import LandingClient from './landing-client';
import { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const isLoggedIn = !!data?.user;

  return (
    <LandingClient isLoggedIn={isLoggedIn} />
  );
}
