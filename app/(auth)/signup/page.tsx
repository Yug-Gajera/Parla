export const dynamic = "force-dynamic";
// ============================================================
// Parlova — Signup Page
// ============================================================

import { Metadata } from 'next';
import SignupForm from '@/components/auth/SignupForm';

export const metadata: Metadata = {
    title: 'Sign Up | Parlova',
    description: 'Join thousands of language learners and start your journey today.',
};

export default function SignupPage() {
    return <SignupForm />;
}
