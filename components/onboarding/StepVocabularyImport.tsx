'use client';

// ============================================================
// Parlova — Onboarding Step 4: Vocabulary Import
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Clipboard, BarChart, Sparkles, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type ImportMethod = 'anki' | 'paste' | 'tier' | 'skip' | null;
type ProcessState = 'idle' | 'processing' | 'success' | 'error';

const TIERS = [
    { id: 'A1', label: 'Just started', desc: 'around 300 words' },
    { id: 'A2', label: 'Beginner', desc: 'around 800 words' },
    { id: 'B1', label: 'Intermediate', desc: 'around 2,000 words' },
    { id: 'B2', label: 'Upper Intermediate', desc: 'around 4,000 words' },
    { id: 'C1', label: 'Advanced', desc: 'around 8,000 words' },
];

export default function StepVocabularyImport() {
    const { selectedLanguageCode, setVocabularyImportResult, nextStep, prevStep } = useOnboardingStore();

    const [activeMethod, setActiveMethod] = useState<ImportMethod>(null);
    const [processState, setProcessState] = useState<ProcessState>('idle');
    const [processText, setProcessText] = useState('Getting things ready for you...');
    const [progressStats, setProgressStats] = useState({ current: 0, total: 0 });
    const [finalStats, setFinalStats] = useState({ count: 0, level: 'A1' });

    // Anki specific
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [ankiPreview, setAnkiPreview] = useState<any[]>([]);
    const [ankiFileData, setAnkiFileData] = useState<string>('');

    // Paste specific
    const [pasteText, setPasteText] = useState('');

    // --- Parsing Helpers ---
    const parseAnkiCSV = (text: string) => {
        // Simple CSV parser handling quotes and basic commas/tabs
        const rows = [];
        let cur = '';
        let inQuotes = false;
        let row = [];
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
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
        
        return rows.map(r => {
            const parsedInterval = r[2] ? parseInt(r[2]) : undefined;
            return {
                spanish: r[0] || '',
                english: r[1] || '',
                interval: !isNaN(parsedInterval as number) ? parsedInterval : undefined
            };
        }).filter(w => w.spanish.length > 0);
    };

    const parsePasteText = (text: string) => {
        // Split by newlines or commas
        const tokens = text.split(/[\n,]+/);
        const words = [];
        for (const t of tokens) {
            const clean = t.trim();
            if (!clean) continue;
            // detect word - translation format
            const match = clean.match(/^(.+?)(?:\s*(?:-|—|:)\s*)(.+)$/);
            if (match) {
                words.push({ spanish: match[1].trim(), english: match[2].trim() });
            } else {
                words.push({ spanish: clean, english: '' });
            }
        }
        return words;
    };

    // --- Action Handlers --- 

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large. Please export a smaller deck.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            const content = evt.target?.result as string;
            setAnkiFileData(content);
            const parsed = parseAnkiCSV(content);
            if (parsed.length === 0) {
                toast.error("We couldn't read that file. Try pasting instead.");
            } else {
                setAnkiPreview(parsed.slice(0, 5));
            }
        };
        reader.readAsText(file);
    };

    const submitAnki = async () => {
        try {
            const parsed = parseAnkiCSV(ankiFileData);
            if (!parsed.length) return;
            startProcessing("Reading your deck...");
            
            const res = await fetch('/api/vocabulary/import-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words: parsed, importSource: 'anki_import', languageId: selectedLanguageCode })
            });

            const data = await res.json();
            if (!data.success) throw new Error();

            setVocabularyImportResult(data.estimated_level, data.high_confidence, 'anki_import');
            showSuccess(data.imported_count, data.estimated_level);

        } catch (err) {
            setProcessState('error');
            toast.error("Something went wrong.");
        }
    };

    const submitPaste = async () => {
        try {
            const words = parsePasteText(pasteText);
            if (!words.length) return;

            startProcessing("Looking up your words...");
            
            const needingEnrichment = words.filter(w => !w.english);
            const alreadyTranslated = words.filter(w => w.english);

            let finalWords = [...alreadyTranslated];

            if (needingEnrichment.length > 0) {
                setProcessText(`Looking up your words... 0 of ${needingEnrichment.length}`);
                setProgressStats({ current: 0, total: needingEnrichment.length });

                const batches = [];
                for (let i = 0; i < needingEnrichment.length; i += 20) {
                    batches.push(needingEnrichment.slice(i, i + 20).map(w => w.spanish));
                }

                let enrichedCount = 0;
                for (const batch of batches) {
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
                    enrichedCount += batch.length;
                    setProgressStats(prev => ({ ...prev, current: enrichedCount }));
                    setProcessText(`Looking up your words... ${Math.min(enrichedCount, needingEnrichment.length)} of ${needingEnrichment.length}`);
                }
            }

            setProcessText("Setting up your word list...");
            const res = await fetch('/api/vocabulary/import-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words: finalWords, importSource: 'paste_import', languageId: selectedLanguageCode })
            });

            const data = await res.json();
            if (!data.success) throw new Error();

            setVocabularyImportResult(data.estimated_level, data.high_confidence, 'paste_import');
            showSuccess(data.imported_count, data.estimated_level);

        } catch (err) {
            setProcessState('error');
            toast.error("Something went wrong.");
        }
    };

    const submitTier = async (tierId: string) => {
        try {
            startProcessing("Adding common words...");
            
            const res = await fetch('/api/vocabulary/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tierId, languageId: selectedLanguageCode })
            });

            const data = await res.json();
            if (!data.success) throw new Error();

            setVocabularyImportResult(data.estimated_level, data.high_confidence, 'frequency_seed');
            showSuccess(data.seeded_count, data.estimated_level);

        } catch (err) {
            setProcessState('error');
            toast.error("Something went wrong.");
        }
    };

    const submitSkip = () => {
        setVocabularyImportResult(null, false, 'skip');
        nextStep();
    };

    // --- UI Helpers ---

    const startProcessing = (text: string) => {
        setProcessState('processing');
        setProcessText(text);
        setProgressStats({ current: 0, total: 0 });
    };

    const showSuccess = (count: number, level: string) => {
        setFinalStats({ count, level });
        setProcessState('success');
    };

    // Cycling waiting text
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (processState === 'processing' && progressStats.total === 0) {
            const texts = ["Getting things ready for you...", "Setting up your words...", "Almost ready..."];
            let idx = 0;
            interval = setInterval(() => {
                idx = (idx + 1) % texts.length;
                setProcessText(texts[idx]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [processState, progressStats.total]);


    // ── Render Processing States ──
    if (processState === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in font-sans px-4">
                <Loader2 size={56} strokeWidth={1.5} className="animate-spin text-primary mb-8" />
                <h2 className="text-2xl text-center font-serif text-foreground mb-4">{processText}</h2>
                {progressStats.total > 0 && (
                    <div className="w-full max-w-xs bg-border h-1.5 rounded-full overflow-hidden mt-2">
                        <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${(progressStats.current / progressStats.total) * 100}%` }}
                        />
                    </div>
                )}
            </div>
        );
    }

    if (processState === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in font-sans px-4 text-center">
                <CheckCircle size={72} strokeWidth={1} className="text-primary mb-6" />
                <h1 className="text-4xl text-foreground font-serif mb-2">Your word list is ready</h1>
                <p className="text-muted-foreground mb-8 text-lg">
                    {finalStats.count} words added to your list<br/>
                    Estimated level: <span className="text-primary font-mono">{finalStats.level}</span>
                </p>
                <Button 
                    onClick={nextStep}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono uppercase tracking-widest text-[11px] font-bold h-14 px-8 rounded-full shadow-md"
                >
                    Next
                </Button>
            </div>
        );
    }

    if (processState === 'error') {
        return (
             <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in font-sans px-4 text-center">
                <AlertTriangle size={56} className="text-red-400 mb-6" />
                <h2 className="text-2xl text-foreground font-serif mb-4">Something went wrong.</h2>
                <Button onClick={() => setProcessState('idle')} variant="outline" className="border-border-strong text-foreground">
                    Try Again
                </Button>
            </div>
        );
    }

    // ── Main UI ──
    const pasteWordCount = parsePasteText(pasteText).length;

    return (
        <div className="flex flex-col items-center w-full animation-fade-in relative pt-12 pb-16 font-sans">
            <button onClick={prevStep} className="absolute left-0 top-0 p-3 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
                <ArrowLeft size={18} />
            </button>

            <h1 className="text-3xl md:text-5xl font-serif text-center text-foreground tracking-tight mb-3">
                Do you already know some Spanish words?
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mb-12 text-center max-w-lg px-4">
                We'll set up your list to match where you actually are.
            </p>

            <div className="w-full max-w-2xl px-4 flex flex-col gap-4">
                
                {/* 1. Anki Card */}
                <div 
                    className={`border rounded-[18px] transition-all duration-300 overflow-hidden cursor-pointer ${activeMethod === 'anki' ? 'border-accent-border bg-card' : 'border-border bg-card hover:border-accent-border'} ${(activeMethod && activeMethod !== 'anki') ? 'opacity-50' : ''}`}
                >
                    <div className="p-5 flex items-center gap-4" onClick={() => setActiveMethod('anki')}>
                        <div className={`p-3 rounded-xl border ${activeMethod === 'anki' ? 'border-accent-border bg-accent/10 text-accent' : 'border-border bg-surface text-text-muted'}`}>
                            <Upload size={20} />
                        </div>
                        <div>
                            <h3 className={`font-serif text-xl ${activeMethod === 'anki' ? 'text-accent' : 'text-text-primary'}`}>I use Anki — import my word list</h3>
                            <p className="text-xs text-text-muted mt-1">Upload your Spanish deck as a .csv file</p>
                        </div>
                    </div>
                    {activeMethod === 'anki' && (
                        <div className="px-5 pb-5 pt-2 animation-fade-in">
                            <input type="file" accept=".csv,.txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            {!ankiFileData ? (
                                <div className="text-center p-6 border border-dashed border-border rounded-xl hover:border-accent-border transition-colors" onClick={() => fileInputRef.current?.click()}>
                                    <p className="text-sm text-text-muted">Click to select .csv or .txt file</p>
                                    <p className="text-[10px] text-text-muted mt-2">Export from Anki: File → Export → Notes as Plain Text</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="bg-surface border border-border rounded-lg p-3 max-h-40 overflow-y-auto mb-4 text-xs font-mono">
                                        {ankiPreview.map((w, i) => (
                                            <div key={i} className="flex gap-4 border-b border-border last:border-0 py-1.5">
                                                <span className="flex-1 text-accent truncate">{w.spanish}</span>
                                                <span className="flex-1 text-text-muted truncate">{w.english}</span>
                                                <span className="w-12 text-text-muted text-right">{w.interval || '-'}d</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={submitAnki} className="btn-action w-full h-12">
                                        Import {parseAnkiCSV(ankiFileData).length} words
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Paste Card */}
                <div 
                    className={`border rounded-[18px] transition-all duration-300 overflow-hidden cursor-pointer ${activeMethod === 'paste' ? 'border-accent-border bg-card' : 'border-border bg-card hover:border-accent-border'} ${(activeMethod && activeMethod !== 'paste') ? 'opacity-50' : ''}`}
                >
                    <div className="p-5 flex items-center gap-4" onClick={() => setActiveMethod('paste')}>
                        <div className={`p-3 rounded-xl border ${activeMethod === 'paste' ? 'border-accent-border bg-accent/10 text-accent' : 'border-border bg-surface text-text-muted'}`}>
                            <Clipboard size={20} />
                        </div>
                        <div>
                            <h3 className={`font-serif text-xl ${activeMethod === 'paste' ? 'text-accent' : 'text-text-primary'}`}>I have a list of words somewhere</h3>
                            <p className="text-xs text-text-muted mt-1">Paste words from notes, spreadsheets, or anywhere else</p>
                        </div>
                    </div>
                    {activeMethod === 'paste' && (
                        <div className="px-5 pb-5 pt-2 animation-fade-in">
                            <p className="text-[10px] text-text-muted mb-3">Paste your words here, one per line or separated by commas. Translations optional.</p>
                            <textarea 
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                placeholder="hablar, comer, vivir, casa, tiempo..."
                                className="w-full bg-surface border border-border rounded-[18px] p-4 text-sm text-text-primary focus:outline-none focus:border-accent-border min-h-[120px] mb-4 placeholder:text-text-muted resize-none"
                            />
                            <Button onClick={submitPaste} disabled={pasteWordCount === 0} className="btn-action w-full h-12">
                                Import {pasteWordCount} words
                            </Button>
                        </div>
                    )}
                </div>

                {/* 3. Tier Select Card */}
                <div 
                    className={`border rounded-[18px] transition-all duration-300 overflow-hidden cursor-pointer ${activeMethod === 'tier' ? 'border-accent-border bg-card' : 'border-border bg-card hover:border-accent-border'} ${(activeMethod && activeMethod !== 'tier') ? 'opacity-50' : ''}`}
                >
                    <div className="p-5 flex items-center gap-4" onClick={() => setActiveMethod('tier')}>
                        <div className={`p-3 rounded-xl border ${activeMethod === 'tier' ? 'border-accent-border bg-accent/10 text-accent' : 'border-border bg-surface text-text-muted'}`}>
                            <BarChart size={20} />
                        </div>
                        <div>
                            <h3 className={`font-serif text-xl ${activeMethod === 'tier' ? 'text-accent' : 'text-text-primary'}`}>Just fill it in based on my level</h3>
                            <p className="text-xs text-text-muted mt-1">We'll add the most common words for your level</p>
                        </div>
                    </div>
                    {activeMethod === 'tier' && (
                        <div className="px-5 pb-5 pt-2 animation-fade-in flex flex-col gap-2">
                            {TIERS.map(tier => (
                                <button 
                                    key={tier.id} 
                                    onClick={() => submitTier(tier.id)}
                                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:border-accent-border hover:bg-card transition-all group text-left shadow-sm"
                                >
                                    <div>
                                        <div className="text-text-primary text-sm group-hover:text-accent transition-colors">{tier.label}</div>
                                        <div className="text-[10px] text-text-muted font-mono mt-1">{tier.id}</div>
                                    </div>
                                    <span className="text-xs text-text-muted">{tier.desc}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Start from Scratch */}
                <div 
                    className={`border rounded-[18px] transition-all duration-300 overflow-hidden cursor-pointer opacity-70 ${activeMethod === 'skip' ? 'border-accent-border bg-card' : 'border-border bg-card hover:border-accent-border hover:opacity-100'} ${(activeMethod && activeMethod !== 'skip') ? 'opacity-30' : ''}`}
                    onClick={submitSkip}
                >
                    <div className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-surface border border-border rounded-xl text-text-muted">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-serif text-lg text-text-muted">No — start from zero</h3>
                            <p className="text-xs text-text-muted mt-0.5">Words will build up naturally as you read</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
