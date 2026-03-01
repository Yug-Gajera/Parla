import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 pb-24">
            <h1 className="text-3xl font-black text-foreground mb-8">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">
                Privacy policy content will be added here. This is a placeholder page.
            </p>
            <Link href="/settings" className="text-primary hover:underline">
                ← Back to Settings
            </Link>
        </div>
    );
}
