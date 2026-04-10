"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { WordData } from '@/components/shared/WordPopover';
import { usePlanLimits } from '@/hooks/usePlanLimits';

interface TranscriptSegment { start_time: number; end_time: number; text: string; }

export function useVideoPlayer(videoId: string) {
    const [video, setVideo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
    const [wordPopover, setWordPopover] = useState<WordData | null>(null);
    const [isWordLoading, setIsWordLoading] = useState(false);
    const [wordsTapped, setWordsTapped] = useState(0);
    const [remainingLookups, setRemainingLookups] = useState<number | null>(null);
    const [comprehensionResult, setComprehensionResult] = useState<any>(null);
    const playerRef = useRef<any>(null);
    const { isPro } = usePlanLimits();

    const fetchVideo = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/watch/${videoId}/progress`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setVideo(data.video);
        } catch (err) {
            console.error('Failed to fetch video:', err);
        } finally {
            setIsLoading(false);
        }
    }, [videoId]);

    useEffect(() => { fetchVideo(); }, [fetchVideo]);

    // Sync subtitle to current time
    const syncSubtitles = useCallback((time: number) => {
        setCurrentTime(time);
        if (!video?.transcript) return;
        const transcript = video.transcript as TranscriptSegment[];
        const idx = transcript.findIndex(
            s => time >= s.start_time && time < s.end_time
        );
        setCurrentSubtitleIndex(idx);
    }, [video]);

    const tapWord = useCallback(async (word: string, contextSentence: string) => {
        setWordsTapped(prev => prev + 1);
        // Pause video
        if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo();

        // Check vocabulary first
        const vocabItem = video?.vocabulary_items?.find(
            (v: any) => v.word.toLowerCase() === word.toLowerCase()
        );

        if (vocabItem) {
            setWordPopover({
                word, translation: vocabItem.translation,
                spanish_explanation: vocabItem.spanish_explanation || null,
                part_of_speech: vocabItem.part_of_speech,
                in_context: vocabItem.in_context || contextSentence,
                note: vocabItem.note,
            });
            return;
        }

        setWordPopover({ word, in_context: contextSentence });
        setIsWordLoading(true);

        try {
            const res = await fetch('/api/words/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word, context_sentence: contextSentence }),
            });
            const data = await res.json();
            if (data.word_info) {
                setWordPopover(prev => prev ? {
                    ...prev, translation: data.word_info.translation,
                    spanish_explanation: data.word_info.spanish_explanation || null,
                    part_of_speech: data.word_info.part_of_speech,
                    note: data.word_info.note,
                } : null);
            }
            if (typeof data.remaining === 'number') {
                setRemainingLookups(data.remaining);
            }
        } catch { /* silent */ } finally { setIsWordLoading(false); }
    }, [video]);

    const dismissPopover = useCallback(() => {
        setWordPopover(null);
        setIsWordLoading(false);
        if (playerRef.current?.playVideo) playerRef.current.playVideo();
    }, []);

    const seekTo = useCallback((time: number) => {
        if (playerRef.current?.seekTo) playerRef.current.seekTo(time, true);
    }, []);

    const setSpeed = useCallback((speed: number) => {
        setPlaybackSpeed(speed);
        if (playerRef.current?.setPlaybackRate) playerRef.current.setPlaybackRate(speed);
    }, []);

    const submitAnswers = useCallback(async (answers: number[]) => {
        try {
            const res = await fetch(`/api/watch/${videoId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    watch_time_seconds: Math.round(currentTime),
                    completed: true,
                    answers,
                    words_tapped: wordsTapped,
                }),
            });
            const data = await res.json();
            setComprehensionResult(data);
        } catch {
            setComprehensionResult({
                score: 0, correct: 0, total: answers.length,
                xp_earned: 40, message: 'Progress saved.',
            });
        }
    }, [videoId, currentTime, wordsTapped]);

    return {
        video, isLoading, currentTime, isPlaying, playbackSpeed,
        currentSubtitleIndex, wordPopover, isWordLoading, wordsTapped,
        comprehensionResult, playerRef, remainingLookups, isPro,
        fetchVideo, syncSubtitles, tapWord, dismissPopover,
        seekTo, setSpeed, submitAnswers, setIsPlaying,
    };
}
