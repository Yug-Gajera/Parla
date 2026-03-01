'use client';

// ============================================================
// FluentLoop — Dashboard Layout
// ============================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Mic, Trophy, User, AudioLines, Settings } from 'lucide-react';

const NAV_ITEMS = [
    { icon: Home, label: 'Home', href: '/home' },
    { icon: BookOpen, label: 'Learn', href: '/learn' },
    { icon: Mic, label: 'Practice', href: '/practice' },
    { icon: Trophy, label: 'Compete', href: '/compete' },
    { icon: User, label: 'Profile', href: '/profile' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row w-full text-foreground relative">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex flex-col w-[260px] border-r border-border bg-card/50 backdrop-blur-xl h-screen sticky top-0 px-4 py-8 z-40">

                {/* Logo */}
                <Link href="/home" className="flex items-center gap-2 text-primary font-bold text-xl mb-10 px-2">
                    <AudioLines size={24} />
                    <span>FluentLoop</span>
                </Link>

                {/* Nav Links */}
                <nav className="flex-1 flex flex-col gap-2">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Settings - desktop */}
                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${pathname.startsWith('/settings')
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                >
                    <Settings size={20} className={pathname.startsWith('/settings') ? 'text-primary' : 'text-muted-foreground'} />
                    <span>Settings</span>
                </Link>

                {/* User Area Placeholder config */}
                <div className="mt-auto px-2 pt-6 border-t border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm text-foreground">
                        FL
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">Learner</span>
                        <span className="text-xs text-muted-foreground">Pro Member</span>
                    </div>
                </div>
            </aside>

            {/* ── Main Content Area ── */}
            <main className="flex-1 flex flex-col w-full pb-20 md:pb-0 min-h-screen max-w-[1200px] mx-auto overflow-x-hidden relative">
                {/* Mobile header with settings gear */}
                <div className="md:hidden absolute top-0 right-4 pt-6 z-30">
                    <Link
                        href="/settings"
                        className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        aria-label="Settings"
                    >
                        <Settings size={22} />
                    </Link>
                </div>
                {children}
            </main>

            {/* ── Mobile Bottom Nav ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 z-50 rounded-t-2xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)]">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                                }`}
                        >
                            <div className={`p-1.5 rounded-full transition-all ${isActive ? 'bg-primary/10' : 'bg-transparent'}`}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            {/* Optional tiny label for mobile */}
                            {/* <span className="text-[10px] font-medium">{item.label}</span> */}
                        </Link>
                    );
                })}
            </nav>

        </div>
    );
}
