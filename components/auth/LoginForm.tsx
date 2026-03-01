'use client';

// ============================================================
// FluentLoop — Login Form
// ============================================================

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, AudioLines, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ─── Schema ──────────────────────────────────────────────────

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

// ─── Component ───────────────────────────────────────────────

export default function LoginForm() {
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = React.useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    async function onSubmit(data: LoginValues) {
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                throw new Error(error.message);
            }

            toast.success('Welcome back!');
            router.push('/home');
            router.refresh();

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Invalid login credentials');
        } finally {
            setIsLoading(false);
        }
    }

    async function loginWithGoogle() {
        setIsGoogleLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/api/auth/callback`,
                },
            });

            if (error) throw new Error(error.message);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
            setIsGoogleLoading(false);
        }
    }

    return (
        <div className="w-full flex flex-col gap-6 p-8 bg-card rounded-2xl border border-border shadow-2xl">
            {/* ── Header ── */}
            <div className="flex flex-col items-center gap-2 text-center mb-2">
                <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-2">
                    <AudioLines size={28} />
                    <span>FluentLoop</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                    Continue your language journey
                </p>
            </div>

            {/* ── Google OAuth ── */}
            <Button
                variant="outline"
                type="button"
                className="w-full relative bg-transparent border-border hover:bg-secondary/50 text-foreground"
                onClick={loginWithGoogle}
                disabled={isLoading || isGoogleLoading}
            >
                {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                )}
                Sign in with Google
            </Button>

            {/* ── Divider ── */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
            </div>

            {/* ── Email Form ── */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Email Field */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        disabled={isLoading || isGoogleLoading}
                        {...form.register('email')}
                        className={`bg-background border-border ${form.formState.errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {form.formState.errors.email && (
                        <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                    )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            href="#"
                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                            tabIndex={-1}
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            disabled={isLoading || isGoogleLoading}
                            {...form.register('password')}
                            className={`bg-background border-border pr-10 ${form.formState.errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {form.formState.errors.password && (
                        <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                    )}
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-2"
                    disabled={isLoading || isGoogleLoading}
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Sign In
                </Button>

            </form>

            {/* ── Footer Link ── */}
            <div className="text-center text-sm text-muted-foreground mt-2">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-medium">
                    Sign up
                </Link>
            </div>

        </div>
    );
}
