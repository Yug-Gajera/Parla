"use client";

// ============================================================
// Parlova — Edit Profile Sheet (Redesigned)
// ============================================================

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { toast } from 'sonner';

interface EditProfileUser {
    id?: string;
    full_name?: string | null;
    avatar_url?: string | null;
    native_language?: string;
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
            if (avatarFile && user?.id) {
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
                avatar_url: finalAvatarUrl || undefined
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
            <SheetContent side="bottom" className="sm:max-w-md mx-auto rounded-t-3xl bg-card border-border border-b-0 px-8 py-10 font-sans shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
                <SheetHeader className="mb-10">
                    <SheetTitle className="text-3xl font-display text-text-primary">Edit Profile</SheetTitle>
                    <SheetDescription className="text-text-muted text-sm">Modify your identification and linguistic baseline parameters.</SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-8">
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
                                <div className={`w-28 h-28 rounded-full overflow-hidden border-2 border-border bg-surface flex items-center justify-center relative transition-all group-hover:border-gold`}>
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Avatar preview"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-4xl font-display text-text-secondary">
                                            {(name || 'U').substring(0, 1).toUpperCase()}
                                        </span>
                                    )}

                                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-gold" />
                                    </div>
                                </div>
                            </Label>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono-num">Select Avatar (Max 2MB)</span>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="name" className="text-[10px] font-mono-num uppercase tracking-widest text-text-muted">Nominal Identity</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-background border-border text-text-primary h-12 rounded-lg px-4 focus-visible:ring-1 focus-visible:ring-gold focus-visible:border-gold transition-colors"
                                placeholder="Enter full name"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="native_lang" className="text-[10px] font-mono-num uppercase tracking-widest text-text-muted">Base Language</Label>
                            <select
                                id="native_lang"
                                value={nativeLang}
                                onChange={(e) => setNativeLang(e.target.value)}
                                className="flex h-12 w-full items-center justify-between rounded-lg border border-border bg-background text-text-primary px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235a5652' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 1rem center',
                                    backgroundSize: '1em'
                                }}
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

                <SheetFooter className="mt-12">
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className="w-full h-12 rounded-full font-mono-num uppercase tracking-widest text-xs font-bold bg-gold text-background hover:brightness-110 transition-colors"
                    >
                        {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transmitting...</> : 'Save Profile Specs'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
