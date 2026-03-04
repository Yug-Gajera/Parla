"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { WordData } from '@/components/shared/WordPopover';

export function useAudioPlayer(episodeId: string) {
    const [episode, setEpisode] = useState<any>(null);
    const [show, setShow] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [currentTranscriptIndex, setCurrentTranscriptIndex] = useState(-1);
    const [wordPopover, setWordPopover] = useState<WordData | null>(null);
    const [isWordLoading, setIsWordLoading] = useState(false);
    const [wordsTapped, setWordsTapped] = useState(0);
    const [comprehensionResult, setComprehensionResult] = useState<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchEpisode = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/listen/${episodeId}/progress`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setEpisode(data.episode);
            setShow(data.show);
        } catch (err) {
            console.error('Failed to fetch episode:', err);
        } finally {
            setIsLoading(false);
        }
    }, [episodeId]);

    useEffect(() => { fetchEpisode(); }, [fetchEpisode]);

    const play = useCallback(() => {
        audioRef.current?.play();
        setIsPlaying(true);
    }, []);

    const pause = useCallback(() => {
        audioRef.current?.pause();
        setIsPlaying(false);
    }, []);

    const seek = useCallback((time: number) => {
        if (audioRef.current) { audioRef.current.currentTime = time; setCurrentTime(time); }
    }, []);

    const setSpeed = useCallback((speed: number) => {
        setPlaybackSpeed(speed);
        if (audioRef.current) audioRef.current.playbackRate = speed;
    }, []);

    const syncTranscript = useCallback((time: number) => {
        setCurrentTime(time);
        if (!episode?.transcript) return;
        const idx = (episode.transcript as any[]).findIndex(
            (s: any) => time >= s.start_time && time < s.end_time
        );
        setCurrentTranscriptIndex(idx);
    }, [episode]);

    const tapWord = useCallback(async (word: string, contextSentence: string) => {
        setWordsTapped(prev => prev + 1);
        pause();

        const vocabItem = episode?.vocabulary_items?.find(
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
        } catch { /* silent */ } finally { setIsWordLoading(false); }
    }, [episode, pause]);

    const dismissPopover = useCallback(() => {
        setWordPopover(null);
        setIsWordLoading(false);
        play();
    }, [play]);

    const submitAnswers = useCallback(async (answers: number[]) => {
        try {
            const res = await fetch(`/api/listen/${episodeId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listen_time_seconds: Math.round(currentTime),
                    completed: true, answers,
                    words_tapped: wordsTapped,
                }),
            });
            setComprehensionResult(await res.json());
        } catch {
            setComprehensionResult({
                score: 0, correct: 0, total: answers.length,
                xp_earned: 40, message: 'Progress saved.',
            });
        }
    }, [episodeId, currentTime, wordsTapped]);

    return {
        episode, show, isLoading, currentTime, duration, isPlaying, playbackSpeed,
        currentTranscriptIndex, wordPopover, isWordLoading, wordsTapped,
        comprehensionResult, audioRef,
        fetchEpisode, play, pause, seek, setSpeed,
        syncTranscript, tapWord, dismissPopover, submitAnswers,
        setCurrentTime, setDuration, setIsPlaying,
    };
}
