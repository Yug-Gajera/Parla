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
        <div className="flex flex-col w-full max-w-5xl mx-auto gap-12 px-6 sm:px-8 py-12 pb-24 font-sans">

            {/* Section 1: Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center md:items-center gap-8 text-center md:text-left">
                    <div className="relative group">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-accent-border">
                            {profile?.avatar_url ? (
                                <Image
                                    src={profile.avatar_url || ''}
                                    alt={profile?.full_name || 'Profile Avatar'}
                                    fill
                                    priority
                                    className="object-cover"
                                />
                            ) : (
                                <span className="text-4xl font-serif text-text-muted">
                                    {(profile?.full_name || 'U').trim().substring(0, 1).toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-card text-[#E8521A] border border-[#E8521A]/22 font-mono text-xs px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">
                            {levelProgress.currentLevel}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl sm:text-5xl font-serif text-text-primary tracking-tight">{profile?.full_name || 'Learner'}</h1>
                        <p className="text-text-muted uppercase tracking-widest text-xs font-medium">
                            Studying {languageName} <span className="mx-2 opacity-30">•</span> Since {startedAt ? new Date(startedAt).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '—'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="btn-action !rounded-full text-[10px] tracking-widest h-10 px-5" onClick={() => setIsEditOpen(true)}>
                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Profile
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full border-border text-text-primary hover:bg-card hover:border-accent-border h-10 w-10 transition-all font-bold" onClick={handleShare}>
                        <Share className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Section 2: Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-8 flex flex-col justify-between border-border bg-card rounded-[18px] hover:border-accent-border shadow-sm transition-all group">
                    <div className="flex items-center gap-3 text-text-muted mb-6">
                        <Brain className="w-4 h-4 text-[#E8521A] transition-transform group-hover:scale-110" /> <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Vocabulary</span>
                    </div>
                    <span className="text-4xl font-mono text-text-primary">{stats.vocabKnown}</span>
                </Card>
                <Card className="p-8 flex flex-col justify-between border-border bg-card rounded-[18px] hover:border-accent-border shadow-sm transition-all group">
                    <div className="flex items-center gap-3 text-text-muted mb-6">
                        <MessageSquare className="w-4 h-4 text-[#E8521A] transition-transform group-hover:scale-110" /> <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Dialogues</span>
                    </div>
                    <span className="text-4xl font-mono text-text-primary">{stats.conversations}</span>
                </Card>
                <Card className="p-8 flex flex-col justify-between border-border bg-card rounded-[18px] hover:border-accent-border shadow-sm transition-all group">
                    <div className="flex items-center gap-3 text-text-muted mb-6">
                        <Flame className="w-4 h-4 text-[#E8521A] transition-transform group-hover:scale-110" /> <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Day Streak</span>
                    </div>
                    <span className="text-4xl font-mono text-text-primary">{stats.streak}</span>
                </Card>
                <Card className="p-8 flex flex-col justify-between border-border bg-card rounded-[18px] hover:border-accent-border shadow-sm transition-all group">
                    <div className="flex items-center gap-3 text-text-muted mb-6">
                        <Clock className="w-4 h-4 text-[#E8521A] transition-transform group-hover:scale-110" /> <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Focus Hours</span>
                    </div>
                    <span className="text-4xl font-mono text-text-primary">{stats.totalHours}</span>
                </Card>
            </div>

            {/* Section 3: Level Journey */}
            <div className="flex flex-col gap-6">
                <h3 className="text-sm uppercase tracking-[0.2em] text-text-muted font-medium">Acquisition Protocol</h3>
                <Card className="p-8 md:p-10 border-border bg-card rounded-[18px] flex flex-col gap-10 shadow-sm">
                    <div className="flex flex-col lg:flex-row items-stretch gap-10">
                        <div className="flex-1 bg-surface rounded-[18px] p-8 border border-border transition-colors hover:border-accent-border group">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">Current Phase</h4>
                                    <div className="text-5xl font-serif text-[#E8521A] tracking-tight">{levelProgress.currentLevel}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">Continuum</div>
                                    <div className="text-2xl font-mono text-text-primary">{levelProgress.levelScore} <span className="text-text-muted text-sm">/ 100</span></div>
                                </div>
                            </div>
                            <Progress value={levelProgress.levelScore} className="h-1.5 bg-border [&>div]:bg-[#E8521A] rounded-full" />
                            {levelProgress.daysToNextLevel != null && levelProgress.daysToNextLevel > 0 && (
                                <p className="text-xs font-mono text-text-muted text-center mt-6 uppercase tracking-wider">
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
                                                isPassed ? 'bg-accent/30' : 'bg-border'
                                            }`} />
                                        )}
                                        <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-mono text-xs transition-all duration-700
                                            ${isPassed 
                                                ? 'bg-card border-[#E8521A] text-[#E8521A]' 
                                                : isCurrent 
                                                    ? 'bg-[#E8521A]/10 border-[#E8521A]/22 text-[#E8521A] shadow-sm' 
                                                    : 'bg-surface border-border text-text-muted'}
                                        `}>
                                            {isPassed ? '✓' : lvl}
                                        </div>
                                        <span className={`text-[10px] font-mono uppercase tracking-widest ${isPassed || isCurrent ? 'text-text-primary' : 'text-text-muted'}`}>{lvl}</span>
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
                <h3 className="text-sm uppercase tracking-[0.2em] text-text-muted font-medium">Credentials</h3>
                {certificates.length === 0 ? (
                    <Card className="p-12 border border-border border-dashed bg-card flex flex-col items-center justify-center text-center min-h-[260px] rounded-[18px] shadow-sm">
                        <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mb-6">
                            <Award className="w-6 h-6 text-text-muted" />
                        </div>
                        <h4 className="font-serif text-xl text-text-primary mb-3">No Certificates Recorded</h4>
                        <p className="text-sm text-text-muted max-w-sm mb-8 leading-relaxed">
                            Undertake a verified tier examination to secure your linguistic certification.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((cert) => (
                            <Card key={cert.id} className="p-8 border-border bg-card hover:border-accent-border shadow-sm transition-all flex flex-col gap-6 rounded-[18px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/5 rounded-bl-full -z-10 group-hover:bg-[#C9A84C]/10 transition-colors" />
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full border border-border bg-surface flex items-center justify-center text-xl shadow-inner">
                                        {(cert.languages as { flag_emoji?: string } | undefined)?.flag_emoji || '🏆'}
                                    </div>
                                    <div>
                                        <div className="font-serif text-2xl text-text-primary">{cert.level_achieved}</div>
                                        <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mt-1">{new Date(cert.issued_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-mono text-text-muted bg-surface border border-border px-3 py-2 rounded-lg break-all">
                                    ID: {cert.verification_code}
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" size="sm" className="btn-action flex-1 text-[10px] h-8" onClick={() => toast.info('PDF generation coming soon')}>
                                        <Download className="w-3 h-3 mr-2" /> PDF
                                    </Button>
                                    <Button variant="outline" size="sm" asChild className="btn-action flex-1 text-[10px] h-8">
                                        <a href="https://linkedin.com/in" target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-3 h-3 mr-2" /> LinkedIn
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
                <div className="flex justify-between items-end border-b border-border pb-4 font-serif">
                    <h3 className="text-xl tracking-tight text-text-primary">Insignia</h3>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#E8521A] font-bold">
                        {badges.filter((b) => b.earned).length} / {badges.length} Unlocked
                    </span>
                </div>
                <Card className="p-8 md:p-10 border-border bg-card rounded-[18px] shadow-sm">
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
                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border transition-all duration-300
                                        ${earned ? 'bg-[#E8521A]/10 text-[#E8521A] border-[#E8521A]/22 shadow-sm' : 'bg-surface text-text-muted border-border'}
                                    `}>
                                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span className="text-[9px] font-mono uppercase tracking-[0.1em] leading-tight text-text-muted">{b.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* Section 7: Account Actions */}
            <div className="flex flex-col gap-6 mt-8">
                <h3 className="text-sm uppercase tracking-[0.2em] text-text-muted font-medium">System Configuration</h3>
                <Card className="border-border bg-card rounded-[18px] overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        {/* Sign Out */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 sm:p-8 border-b border-border hover:bg-surface/50 transition-colors">
                            <div className="mb-4 md:mb-0">
                                <h4 className="font-serif text-xl text-text-primary flex items-center gap-3">
                                    <LogOut className="w-5 h-5 text-text-muted" /> Sign Out Session
                                </h4>
                                <p className="text-sm text-text-muted mt-2 max-w-md leading-relaxed">
                                    Terminate your current session and return to the authorization portal.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="btn-action rounded-full h-10 px-6"
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 sm:p-8 hover:bg-surface/50 transition-colors">
                            <div className="mb-4 md:mb-0">
                                <h4 className="font-serif text-xl text-red-500 opacity-90 flex items-center gap-3">
                                    Termination Sequence
                                </h4>
                                <p className="text-sm text-red-500/60 mt-2 max-w-md leading-relaxed">
                                    Permanently purge all user data, lexical progress, and account access. This action is irreversible.
                                </p>
                            </div>
                            <Button variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 uppercase tracking-widest text-[10px] h-10 px-6 rounded-full transition-colors font-bold">
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

    // Orange heat map theme
    const getColor = (mins: number) => {
        if (mins === 0) return 'var(--color-surface)'; // empty state bg
        if (mins <= 10) return 'rgba(232, 82, 26, 0.2)'; // faint orange
        if (mins <= 20) return 'rgba(232, 82, 26, 0.4)';
        if (mins <= 30) return 'rgba(232, 82, 26, 0.6)';
        if (mins <= 45) return 'rgba(232, 82, 26, 0.8)';
        return 'rgba(232, 82, 26, 1)'; // solid orange
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
            <Card className="p-8 border-border bg-card rounded-[18px] overflow-x-auto relative hide-scrollbar shadow-sm">
                {Object.keys(activityByDate).length === 0 && (
                    <div className="absolute inset-0 bg-bg/40 backdrop-blur-sm z-10 flex items-center justify-center p-4 rounded-[18px]">
                        <div className="bg-card border border-border px-6 py-4 rounded-xl shadow-lg text-[10px] uppercase tracking-widest text-[#E8521A] font-mono font-bold">
                            Initialize practice to populate heatmap
                        </div>
                    </div>
                )}
                <svg viewBox={`0 0 ${width + 60} ${height + 40}`} className="min-w-[700px] mx-auto" style={{ maxWidth: '100%' }}>
                    {/* Day labels - Sun, Mon, Tue... */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => (
                        <text key={i} x={0} y={24 + i * (cellSize + gap) + cellSize / 2} fontSize={9} fill="var(--color-text-muted)" className="font-mono uppercase tracking-widest font-bold">
                            {label}
                        </text>
                    ))}
                    {/* Month labels at top */}
                    {monthPositions.map((m, i) => (
                        <text key={i} x={45 + m.weekIndex * (cellSize + gap)} y={10} fontSize={9} fill="var(--color-text-muted)" className="font-mono uppercase tracking-widest font-bold">
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
                                        className="transition-all hover:opacity-80 cursor-crosshair stroke-border stroke-[0.5px]"
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
