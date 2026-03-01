"use client";

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface EditProfileUser {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
}

interface EditProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
    user: EditProfileUser | null;
    onSave: (updates: { full_name?: string, native_language?: string, avatar_url?: string }) => Promise<boolean>;
}

export function EditProfileSheet({ isOpen, onClose, user, onSave }: EditProfileSheetProps) {
    const [name, setName] = useState(user?.full_name || '');
    const [nativeLang, setNativeLang] = useState(user?.native_language || 'en');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar_url || null);

    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Image must be less than 2MB");
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error("Must be an image file");
                return;
            }
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalAvatarUrl = user?.avatar_url;

            // Upload image if changed - path: {user_id}/avatar.{ext}
            if (avatarFile) {
                const ext = avatarFile.name.split('.').pop() || 'jpg';
                const filePath = `${user.id}/avatar.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                finalAvatarUrl = data.publicUrl;
            }

            const success = await onSave({
                full_name: name,
                native_language: nativeLang,
                avatar_url: finalAvatarUrl
            });

            if (success) {
                onClose();
            }
        } catch (error) {
            console.error("Save error", error);
            toast.error("Failed to save changes. Make sure you set up the 'avatars' storage bucket!");
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-update internal state if user prop changes
    React.useEffect(() => {
        if (user && isOpen) {
            setName(user.full_name || '');
            setNativeLang(user.native_language || 'en');
            setPreviewUrl(user.avatar_url || null);
            setAvatarFile(null);
        }
    }, [user, isOpen]);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="bottom" className="sm:max-w-md mx-auto rounded-t-3xl bg-card border-border px-6 py-8">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-2xl font-black text-foreground">Edit Profile</SheetTitle>
                    <SheetDescription>Update your personal info and display picture.</SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer">
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <Label htmlFor="avatar-upload" className="cursor-pointer block">
                                <div className={`w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-secondary flex items-center justify-center relative transition-all group-hover:border-primary`}>
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-secondary-foreground">
                                            {(name || 'U').substring(0, 2).toUpperCase()}
                                        </span>
                                    )}

                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </Label>
                        </div>
                        <span className="text-xs text-muted-foreground">Tap to change (Max 2MB)</span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-background border-border"
                                placeholder="Your full name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="native_lang" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Native Language</Label>
                            <select
                                id="native_lang"
                                value={nativeLang}
                                onChange={(e) => setNativeLang(e.target.value)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="en">English (US)</option>
                                <option value="en-gb">English (UK)</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="it">Italian</option>
                                <option value="pt">Portuguese</option>
                                <option value="zh">Chinese</option>
                                <option value="ja">Japanese</option>
                                <option value="ko">Korean</option>
                            </select>
                        </div>
                    </div>
                </div>

                <SheetFooter className="mt-8">
                    <Button onClick={handleSave} disabled={isSaving} className="w-full font-bold">
                        {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
