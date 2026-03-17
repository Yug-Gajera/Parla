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
                    <h1 className="text-4xl md:text-5xl text-text-primary font-serif tracking-tight mb-2">Systems & Preferences</h1>
                    <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest">Configure Parlova operational parameters</p>
                </div>
                {isSaving && (
                    <div className="flex items-center text-[10px] font-mono font-bold text-accent uppercase tracking-widest animate-pulse border border-accent-border bg-accent/5 px-3 py-1.5 rounded-lg shadow-sm">
                        Synchronizing...
                    </div>
                )}
            </div>

            <div className="space-y-14">
                {/* Account Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4 font-serif">
                        <Mail className="w-4 h-4 text-accent" />
                        <h2 className="text-xl tracking-tight text-text-primary">Identity & Security</h2>
                    </div>
                    <Card className="p-8 bg-card border border-border shadow-sm rounded-[18px] divide-y divide-border/50">
                        <div className="pb-8">
                            <Label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted mb-3 block">Primary Uplink</Label>
                            <div className="flex items-center justify-between">
                                <span className="text-text-primary font-medium">{user?.email}</span>
                                <span className="text-[10px] font-mono bg-surface border border-border text-accent px-3 py-1 rounded-md uppercase tracking-widest font-bold shadow-sm">Verified</span>
                            </div>
                        </div>
                        <div className="py-8">
                            <Label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted mb-3 block">Access Key</Label>
                            <div className="flex items-center justify-between">
                                <span className="text-text-muted font-mono text-sm tracking-widest">••••••••••••</span>
                                <Button variant="outline" size="sm" className="btn-action rounded-full font-mono text-[10px] uppercase tracking-widest h-9" onClick={handlePasswordReset}>
                                    Cycle Key
                                </Button>
                            </div>
                        </div>
                        <div className="pt-8">
                            <Label className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 mb-3 block">Critical Operations</Label>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-full bg-red-500/5 border-red-200 text-red-600 hover:bg-red-500/10 hover:text-red-700 font-mono text-[10px] uppercase tracking-widest h-9 transition-all">
                                        Purge Identity
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border border-border max-w-md p-10 rounded-[32px] shadow-2xl">
                                    <AlertDialogHeader className="mb-8">
                                        <AlertDialogTitle className="text-3xl font-serif text-text-primary">Confirm Annihilation</AlertDialogTitle>
                                        <AlertDialogDescription className="text-text-muted text-sm leading-relaxed mt-4">
                                            This sequence is irreversible. All language nodes, XP, and neural mappings will be disintegrated.
                                            Type <span className="font-mono text-red-500 bg-red-500/5 px-1.5 py-0.5 rounded border border-red-200">PURGE</span> to verify authorization.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Input
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        className="bg-surface border-border text-text-primary font-mono tracking-widest text-center text-xl h-16 mb-8 focus-visible:ring-red-500/20 rounded-[18px] shadow-inner"
                                        placeholder="PURGE"
                                    />
                                    <AlertDialogFooter className="gap-3">
                                        <AlertDialogCancel className="rounded-full bg-surface border-border text-text-muted hover:text-text-primary hover:bg-border font-mono text-[11px] uppercase tracking-widest h-14 px-8 mt-0 transition-all">Abort</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirm !== 'PURGE'}
                                            className="rounded-full bg-red-500 hover:bg-red-600 text-white font-mono text-[11px] uppercase tracking-widest font-bold h-14 px-8 disabled:opacity-30 shadow-lg shadow-red-500/20 transition-all"
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
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4 font-serif">
                        <Brain className="w-4 h-4 text-accent" />
                        <h2 className="text-xl tracking-tight text-text-primary">Neural Calibration</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <Label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted block">Immersion Horizon</Label>
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
                                            className="flex flex-col items-center justify-center rounded-[24px] border border-border bg-card p-8 hover:bg-surface hover:border-accent/30 peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/5 cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md"
                                        >
                                            <span className="text-4xl font-serif text-text-primary group-hover:text-accent peer-data-[state=checked]:text-accent transition-colors mb-2 z-10">{mins}</span>
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted peer-data-[state=checked]:text-accent/80 z-10">MINUTES</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="space-y-6">
                            <Label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted block">Extraction Vectors</Label>
                            <div className="grid grid-cols-2 gap-4 bg-surface p-8 rounded-[32px] border border-border shadow-inner">
                                {CONTENT_TYPES.map((type) => (
                                    <div key={type.id} className="flex items-center space-x-3 group cursor-pointer hover:bg-white/50 p-2 rounded-xl transition-colors -m-2">
                                        <Checkbox
                                            id={type.id}
                                            checked={settings?.preferred_content_types?.includes(type.id)}
                                            onCheckedChange={(checked) => handleContentTypeToggle(type.id, !!checked)}
                                            className="border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent w-5 h-5 rounded-md"
                                        />
                                        <label
                                            htmlFor={type.id}
                                            className="text-sm font-medium text-text-primary group-hover:text-accent cursor-pointer transition-colors pt-0.5"
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
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4 font-serif">
                        <Palette className="w-4 h-4 text-accent" />
                        <h2 className="text-xl tracking-tight text-text-primary">Visual Interface</h2>
                    </div>
                    <Card className="p-10 bg-card border border-border shadow-sm rounded-[32px] transition-all hover:border-accent-border">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h4 className="font-serif text-2xl text-text-primary mb-2">Parlova Premium Light</h4>
                                <p className="text-text-muted text-sm leading-relaxed max-w-md">The original artisanal experience. Deep focus through warm palettes and rich typography.</p>
                            </div>
                            <span className="text-[10px] font-mono bg-accent/5 text-accent border border-accent-border font-bold px-4 py-2 rounded-lg uppercase tracking-widest whitespace-nowrap text-center shadow-sm">
                                PRIMARY MODE ACTIVE
                            </span>
                        </div>
                    </Card>
                </section>

                {/* Data Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4 font-serif">
                        <Database className="w-4 h-4 text-accent" />
                        <h2 className="text-xl tracking-tight text-text-primary">Data Telemetry</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Button
                            variant="outline"
                            className="h-auto p-10 flex flex-col items-start gap-3 rounded-[32px] border border-border bg-card hover:bg-surface hover:border-accent/30 group transition-all hover:shadow-md"
                            onClick={() => toast.success("Extraction sequence initiated. Packet delivery in T-24H.")}
                        >
                            <span className="font-serif text-2xl text-text-primary group-hover:text-accent transition-colors">Export Logs</span>
                            <span className="text-sm text-text-muted text-left leading-relaxed">Generate a cohesive package of all syntactic interactions for offline archiving.</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto p-10 flex flex-col items-start gap-3 rounded-[32px] border border-border bg-card hover:bg-surface hover:border-accent/30 group transition-all hover:shadow-md"
                        >
                            <span className="font-serif text-2xl text-text-primary group-hover:text-accent transition-colors">Security Protocol</span>
                            <span className="text-sm text-text-muted text-left leading-relaxed">Review cryptographic boundaries, neural encryption, and data retention policies.</span>
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
