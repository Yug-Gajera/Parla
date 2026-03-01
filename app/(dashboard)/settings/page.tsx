'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Mail, Key, Trash2, Bell, Moon, Database, Shield } from 'lucide-react';
import { toast } from 'sonner';

const DAILY_GOAL_OPTIONS = [10, 20, 30, 45] as const;
const CONTENT_TYPES = [
    { id: 'news', label: 'News' },
    { id: 'cooking', label: 'Cooking' },
    { id: 'travel', label: 'Travel' },
    { id: 'sports', label: 'Sports' },
    { id: 'business', label: 'Business' },
    { id: 'entertainment', label: 'Entertainment' },
];

export default function SettingsPage() {
    const supabase = createClient();
    const [email, setEmail] = useState<string>('');
    const [settings, setSettings] = useState<{
        daily_goal_minutes: number;
        notification_enabled: boolean;
        preferred_content_types: string[];
    } | null>(null);
    const [saved, setSaved] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setEmail(user.email || '');
            const { data } = await supabase.from('user_settings').select('*').eq('user_id', user?.id).single();
            if (data) {
                setSettings({
                    daily_goal_minutes: data.daily_goal_minutes ?? 20,
                    notification_enabled: data.notification_enabled ?? true,
                    preferred_content_types: Array.isArray(data.preferred_content_types) ? data.preferred_content_types : ['news', 'cooking', 'vlog'],
                });
            } else {
                setSettings({
                    daily_goal_minutes: 20,
                    notification_enabled: true,
                    preferred_content_types: ['news', 'cooking', 'vlog'],
                });
            }
        })().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveSettings = async (updates: Partial<typeof settings>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        try {
            const res = await fetch('/api/settings/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error();
            setSettings((s) => (s ? { ...s, ...updates } : s));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            toast.error('Failed to save settings');
        }
    };

    const scheduleSave = (updates: Partial<typeof settings>) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSettings((s) => (s ? { ...s, ...updates } : s));
        saveTimeoutRef.current = setTimeout(() => {
            saveSettings(updates);
            saveTimeoutRef.current = null;
        }, 500);
    };

    const handleDailyGoal = (mins: number) => {
        scheduleSave({ daily_goal_minutes: mins });
    };

    const handleNotification = (checked: boolean) => {
        scheduleSave({ notification_enabled: checked });
    };

    const handleContentType = (id: string, checked: boolean) => {
        if (!settings) return;
        const current = settings.preferred_content_types;
        const arr = checked
            ? (current.includes(id) ? current : [...current, id])
            : current.filter((t) => t !== id);
        scheduleSave({ preferred_content_types: arr });
        setSettings({ ...settings, preferred_content_types: arr });
    };

    const handleChangePassword = async () => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
            });
            if (error) throw error;
            toast.success('Check your email for the reset link');
        } catch {
            toast.error('Failed to send reset email');
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'DELETE') return;
        setIsDeleting(true);
        toast.error('Account deletion requires the service role. See docs for setup.');
        setIsDeleting(false);
        setIsDeleteOpen(false);
        setDeleteConfirm('');
    };

    if (!settings) {
        return (
            <div className="flex flex-col w-full max-w-2xl mx-auto p-8 animate-pulse">
                <div className="h-8 bg-muted rounded w-48 mb-8" />
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-muted rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black text-foreground tracking-tight">Settings</h1>
                {saved && <span className="text-xs text-primary font-medium">Saved</span>}
            </div>

            {/* Account */}
            <Card className="p-6 border-border/50 bg-card mb-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Account
                </h2>
                <div className="space-y-4">
                    <div>
                        <Label className="text-muted-foreground text-sm">Email</Label>
                        <p className="text-foreground mt-1 opacity-70">{email}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleChangePassword}>
                        <Key className="w-4 h-4 mr-2" /> Change Password
                    </Button>
                </div>
                <Separator className="my-6" />
                <div>
                    <Label className="text-destructive font-medium">Danger Zone</Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Permanently delete your account and all data.</p>
                    <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                    </Button>
                </div>
            </Card>

            {/* Learning Preferences */}
            <Card className="p-6 border-border/50 bg-card mb-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Learning Preferences
                </h2>
                <div className="space-y-6">
                    <div>
                        <Label className="text-sm mb-3 block">Daily Goal</Label>
                        <div className="flex flex-wrap gap-2">
                            {DAILY_GOAL_OPTIONS.map((mins) => (
                                <button
                                    key={mins}
                                    onClick={() => handleDailyGoal(mins)}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                                        ${settings.daily_goal_minutes === mins
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-secondary/50 border-border hover:border-primary/50'}`}
                                >
                                    {mins}+ min
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Notifications</Label>
                            <p className="text-xs text-muted-foreground">Get reminders to practice (coming soon)</p>
                        </div>
                        <Switch
                            checked={settings.notification_enabled}
                            onCheckedChange={handleNotification}
                        />
                    </div>
                    <div>
                        <Label className="text-sm mb-3 block">Preferred Content Types</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {CONTENT_TYPES.map((ct) => (
                                <div key={ct.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={ct.id}
                                        checked={settings.preferred_content_types.includes(ct.id)}
                                        onCheckedChange={(c) => handleContentType(ct.id, !!c)}
                                    />
                                    <Label htmlFor={ct.id} className="cursor-pointer font-normal">{ct.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Appearance */}
            <Card className="p-6 border-border/50 bg-card mb-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Moon className="w-4 h-4" /> Appearance
                </h2>
                <p className="text-sm text-muted-foreground">Dark mode only for now. Light mode coming soon.</p>
            </Card>

            {/* Data */}
            <Card className="p-6 border-border/50 bg-card mb-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Data
                </h2>
                <div className="space-y-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info("We'll email you a data export within 24 hours")}
                    >
                        Export My Data
                    </Button>
                    <div>
                        <a
                            href="/privacy"
                            className="text-sm text-primary hover:underline flex items-center gap-2"
                        >
                            <Shield className="w-4 h-4" /> View Privacy Policy
                        </a>
                    </div>
                </div>
            </Card>

            {/* Delete confirmation dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All your data will be permanently removed.
                            Type <strong>DELETE</strong> to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Type DELETE to confirm"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        className="font-mono"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setDeleteConfirm(''); }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirm !== 'DELETE' || isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
