"use client";

// ============================================================
// Parlova — Profile View (Redesigned)
// ============================================================

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Edit2, Share, Brain, MessageSquare, Flame, Clock, Award, Download, ExternalLink, Settings2, LogOut } from 'lucide-react';
import { EditProfileSheet } from './EditProfileSheet';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';
import { BADGES, type UserBadgeEarned } from '@/lib/data/badges';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

interface ProfileUser {
    id?: string;
    full_name?: string | null;
    avatar_url?: string | null;
    created_at?: string;
}

interface ProfileViewProps {
    initialData: {
        user: ProfileUser | null;
        userLanguage: { languages?: { name?: string }; started_at?: string } | null;
        stats: { vocabKnown: number; conversations: number; streak: number; totalHours: number };
        levelProgress: { currentLevel: string; levelScore: number; daysToNextLevel: number | null };
        certificates: Array<{ id: string; level_achieved: string; issued_at: string; verification_code: string; languages?: { flag_emoji?: string } }>;
        studySessions: Array<{ created_at: string; duration_minutes?: number }>;
        earnedBadges: UserBadgeEarned[];
    };
}

export function ProfileView({ initialData }: ProfileViewProps) {
    const router = useRouter();
    const { updateProfile } = useProfile();
    const [profile, setProfile] = useState(initialData.user);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const lang = initialData.userLanguage;
    const stats = initialData.stats;
    const levelProgress = initialData.levelProgress;
    const certificates = initialData.certificates;
    const studySessions = initialData.studySessions || [];
    const earnedBadges = initialData.earnedBadges;

    const badges = BADGES.map((b) => ({
        ...b,
        earned: earnedBadges.find((e) => e.badgeId === b.id),
    }));

    const languageName = (lang?.languages as { name?: string } | undefined)?.name || 'Spanish';
    const startedAt = lang?.started_at || profile?.created_at;

    const handleShare = () => {
        if (typeof window !== 'undefined') {
            const url = window.location.href;
            navigator.clipboard.writeText(url);
            toast.success('Profile link copied to clipboard');
        }
    };

    const handleProfileSave = async (updates: { full_name?: string; native_language?: string; avatar_url?: string }): Promise<boolean> => {
        const ok = await updateProfile(updates);
        if (ok) {
            setProfile((p: ProfileUser | null) => (p ? { ...p, ...updates } : p));
            router.refresh();
        }
        return ok;
    };

    // Build activity map: date string -> total minutes
    const activityByDate: Record<string, number> = {};
    studySessions.forEach((s: { created_at: string; duration_minutes?: number }) => {
        const d = new Date(s.created_at).toISOString().split('T')[0];
        activityByDate[d] = (activityByDate[d] || 0) + (s.duration_minutes || 0);
    });

    // Level timeline: which levels passed
    const levelIndex = CEFR_LEVELS.indexOf(levelProgress.currentLevel);
    const currentLevelIndex = levelIndex >= 0 ? levelIndex : 0;

    return (
        <div className="flex flex-col w-full max-w-5xl mx-auto gap-12 px-6 sm:px-8 py-12 pb-24 font-sans bg-[#080808]">

            {/* Section 1: Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center md:items-center gap-8 text-center md:text-left">
                    <div className="relative group">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#141414] border border-[#2a2a2a] flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-[#c9a84c]">
                            {profile?.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt={profile?.full_name || 'Profile Avatar'}
                                    fill
                                    priority
                                    className="object-cover"
                                />
                            ) : (
                                <span className="text-4xl font-serif text-[#9a9590]">
                                    {(profile?.full_name || 'U').trim().substring(0, 1).toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-[#141414] text-[#c9a84c] border border-[#c9a84c]/50 font-mono text-xs px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(201,168,76,0.15)] uppercase tracking-wider">
                            {levelProgress.currentLevel}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl sm:text-5xl font-serif text-[#f0ece4] tracking-tight">{profile?.full_name || 'Learner'}</h1>
                        <p className="text-[#9a9590] uppercase tracking-widest text-xs font-medium">
                            Studying {languageName} <span className="mx-2 opacity-50">•</span> Since {startedAt ? new Date(startedAt).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '—'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-full bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#141414] hover:border-[#2a2a2a] uppercase text-[10px] tracking-widest h-10 px-5" onClick={() => setIsEditOpen(true)}>
                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Profile
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#141414] hover:border-[#2a2a2a] h-10 w-10" onClick={handleShare}>
                        <Share className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Section 2: Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-8 flex flex-col justify-between border-[#1e1e1e] bg-[#141414] rounded-2xl hover:border-[#2a2a2a] transition-all">
                    <div className="flex items-center gap-3 text-[#5a5652] mb-6">
                        <Brain className="w-4 h-4 text-[#c9a84c]" /> <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Vocabulary</span>
                    </div>
                    <span className="text-4xl font-mono text-[#f0ece4]">{stats.vocabKnown}</span>
                </Card>
                <Card className="p-8 flex flex-col justify-between border-[#1e1e1e] bg-[#141414] rounded-2xl hover:border-[#2a2a2a] transition-all">
                    <div className="flex items-center gap-3 text-[#5a5652] mb-6">
                        <MessageSquare className="w-4 h-4 text-[#c9a84c]" /> <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Dialogues</span>
                    </div>
                    <span className="text-4xl font-mono text-[#f0ece4]">{stats.conversations}</span>
                </Card>
                <Card className="p-8 flex flex-col justify-between border-[#1e1e1e] bg-[#141414] rounded-2xl hover:border-[#2a2a2a] transition-all">
                    <div className="flex items-center gap-3 text-[#5a5652] mb-6">
                        <Flame className="w-4 h-4 text-[#c9a84c]" /> <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Day Streak</span>
                    </div>
                    <span className="text-4xl font-mono text-[#f0ece4]">{stats.streak}</span>
                </Card>
                <Card className="p-8 flex flex-col justify-between border-[#1e1e1e] bg-[#141414] rounded-2xl hover:border-[#2a2a2a] transition-all">
                    <div className="flex items-center gap-3 text-[#5a5652] mb-6">
                        <Clock className="w-4 h-4 text-[#c9a84c]" /> <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Focus Hours</span>
                    </div>
                    <span className="text-4xl font-mono text-[#f0ece4]">{stats.totalHours}</span>
                </Card>
            </div>

            {/* Section 3: Level Journey */}
            <div className="flex flex-col gap-6">
                <h3 className="text-sm uppercase tracking-[0.2em] text-[#5a5652] font-medium">Acquisition Protocol</h3>
                <Card className="p-8 md:p-10 border-[#1e1e1e] bg-[#141414] rounded-2xl flex flex-col gap-10">
                    <div className="flex flex-col lg:flex-row items-stretch gap-10">
                        <div className="flex-1 bg-[#0f0f0f] rounded-2xl p-8 border border-[#1e1e1e]">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#5a5652] mb-2">Current Phase</h4>
                                    <div className="text-5xl font-serif text-[#c9a84c] tracking-tight">{levelProgress.currentLevel}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#5a5652] mb-2">Continuum</div>
                                    <div className="text-2xl font-mono text-[#f0ece4]">{levelProgress.levelScore} <span className="text-[#5a5652] text-sm">/ 100</span></div>
                                </div>
                            </div>
                            <Progress value={levelProgress.levelScore} className="h-1 bg-[#1e1e1e] [&>div]:bg-[#c9a84c] rounded-full" />
                            {levelProgress.daysToNextLevel != null && levelProgress.daysToNextLevel > 0 && (
                                <p className="text-xs font-mono text-[#9a9590] text-center mt-6 uppercase tracking-wider">
                                    Est. {levelProgress.daysToNextLevel} days to {CEFR_LEVELS[currentLevelIndex + 1] || 'fluency'}
                                </p>
                            )}
                        </div>
                        
                        {/* Level Nodes */}
                        <div className="flex-1 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar px-2">
                            {CEFR_LEVELS.map((lvl, idx) => {
                                const isPassed = idx < currentLevelIndex;
                                const isCurrent = idx === currentLevelIndex;
                                return (
                                    <div key={lvl} className="flex flex-col items-center gap-4 relative">
                                        {/* Connector line */}
                                        {idx < CEFR_LEVELS.length - 1 && (
                                            <div className={`absolute top-6 left-[50%] w-full h-[1px] -z-10 ${
                                                isPassed ? 'bg-[#c9a84c]/50' : 'bg-[#1e1e1e]'
                                            }`} />
                                        )}
                                        <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-mono text-xs transition-all duration-700
                                            ${isPassed 
                                                ? 'bg-[#141414] border-[#c9a84c] text-[#c9a84c]' 
                                                : isCurrent 
                                                    ? 'bg-[#c9a84c]/10 border-[#c9a84c] text-[#c9a84c] shadow-[0_0_20px_rgba(201,168,76,0.2)]' 
                                                    : 'bg-[#0f0f0f] border-[#1e1e1e] text-[#5a5652]'}
                                        `}>
                                            {isPassed ? '✓' : lvl}
                                        </div>
                                        <span className={`text-[10px] font-mono uppercase tracking-widest ${isPassed || isCurrent ? 'text-[#f0ece4]' : 'text-[#5a5652]'}`}>{lvl}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Section 4: Activity Chart */}
            <ActivityChart activityByDate={activityByDate} />

            {/* Section 5: Certificates */}
            <div className="flex flex-col gap-6">
                <h3 className="text-sm uppercase tracking-[0.2em] text-[#5a5652] font-medium">Credentials</h3>
                {certificates.length === 0 ? (
                    <Card className="p-12 border border-[#1e1e1e] border-dashed bg-[#0f0f0f] flex flex-col items-center justify-center text-center min-h-[260px] rounded-2xl">
                        <div className="w-16 h-16 bg-[#141414] border border-[#2a2a2a] rounded-full flex items-center justify-center mb-6">
                            <Award className="w-6 h-6 text-[#5a5652]" />
                        </div>
                        <h4 className="font-serif text-xl text-[#f0ece4] mb-3">No Certificates Recorded</h4>
                        <p className="text-sm text-[#9a9590] max-w-sm mb-8 leading-relaxed">
                            Undertake a verified tier examination to secure your linguistic certification.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((cert) => (
                            <Card key={cert.id} className="p-8 border-[#1e1e1e] bg-[#141414] hover:border-[#2a2a2a] transition-all flex flex-col gap-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/5 rounded-bl-full -z-10 group-hover:bg-[#c9a84c]/10 transition-colors" />
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full border border-[#1e1e1e] bg-[#0f0f0f] flex items-center justify-center text-xl">
                                        {(cert.languages as { flag_emoji?: string } | undefined)?.flag_emoji || '🏆'}
                                    </div>
                                    <div>
                                        <div className="font-serif text-2xl text-[#f0ece4]">{cert.level_achieved}</div>
                                        <div className="text-[10px] font-mono text-[#5a5652] uppercase tracking-widest mt-1">{new Date(cert.issued_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-mono text-[#9a9590] bg-[#0f0f0f] border border-[#1e1e1e] px-3 py-2 rounded-lg break-all">
                                    ID: {cert.verification_code}
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" size="sm" className="flex-1 bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#1e1e1e] text-[10px] uppercase tracking-widest h-8" onClick={() => toast.info('PDF generation coming soon')}>
                                        <Download className="w-3 h-3 mr-2" /> PDF
                                    </Button>
                                    <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#1e1e1e] text-[10px] uppercase tracking-widest h-8">
                                        <a href="https://linkedin.com/in" target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-3 h-3 mr-2 text-[#c9a84c]" /> LinkedIn
                                        </a>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Section 6: Badges */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end border-b border-[#1e1e1e] pb-4">
                    <h3 className="text-sm uppercase tracking-[0.2em] text-[#5a5652] font-medium">Insignia</h3>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a84c]">
                        {badges.filter((b) => b.earned).length} / {badges.length} Unlocked
                    </span>
                </div>
                <Card className="p-8 md:p-10 border-[#1e1e1e] bg-[#141414] rounded-2xl">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-6 gap-y-10">
                        {badges.map((b) => {
                            const Icon = b.icon;
                            const earned = !!b.earned;
                            return (
                                <div
                                    key={b.id}
                                    className={`flex flex-col items-center text-center gap-3 transition-all ${earned ? 'cursor-pointer hover:-translate-y-1' : 'cursor-help opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                    title={earned ? `Earned ${b.earned ? new Date(b.earned.earnedAt).toLocaleDateString() : ''}` : b.earnedCriteria}
                                >
                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border transition-colors
                                        ${earned ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30 shadow-[0_0_15px_rgba(201,168,76,0.1)]' : 'bg-[#0f0f0f] text-[#5a5652] border-[#1e1e1e]'}
                                    `}>
                                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span className="text-[9px] font-mono uppercase tracking-[0.1em] leading-tight text-[#9a9590]">{b.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* Section 7: Account Actions */}
            <div className="flex flex-col gap-6 mt-8">
                <h3 className="text-sm uppercase tracking-[0.2em] text-[#5a5652] font-medium">System Configuration</h3>
                <Card className="border-[#1e1e1e] bg-[#141414] rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                        {/* Sign Out */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 sm:p-8 border-b border-[#1e1e1e] hover:bg-[#0f0f0f]/50 transition-colors">
                            <div className="mb-4 md:mb-0">
                                <h4 className="font-serif text-xl text-[#f0ece4] flex items-center gap-3">
                                    <LogOut className="w-5 h-5 text-[#5a5652]" /> Sign Out Session
                                </h4>
                                <p className="text-sm text-[#9a9590] mt-2 max-w-md leading-relaxed">
                                    Terminate your current session and return to the authorization portal.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#1e1e1e] uppercase tracking-widest text-[10px] h-10 px-6 rounded-full"
                                onClick={async () => {
                                    const { createClient } = await import('@/lib/supabase/client');
                                    const supabase = createClient();
                                    await supabase.auth.signOut();
                                    window.location.href = '/';
                                }}
                            >
                                Execute Sign Out
                            </Button>
                        </div>

                        {/* Delete Account */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 sm:p-8 hover:bg-[#0f0f0f]/50 transition-colors">
                            <div className="mb-4 md:mb-0">
                                <h4 className="font-serif text-xl text-[#ef4444] opacity-90 flex items-center gap-3">
                                    Termination Sequence
                                </h4>
                                <p className="text-sm text-[#ef4444]/60 mt-2 max-w-md leading-relaxed">
                                    Permanently purge all user data, lexical progress, and account access. This action is irreversible.
                                </p>
                            </div>
                            <Button variant="destructive" className="bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border border-[#ef4444]/20 uppercase tracking-widest text-[10px] h-10 px-6 rounded-full transition-colors">
                                Purge Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <EditProfileSheet
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                user={profile}
                onSave={handleProfileSave}
            />
        </div>
    );
}

function ActivityChart({ activityByDate }: { activityByDate: Record<string, number> }) {
    const cellSize = 12;
    const gap = 3;
    const weeks = 52;
    const days = 7;

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - weeks * 7 + 1);

    const getDateForCell = (weekIndex: number, dayIndex: number) => {
        const ordinal = weekIndex * 7 + dayIndex;
        const d = new Date(startDate);
        d.setDate(d.getDate() + ordinal);
        return d.toISOString().split('T')[0];
    };

    // Gold luxury heat map theme
    const getColor = (mins: number) => {
        if (mins === 0) return '#0f0f0f'; // empty state bg
        if (mins <= 10) return 'rgba(201, 168, 76, 0.2)'; // faint gold
        if (mins <= 20) return 'rgba(201, 168, 76, 0.4)';
        if (mins <= 30) return 'rgba(201, 168, 76, 0.6)';
        if (mins <= 45) return 'rgba(201, 168, 76, 0.8)';
        return 'rgba(201, 168, 76, 1)'; // solid gold
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthPositions: { weekIndex: number; label: string }[] = [];
    for (let w = 0; w < weeks; w++) {
        const dateStr = getDateForCell(w, 0);
        const d = new Date(dateStr);
        if (d.getDate() <= 7) {
            monthPositions.push({ weekIndex: w, label: months[d.getMonth()] });
        }
    }

    const width = weeks * (cellSize + gap) - gap;
    const height = days * (cellSize + gap) - gap;

    return (
        <div className="flex flex-col gap-6">
            <h3 className="text-sm uppercase tracking-[0.2em] text-[#5a5652] font-medium">Immersion Heatmap (365d)</h3>
            <Card className="p-8 border-[#1e1e1e] bg-[#141414] rounded-2xl overflow-x-auto relative hide-scrollbar">
                {Object.keys(activityByDate).length === 0 && (
                    <div className="absolute inset-0 bg-[#080808]/80 backdrop-blur-sm z-10 flex items-center justify-center p-4 rounded-2xl">
                        <div className="bg-[#141414] border border-[#2a2a2a] px-6 py-4 rounded-xl shadow-2xl text-xs uppercase tracking-widest text-[#c9a84c] font-mono">
                            Initialize practice to populate heatmap
                        </div>
                    </div>
                )}
                <svg viewBox={`0 0 ${width + 60} ${height + 40}`} className="min-w-[700px] mx-auto" style={{ maxWidth: '100%' }}>
                    {/* Day labels - Sun, Mon, Tue... */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => (
                        <text key={i} x={0} y={24 + i * (cellSize + gap) + cellSize / 2} fontSize={9} fill="#5a5652" className="font-mono uppercase tracking-widest">
                            {label}
                        </text>
                    ))}
                    {/* Month labels at top */}
                    {monthPositions.map((m, i) => (
                        <text key={i} x={45 + m.weekIndex * (cellSize + gap)} y={10} fontSize={9} fill="#5a5652" className="font-mono uppercase tracking-widest">
                            {m.label}
                        </text>
                    ))}
                    {/* Grid */}
                    <g transform="translate(45, 20)">
                        {Array.from({ length: weeks }, (_, w) =>
                            Array.from({ length: days }, (_, d) => {
                                const dateStr = getDateForCell(w, d);
                                const mins = activityByDate[dateStr] || 0;
                                const x = w * (cellSize + gap);
                                const y = d * (cellSize + gap);
                                return (
                                    <rect
                                        key={`${w}-${d}`}
                                        x={x}
                                        y={y}
                                        width={cellSize}
                                        height={cellSize}
                                        rx={2}
                                        fill={getColor(mins)}
                                        className="transition-all hover:opacity-80 cursor-crosshair stroke-[#1e1e1e] stroke-[0.5px]"
                                    >
                                        <title>{mins > 0 ? `${mins} minutes on ${dateStr}` : `No activity on ${dateStr}`}</title>
                                    </rect>
                                );
                            })
                        )}
                    </g>
                </svg>
            </Card>
        </div>
    );
}
