export const dynamic = "force-dynamic";
// ============================================================
// Parlova — Login Page
// ============================================================

import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
    title: 'Log In | Parlova',
    description: 'Sign in to continue your language learning journey.',
};

export default function LoginPage() {
    return <LoginForm />;
}
