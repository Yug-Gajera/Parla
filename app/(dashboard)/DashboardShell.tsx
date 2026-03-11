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
        <div className="min-h-screen bg-[#080808] flex flex-col w-full text-[#f0ece4] relative md:pl-[240px]">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[240px] flex-col overflow-y-auto bg-[#0f0f0f] border-r border-[#1e1e1e] py-6 z-50">
                {/* Logo */}
                <div className="px-5 pb-6 border-b border-[#1e1e1e] mb-2">
                    <Link href="/home" className="flex items-center gap-2.5">
                        <AudioLines size={20} className="text-[#c9a84c]" />
                        <span className="font-serif font-semibold text-xl text-[#f0ece4] tracking-wide">Parlova</span>
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
                                        ? 'bg-[#141414] text-[#c9a84c] border-r-[#c9a84c] shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]' 
                                        : 'text-[#9a9590] border-r-transparent hover:text-[#f0ece4]'
                                }`}
                                style={!isActive ? { marginLeft: '12px', marginRight: '12px', borderRadius: '8px' } : {}}
                            >
                                <div className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-[rgba(201,168,76,0.08)]' 
                                        : 'bg-transparent group-hover:bg-[rgba(255,255,255,0.04)]'
                                }`}>
                                    <Icon 
                                        size={16} 
                                        strokeWidth={isActive ? 2 : 1.5} 
                                        color={isActive ? '#c9a84c' : '#5a5652'}
                                        style={{ transition: 'color 0.2s ease' }}
                                    />
                                </div>
                                <span className={isActive ? 'font-semibold tracking-wide text-[#c9a84c]' : 'tracking-wide text-[#5a5652] group-hover:text-[#9a9590]'}>
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
                            ? 'bg-[#141414] text-[#c9a84c] border-r-[#c9a84c]' 
                            : 'text-[#9a9590] border-r-transparent hover:text-[#f0ece4]'
                    }`}
                    style={!pathname.startsWith('/settings') ? { marginLeft: '12px', marginRight: '12px', borderRadius: '8px' } : {}}
                >
                    <div className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all duration-200 ${
                        pathname.startsWith('/settings') 
                            ? 'bg-[rgba(201,168,76,0.08)]' 
                            : 'bg-transparent group-hover:bg-[rgba(255,255,255,0.04)]'
                    }`}>
                        <Settings2 
                            size={16} 
                            strokeWidth={pathname.startsWith('/settings') ? 2 : 1.5} 
                            color={pathname.startsWith('/settings') ? '#c9a84c' : '#5a5652'}
                        />
                    </div>
                    <span className={pathname.startsWith('/settings') ? 'font-semibold tracking-wide text-[#c9a84c]' : 'tracking-wide text-[#5a5652] group-hover:text-[#9a9590]'}>
                        Settings
                    </span>
                </Link>

                {/* User Area */}
                <div className="px-5 py-4 border-t border-[#1e1e1e] mt-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#141414] border border-[#2a2a2a] text-[#c9a84c] font-serif font-semibold flex items-center justify-center shadow-inner">
                        FL
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-serif text-[#f0ece4] tracking-wide">Learner</span>
                        <span className="text-[10px] font-mono text-[#c9a84c] uppercase tracking-widest">Immersion Tier</span>
                    </div>
                </div>
            </aside>

            {/* ── Main Content Area ── */}
            <main className="flex-1 flex flex-col w-full pb-[80px] md:pb-0 min-h-screen max-w-[900px] mx-auto overflow-x-hidden relative">
                {/* Mobile header with settings gear */}
                <div className="md:hidden absolute top-0 right-[16px] pt-[24px] z-30">
                    <Link
                        href="/settings"
                        className="p-[8px] rounded-full text-[#9a9590] hover:text-[#f0ece4] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                        aria-label="Settings"
                    >
                        <Settings2 size={22} strokeWidth={1.5} />
                    </Link>
                </div>
                {children}
            </main>

            {/* ── Mobile Bottom Nav ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[rgba(10,10,10,0.95)] backdrop-blur-[20px] border-t border-[#1e1e1e] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] z-[100]">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    // Primary Action (Practice/Speak)
                    if (item.href === '/practice') {
                        return (
                            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-4 no-underline">
                                <div className={`w-[48px] h-[48px] rounded-[14px] flex items-center justify-center -mt-[16px] transition-all duration-200 border ${
                                    isActive 
                                        ? 'bg-[#c9a84c] border-[#c9a84c] shadow-[0_4px_20px_rgba(201,168,76,0.3)]' 
                                        : 'bg-[rgba(201,168,76,0.12)] border-[rgba(201,168,76,0.25)] shadow-none'
                                }`}>
                                    <Icon
                                        size={20}
                                        strokeWidth={isActive ? 2 : 1.5}
                                        color={isActive ? '#080808' : '#c9a84c'}
                                    />
                                </div>
                                <span className={`font-sans text-[10px] tracking-[0.02em] ${isActive ? 'font-semibold text-[#c9a84c]' : 'font-normal text-[#5a5652]'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    }

                    // Standard tabs
                    return (
                        <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center gap-1 px-3 py-1 no-underline">
                            <div className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all duration-150 ${
                                isActive ? 'bg-[rgba(201,168,76,0.1)]' : 'bg-transparent'
                            }`}>
                                <Icon
                                    size={18}
                                    strokeWidth={isActive ? 2 : 1.5}
                                    color={isActive ? '#c9a84c' : '#5a5652'}
                                    className="transition-all duration-150"
                                />
                            </div>
                            <span className={`font-sans text-[10px] tracking-[0.02em] transition-colors duration-150 ${
                                isActive ? 'font-semibold text-[#c9a84c]' : 'font-normal text-[#5a5652]'
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
