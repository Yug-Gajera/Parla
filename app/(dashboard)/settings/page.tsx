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
            <div className="flex items-center justify-center min-h-[500px] bg-[#080808]">
                <Loader2 className="w-8 h-8 animate-spin text-[#c9a84c]" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1000px] mx-auto p-4 md:p-8 space-y-8 font-sans pb-32">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl text-[#f0ece4] font-serif tracking-tight mb-2">Systems & Preferences</h1>
                    <p className="text-[11px] font-mono text-[#5a5652] uppercase tracking-[0.2em]">Configure Parlova operational parameters</p>
                </div>
                {isSaving && (
                    <div className="flex items-center text-[10px] font-mono font-bold text-[#c9a84c] uppercase tracking-widest animate-pulse border border-[#c9a84c]/30 bg-[#c9a84c]/5 px-3 py-1.5 rounded-sm">
                        Synchronizing...
                    </div>
                )}
            </div>

            <div className="space-y-12">
                {/* Account Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-[#1e1e1e] pb-4">
                        <Mail className="w-4 h-4 text-[#c9a84c]" />
                        <h2 className="text-[12px] font-mono font-bold uppercase tracking-widest text-[#9a9590]">Identity & Security</h2>
                    </div>
                    <Card className="p-8 bg-[#0f0f0f] border border-[#1e1e1e] shadow-inner rounded-3xl divide-y divide-[#1e1e1e]/50">
                        <div className="pb-8">
                            <Label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#5a5652] mb-3 block">Primary Uplink</Label>
                            <div className="flex items-center justify-between">
                                <span className="text-[#f0ece4] font-sans opacity-80 font-medium">{user?.email}</span>
                                <span className="text-[9px] font-mono bg-[#141414] border border-[#2a2a2a] text-[#c9a84c] px-3 py-1 rounded-sm uppercase tracking-widest">Verified</span>
                            </div>
                        </div>
                        <div className="py-8">
                            <Label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#5a5652] mb-3 block">Access Key</Label>
                            <div className="flex items-center justify-between">
                                <span className="text-[#5a5652] font-mono text-sm tracking-widest">••••••••••••</span>
                                <Button variant="outline" size="sm" className="rounded-full bg-[#141414] border-[#2a2a2a] text-[#9a9590] hover:text-[#f0ece4] hover:bg-[#1e1e1e] font-mono text-[10px] uppercase tracking-widest" onClick={handlePasswordReset}>
                                    Cycle Key
                                </Button>
                            </div>
                        </div>
                        <div className="pt-8">
                            <Label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-red-500/80 mb-3 block">Critical Operations</Label>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-full bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 font-mono text-[10px] uppercase tracking-widest">
                                        Purge Identity
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-[#080808] border-[#1e1e1e] max-w-md p-8 rounded-3xl shadow-2xl">
                                    <AlertDialogHeader className="mb-6">
                                        <AlertDialogTitle className="text-2xl font-serif text-[#f0ece4]">Confirm Annihilation</AlertDialogTitle>
                                        <AlertDialogDescription className="text-[#9a9590] font-sans text-sm leading-relaxed mt-2">
                                            This sequence is irreversible. All language nodes, XP, and neural mappings will be disintegrated.
                                            Type <span className="font-mono text-red-400 bg-red-500/10 px-1 rounded">PURGE</span> to verify authorization.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Input
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        className="bg-[#0f0f0f] border-[#2a2a2a] text-[#f0ece4] font-mono tracking-widest text-center text-lg h-14 mb-8 focus-visible:ring-red-500/50"
                                        placeholder="PURGE"
                                    />
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-full bg-[#141414] border-[#2a2a2a] text-[#9a9590] hover:text-[#f0ece4] hover:bg-[#1e1e1e] font-mono text-[10px] uppercase tracking-widest h-12 px-6">Abort</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirm !== 'PURGE'}
                                            className="rounded-full bg-red-500 hover:bg-red-400 text-white font-mono text-[10px] uppercase tracking-widest font-bold h-12 px-6 disabled:opacity-30 disabled:hover:bg-red-500"
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
                    <div className="flex items-center gap-3 mb-6 border-b border-[#1e1e1e] pb-4">
                        <Brain className="w-4 h-4 text-[#c9a84c]" />
                        <h2 className="text-[12px] font-mono font-bold uppercase tracking-widest text-[#9a9590]">Neural Calibration</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <Label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#5a5652] block">Immersion Horizon</Label>
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
                                            className="flex flex-col items-center justify-center rounded-2xl border border-[#1e1e1e] bg-[#0f0f0f] p-6 hover:bg-[#141414] hover:border-[#2a2a2a] peer-data-[state=checked]:border-[#c9a84c] peer-data-[state=checked]:bg-[#c9a84c]/5 cursor-pointer transition-all duration-300 relative overflow-hidden group"
                                        >
                                            <span className="text-3xl font-serif text-[#f0ece4] group-hover:text-[#c9a84c] peer-data-[state=checked]:text-[#c9a84c] transition-colors mb-2 z-10">{mins}</span>
                                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#5a5652] peer-data-[state=checked]:text-[#c9a84c]/80 z-10">MINUTES</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="space-y-5">
                            <Label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#5a5652] block">Extraction Vectors</Label>
                            <div className="grid grid-cols-2 gap-4 bg-[#0f0f0f] p-6 rounded-3xl border border-[#1e1e1e] shadow-inner">
                                {CONTENT_TYPES.map((type) => (
                                    <div key={type.id} className="flex items-center space-x-3 group cursor-pointer hover:bg-[#141414] p-2 rounded-lg transition-colors -m-2">
                                        <Checkbox
                                            id={type.id}
                                            checked={settings?.preferred_content_types?.includes(type.id)}
                                            onCheckedChange={(checked) => handleContentTypeToggle(type.id, !!checked)}
                                            className="border-[#2a2a2a] data-[state=checked]:bg-[#c9a84c] data-[state=checked]:border-[#c9a84c] w-5 h-5"
                                        />
                                        <label
                                            htmlFor={type.id}
                                            className="text-sm font-sans text-[#f0ece4]/80 group-hover:text-[#c9a84c] cursor-pointer transition-colors pt-0.5"
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
                    <div className="flex items-center gap-3 mb-6 border-b border-[#1e1e1e] pb-4">
                        <Palette className="w-4 h-4 text-[#c9a84c]" />
                        <h2 className="text-[12px] font-mono font-bold uppercase tracking-widest text-[#9a9590]">Visual Interface</h2>
                    </div>
                    <Card className="p-8 bg-[#0f0f0f] border border-[#1e1e1e] shadow-inner rounded-3xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-serif text-xl text-[#f0ece4] mb-1">Obsidian Theme</h4>
                                <p className="text-[#5a5652] font-sans text-sm">Engineered for deep focus and minimal optical strain.</p>
                            </div>
                            <span className="text-[9px] font-mono bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 font-bold px-3 py-1.5 rounded-sm uppercase tracking-[0.2em] whitespace-nowrap text-center">
                                PRIMARY MODE ACTIVE
                            </span>
                        </div>
                    </Card>
                </section>

                {/* Data Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-[#1e1e1e] pb-4">
                        <Database className="w-4 h-4 text-[#c9a84c]" />
                        <h2 className="text-[12px] font-mono font-bold uppercase tracking-widest text-[#9a9590]">Data Telemetry</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Button
                            variant="outline"
                            className="h-auto p-8 flex flex-col items-start gap-2 rounded-3xl border border-[#1e1e1e] bg-[#0f0f0f] hover:bg-[#141414] hover:border-[#2a2a2a] group"
                            onClick={() => toast.success("Extraction sequence initiated. Packet delivery in T-24H.")}
                        >
                            <span className="font-serif text-xl text-[#f0ece4] group-hover:text-[#c9a84c] transition-colors">Export Logs</span>
                            <span className="text-xs text-[#5a5652] font-sans text-left">Generate a cohesive package of all syntactic interactions.</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto p-8 flex flex-col items-start gap-2 rounded-3xl border border-[#1e1e1e] bg-[#0f0f0f] hover:bg-[#141414] hover:border-[#2a2a2a] group"
                        >
                            <span className="font-serif text-xl text-[#f0ece4] group-hover:text-[#c9a84c] transition-colors">Security Protocol</span>
                            <span className="text-xs text-[#5a5652] font-sans text-left">Review cryptographic boundaries and data retention policies.</span>
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
