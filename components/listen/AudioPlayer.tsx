"use client";

// ============================================================
// Parlai — Audio Player (Podcast episode with transcript)
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
        comprehensionResult, audioRef,
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
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!episode) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Episode not found.</p>
                <Button variant="ghost" onClick={onClose}>Close</Button>
            </div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-background flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
            {/* Hidden audio element */}
            <audio ref={audioRef} src={episode.audio_url} preload="metadata" />

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
                <div className="truncate flex-1 mr-3">
                    <p className="text-[10px] text-muted-foreground">{show?.name}</p>
                    <h2 className="font-bold text-sm truncate">{episode.title}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>

            <AnimatePresence mode="wait">
                {phase === 'listening' && (
                    <motion.div key="listening" className="flex flex-col flex-1 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* Player section */}
                        <div className="p-6 border-b border-border shrink-0">
                            {/* Artwork */}
                            <div className="mx-auto w-32 h-32 sm:w-40 sm:h-40 rounded-2xl flex items-center justify-center mb-5 relative overflow-hidden"
                                style={{ backgroundColor: show?.cover_color || '#444' }}>
                                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/30 to-transparent" />
                                <Headphones className="w-12 h-12 text-white/80 relative z-10" />
                            </div>

                            {/* Seek bar */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] text-muted-foreground font-mono w-10">{formatTime(currentTime)}</span>
                                <input
                                    type="range" min={0} max={duration || 1} value={currentTime}
                                    onChange={handleSeek}
                                    className="flex-1 h-1 accent-primary bg-muted rounded-full appearance-none cursor-pointer"
                                />
                                <span className="text-[10px] text-muted-foreground font-mono w-10 text-right">{formatTime(duration)}</span>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-6">
                                <button onClick={handleSkipBack} className="p-2 rounded-full hover:bg-muted transition-colors">
                                    <SkipBack className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={isPlaying ? pause : play}
                                    className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 text-white" fill="white" /> : <Play className="w-6 h-6 text-white ml-0.5" fill="white" />}
                                </button>
                                <button onClick={handleSkipForward} className="p-2 rounded-full hover:bg-muted transition-colors">
                                    <SkipForward className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Speed + quiz button */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-1">
                                    <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                                    {SPEEDS.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleSpeedChange(s)}
                                            className={`px-2 py-0.5 rounded text-xs font-mono ${activeSpeed === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                                                }`}
                                        >{s}x</button>
                                    ))}
                                </div>
                                {episode.comprehension_questions?.length > 0 && (
                                    <Button size="sm" variant="outline" onClick={() => setPhase('comprehension')} className="text-xs gap-1">
                                        Quiz <ChevronRight className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Transcript / description */}
                        <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-3">
                            {transcript.length > 0 ? (
                                <div className="space-y-1">
                                    {transcript.map((seg, i) => (
                                        <div
                                            key={i}
                                            className={`flex gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${i === currentTranscriptIndex
                                                ? 'bg-primary/5 border-l-2 border-primary'
                                                : i < currentTranscriptIndex ? 'opacity-50' : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => seek(seg.start_time)}
                                        >
                                            <span className="text-[10px] text-muted-foreground font-mono w-10 shrink-0 pt-0.5">
                                                {Math.floor(seg.start_time / 60)}:{String(Math.floor(seg.start_time % 60)).padStart(2, '0')}
                                            </span>
                                            <p className="text-sm leading-relaxed">
                                                {seg.text.split(/\s+/).map((w, j) => (
                                                    <span
                                                        key={j}
                                                        className="cursor-pointer hover:text-primary hover:underline transition-colors"
                                                        onClick={e => { e.stopPropagation(); handleWordTap(w, seg.text); }}
                                                    >{w} </span>
                                                ))}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : transcriptText ? (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-3 italic">Full interactive transcript not available for this episode.</p>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {transcriptText.split(/\s+/).map((w, i) => (
                                            <span
                                                key={i}
                                                className="cursor-pointer hover:text-primary hover:underline transition-colors"
                                                onClick={() => handleWordTap(w, transcriptText.slice(Math.max(0, transcriptText.indexOf(w) - 30), transcriptText.indexOf(w) + 50))}
                                            >{w} </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <Volume2 className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
                                    <p className="text-sm text-muted-foreground">No transcript available for this episode.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Listen and enjoy the audio!</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {phase === 'comprehension' && episode.comprehension_questions && (
                    <motion.div key="quiz" className="flex-1 overflow-y-auto p-4 space-y-5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 className="font-bold text-lg">Comprehension Check</h3>
                        {episode.comprehension_questions.map((q: any, qi: number) => (
                            <Card key={qi} className="p-4">
                                <p className="font-medium text-sm mb-3">{qi + 1}. {q.question}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt: string, oi: number) => (
                                        <button
                                            key={oi}
                                            onClick={() => handleAnswer(qi, oi)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${answers[qi] === oi
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary/30'
                                                }`}
                                        >{opt}</button>
                                    ))}
                                </div>
                            </Card>
                        ))}
                        <Button
                            onClick={handleSubmit}
                            disabled={Object.keys(answers).length < episode.comprehension_questions.length}
                            className="w-full"
                        >Submit Answers</Button>
                    </motion.div>
                )}

                {phase === 'results' && (
                    <motion.div key="results" className="flex-1 flex items-center justify-center p-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <Card className="p-6 max-w-sm w-full text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{comprehensionResult?.message || 'Episode Complete!'}</h3>
                            {comprehensionResult?.score !== undefined && (
                                <p className="text-3xl font-black text-primary mb-1">{comprehensionResult.score}%</p>
                            )}
                            <p className="text-sm text-muted-foreground mb-4">
                                {comprehensionResult?.correct}/{comprehensionResult?.total} correct
                            </p>
                            <p className="text-lg font-bold text-amber-400 mb-6">+{comprehensionResult?.xp_earned || 40} XP</p>
                            <Button onClick={onClose} className="w-full">Done</Button>
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
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
