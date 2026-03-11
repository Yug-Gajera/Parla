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
            <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0 bg-[#080808] border-t border-[#1e1e1e] rounded-t-3xl overflow-hidden font-sans">
                <SheetHeader className="p-6 pb-5 border-b border-[#1e1e1e] bg-[#0f0f0f]">
                    <SheetTitle className="text-2xl font-serif text-[#f0ece4] text-center mb-2">Index Lexicon</SheetTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a5652]" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Input terminology..."
                            className="pl-11 h-12 bg-[#141414] border-[#2a2a2a] text-[#f0ece4] placeholder:text-[#5a5652] rounded-xl focus-visible:ring-1 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-0 focus-visible:bg-[#1a1a1a] transition-all font-mono"
                        />
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-[#080808]">
                    {isSearching ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-6 w-6 animate-spin text-[#c9a84c]" />
                        </div>
                    ) : search.trim().length > 0 && results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-14 text-center">
                            <p className="text-[#9a9590] mb-2 font-mono text-sm uppercase tracking-widest">
                                Unit unindexed
                            </p>
                            <p className="text-[11px] text-[#5a5652] font-sans max-w-xs mx-auto leading-relaxed">
                                Diagnostic failure: Term not found in current database array.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col w-full divide-y divide-[#1e1e1e]">
                            {results.map((word) => (
                                <div key={word.id} className="flex items-center justify-between p-5 hover:bg-[#141414] transition-colors group">
                                    <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-serif font-bold text-xl text-[#f0ece4] group-hover:text-[#c9a84c] transition-colors">{word.word}</span>
                                            {word.cefr_level && (
                                                <span className="px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase tracking-widest border border-[#c9a84c]/30 text-[#c9a84c] bg-[#c9a84c]/10">
                                                    {word.cefr_level}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-[#9a9590]">{word.translation}</span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => !word.is_added && handleAdd(word.id)}
                                        disabled={word.is_added || addingIds.has(word.id)}
                                        className={`h-10 rounded-full font-mono text-[10px] uppercase tracking-widest font-bold transition-all ${
                                            word.is_added 
                                            ? "opacity-50 cursor-default border-[#1e1e1e] bg-[#0f0f0f] text-[#5a5652]" 
                                            : "bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30 hover:bg-[#c9a84c] hover:text-[#080808]"
                                        }`}
                                    >
                                        {addingIds.has(word.id) ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-[#c9a84c]" />
                                        ) : word.is_added ? (
                                            <><CheckCircle2 className="h-3.5 h-3.5 mr-1.5" /> Indexed</>
                                        ) : (
                                            <><Plus className="h-3.5 h-3.5 mr-1.5" /> Acquire</>
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet >
    );
}
