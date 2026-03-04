"use client";

import React, { useState, useEffect } from 'react';
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
import { Loader2, ShieldAlert, Lock, Mail, Palette, Database, Eye, EyeOff, Brain } from 'lucide-react';
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
            toast.success("Password reset email sent!");
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'DELETE') return;
        toast.error("Account deletion requires administrative privileges. Please contact support.");
        // In a real app, you'd call a secure edge function that uses the service role to delete the user.
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 pb-32">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage your account and learning preferences.</p>
                </div>
                {isSaving && (
                    <div className="flex items-center text-xs font-bold text-primary animate-pulse">
                        SAVING...
                    </div>
                )}
            </div>

            <div className="space-y-12">
                {/* Account Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Mail className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold">Account</h2>
                    </div>
                    <Card className="p-6 bg-card border-border/50 divide-y divide-border/50">
                        <div className="pb-6">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Email Address</Label>
                            <div className="flex items-center justify-between">
                                <span className="text-foreground font-medium opacity-50">{user?.email}</span>
                                <span className="text-[10px] bg-secondary px-2 py-1 rounded text-muted-foreground">PRIMARY</span>
                            </div>
                        </div>
                        <div className="py-6">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Password</Label>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm italic">••••••••••••</span>
                                <Button variant="outline" size="sm" className="rounded-full" onClick={handlePasswordReset}>
                                    Change Password
                                </Button>
                            </div>
                        </div>
                        <div className="pt-6">
                            <Label className="text-xs font-bold uppercase tracking-wider text-destructive mb-2 block">Danger Zone</Label>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="rounded-full">
                                        Delete Account
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border-border">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted-foreground">
                                            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                            Please type <span className="font-bold text-foreground">DELETE</span> to confirm.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Input
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        className="bg-background border-border my-4"
                                        placeholder="DELETE"
                                    />
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirm !== 'DELETE'}
                                            className="bg-destructive hover:bg-destructive/90 rounded-full font-bold"
                                        >
                                            Delete My Account
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </Card>
                </section>

                <Separator className="bg-border/50" />

                {/* Learning Preferences */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Brain className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold">Learning Preferences</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Goal</Label>
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
                                            className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-card p-4 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                                        >
                                            <span className="text-2xl font-black">{mins}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">MINUTES</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Types</Label>
                            <div className="grid grid-cols-2 gap-3 bg-card p-4 rounded-2xl border border-border/50">
                                {CONTENT_TYPES.map((type) => (
                                    <div key={type.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={type.id}
                                            checked={settings?.preferred_content_types?.includes(type.id)}
                                            onCheckedChange={(checked) => handleContentTypeToggle(type.id, !!checked)}
                                        />
                                        <label
                                            htmlFor={type.id}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {type.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <Separator className="bg-border/50" />

                {/* Appearance */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Palette className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold">Appearance</h2>
                    </div>
                    <Card className="p-6 bg-card border-border/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold">Dark Mode</h4>
                                <p className="text-sm text-muted-foreground">Always on for focused learning sessions.</p>
                            </div>
                            <span className="text-[10px] bg-primary/10 text-primary font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                LIGHT MODE COMING SOON
                            </span>
                        </div>
                    </Card>
                </section>

                <Separator className="bg-border/50" />

                {/* Data Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Database className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold">Privacy & Data</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="h-auto p-6 flex flex-col items-start gap-1 rounded-2xl border-border/50 bg-card hover:bg-muted"
                            onClick={() => toast.success("We'll email you a data export within 24 hours")}
                        >
                            <span className="font-bold">Export My Data</span>
                            <span className="text-xs text-muted-foreground">Download all your study history.</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto p-6 flex flex-col items-start gap-1 rounded-2xl border-border/50 bg-card hover:bg-muted"
                        >
                            <span className="font-bold">Privacy Policy</span>
                            <span className="text-xs text-muted-foreground">Read how we protect your information.</span>
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
