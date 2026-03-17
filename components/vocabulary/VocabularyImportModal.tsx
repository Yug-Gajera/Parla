'use client';

// ============================================================
// Parlova — Dashboard Vocabulary Import Modal
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type ProcessingState = 'idle' | 'processing' | 'success';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLevel?: string; // from user_languages
    onSuccessAction?: () => void; // action to refresh the parent vocabulary list
}

const TIERS = [
    { id: 'A1', label: 'Just Starting', desc: '300 most common words' },
    { id: 'A2', label: 'Beginner', desc: '800 most common words' },
    { id: 'B1', label: 'Intermediate', desc: '2,000 most common words' },
    { id: 'B2', label: 'Upper Intermediate', desc: '4,000 most common words' },
    { id: 'C1', label: 'Advanced', desc: '8,000 most common words' },
];

export function VocabularyImportModal({ isOpen, onClose, currentLevel = 'A1', onSuccessAction }: ImportModalProps) {
    const [activeTab, setActiveTab] = useState<'anki' | 'paste' | 'tier'>('anki');
    const [processState, setProcessState] = useState<ProcessingState>('idle');
    const [processStatus, setProcessStatus] = useState('Importing your vocabulary...');
    const [runningCount, setRunningCount] = useState({ current: 0 });

    const [finalStats, setFinalStats] = useState({ added: 0, skipped: 0, enriched: 0, updated: 0, newLevelEstimate: 'A1' });

    // --- Tab 1: Anki ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [ankiPreview, setAnkiPreview] = useState<any[]>([]);
    const [ankiData, setAnkiData] = useState<string>('');
    const [ankiParsedCount, setAnkiParsedCount] = useState(0);

    // --- Tab 2: Paste ---
    const [pasteText, setPasteText] = useState('');
    const [pasteDetails, setPasteDetails] = useState({ count: 0, needingTranslation: 0 });

    // --- Tab 3: Tier ---
    const [selectedTier, setSelectedTier] = useState<string | null>(null);
    const [tierPreviews, setTierPreviews] = useState<Record<string, number>>({});
    const tierFetches = useRef<Set<string>>(new Set());

    // --- Reset on open ---
    useEffect(() => {
        if (isOpen) {
            setProcessState('idle');
            setAnkiPreview([]);
            setAnkiData('');
            setAnkiParsedCount(0);
            setPasteText('');
            setPasteDetails({ count: 0, needingTranslation: 0 });
            setSelectedTier(null);
            setTierPreviews({});
            tierFetches.current.clear();
        }
    }, [isOpen]);

    // --- Parsing Helpers ---
    const parseAnkiCSV = (text: string) => {
        const rows = [];
        let cur = '';
        let inQuotes = false;
        let row: string[] = [];
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if ((char === ',' || char === '\t') && !inQuotes) {
                row.push(cur.replace(/<\/?[^>]+(>|$)/g, "").trim());
                cur = '';
            } else if (char === '\n' && !inQuotes) {
                row.push(cur.replace(/<\/?[^>]+(>|$)/g, "").trim());
                if (row.length > 0 && row.some(c => c.length > 0)) rows.push(row);
                row = [];
                cur = '';
            } else {
                cur += char;
            }
        }
        if (cur.length > 0 || row.length > 0) {
            row.push(cur.replace(/<\/?[^>]+(>|$)/g, "").trim());
            rows.push(row);
        }
        
        return rows.map(r => ({
            spanish: r[0] || '',
            english: r[1] || '',
            interval: r[2] ? parseInt(r[2]) : undefined
        })).filter(w => w.spanish.length > 0);
    };

    const parsePasteText = (text: string) => {
        const tokens = text.split(/[\n;|,]+/).filter(Boolean);
        const words = [];
        for (let t of tokens) {
            const clean = t.trim();
            if (!clean) continue;
            // Match "word — translation" or "word: translation" etc.
            const match = clean.match(/^(.+?)(?:\s*(?:-|—|:)\s*)(.+)$/);
            if (match) {
                words.push({ spanish: match[1].trim(), english: match[2].trim() });
            } else {
                words.push({ spanish: clean, english: '' });
            }
        }
        return words;
    };

    // Live update paste details
    useEffect(() => {
        const handler = setTimeout(() => {
            if (!pasteText) {
                setPasteDetails({ count: 0, needingTranslation: 0 });
                return;
            }
            const parsed = parsePasteText(pasteText);
            setPasteDetails({ 
                count: parsed.length, 
                needingTranslation: parsed.filter(p => !p.english).length 
            });
        }, 300);
        return () => clearTimeout(handler);
    }, [pasteText]);


    // Fetch tier previews on mount or when switching to tier tab
    useEffect(() => {
        if (isOpen && activeTab === 'tier') {
            const fetchPreviews = async () => {
                const tiersToFetch = ['A1', 'A2', 'B1', 'B2', 'C1']; // using C1 for advanced
                for (const t of tiersToFetch) {
                    if (tierFetches.current.has(t)) continue;
                    tierFetches.current.add(t);
                    try {
                        const res = await fetch('/api/vocabulary/seed', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tierId: t, languageId: 'es', preview: true })
                        });
                        const data = await res.json();
                        if (data.success) {
                            setTierPreviews(prev => ({ ...prev, [t]: data.seeded_count }));
                        }
                    } catch (e) {}
                }
            };
            fetchPreviews();
        }
    }, [isOpen, activeTab]);


    // --- Handlers ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large. Max 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            const content = evt.target?.result as string;
            setAnkiData(content);
            const parsed = parseAnkiCSV(content);
            if (parsed.length === 0) {
                toast.error("We couldn't read that file. Try parsing again.");
            } else {
                setAnkiParsedCount(parsed.length);
                setAnkiPreview(parsed.slice(0, 5));
            }
        };
        reader.readAsText(file);
    };

    const runImportBatch = async (words: any[], source: string, enrichedCount = 0) => {
        setProcessState('processing');
        setProcessStatus("Importing your vocabulary...");
        setRunningCount({ current: 0 });

        try {
            const res = await fetch('/api/vocabulary/import-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words, importSource: source, languageId: 'es', enrichedCount })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setFinalStats({
                added: data.imported_count,
                skipped: data.skipped_count,
                enriched: data.enriched_count,
                updated: data.updated_count,
                newLevelEstimate: data.estimated_level
            });
            setProcessState('success');

        } catch (e) {
            console.error(e);
            toast.error("Import failed");
            setProcessState('idle');
        }
    };

    const submitAnki = () => {
        const parsed = parseAnkiCSV(ankiData);
        if (parsed.length) runImportBatch(parsed, 'anki_import');
    };

    const submitPaste = async () => {
        const parsed = parsePasteText(pasteText);
        if (!parsed.length) return;

        setProcessState('processing');
        
        let finalWords = [...parsed.filter(w => w.english)];
        const needsEnglish = parsed.filter(w => !w.english);

        if (needsEnglish.length > 0) {
            setProcessStatus(`Enriching words...`);
            const batches = [];
            for (let i = 0; i < needsEnglish.length; i += 20) {
                batches.push(needsEnglish.slice(i, i + 20).map(w => w.spanish));
            }

            let enriched = 0;
            for (const batch of batches) {
                try {
                    const res = await fetch('/api/vocabulary/enrich', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ words: batch })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.enriched) {
                            finalWords = [...finalWords, ...data.enriched];
                        }
                    }
                } catch(e) {}
                enriched += batch.length;
                setRunningCount({ current: enriched });
                setProcessStatus(`Enriching words...`); // UI can show dynamic things here if needed
            }
        }

        setProcessStatus("Almost done...");
        const res = await fetch('/api/vocabulary/import-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: finalWords, importSource: 'paste_import', languageId: 'es', enrichedCount: needsEnglish.length })
        });

        try {
            const data = await res.json();
            if (!data.success) throw new Error();

            setFinalStats({
                added: data.imported_count,
                skipped: data.skipped_count,
                enriched: needsEnglish.length,
                updated: data.updated_count || 0,
                newLevelEstimate: data.estimated_level
            });
            setProcessState('success');
        } catch (e) {
            toast.error("Format parsing failed");
            setProcessState('idle');
        }
    };

    const submitTier = async () => {
        if (!selectedTier) return;
        setProcessState('processing');
        setProcessStatus("Planting global frequencies...");
        
        try {
            const res = await fetch('/api/vocabulary/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tierId: selectedTier, languageId: 'es', preview: false })
            });

            const data = await res.json();
            if (!data.success) throw new Error();

            setFinalStats({
                added: data.seeded_count,
                skipped: data.skipped_count,
                enriched: 0,
                updated: 0,
                newLevelEstimate: data.estimated_level
            });
            setProcessState('success');
            
        } catch (e) {
            toast.error("Seed failed");
            setProcessState('idle');
        }
    };

    const acceptNewLevel = async () => {
        try {
            await fetch('/api/user/update-level', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ targetLevel: finalStats.newLevelEstimate })
            });
            toast.success("Level updated successfully");
            closeAndRefresh();
        } catch(e) {
            toast.error("Failed to commit level");
        }
    };

    const closeAndRefresh = () => {
        if (onSuccessAction) onSuccessAction();
        onClose();
    };

    if (!isOpen) return null;

    // Check if level suggestion is applicable
    const levelHierarchy = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const curIdx = levelHierarchy.indexOf(currentLevel);
    const newIdx = levelHierarchy.indexOf(finalStats.newLevelEstimate);
    const showsSuggestion = (processState === 'success' && Math.abs(curIdx - newIdx) > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`absolute inset-0 bg-black/70 ${processState === 'processing' ? 'pointer-events-none' : ''}`} onClick={processState === 'processing' ? undefined : onClose} />
            
            <div className="relative bg-card border border-gold/20 rounded-[20px] p-8 w-full max-w-[520px] flex flex-col items-center">
                
                {processState !== 'processing' && (
                    <button onClick={onClose} className="absolute top-6 right-6 text-text-secondary hover:text-text-primary transition-colors p-1 rounded-md hover:bg-surface">
                        <X size={20} />
                    </button>
                )}

                {/* --- Processing View --- */}
                {processState === 'processing' && (
                    <div className="py-12 flex flex-col items-center w-full animation-fade-in text-center">
                        <Loader2 size={48} strokeWidth={1.5} className="animate-spin text-gold mb-6" />
                        <p className="text-text-secondary text-sm font-sans mb-3">{processStatus}</p>
                        {runningCount.current > 0 && (
                            <p className="text-gold text-[13px] font-mono font-medium">{runningCount.current} prepared</p>
                        )}
                    </div>
                )}

                {/* --- Success View --- */}
                {processState === 'success' && (
                    <div className="py-6 flex flex-col items-center w-full animation-fade-in text-center">
                        <CheckCircle size={40} strokeWidth={1.5} className="text-gold mb-5" />
                        <h2 className="text-2xl font-serif text-text-primary mb-8">Import complete</h2>
                        
                        <div className="flex gap-8 mb-10 w-full justify-center">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-2xl font-mono text-gold font-medium">{finalStats.added}</span>
                                <span className="text-xs font-sans text-text-secondary">added</span>
                            </div>
                            <div className="w-[1px] bg-border-strong" />
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-2xl font-mono text-gold font-medium">{finalStats.skipped}</span>
                                <span className="text-xs font-sans text-text-secondary">skipped</span>
                            </div>
                            {(finalStats.enriched > 0 || finalStats.updated > 0) && (
                                <>
                                    <div className="w-[1px] bg-border-strong" />
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-2xl font-mono text-gold font-medium">
                                            {finalStats.enriched > 0 ? finalStats.enriched : finalStats.updated}
                                        </span>
                                        <span className="text-xs font-sans text-text-secondary">
                                            {finalStats.enriched > 0 ? 'enriched' : 'updated'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {showsSuggestion && (
                            <div className="bg-surface border border-border-strong rounded-xl p-5 mb-8 w-full flex flex-col items-center">
                                <p className="text-[13px] font-sans text-text-primary mb-4 text-center">
                                    Your vocabulary suggests you may be <strong>{finalStats.newLevelEstimate}</strong>.<br/>
                                    Would you like to update your level?
                                </p>
                                <div className="flex gap-3 w-full">
                                    <Button onClick={closeAndRefresh} className="flex-1 bg-transparent hover:bg-surface border border-border-strong text-text-primary font-sans">
                                        Keep current
                                    </Button>
                                    <Button onClick={acceptNewLevel} className="flex-1 bg-gold hover:brightness-110 text-bg font-sans font-medium">
                                        Update level
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!showsSuggestion && (
                            <Button onClick={closeAndRefresh} className="bg-gold hover:brightness-110 text-bg font-sans font-medium w-full h-12 text-[15px] rounded-xl">
                                View my deck
                            </Button>
                        )}
                    </div>
                )}


                {/* --- Input View --- */}
                {processState === 'idle' && (
                    <div className="w-full animation-fade-in flex flex-col items-center">
                        <h2 className="font-serif text-text-primary text-2xl mb-2 text-center">Import Vocabulary</h2>
                        <p className="font-sans text-[14px] text-text-secondary mb-8 text-center balance-text">
                            Add words from Anki, a word list, or let us fill your deck based on your level
                        </p>

                        {/* Tabs */}
                        <div className="flex w-full mb-6 relative px-2">
                            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border-strong" />
                            {(['anki', 'paste', 'tier'] as const).map(tab => {
                                const labels = { anki: 'Anki CSV', paste: 'Word List', tier: 'By Level' };
                                const isActive = activeTab === tab;
                                return (
                                    <button 
                                        key={tab} 
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 pb-3 text-[13px] font-sans font-medium transition-colors relative z-10 ${isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        {labels[tab]}
                                        <div className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full transition-all ${isActive ? 'bg-gold' : 'bg-transparent'}`} />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content 1: Anki */}
                        {activeTab === 'anki' && (
                            <div className="w-full animation-fade-in">
                                <input type="file" accept=".csv,.txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                
                                {!ankiData ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full bg-gold/5 border border-dashed border-gold/30 rounded-[14px] p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gold/10 transition-colors mb-4"
                                    >
                                        <Upload size={24} className="text-gold mb-3" />
                                        <p className="text-text-secondary font-sans text-[14px]">Drop your CSV here or click to browse</p>
                                    </div>
                                ) : (
                                    <div className="w-full mb-4">
                                        <div className="flex justify-between items-center mb-3 text-[13px] font-sans text-text-primary px-1">
                                            <span>File parsed successfully</span>
                                            <button onClick={() => setAnkiData('')} className="text-text-muted hover:text-text-secondary uppercase text-[10px] font-bold tracking-wider">Reset</button>
                                        </div>
                                        <div className="bg-surface border border-border rounded-xl p-3 mb-6 max-h-[160px] overflow-y-auto font-mono text-[11px]">
                                            {ankiPreview.map((w, i) => (
                                                <div key={i} className="flex gap-4 border-b border-border last:border-0 py-2 text-text-secondary">
                                                    <span className="flex-1 text-text-primary truncate">{w.spanish}</span>
                                                    <span className="flex-1 truncate">{w.english || '-'}</span>
                                                    <span className="w-12 text-right">{w.interval || '-'}d</span>
                                                </div>
                                            ))}
                                            {ankiParsedCount > 5 && (
                                                <div className="text-center py-2 text-text-muted">... and {ankiParsedCount - 5} more</div>
                                            )}
                                        </div>
                                        <Button onClick={submitAnki} className="w-full h-12 bg-gold hover:brightness-110 text-bg font-sans font-medium text-[15px] rounded-xl">
                                            Import {ankiParsedCount} words
                                        </Button>
                                    </div>
                                )}
                                
                                {!ankiData && (
                                    <p className="text-[12px] font-sans text-text-muted text-center px-4">
                                        How to export from Anki:<br/>File → Export → Notes as Plain Text
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Tab Content 2: Paste */}
                        {activeTab === 'paste' && (
                            <div className="w-full animation-fade-in relative">
                                <textarea
                                    value={pasteText}
                                    onChange={(e) => setPasteText(e.target.value)}
                                    placeholder={`hablar, comer, vivir, casa...\n\nOr paste with translations:\nhablar — to speak\ncomer — to eat`}
                                    className="w-full h-[160px] bg-card border border-border-strong rounded-xl p-4 text-text-primary font-sans text-[14px] focus:outline-none focus:border-gold/50 transition-colors resize-none placeholder:text-text-muted/50"
                                />
                                <div className="mt-2 mb-6 px-1">
                                    <span className="font-mono text-[12px] font-medium text-text-secondary">{pasteDetails.count} words detected</span>
                                </div>
                                <Button 
                                    onClick={submitPaste} 
                                    disabled={pasteDetails.count === 0}
                                    className="w-full h-12 bg-gold hover:brightness-110 text-bg font-sans font-medium text-[15px] rounded-xl disabled:opacity-30"
                                >
                                    Import {pasteDetails.count} words
                                </Button>
                            </div>
                        )}

                        {/* Tab Content 3: By Level */}
                        {activeTab === 'tier' && (
                            <div className="w-full animation-fade-in flex flex-col">
                                <p className="font-sans text-[14px] text-text-secondary mb-[20px] text-center">
                                    We'll add the most common Spanish words up to your selected level to your deck. Words you already have will be skipped.
                                </p>
                                
                                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1 mb-4 custom-scrollbar">
                                    {TIERS.map(tier => {
                                        const isSelected = selectedTier === tier.id;
                                        const newWords = tierPreviews[tier.id] ?? '...';
                                        return (
                                            <div 
                                                key={tier.id}
                                                onClick={() => setSelectedTier(tier.id)}
                                                className={`p-[14px] px-[16px] rounded-[10px] border transition-all duration-150 cursor-pointer flex justify-between items-center ${isSelected ? 'border-gold/40 bg-gold/5' : 'border-border bg-surface hover:bg-surface-hover hover:border-border-strong'}`}
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-gold font-bold text-[11px] bg-gold/10 px-1.5 py-0.5 rounded uppercase">{tier.id}</span>
                                                        <span className={`font-sans text-[14px] font-medium ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{tier.label}</span>
                                                    </div>
                                                    <span className="font-sans text-[12px] text-text-muted">{tier.desc}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-mono text-[13px] ${isSelected ? 'text-gold' : 'text-text-secondary'}`}>
                                                        {newWords} new
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <p className="font-sans text-[12px] text-text-muted text-center mb-5 px-4">
                                    These words are pre-marked as known and won't appear in daily review unless you fail them in context.
                                </p>
                                <Button 
                                    onClick={submitTier} 
                                    disabled={!selectedTier}
                                    className="w-full h-12 bg-gold hover:brightness-110 text-bg font-sans font-medium text-[15px] rounded-xl disabled:opacity-30"
                                >
                                    Add {selectedTier && tierPreviews[selectedTier] ? tierPreviews[selectedTier] : 'words'} to my deck
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default VocabularyImportModal;
