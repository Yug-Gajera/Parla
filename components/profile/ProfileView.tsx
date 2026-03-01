"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Edit2, Share, Brain, MessageSquare, Flame, Clock, Award, Download, ExternalLink } from 'lucide-react';
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
        <div className="flex flex-col w-full max-w-5xl mx-auto gap-8 px-4 sm:px-6 py-8 pb-20">

            {/* Section 1: Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 text-center sm:text-left">
                    <div className="relative">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-black text-secondary-foreground">
                                    {(profile?.full_name || 'U').trim().substring(0, 2).toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground font-black text-xs px-2.5 py-1 rounded-full border-2 border-background shadow-lg shadow-primary/20">
                            {levelProgress.currentLevel}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-3xl font-black text-foreground tracking-tight">{profile?.full_name || 'Learner'}</h1>
                        <p className="text-muted-foreground font-medium">
                            Learning {languageName} since {startedAt ? new Date(startedAt).toLocaleDateString([], { month: 'long', year: 'numeric' }) : '—'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-full bg-card hover:bg-muted" onClick={() => setIsEditOpen(true)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full bg-card hover:bg-muted" onClick={handleShare}>
                        <Share className="w-4 h-4 text-foreground" />
                    </Button>
                </div>
            </div>

            {/* Section 2: Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col justify-between border-border/50 bg-card/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <Brain className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Words Known</span>
                    </div>
                    <span className="text-4xl font-black text-foreground">{stats.vocabKnown}</span>
                </Card>
                <Card className="p-5 flex flex-col justify-between border-border/50 bg-card/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <MessageSquare className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Conversations</span>
                    </div>
                    <span className="text-4xl font-black text-foreground">{stats.conversations}</span>
                </Card>
                <Card className="p-5 flex flex-col justify-between border-border/50 bg-card/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <Flame className="w-4 h-4 text-orange-500" /> <span className="text-xs font-bold uppercase tracking-wider text-orange-500/80">Day Streak</span>
                    </div>
                    <span className="text-4xl font-black text-foreground">{stats.streak}</span>
                </Card>
                <Card className="p-5 flex flex-col justify-between border-border/50 bg-card/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <Clock className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Total Hours</span>
                    </div>
                    <span className="text-4xl font-black text-foreground">{stats.totalHours}</span>
                </Card>
            </div>

            {/* Section 3: Level Journey */}
            <div className="flex flex-col gap-4">
                <h3 className="font-bold text-lg">Level Journey</h3>
                <Card className="p-8 border-border/50 bg-card flex flex-col gap-8">
                    <div className="flex flex-col lg:flex-row items-stretch gap-8">
                        <div className="flex-1 bg-secondary/50 rounded-2xl p-6 border border-border">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Current Level</h4>
                                    <div className="text-4xl font-black">{levelProgress.currentLevel}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Score</div>
                                    <div className="text-xl font-bold">{levelProgress.levelScore} <span className="text-muted-foreground text-sm font-medium">/ {100}</span></div>
                                </div>
                            </div>
                            <Progress value={levelProgress.levelScore} className="h-4 bg-background border border-border" />
                            {levelProgress.daysToNextLevel != null && levelProgress.daysToNextLevel > 0 && (
                                <p className="text-xs text-muted-foreground text-center mt-4">
                                    ~{levelProgress.daysToNextLevel} days to {CEFR_LEVELS[currentLevelIndex + 1] || 'next level'} at current pace
                                </p>
                            )}
                        </div>
                        <div className="flex-1 flex items-center gap-2 flex-wrap">
                            {CEFR_LEVELS.map((lvl, idx) => {
                                const isPassed = idx < currentLevelIndex;
                                const isCurrent = idx === currentLevelIndex;
                                return (
                                    <div key={lvl} className="flex flex-col items-center gap-2">
                                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors
                                            ${isPassed ? 'border-primary text-primary bg-primary/10' : isCurrent ? 'border-primary text-primary bg-primary/20 shadow-[0_0_20px_rgba(124,58,237,0.3)]' : 'border-muted text-muted-foreground bg-secondary'}
                                        `}>
                                            {isPassed ? '✓' : lvl}
                                        </div>
                                        <span className={`text-[10px] font-medium ${isPassed || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>{lvl}</span>
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
            <div className="flex flex-col gap-4">
                <h3 className="font-bold text-lg">Certificates</h3>
                {certificates.length === 0 ? (
                    <Card className="p-8 border-border/50 bg-card flex flex-col items-center justify-center text-center min-h-[220px]">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Award className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h4 className="font-bold text-foreground mb-1">No Certificates Yet</h4>
                        <p className="text-sm text-muted-foreground">Pass a level test to earn your first certificate.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {certificates.map((cert) => (
                            <Card key={cert.id} className="p-6 border-border/50 bg-card flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{(cert.languages as { flag_emoji?: string } | undefined)?.flag_emoji || '🏆'}</span>
                                    <div>
                                        <div className="font-bold">{cert.level_achieved}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(cert.issued_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-mono text-muted-foreground">#{cert.verification_code}</div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => toast.info('PDF generation coming soon')}>
                                        <Download className="w-3 h-3 mr-1" /> Download
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href="https://linkedin.com/in" target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-3 h-3 mr-1" /> View on LinkedIn
                                        </a>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Section 6: Badges */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                    <h3 className="font-bold text-lg">Achievements</h3>
                    <span className="text-xs font-bold text-primary">
                        {badges.filter((b) => b.earned).length} / {badges.length} UNLOCKED
                    </span>
                </div>
                <Card className="p-6 border-border/50 bg-card">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5">
                        {badges.map((b) => {
                            const Icon = b.icon;
                            const earned = !!b.earned;
                            return (
                                <div
                                    key={b.id}
                                    className={`flex flex-col items-center text-center gap-2 transition-all ${earned ? 'cursor-pointer' : 'cursor-help opacity-60 grayscale hover:grayscale-0 hover:opacity-90'}`}
                                    title={earned ? `Earned ${b.earned ? new Date(b.earned.earnedAt).toLocaleDateString() : ''}` : b.earnedCriteria}
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors
                                        ${earned ? 'bg-primary/20 text-primary border-primary/40' : 'bg-secondary text-muted-foreground border-border'}
                                    `}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-foreground">{b.name}</span>
                                </div>
                            );
                        })}
                    </div>
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
    const gap = 2;
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

    const getColor = (mins: number) => {
        if (mins === 0) return '#1a1a1a';
        if (mins <= 10) return 'rgba(124, 58, 237, 0.15)';
        if (mins <= 20) return 'rgba(124, 58, 237, 0.35)';
        if (mins <= 30) return 'rgba(124, 58, 237, 0.55)';
        return 'rgba(124, 58, 237, 0.9)';
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
        <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg">Activity (Last 365 days)</h3>
            <Card className="p-6 border-border/50 bg-card overflow-x-auto">
                <svg viewBox={`0 0 ${width + 60} ${height + 40}`} className="min-w-[600px]" style={{ maxWidth: '100%' }}>
                    {/* Day labels - Sun, Mon, Tue... */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => (
                        <text key={i} x={0} y={20 + i * (cellSize + gap) + cellSize / 2} fontSize={9} fill="currentColor" className="text-muted-foreground">
                            {label}
                        </text>
                    ))}
                    {/* Month labels at top */}
                    {monthPositions.map((m, i) => (
                        <text key={i} x={45 + m.weekIndex * (cellSize + gap)} y={12} fontSize={9} fill="currentColor" className="text-muted-foreground">
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
                                        className="transition-colors"
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
