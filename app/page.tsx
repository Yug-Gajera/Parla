import { redirect } from 'next/navigation';

// By default Next.js might try to cache or statically generate if possible
// We force dynamic because we rely on the search params (which depends on request context)
export const dynamic = 'force-dynamic';

export default function RootPage() {
  redirect('/home');
}
