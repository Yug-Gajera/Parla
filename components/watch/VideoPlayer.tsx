"use client";

// ============================================================
// Parlai — Video Player (YouTube embed + interactive subtitles)
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
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!video) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Video not found.</p>
                <Button variant="ghost" onClick={onClose} className="mt-4">Close</Button>
            </div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-background flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
                <div className="truncate flex-1 mr-3">
                    <h2 className="font-bold text-sm truncate">{video.title}</h2>
                    <p className="text-xs text-muted-foreground">{video.channel_name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>

            <AnimatePresence mode="wait">
                {phase === 'watching' && (
                    <motion.div key="watching" className="flex flex-col flex-1 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* YouTube embed */}
                        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                            <div ref={iframeRef} className="absolute inset-0" />
                            {/* Subtitle overlay */}
                            {currentSubtitleIndex >= 0 && transcript[currentSubtitleIndex] && (
                                <div className="absolute bottom-4 left-4 right-4 text-center">
                                    <div className="inline-block bg-black/70 rounded-lg px-4 py-2 max-w-md mx-auto">
                                        <p className="text-white text-base sm:text-lg font-medium leading-relaxed" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                                            {transcript[currentSubtitleIndex].text.split(/\s+/).map((w, i) => (
                                                <span
                                                    key={i}
                                                    className="cursor-pointer hover:text-violet-300 transition-colors"
                                                    onClick={() => handleWordTap(w, transcript[currentSubtitleIndex].text)}
                                                >{w} </span>
                                            ))}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
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
                            {video.comprehension_questions?.length > 0 && (
                                <Button size="sm" variant="outline" onClick={() => setPhase('comprehension')} className="text-xs gap-1">
                                    Quiz <ChevronRight className="w-3 h-3" />
                                </Button>
                            )}
                        </div>

                        {/* Transcript panel */}
                        <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                            {transcript.length > 0 ? transcript.map((seg, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${i === currentSubtitleIndex
                                        ? 'bg-primary/5 border-l-2 border-primary'
                                        : i < currentSubtitleIndex
                                            ? 'opacity-50'
                                            : 'hover:bg-muted/50'
                                        }`}
                                    onClick={() => seekTo(seg.start_time)}
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
                            )) : (
                                <div className="text-center py-10 text-muted-foreground text-sm">
                                    No subtitles available for this video.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {phase === 'comprehension' && video.comprehension_questions && (
                    <motion.div key="quiz" className="flex-1 overflow-y-auto p-4 space-y-5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 className="font-bold text-lg">Comprehension Check</h3>
                        {video.comprehension_questions.map((q: any, qi: number) => (
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
                            disabled={Object.keys(answers).length < video.comprehension_questions.length}
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
                            <h3 className="text-xl font-bold mb-2">{comprehensionResult?.message || 'Video Complete!'}</h3>
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
