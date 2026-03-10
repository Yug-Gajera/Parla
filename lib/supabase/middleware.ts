// ============================================================
// Parlova — Supabase Auth Middleware
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/home',
    '/learn',
    '/practice',
    '/compete',
    '/profile',
    '/onboarding',
];

// Routes only accessible to unauthenticated users
const AUTH_ROUTES = ['/login', '/signup'];

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Guard: if env vars aren't available, skip auth checks
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase env vars in middleware');
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Do NOT use getSession() — it reads from cookies which
    // can be spoofed. getUser() always hits the Supabase Auth server.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Check if the current path matches a protected or auth route
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
    );
    const isAuthRoute = AUTH_ROUTES.some((route) =>
        pathname.startsWith(route)
    );

    // ── Unauthenticated user hitting a protected route → login ──
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // ── Authenticated user hitting login/signup → home ──
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/home';
        return NextResponse.redirect(url);
    }

    // ── Authenticated user: check onboarding completion ──
    if (user && isProtectedRoute && !pathname.startsWith('/onboarding')) {
        const { data: userLanguages } = await supabase
            .from('user_languages')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

        // No languages selected → needs onboarding
        if (!userLanguages || userLanguages.length === 0) {
            const url = request.nextUrl.clone();
            url.pathname = '/onboarding';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
