// ============================================================
// Parlova — Environment Variable Validation
// ============================================================

const requiredServerVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
] as const;

const requiredPublicVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL',
] as const;

// Optional vars that won't cause a crash if missing
const optionalVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
] as const;

interface Env {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // OpenAI
    OPENAI_API_KEY: string;

    // App
    NEXT_PUBLIC_APP_URL: string;

    // Stripe (optional)
    STRIPE_SECRET_KEY: string | undefined;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string | undefined;
    STRIPE_WEBHOOK_SECRET: string | undefined;
}

function validateEnv(): Env {
    const isServer = typeof window === 'undefined';

    const requiredVars = isServer
        ? [...requiredServerVars, ...requiredPublicVars]
        : [...requiredPublicVars];

    // De-duplicate
    const uniqueRequired = Array.from(new Set(requiredVars as unknown as string[]));

    const missing = uniqueRequired.filter((key) => {
        const value = process.env[key];
        return !value || value.trim() === '';
    });

    if (missing.length > 0) {
        throw new Error(
            `❌ Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nCopy .env.local.example to .env.local and fill in the values.`
        );
    }

    return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    };
}

export const env = validateEnv();
