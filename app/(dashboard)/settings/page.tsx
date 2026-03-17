"use client";

import React, { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Mail, Palette, Database, Brain } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const CONTENT_TYPES = [
    { id: 'news', label: 'News' },
    { id: 'cooking', label: 'Cooking' },
    { id: 'travel', label: 'Travel' },
    { id: 'sports', label: 'Sports' },
    { id: 'business', label: 'Business' },
    { id: 'entertainment', label: 'Entertainment' },
];

export default function SettingsPage() {
    const { user, settings, isLoading, updateSettings } = useProfile();
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    const handleGoalChange = async (value: string) => {
        setIsSaving(true);
        await updateSettings({ daily_goal_minutes: parseInt(value) });
        setIsSaving(false);
    };

    const handleContentTypeToggle = async (typeId: string, checked: boolean) => {
        const currentTypes = settings?.preferred_content_types || [];
        let newTypes;
        if (checked) {
            newTypes = [...currentTypes, typeId];
        } else {
            newTypes = currentTypes.filter((t: string) => t !== typeId);
        }
        setIsSaving(true);
        await updateSettings({ preferred_content_types: newTypes });
        setIsSaving(false);
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Security token dispatched");
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'PURGE') return;
        toast.error("Operation requires root privileges. Contact sysadmin.");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[500px] bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1000px] mx-auto p-6 md:p-10 space-y-10 font-sans pb-32">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl md:text-5xl text-foreground font-display tracking-tight mb-2">Systems & Preferences</h1>
                    <p className="text-[11px] font-mono-num text-text-muted uppercase tracking-widest">Configure Parlova operational parameters</p>
                </div>
                {isSaving && (
                    <div className="flex items-center text-[10px] font-mono-num font-bold text-gold uppercase tracking-widest animate-pulse border border-gold-border bg-gold-subtle px-3 py-1.5 rounded-lg">
                        Synchronizing...
                    </div>
                )}
            </div>

            <div className="space-y-14">
                {/* Account Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                        <Mail className="w-4 h-4 text-gold" />
                        <h2 className="text-[12px] font-mono-num font-bold uppercase tracking-widest text-text-secondary">Identity & Security</h2>
                    </div>
                    <Card className="p-8 bg-card border border-border shadow-sm rounded-3xl divide-y divide-border/50">
                        <div className="pb-8">
                            <Label className="text-[10px] font-mono-num font-bold uppercase tracking-widest text-text-muted mb-3 block">Primary Uplink</Label>
                            <div className="flex items-center justify-between">
                                <span className="text-text-primary font-medium">{user?.email}</span>
                                <span className="text-[10px] font-mono-num bg-surface border border-border text-gold px-3 py-1 rounded-md uppercase tracking-widest">Verified</span>
                            </div>
                        </div>
                        <div className="py-8">
                            <Label className="text-[10px] font-mono-num font-bold uppercase tracking-widest text-text-muted mb-3 block">Access Key</Label>
                            <div className="flex items-center justify-between">
                                <span className="text-text-muted font-mono-num text-sm tracking-widest">••••••••••••</span>
                                <Button variant="outline" size="sm" className="rounded-full bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-border font-mono-num text-[10px] uppercase tracking-widest h-9" onClick={handlePasswordReset}>
                                    Cycle Key
                                </Button>
                            </div>
                        </div>
                        <div className="pt-8">
                            <Label className="text-[10px] font-mono-num font-bold uppercase tracking-widest text-error mb-3 block">Critical Operations</Label>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-full bg-error-subtle border-error-border text-error hover:bg-error/10 hover:text-error font-mono-num text-[10px] uppercase tracking-widest h-9">
                                        Purge Identity
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border-border max-w-md p-10 rounded-[32px] shadow-2xl">
                                    <AlertDialogHeader className="mb-8">
                                        <AlertDialogTitle className="text-3xl font-display text-text-primary">Confirm Annihilation</AlertDialogTitle>
                                        <AlertDialogDescription className="text-text-secondary text-sm leading-relaxed mt-4">
                                            This sequence is irreversible. All language nodes, XP, and neural mappings will be disintegrated.
                                            Type <span className="font-mono-num text-error bg-error-subtle px-1.5 py-0.5 rounded border border-error-border">PURGE</span> to verify authorization.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Input
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        className="bg-surface border-border text-text-primary font-mono-num tracking-widest text-center text-xl h-16 mb-8 focus-visible:ring-error/20 rounded-2xl"
                                        placeholder="PURGE"
                                    />
                                    <AlertDialogFooter className="gap-3">
                                        <AlertDialogCancel className="rounded-2xl bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-border font-mono-num text-[11px] uppercase tracking-widest h-14 px-8 mt-0">Abort</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirm !== 'PURGE'}
                                            className="rounded-2xl bg-error hover:bg-error-hover text-white font-mono-num text-[11px] uppercase tracking-widest font-bold h-14 px-8 disabled:opacity-30"
                                        >
                                            Execute Purge
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </Card>
                </section>

                {/* Learning Preferences */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                        <Brain className="w-4 h-4 text-gold" />
                        <h2 className="text-[12px] font-mono-num font-bold uppercase tracking-widest text-text-secondary">Neural Calibration</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <Label className="text-[10px] font-mono-num font-bold uppercase tracking-widest text-text-muted block">Immersion Horizon</Label>
                            <RadioGroup
                                defaultValue={settings?.daily_goal_minutes?.toString() || "20"}
                                onValueChange={handleGoalChange}
                                className="grid grid-cols-2 gap-4"
                            >
                                {[10, 20, 30, 45].map((mins) => (
                                    <div key={mins}>
                                        <RadioGroupItem value={mins.toString()} id={`goal-${mins}`} className="peer sr-only" />
                                        <Label
                                            htmlFor={`goal-${mins}`}
                                            className="flex flex-col items-center justify-center rounded-[24px] border border-border bg-card p-8 hover:bg-surface hover:border-gold/30 peer-data-[state=checked]:border-gold peer-data-[state=checked]:bg-gold-subtle cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md"
                                        >
                                            <span className="text-4xl font-display text-text-primary group-hover:text-gold peer-data-[state=checked]:text-gold transition-colors mb-2 z-10">{mins}</span>
                                            <span className="text-[10px] font-mono-num font-bold uppercase tracking-widest text-text-muted peer-data-[state=checked]:text-gold/80 z-10">MINUTES</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="space-y-6">
                            <Label className="text-[10px] font-mono-num font-bold uppercase tracking-widest text-text-muted block">Extraction Vectors</Label>
                            <div className="grid grid-cols-2 gap-4 bg-surface/50 p-8 rounded-[32px] border border-border shadow-inner">
                                {CONTENT_TYPES.map((type) => (
                                    <div key={type.id} className="flex items-center space-x-3 group cursor-pointer hover:bg-surface p-2 rounded-xl transition-colors -m-2">
                                        <Checkbox
                                            id={type.id}
                                            checked={settings?.preferred_content_types?.includes(type.id)}
                                            onCheckedChange={(checked) => handleContentTypeToggle(type.id, !!checked)}
                                            className="border-border-strong data-[state=checked]:bg-gold data-[state=checked]:border-gold w-5 h-5 rounded-md"
                                        />
                                        <label
                                            htmlFor={type.id}
                                            className="text-sm font-medium text-text-primary group-hover:text-gold cursor-pointer transition-colors pt-0.5"
                                        >
                                            {type.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Appearance */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                        <Palette className="w-4 h-4 text-gold" />
                        <h2 className="text-[12px] font-mono-num font-bold uppercase tracking-widest text-text-secondary">Visual Interface</h2>
                    </div>
                    <Card className="p-10 bg-card border border-border shadow-sm rounded-[32px]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h4 className="font-display text-2xl text-text-primary mb-2">Parlova Premium Light</h4>
                                <p className="text-text-secondary text-sm leading-relaxed max-w-md">The original artisanal experience. Deep focus through warm palettes and rich typography.</p>
                            </div>
                            <span className="text-[10px] font-mono-num bg-gold-subtle text-gold border border-gold-border font-bold px-4 py-2 rounded-lg uppercase tracking-widest whitespace-nowrap text-center">
                                PRIMARY MODE ACTIVE
                            </span>
                        </div>
                    </Card>
                </section>

                {/* Data Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                        <Database className="w-4 h-4 text-gold" />
                        <h2 className="text-[12px] font-mono-num font-bold uppercase tracking-widest text-text-secondary">Data Telemetry</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Button
                            variant="outline"
                            className="h-auto p-10 flex flex-col items-start gap-3 rounded-[32px] border border-border bg-card hover:bg-surface hover:border-gold/30 group transition-all hover:shadow-md"
                            onClick={() => toast.success("Extraction sequence initiated. Packet delivery in T-24H.")}
                        >
                            <span className="font-display text-2xl text-text-primary group-hover:text-gold transition-colors">Export Logs</span>
                            <span className="text-sm text-text-secondary text-left leading-relaxed">Generate a cohesive package of all syntactic interactions for offline archiving.</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto p-10 flex flex-col items-start gap-3 rounded-[32px] border border-border bg-card hover:bg-surface hover:border-gold/30 group transition-all hover:shadow-md"
                        >
                            <span className="font-display text-2xl text-text-primary group-hover:text-gold transition-colors">Security Protocol</span>
                            <span className="text-sm text-text-secondary text-left leading-relaxed">Review cryptographic boundaries, neural encryption, and data retention policies.</span>
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
