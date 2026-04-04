"use client";

// ============================================================
// Parlova — Dashboard Layout (Redesigned)
// ============================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, Layers, BookOpen, Mic2, Trophy, User, 
    AudioLines, Settings2, GraduationCap, Sparkles, BarChart3, LogOut 
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Home', href: '/home' },
    { icon: Layers, label: 'Learn', href: '/learn' },
    { icon: BookOpen, label: 'Read', href: '/read' },
    { icon: Mic2, label: 'Practice', href: '/practice' },
    { icon: Trophy, label: 'Compete', href: '/compete' },
    { icon: User, label: 'Profile', href: '/profile' },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-background flex flex-col w-full text-text-primary relative md:pl-[240px]">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[240px] flex-col overflow-y-auto bg-surface border-r border-border py-6 z-50">
                {/* Logo */}
                <div className="px-5 pb-6 border-b border-border mb-2">
                    <Link href="/home" className="flex items-center gap-2.5">
                        <AudioLines size={20} className="text-accent" />
                        <span className="font-display font-semibold text-xl text-text-primary tracking-wide">Parlova</span>
                    </Link>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 flex flex-col mt-2">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center gap-3 pl-5 pr-4 py-2 my-1 rounded-r-none text-sm font-medium transition-all duration-200 border-r-2 ${
                                    isActive 
                                        ? 'bg-accent-subtle text-accent border-r-accent font-semibold' 
                                        : 'text-text-secondary border-r-transparent hover:text-text-primary'
                                }`}
                                style={!isActive ? { marginLeft: '12px', marginRight: '12px', borderRadius: '8px' } : {}}
                            >
                                <div className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-transparent' 
                                        : 'bg-transparent group-hover:bg-accent-subtle/50'
                                }`}>
                                    <Icon 
                                        size={16} 
                                        strokeWidth={isActive ? 2 : 1.5} 
                                        className={isActive ? 'text-accent' : 'text-text-muted transition-colors duration-200'}
                                    />
                                </div>
                                <span className={isActive ? 'tracking-wide' : 'tracking-wide group-hover:text-text-secondary'}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Settings */}
                <Link
                    href="/settings"
                    className={`group flex items-center gap-3 pl-5 pr-4 py-2 mt-auto text-sm font-medium transition-all duration-200 border-r-2 ${
                        pathname.startsWith('/settings') 
                            ? 'bg-accent-subtle text-accent border-r-accent font-semibold' 
                            : 'text-text-secondary border-r-transparent hover:text-text-primary'
                    }`}
                    style={!pathname.startsWith('/settings') ? { marginLeft: '12px', marginRight: '12px', borderRadius: '8px' } : {}}
                >
                    <div className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all duration-200 ${
                        pathname.startsWith('/settings') 
                            ? 'bg-transparent' 
                            : 'bg-transparent group-hover:bg-accent-subtle/50'
                    }`}>
                        <Settings2 
                            size={16} 
                            strokeWidth={pathname.startsWith('/settings') ? 2 : 1.5} 
                            className={pathname.startsWith('/settings') ? 'text-accent' : 'text-text-muted'}
                        />
                    </div>
                    <span className={pathname.startsWith('/settings') ? 'tracking-wide' : 'tracking-wide group-hover:text-text-secondary'}>
                        Settings
                    </span>
                </Link>

                {/* User Area */}
                <div className="px-5 py-4 border-t border-border mt-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent-border text-accent font-serif font-semibold flex items-center justify-center">
                        FL
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm font-medium text-text-primary tracking-wide truncate">Learner</span>
                        <span className="text-[10px] font-mono text-accent uppercase tracking-widest font-bold">Immersion Tier</span>
                    </div>
                </div>
            </aside>

            {/* ── Top Bar (Desktop) ── */}
            <header className="hidden md:flex fixed top-0 right-0 left-[240px] h-[64px] bg-background/80 backdrop-blur-md border-b border-border items-center justify-end px-8 z-40">
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                </div>
            </header>

            {/* ── Main Content Area ── */}
            <main className="flex-1 flex flex-col w-full pb-[80px] md:pb-0 md:pt-[64px] min-h-screen max-w-[900px] mx-auto overflow-x-hidden relative">
                {/* Mobile header with settings & theme toggle */}
                <div className="md:hidden absolute top-0 right-[16px] pt-[24px] z-30 flex items-center gap-2">
                    <ThemeToggle />
                    <Link
                        href="/settings"
                        className="p-[8px] rounded-full text-text-secondary hover:text-text-primary hover:bg-accent-subtle transition-colors"
                        aria-label="Settings"
                    >
                        <Settings2 size={22} strokeWidth={1.5} />
                    </Link>
                </div>
                {children}
            </main>

            {/* ── Mobile Bottom Nav ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-background/90 backdrop-blur-xl border-t border-border grid grid-cols-6 items-center px-1 pb-[env(safe-area-inset-bottom)] z-[100]">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    // Primary Action (Practice/Speak)
                    if (item.href === '/practice') {
                        return (
                            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-1 py-1 no-underline">
                                <div className={`w-[48px] h-[48px] rounded-[14px] flex items-center justify-center -mt-[16px] transition-all duration-200 border ${
                                    isActive 
                                        ? 'bg-accent border-accent shadow-md shadow-accent/20 text-bg' 
                                        : 'bg-accent-subtle border-accent-border shadow-none text-accent'
                                }`}>
                                    <Icon
                                        size={20}
                                        strokeWidth={isActive ? 2 : 1.5}
                                    />
                                </div>
                                <span className={`font-body text-[10px] tracking-[0.02em] ${isActive ? 'font-semibold text-accent' : 'font-normal text-text-muted'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    }

                    // Standard tabs
                    return (
                        <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-1 py-1 no-underline">
                            <div className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all duration-150 ${
                                isActive ? 'bg-accent-subtle font-semibold text-accent' : 'bg-transparent text-text-muted font-normal'
                            }`}>
                                <Icon
                                    size={18}
                                    strokeWidth={isActive ? 2 : 1.5}
                                    className="transition-all duration-150"
                                />
                            </div>
                            <span className={`font-body text-[10px] tracking-[0.02em] transition-colors duration-150 ${
                                isActive ? 'font-semibold text-accent' : 'font-normal text-text-muted'
                            }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

        </div>
    );
}
