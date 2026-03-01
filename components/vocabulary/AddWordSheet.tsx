"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search, CheckCircle2 } from 'lucide-react';
import { useVocabulary } from '@/hooks/useVocabulary';

interface AddWordSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    languageId: string | null;
    refreshDeck: () => void;
}

export function AddWordSheet({ open, onOpenChange, languageId, refreshDeck }: AddWordSheetProps) {
    const { addWord } = useVocabulary(languageId);

    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!open) {
            setSearch('');
            setResults([]);
            setAddingIds(new Set());
        }
    }, [open]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!search.trim() || !languageId) {
                setResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`/api/vocabulary/words?language_id=${languageId}&search=${encodeURIComponent(search)}&limit=15`);
                if (res.ok) {
                    const json = await res.json();
                    setResults(json.data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchResults, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [search, languageId]);

    const handleAdd = async (wordId: string) => {
        setAddingIds(prev => new Set(prev).add(wordId));
        try {
            await addWord(wordId);
            // Update local results strictly to show added
            setResults(prev => prev.map(w => w.id === wordId ? { ...w, is_added: true } : w));
            refreshDeck();
        } catch (err) {
            console.error(err);
        } finally {
            setAddingIds(prev => {
                const next = new Set(prev);
                next.delete(wordId);
                return next;
            });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0">
                <SheetHeader className="p-6 pb-4 border-b border-border">
                    <SheetTitle className="text-xl">Add New Word</SheetTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Type a word in Spanish..."
                            className="pl-9 h-12 bg-background/50 border-input w-full"
                        />
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto w-full">
                    {isSearching ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : search.trim().length > 0 && results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <p className="text-muted-foreground mb-1">
                                This word isn't in our database yet
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                                Try searching for its root form (e.g., infinitive verb).
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col w-full divide-y divide-border/50">
                            {results.map((word) => (
                                <div key={word.id} className="flex items-center justify-between p-4 hover:bg-card/50 transition-colors">
                                    <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-lg">{word.word}</span>
                                            {word.cefr_level && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                                                    {word.cefr_level}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-muted-foreground">{word.translation}</span>
                                    </div>

                                    <Button
                                        variant={word.is_added ? "secondary" : "default"}
                                        size="sm"
                                        onClick={() => !word.is_added && handleAdd(word.id)}
                                        disabled={word.is_added || addingIds.has(word.id)}
                                        className={word.is_added ? "opacity-70 cursor-default" : "bg-primary text-primary-foreground"}
                                    >
                                        {addingIds.has(word.id) ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : word.is_added ? (
                                            <><CheckCircle2 className="h-4 w-4 mr-1" /> Added</>
                                        ) : (
                                            <><Plus className="h-4 w-4 mr-1" /> Add</>
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
