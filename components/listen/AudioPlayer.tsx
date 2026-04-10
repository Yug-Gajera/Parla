"use client";

// ============================================================
// Parlova — Audio Player (Redesigned)
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import WordPopover from '@/components/shared/WordPopover';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X, Play, Pause, SkipBack, SkipForward, Gauge, Trophy, Headphones, ChevronRight, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioPlayerProps {
    episodeId: string;
    onClose: () => void;
}

type Phase = 'listening' | 'comprehension' | 'results';

const SPEEDS = [0.75, 1, 1.25];

function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function AudioPlayer({ episodeId, onClose }: AudioPlayerProps) {
    const {
        episode, show, isLoading, currentTime, duration, isPlaying, playbackSpeed,
        currentTranscriptIndex, wordPopover, isWordLoading,
        comprehensionResult, audioRef, remainingLookups, isPro,
        play, pause, seek, setSpeed,
        syncTranscript, tapWord, dismissPopover, submitAnswers,
        setCurrentTime, setDuration, setIsPlaying,
    } = useAudioPlayer(episodeId);

    const [phase, setPhase] = useState<Phase>('listening');
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [activeSpeed, setActiveSpeed] = useState(1);
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Audio element setup
    useEffect(() => {
        if (!episode?.audio_url || !audioRef.current) return;
        const audio = audioRef.current;

        const onTimeUpdate = () => syncTranscript(audio.currentTime);
        const onLoadedMeta = () => setDuration(audio.duration || 0);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => {
            setIsPlaying(false);
            if (episode?.comprehension_questions?.length > 0) setPhase('comprehension');
            else setPhase('results');
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMeta);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMeta);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
        };
    }, [episode?.audio_url]);

    // Auto-scroll transcript
    useEffect(() => {
        if (currentTranscriptIndex < 0 || !transcriptRef.current) return;
        const el = transcriptRef.current.children[currentTranscriptIndex] as HTMLElement;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentTranscriptIndex]);

    const handleSpeedChange = (speed: number) => { setActiveSpeed(speed); setSpeed(speed); };
    const handleSkipBack = () => seek(Math.max(0, currentTime - 10));
    const handleSkipForward = () => seek(Math.min(duration, currentTime + 30));
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => seek(Number(e.target.value));
    const handleAnswer = (qIdx: number, aIdx: number) => setAnswers(prev => ({ ...prev, [qIdx]: aIdx }));
    const handleSubmit = () => {
        const a = episode.comprehension_questions.map((_: any, i: number) => answers[i] ?? -1);
        submitAnswers(a);
        setPhase('results');
    };

    const handleWordTap = useCallback((word: string, line: string) => {
        const clean = word.replace(/[.,;:!?¿¡"""()]/g, '').trim();
        if (clean.length < 2) return;
        tapWord(clean, line);
    }, [tapWord]);

    const transcript = (episode?.transcript || []) as { start_time: number; end_time: number; text: string }[];
    const transcriptText = episode?.transcript_text as string || '';

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 bg-[#080808] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#E8521A]" />
            </div>
        );
    }

    if (!episode) {
        return (
            <div className="fixed inset-0 z-50 bg-[#080808] flex flex-col items-center justify-center gap-6 font-sans">
                <p className="text-[#9a9590] uppercase tracking-widest text-xs">Audio segment unavailable</p>
                <Button variant="outline" onClick={onClose} className="rounded-full bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#141414] px-8 text-xs uppercase tracking-widest">Back to library</Button>
            </div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-[#080808] flex flex-col font-sans"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
            {/* Hidden audio element */}
            <audio ref={audioRef} src={episode.audio_url} preload="metadata" />

            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e] bg-[#141414] shrink-0">
                <div className="truncate flex-1 mr-4">
                    <p className="text-[10px] text-[#5a5652] uppercase tracking-[0.2em] mb-1">{show?.name}</p>
                    <h2 className="font-serif text-lg text-[#f0ece4] truncate">{episode.title}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-[#1e1e1e] text-[#9a9590] rounded-full">
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {phase === 'listening' && (
                    <motion.div key="listening" className="flex flex-col flex-1 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* Player section */}
                        <div className="p-8 border-b border-[#1e1e1e] bg-[#0f0f0f] shrink-0 flex flex-col items-center">
                            {/* Artwork */}
                            <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10"
                                style={{ backgroundColor: show?.cover_color || '#141414' }}>
                                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/30 to-transparent" />
                                <Headphones className="w-12 h-12 text-white/50 relative z-10" />
                            </div>

                            <div className="w-full max-w-xl mx-auto">
                                {/* Seek bar */}
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="text-[10px] text-[#9a9590] font-mono w-10 text-right">{formatTime(currentTime)}</span>
                                    <div className="flex-1 relative group h-2 cursor-pointer flex items-center">
                                        <input
                                            type="range" min={0} max={duration || 1} value={currentTime}
                                            onChange={handleSeek}
                                            className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                                        />
                                        <div className="w-full h-1 bg-[#1e1e1e] rounded-full overflow-hidden absolute">
                                            <div 
                                                className="h-full bg-[#E8521A] rounded-full" 
                                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} 
                                            />
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-[#5a5652] font-mono w-10">{formatTime(duration)}</span>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-center gap-8">
                                    <button onClick={handleSkipBack} className="p-3 rounded-full hover:bg-[#141414] text-[#9a9590] transition-colors border border-transparent hover:border-[#1e1e1e]">
                                        <SkipBack className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={isPlaying ? pause : play}
                                        className="w-16 h-16 rounded-full bg-[#f0ece4] flex items-center justify-center hover:bg-[#E8521A] hover:scale-105 transition-all shadow-lg"
                                    >
                                        {isPlaying ? <Pause className="w-6 h-6 text-[#080808]" fill="currentColor" /> : <Play className="w-6 h-6 text-[#080808] ml-1" fill="currentColor" />}
                                    </button>
                                    <button onClick={handleSkipForward} className="p-3 rounded-full hover:bg-[#141414] text-[#9a9590] transition-colors border border-transparent hover:border-[#1e1e1e]">
                                        <SkipForward className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Speed + quiz button */}
                                <div className="flex items-center justify-between mt-8">
                                    <div className="flex items-center gap-3">
                                        <Gauge className="w-4 h-4 text-[#5a5652]" />
                                        <div className="flex gap-1">
                                            {SPEEDS.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleSpeedChange(s)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase transition-colors ${
                                                        activeSpeed === s ? 'bg-[#141414] text-[#E8521A] border border-[#2a2a2a]' : 'text-[#5a5652] border border-transparent hover:text-[#9a9590]'
                                                    }`}
                                                >{s}x</button>
                                            ))}
                                        </div>
                                    </div>
                                    {episode.comprehension_questions?.length > 0 && (
                                        <Button size="sm" variant="outline" onClick={() => setPhase('comprehension')} className="text-[10px] uppercase tracking-widest gap-2 bg-transparent border-[#1e1e1e] text-[#f0ece4] hover:bg-[#141414] rounded-full px-5 h-8">
                                            Start Quiz <ChevronRight className="w-3 h-3 text-[#E8521A]" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Transcript / description */}
                        <div ref={transcriptRef} className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar max-w-4xl mx-auto w-full">
                            {transcript.length > 0 ? (
                                <div className="space-y-2">
                                    {transcript.map((seg, i) => (
                                        <div
                                            key={i}
                                            className={`flex gap-5 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                                                i === currentTranscriptIndex
                                                    ? 'bg-[#141414] border-l-[3px] border-l-[#E8521A] shadow-lg'
                                                    : i < currentTranscriptIndex 
                                                        ? 'opacity-40 hover:opacity-70' 
                                                        : 'text-[#9a9590] hover:bg-[#0f0f0f] border-l-[3px] border-transparent'
                                                }`}
                                            onClick={() => seek(seg.start_time)}
                                        >
                                            <span className={`text-xs font-mono w-12 shrink-0 pt-1 tracking-wider ${i === currentTranscriptIndex ? 'text-[#E8521A]' : 'text-[#5a5652]'}`}>
                                                {Math.floor(seg.start_time / 60)}:{String(Math.floor(seg.start_time % 60)).padStart(2, '0')}
                                            </span>
                                            <p className={`text-lg sm:text-xl font-serif leading-relaxed ${i === currentTranscriptIndex ? 'text-[#f0ece4]' : 'text-[#9a9590]'}`}>
                                                {seg.text.split(/\s+/).map((w, j) => (
                                                    <span
                                                        key={j}
                                                        className="cursor-pointer hover:text-[#E8521A] transition-colors"
                                                        onClick={e => { e.stopPropagation(); handleWordTap(w, seg.text); }}
                                                    >{w} </span>
                                                ))}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : transcriptText ? (
                                <div className="bg-[#141414] p-8 rounded-2xl border border-[#1e1e1e]">
                                    <p className="text-[10px] text-[#E8521A] mb-6 uppercase tracking-[0.2em] font-mono">Full interactive protocol offline. Standard display active.</p>
                                    <div className="text-lg font-serif text-[#f0ece4] leading-relaxed whitespace-pre-wrap">
                                        {transcriptText.split(/\s+/).map((w, i) => (
                                            <span
                                                key={i}
                                                className="cursor-pointer hover:text-[#E8521A] transition-colors"
                                                onClick={() => handleWordTap(w, transcriptText.slice(Math.max(0, transcriptText.indexOf(w) - 30), transcriptText.indexOf(w) + 50))}
                                            >{w} </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <Volume2 className="w-10 h-10 mx-auto text-[#2a2a2a] mb-4" />
                                    <p className="text-[#9a9590] font-serif text-lg">No transcript data available.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {phase === 'comprehension' && episode.comprehension_questions && (
                    <motion.div key="quiz" className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 max-w-3xl mx-auto w-full" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="text-center mb-10">
                            <h3 className="font-serif text-3xl text-[#f0ece4] mb-2">Quiz</h3>
                            <p className="text-xs font-mono uppercase tracking-widest text-[#5a5652]">Test your understanding</p>
                        </div>
                        
                        {episode.comprehension_questions.map((q: any, qi: number) => (
                            <Card key={qi} className="p-8 bg-[#141414] border-[#1e1e1e] rounded-2xl">
                                <p className="font-serif text-xl text-[#f0ece4] mb-6"><span className="text-[#E8521A] mr-2 text-sm font-mono">{qi + 1}.</span> {q.question}</p>
                                <div className="space-y-3">
                                    {q.options.map((opt: string, oi: number) => (
                                        <button
                                            key={oi}
                                            onClick={() => handleAnswer(qi, oi)}
                                            className={`w-full text-left px-5 py-4 rounded-xl text-sm transition-all border ${
                                                answers[qi] === oi
                                                    ? 'border-[#E8521A] bg-[#E8521A]/10 text-[#f0ece4] shadow-[0_0_15px_rgba(232,82,26,0.1)]'
                                                    : 'border-[#1e1e1e] bg-[#0f0f0f] text-[#9a9590] hover:border-[#2a2a2a] hover:bg-[#1e1e1e]'
                                                }`}
                                        >{opt}</button>
                                    ))}
                                </div>
                            </Card>
                        ))}
                        <div className="pt-6">
                            <Button
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length < episode.comprehension_questions.length}
                                className="w-full h-12 rounded-full font-mono uppercase tracking-widest text-xs font-bold bg-[#E8521A] text-[#080808] hover:bg-[#D94A15] transition-colors disabled:opacity-50 disabled:bg-[#141414] disabled:text-[#5a5652]"
                            >Submit answers</Button>
                        </div>
                    </motion.div>
                )}

                {phase === 'results' && (
                    <motion.div key="results" className="flex-1 flex items-center justify-center p-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <Card className="p-10 max-w-md w-full text-center bg-[#141414] border-[#1e1e1e] rounded-3xl shadow-2xl">
                            <div className="w-20 h-20 rounded-full bg-[#080808] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(201,168,76,0.15)]">
                                <Trophy className="w-8 h-8 text-[#E8521A]" />
                            </div>
                            <h3 className="text-3xl font-serif text-[#f0ece4] mb-4">{comprehensionResult?.message || 'Quiz Complete'}</h3>
                            
                            {comprehensionResult?.score !== undefined && (
                                <div className="my-8">
                                    <p className="text-[#5a5652] text-[10px] uppercase font-mono tracking-widest mb-2">Score</p>
                                    <p className="text-6xl font-mono text-[#f0ece4]">{comprehensionResult.score}<span className="text-2xl text-[#E8521A]">%</span></p>
                                </div>
                            )}
                            
                            <div className="flex justify-center gap-12 mb-10 border-t border-b border-[#1e1e1e] py-6">
                                <div>
                                    <p className="text-[#5a5652] text-[10px] uppercase font-mono tracking-widest mb-1">Score</p>
                                    <p className="text-xl font-mono text-[#f0ece4]">{comprehensionResult?.correct} <span className="text-sm text-[#5a5652]">/ {comprehensionResult?.total}</span></p>
                                </div>
                                <div>
                                    <p className="text-[#5a5652] text-[10px] uppercase font-mono tracking-widest mb-1">XP Earned</p>
                                    <p className="text-xl font-mono text-[#E8521A]">+{comprehensionResult?.xp_earned || 40}</p>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={onClose} 
                                className="w-full h-12 rounded-full font-mono uppercase tracking-widest text-xs font-bold bg-[#f0ece4] text-[#080808] hover:bg-[#E8521A] transition-colors"
                            >Back to library</Button>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Word popover */}
            <AnimatePresence>
                {wordPopover && (
                    <WordPopover
                        wordData={wordPopover}
                        onDismiss={dismissPopover}
                        isLoading={isWordLoading}
                        remainingLookups={remainingLookups}
                        isPro={isPro}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
