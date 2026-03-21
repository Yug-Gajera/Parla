"use client";

// ============================================================
// Parlova — Video Player (Redesigned)
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import WordPopover from '@/components/shared/WordPopover';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X, ChevronRight, Trophy, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
    interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

interface VideoPlayerProps {
    videoId: string;
    onClose: () => void;
}

type Phase = 'watching' | 'comprehension' | 'results';

const SPEEDS = [0.75, 1, 1.25, 1.5];

export default function VideoPlayer({ videoId, onClose }: VideoPlayerProps) {
    const {
        video, isLoading, currentSubtitleIndex, wordPopover, isWordLoading,
        comprehensionResult, playerRef,
        syncSubtitles, tapWord, dismissPopover, seekTo, setSpeed, submitAnswers, setIsPlaying,
    } = useVideoPlayer(videoId);

    const [phase, setPhase] = useState<Phase>('watching');
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [activeSpeed, setActiveSpeed] = useState(1);
    const iframeRef = useRef<HTMLDivElement>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);
    const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!video?.youtube_id) return;

        const loadAPI = () => {
            if (window.YT?.Player) {
                initPlayer();
                return;
            }
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
            window.onYouTubeIframeAPIReady = initPlayer;
        };

        const initPlayer = () => {
            if (!iframeRef.current) return;
            playerRef.current = new window.YT.Player(iframeRef.current, {
                videoId: video.youtube_id,
                playerVars: {
                    cc_load_policy: 0, rel: 0, modestbranding: 1,
                    autoplay: 0, playsinline: 1,
                },
                events: {
                    onStateChange: (e: any) => {
                        setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
                        if (e.data === window.YT.PlayerState.PLAYING) {
                            if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
                            timeIntervalRef.current = setInterval(() => {
                                if (playerRef.current?.getCurrentTime) {
                                    syncSubtitles(playerRef.current.getCurrentTime());
                                }
                            }, 200);
                        } else {
                            if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
                        }
                        if (e.data === window.YT.PlayerState.ENDED) {
                            if (video?.comprehension_questions?.length > 0) setPhase('comprehension');
                            else setPhase('results');
                        }
                    },
                },
            });
        };

        loadAPI();
        return () => { if (timeIntervalRef.current) clearInterval(timeIntervalRef.current); };
    }, [video?.youtube_id]);

    // Auto-scroll transcript
    useEffect(() => {
        if (currentSubtitleIndex < 0 || !transcriptRef.current) return;
        const el = transcriptRef.current.children[currentSubtitleIndex] as HTMLElement;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentSubtitleIndex]);

    const handleSpeedChange = (speed: number) => {
        setActiveSpeed(speed);
        setSpeed(speed);
    };

    const handleAnswer = (qIdx: number, aIdx: number) => setAnswers(prev => ({ ...prev, [qIdx]: aIdx }));
    const handleSubmit = () => {
        const a = video.comprehension_questions.map((_: any, i: number) => answers[i] ?? -1);
        submitAnswers(a);
        setPhase('results');
    };

    const transcript = (video?.transcript || []) as { start_time: number; end_time: number; text: string }[];

    const handleWordTap = useCallback((word: string, line: string) => {
        const clean = word.replace(/[.,;:!?¿¡"""()]/g, '').trim();
        if (clean.length < 2) return;
        tapWord(clean, line);
    }, [tapWord]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#E8521A]" />
            </div>
        );
    }

    if (!video) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center font-sans">
                <div className="text-center">
                    <p className="text-text-muted mb-6 uppercase tracking-widest text-xs">Video content unavailable</p>
                    <Button variant="outline" onClick={onClose} className="rounded-full bg-transparent border-border text-text-primary hover:bg-card px-8 text-xs uppercase tracking-widest">Back to library</Button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-background flex flex-col font-sans"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
                <div className="truncate flex-1 mr-4">
                    <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] mb-1">{video.channel_name}</p>
                    <h2 className="font-display text-lg text-text-primary truncate">{video.title}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-surface text-text-muted rounded-full">
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {phase === 'watching' && (
                    <motion.div key="watching" className="flex flex-col flex-1 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* YouTube embed */}
                        <div className="relative w-full bg-black max-h-[50vh] xl:max-h-[60vh] mx-auto overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                                <div ref={iframeRef} className="absolute inset-0" />
                            </div>
                            {/* Subtitle overlay */}
                            {currentSubtitleIndex >= 0 && transcript[currentSubtitleIndex] && (
                                <div className="absolute bottom-6 left-6 right-6 text-center pointer-events-none">
                                    <div className="inline-block bg-background/80 backdrop-blur-md rounded-xl px-6 py-3 max-w-2xl mx-auto border border-border pointer-events-auto shadow-2xl">
                                        <p className="text-text-primary text-lg sm:text-xl md:text-2xl font-display leading-relaxed" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                            {transcript[currentSubtitleIndex].text.split(/\s+/).map((w, i) => (
                                                <span
                                                    key={i}
                                                    className="cursor-pointer hover:text-[#E8521A] transition-colors"
                                                    onClick={() => handleWordTap(w, transcript[currentSubtitleIndex].text)}
                                                >{w} </span>
                                            ))}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between px-6 py-3 border-y border-border bg-surface shrink-0">
                            <div className="flex items-center gap-3">
                                <Gauge className="w-4 h-4 text-text-secondary" />
                                <div className="flex gap-1">
                                    {SPEEDS.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleSpeedChange(s)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-mono-num tracking-widest uppercase transition-colors ${
                                                activeSpeed === s ? 'bg-card text-[#E8521A] border border-border-strong' : 'text-text-secondary border border-transparent hover:text-text-muted'
                                            }`}
                                        >{s}x</button>
                                    ))}
                                </div>
                            </div>
                            {video.comprehension_questions?.length > 0 && (
                                <Button size="sm" variant="outline" onClick={() => setPhase('comprehension')} className="text-[10px] uppercase tracking-widest gap-2 bg-transparent border-border text-text-primary hover:bg-card rounded-full px-5 h-8">
                                    Start Quiz <ChevronRight className="w-3 h-3 text-[#E8521A]" />
                                </Button>
                            )}
                        </div>

                        {/* Transcript panel */}
                        <div ref={transcriptRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-2 bg-background custom-scrollbar max-w-5xl mx-auto w-full">
                            {transcript.length > 0 ? transcript.map((seg, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-5 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                                        i === currentSubtitleIndex
                                            ? 'bg-card border-l-[3px] border-l-[#E8521A] shadow-lg'
                                            : i < currentSubtitleIndex
                                                ? 'opacity-40 hover:opacity-70'
                                                : 'text-text-muted hover:bg-surface border-l-[3px] border-transparent'
                                        }`}
                                    onClick={() => seekTo(seg.start_time)}
                                >
                                    <span className={`text-xs font-mono-num w-12 shrink-0 pt-1 tracking-wider ${i === currentSubtitleIndex ? 'text-[#E8521A]' : 'text-text-secondary'}`}>
                                        {Math.floor(seg.start_time / 60)}:{String(Math.floor(seg.start_time % 60)).padStart(2, '0')}
                                    </span>
                                    <p className={`text-base sm:text-lg leading-relaxed ${i === currentSubtitleIndex ? 'text-text-primary' : 'text-text-muted'}`}>
                                        {seg.text.split(/\s+/).map((w, j) => (
                                            <span
                                                key={j}
                                                className="cursor-pointer hover:text-[#E8521A] transition-colors"
                                                onClick={e => { e.stopPropagation(); handleWordTap(w, seg.text); }}
                                            >{w} </span>
                                        ))}
                                    </p>
                                </div>
                            )) : (
                                <div className="text-center py-20">
                                    <p className="text-[10px] uppercase tracking-widest text-text-secondary font-mono-num">No transcript available</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {phase === 'comprehension' && video.comprehension_questions && (
                    <motion.div key="quiz" className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 max-w-3xl mx-auto w-full" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="text-center mb-10">
                            <h3 className="font-display text-3xl text-text-primary mb-2">Quiz</h3>
                            <p className="text-xs font-mono-num uppercase tracking-widest text-text-secondary">Test your understanding</p>
                        </div>
                        
                        {video.comprehension_questions.map((q: any, qi: number) => (
                            <Card key={qi} className="p-8 bg-card border-border rounded-2xl">
                                <p className="font-display text-xl text-text-primary mb-6"><span className="text-[#E8521A] mr-2 text-sm font-mono-num">{qi + 1}.</span> {q.question}</p>
                                <div className="space-y-3">
                                    {q.options.map((opt: string, oi: number) => (
                                        <button
                                            key={oi}
                                            onClick={() => handleAnswer(qi, oi)}
                                            className={`w-full text-left px-5 py-4 rounded-xl text-sm transition-all border ${
                                                answers[qi] === oi
                                                    ? 'border-[#E8521A] bg-[#E8521A]/5 text-text-primary shadow-[0_0_15px_rgba(232,82,26,0.1)]'
                                                    : 'border-border bg-surface text-text-muted hover:border-border-strong hover:bg-card'
                                                }`}
                                        >{opt}</button>
                                    ))}
                                </div>
                            </Card>
                        ))}
                        <div className="pt-6">
                            <Button
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length < video.comprehension_questions.length}
                                className="w-full h-12 rounded-full font-mono-num uppercase tracking-widest text-xs font-bold bg-gold text-background hover:brightness-110 transition-colors disabled:opacity-50 disabled:bg-surface disabled:text-text-muted"
                            >Submit answers</Button>
                        </div>
                    </motion.div>
                )}

                {phase === 'results' && (
                    <motion.div key="results" className="flex-1 flex items-center justify-center p-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <Card className="p-10 max-w-md w-full text-center bg-card border-border rounded-3xl shadow-2xl">
                            <div className="w-20 h-20 rounded-full bg-background border border-border-strong flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(232,82,26,0.15)]">
                                <Trophy className="w-8 h-8 text-[#E8521A]" />
                            </div>
                            <h3 className="text-3xl font-display text-text-primary mb-4">{comprehensionResult?.message || 'Quiz Complete'}</h3>
                            
                            {comprehensionResult?.score !== undefined && (
                                <div className="my-8">
                                    <p className="text-text-secondary text-[10px] uppercase font-mono-num tracking-widest mb-2">Score</p>
                                    <p className="text-6xl font-mono-num text-text-primary">{comprehensionResult.score}<span className="text-2xl text-[#E8521A]">%</span></p>
                                </div>
                            )}
                            
                            <div className="flex justify-center gap-12 mb-10 border-t border-b border-border py-6">
                                <div>
                                    <p className="text-text-secondary text-[10px] uppercase font-mono-num tracking-widest mb-1">Score</p>
                                    <p className="text-xl font-mono-num text-text-primary">{comprehensionResult?.correct} <span className="text-sm text-text-secondary">/ {comprehensionResult?.total}</span></p>
                                </div>
                                <div>
                                    <p className="text-text-secondary text-[10px] uppercase font-mono-num tracking-widest mb-1">XP Earned</p>
                                    <p className="text-xl font-mono-num text-[#E8521A]">+{comprehensionResult?.xp_earned || 40}</p>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={onClose} 
                                className="w-full h-12 rounded-full font-mono-num uppercase tracking-widest text-xs font-bold bg-text-primary text-background hover:bg-gold transition-colors"
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
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
