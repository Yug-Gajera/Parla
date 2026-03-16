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
    const [processText, setProcessText] = useState('Importing your vocabulary...');
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
            toast.error("Anki import failed.");
        }
    };

    const submitPaste = async () => {
        try {
            const words = parsePasteText(pasteText);
            if (!words.length) return;

            startProcessing("Analyzing your word list...");
            
            const needingEnrichment = words.filter(w => !w.english);
            const alreadyTranslated = words.filter(w => w.english);

            let finalWords = [...alreadyTranslated];

            if (needingEnrichment.length > 0) {
                setProcessText(`Enriching words... 0 of ${needingEnrichment.length}`);
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
                    setProcessText(`Enriching words... ${Math.min(enrichedCount, needingEnrichment.length)} of ${needingEnrichment.length}`);
                }
            }

            setProcessText("Building your personalised deck...");
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
            toast.error("Paste import failed.");
        }
    };

    const submitTier = async (tierId: string) => {
        try {
            startProcessing("Seeding global frequencies...");
            
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
            toast.error("Dictionary seed failed.");
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
            const texts = ["Importing your vocabulary...", "Analysing word levels...", "Almost ready..."];
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
                <Loader2 size={56} strokeWidth={1.5} className="animate-spin text-[#c9a84c] mb-8" />
                <h2 className="text-2xl text-center font-serif text-[#f0ece4] mb-4">{processText}</h2>
                {progressStats.total > 0 && (
                    <div className="w-full max-w-xs bg-[#1e1e1e] h-1.5 rounded-full overflow-hidden mt-2">
                        <div 
                            className="h-full bg-gradient-to-r from-[#8b7538] to-[#c9a84c] transition-all duration-300"
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
                <CheckCircle size={72} strokeWidth={1} className="text-[#c9a84c] mb-6" />
                <h1 className="text-4xl text-[#f0ece4] font-serif mb-2">Your deck is ready</h1>
                <p className="text-[#9a9590] mb-8 text-lg">
                    {finalStats.count} words imported<br/>
                    Estimated level: <span className="text-[#c9a84c] font-mono">{finalStats.level}</span>
                </p>
                <Button 
                    onClick={nextStep}
                    className="bg-[#c9a84c] hover:bg-[#b98e72] text-[#080808] font-mono uppercase tracking-widest text-[11px] font-bold h-14 px-8 rounded-full"
                >
                    Continue to assessment
                </Button>
            </div>
        );
    }

    if (processState === 'error') {
        return (
             <div className="flex flex-col items-center justify-center min-h-[500px] w-full animation-fade-in font-sans px-4 text-center">
                <AlertTriangle size={56} className="text-red-400 mb-6" />
                <h2 className="text-2xl text-[#f0ece4] font-serif mb-4">Import Interrupted</h2>
                <Button onClick={() => setProcessState('idle')} variant="outline" className="border-[#2a2a2a] text-[#f0ece4]">
                    Try Again
                </Button>
            </div>
        );
    }

    // ── Main UI ──
    const pasteWordCount = parsePasteText(pasteText).length;

    return (
        <div className="flex flex-col items-center w-full animation-fade-in relative pt-12 pb-16 font-sans">
            <button onClick={prevStep} className="absolute left-0 top-0 p-3 text-[#5a5652] hover:text-[#f0ece4] transition-colors rounded-full hover:bg-[#141414]">
                <ArrowLeft size={18} />
            </button>

            <h1 className="text-3xl md:text-5xl font-serif text-center text-[#f0ece4] tracking-tight mb-3">
                Do you have existing vocabulary?
            </h1>
            <p className="text-[#9a9590] text-sm md:text-base mb-12 text-center max-w-lg px-4">
                We'll personalise your deck and assessment to match where you actually are.
            </p>

            <div className="w-full max-w-2xl px-4 flex flex-col gap-4">
                
                {/* 1. Anki Card */}
                <div 
                    className={`border rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${activeMethod === 'anki' ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-[#1e1e1e] bg-[#0f0f0f] hover:border-[#2a2a2a]'} ${(activeMethod && activeMethod !== 'anki') ? 'opacity-50' : ''}`}
                >
                    <div className="p-5 flex items-center gap-4" onClick={() => setActiveMethod('anki')}>
                        <div className={`p-3 rounded-xl border ${activeMethod === 'anki' ? 'border-[#c9a84c]/50 bg-[#c9a84c]/10 text-[#c9a84c]' : 'border-[#2a2a2a] bg-[#141414] text-[#9a9590]'}`}>
                            <Upload size={20} />
                        </div>
                        <div>
                            <h3 className={`font-serif text-xl ${activeMethod === 'anki' ? 'text-[#c9a84c]' : 'text-[#f0ece4]'}`}>Import from Anki</h3>
                            <p className="text-xs text-[#5a5652] mt-1">Upload your existing Spanish deck as a CSV file</p>
                        </div>
                    </div>
                    {activeMethod === 'anki' && (
                        <div className="px-5 pb-5 pt-2 animation-fade-in">
                            <input type="file" accept=".csv,.txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            {!ankiFileData ? (
                                <div className="text-center p-6 border border-dashed border-[#2a2a2a] rounded-xl hover:border-[#c9a84c]/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                                    <p className="text-sm text-[#9a9590]">Click to select .csv or .txt file</p>
                                    <p className="text-[10px] text-[#5a5652] mt-2">Export from Anki: File → Export → Notes as Plain Text</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 max-h-40 overflow-y-auto mb-4 text-xs font-mono">
                                        {ankiPreview.map((w, i) => (
                                            <div key={i} className="flex gap-4 border-b border-[#1e1e1e] last:border-0 py-1.5">
                                                <span className="flex-1 text-[#c9a84c] truncate">{w.spanish}</span>
                                                <span className="flex-1 text-[#9a9590] truncate">{w.english}</span>
                                                <span className="w-12 text-[#5a5652] text-right">{w.interval || '-'}d</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={submitAnki} className="w-full bg-[#c9a84c] hover:bg-[#b98e72] text-[#080808] h-12 rounded-xl font-mono text-xs uppercase tracking-widest font-bold">
                                        Import {parseAnkiCSV(ankiFileData).length} words
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Paste Card */}
                <div 
                    className={`border rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${activeMethod === 'paste' ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-[#1e1e1e] bg-[#0f0f0f] hover:border-[#2a2a2a]'} ${(activeMethod && activeMethod !== 'paste') ? 'opacity-50' : ''}`}
                >
                    <div className="p-5 flex items-center gap-4" onClick={() => setActiveMethod('paste')}>
                        <div className={`p-3 rounded-xl border ${activeMethod === 'paste' ? 'border-[#c9a84c]/50 bg-[#c9a84c]/10 text-[#c9a84c]' : 'border-[#2a2a2a] bg-[#141414] text-[#9a9590]'}`}>
                            <Clipboard size={20} />
                        </div>
                        <div>
                            <h3 className={`font-serif text-xl ${activeMethod === 'paste' ? 'text-[#c9a84c]' : 'text-[#f0ece4]'}`}>Paste a word list</h3>
                            <p className="text-xs text-[#5a5652] mt-1">Paste words from notes, spreadsheets, or anywhere else</p>
                        </div>
                    </div>
                    {activeMethod === 'paste' && (
                        <div className="px-5 pb-5 pt-2 animation-fade-in">
                            <p className="text-[10px] text-[#5a5652] mb-3">Separate words with commas, spaces, or new lines. Translations optional.</p>
                            <textarea 
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                placeholder="hablar, comer, vivir, casa, tiempo..."
                                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 text-sm text-[#f0ece4] focus:outline-none focus:border-[#c9a84c]/50 min-h-[120px] mb-4 placeholder:text-[#3a3632] resize-none"
                            />
                            <Button onClick={submitPaste} disabled={pasteWordCount === 0} className="w-full bg-[#c9a84c] hover:bg-[#b98e72] text-[#080808] h-12 rounded-xl font-mono text-xs uppercase tracking-widest font-bold disabled:opacity-50">
                                Import {pasteWordCount} words
                            </Button>
                        </div>
                    )}
                </div>

                {/* 3. Tier Select Card */}
                <div 
                    className={`border rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${activeMethod === 'tier' ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-[#1e1e1e] bg-[#0f0f0f] hover:border-[#2a2a2a]'} ${(activeMethod && activeMethod !== 'tier') ? 'opacity-50' : ''}`}
                >
                    <div className="p-5 flex items-center gap-4" onClick={() => setActiveMethod('tier')}>
                        <div className={`p-3 rounded-xl border ${activeMethod === 'tier' ? 'border-[#c9a84c]/50 bg-[#c9a84c]/10 text-[#c9a84c]' : 'border-[#2a2a2a] bg-[#141414] text-[#9a9590]'}`}>
                            <BarChart size={20} />
                        </div>
                        <div>
                            <h3 className={`font-serif text-xl ${activeMethod === 'tier' ? 'text-[#c9a84c]' : 'text-[#f0ece4]'}`}>Tell us your approximate level</h3>
                            <p className="text-xs text-[#5a5652] mt-1">We'll seed your deck with the most common words at your level</p>
                        </div>
                    </div>
                    {activeMethod === 'tier' && (
                        <div className="px-5 pb-5 pt-2 animation-fade-in flex flex-col gap-2">
                            {TIERS.map(tier => (
                                <button 
                                    key={tier.id} 
                                    onClick={() => submitTier(tier.id)}
                                    className="flex items-center justify-between p-4 rounded-xl border border-[#2a2a2a] bg-[#141414] hover:border-[#c9a84c]/50 hover:bg-[#1a1a1a] transition-all group text-left"
                                >
                                    <div>
                                        <div className="text-[#f0ece4] text-sm group-hover:text-[#c9a84c] transition-colors">{tier.label}</div>
                                        <div className="text-[10px] text-[#5a5652] font-mono mt-1">{tier.id}</div>
                                    </div>
                                    <span className="text-xs text-[#9a9590]">{tier.desc}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Start from Scratch */}
                <div 
                    className={`border rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer opacity-70 ${activeMethod === 'skip' ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-[#1e1e1e] bg-[#080808] hover:border-[#2a2a2a] hover:opacity-100'} ${(activeMethod && activeMethod !== 'skip') ? 'opacity-30' : ''}`}
                    onClick={submitSkip}
                >
                    <div className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-[#5a5652]">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-serif text-lg text-[#9a9590]">Start from scratch</h3>
                            <p className="text-xs text-[#5a5652] mt-0.5">Words will build up naturally as you read</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
