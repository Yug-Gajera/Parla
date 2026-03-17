"use client";

// ============================================================
// Parlova — Immersion Library (5 tabs: Articles | Stories | Books | Watch | Listen)
// ============================================================

import React, { useState } from 'react';
import ArticleBrowser from '@/components/articles/ArticleBrowser';
import StoryBrowser from '@/components/stories/StoryBrowser';
import BookLibrary from '@/components/books/BookLibrary';
import BookDetail from '@/components/books/BookDetail';
import ChapterReader from '@/components/books/ChapterReader';
import WatchBrowser from '@/components/watch/WatchBrowser';
import VideoPlayer from '@/components/watch/VideoPlayer';
import ListenBrowser from '@/components/listen/ListenBrowser';
import AudioPlayer from '@/components/listen/AudioPlayer';
import { Newspaper, Sparkles, Library, MonitorPlay, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImmersionLibraryProps {
    languageId: string;
    languageName: string;
    level: string;
}

type Tab = 'articles' | 'stories' | 'books' | 'watch' | 'listen';
type View = 'library' | 'book_detail' | 'chapter_reader' | 'video_player' | 'audio_player';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'articles', label: 'Intelligence', icon: Newspaper },
    { id: 'stories', label: 'Simulations', icon: Sparkles },
    { id: 'books', label: 'Archives', icon: Library },
    { id: 'watch', label: 'Visual', icon: MonitorPlay },
    { id: 'listen', label: 'Audio', icon: Headphones },
];

function getDefaultTab(level: string): Tab {
    if (level === 'A1' || level === 'A2') return 'stories';
    if (level === 'B1') return 'articles';
    return 'books';
}

export default function ImmersionLibrary({ languageId, languageName, level }: ImmersionLibraryProps) {
    const [activeTab, setActiveTab] = useState<Tab>(getDefaultTab(level));
    const [view, setView] = useState<View>('library');
    // Book state
    const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<number>(1);
    // Video/Audio state
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

    // ── Book handlers ──
    const handleSelectBook = (bookId: string) => { setSelectedBookId(bookId); setView('book_detail'); };
    const handleOpenChapter = (n: number) => { setSelectedChapter(n); setView('chapter_reader'); };
    const handleCloseDetail = () => { setSelectedBookId(null); setView('library'); };
    const handleCloseReader = () => { setView('book_detail'); };
    const handleNavigateChapter = (n: number) => { setSelectedChapter(n); };

    // ── Video handlers ──
    const handleSelectVideo = (videoId: string) => { setSelectedVideoId(videoId); setView('video_player'); };
    const handleCloseVideo = () => { setSelectedVideoId(null); setView('library'); };

    // ── Audio handlers ──
    const handleSelectEpisode = (episodeId: string) => { setSelectedEpisodeId(episodeId); setView('audio_player'); };
    const handleCloseAudio = () => { setSelectedEpisodeId(null); setView('library'); };

    // ── Full-screen overlays ──
    if (view === 'chapter_reader' && selectedBookId) {
        return <ChapterReader key={`${selectedBookId}-${selectedChapter}`} bookId={selectedBookId} chapterNumber={selectedChapter} onClose={handleCloseReader} onNavigate={handleNavigateChapter} />;
    }
    if (view === 'book_detail' && selectedBookId) {
        return <BookDetail bookId={selectedBookId} onClose={handleCloseDetail} onOpenChapter={handleOpenChapter} />;
    }
    if (view === 'video_player' && selectedVideoId) {
        return <VideoPlayer videoId={selectedVideoId} onClose={handleCloseVideo} />;
    }
    if (view === 'audio_player' && selectedEpisodeId) {
        return <AudioPlayer episodeId={selectedEpisodeId} onClose={handleCloseAudio} />;
    }

    // ── Main Library View ──
    return (
        <div className="min-h-[calc(100vh-80px)] pb-24 font-sans bg-background">
            {/* Header */}
            <div className="px-6 sm:px-10 pt-10 pb-6 max-w-6xl mx-auto border-b border-border">
                <h1 className="text-3xl sm:text-4xl font-display text-text-primary tracking-tight">Acquisition Center</h1>
                <p className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    Target Parameter: <span className="text-text-secondary">{languageName}</span>
                </p>
            </div>

            {/* Tab bar */}
            <div className="bg-surface border-b border-border sticky top-0 z-30">
                <div className="flex gap-2 px-6 sm:px-10 max-w-6xl mx-auto overflow-x-auto py-3 hide-scrollbar mask-fade-right">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold whitespace-nowrap transition-all border ${isActive
                                        ? 'bg-card text-accent border-accent-border shadow-inner'
                                        : 'bg-transparent border-transparent text-text-muted hover:bg-card hover:text-text-secondary hover:border-border'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab content */}
            <div className="px-4 sm:px-10 py-10 max-w-6xl mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'articles' && (
                        <motion.div key="articles" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }}>
                            <ArticleBrowser languageId={languageId} userLevel={level} />
                        </motion.div>
                    )}
                    {activeTab === 'stories' && (
                        <motion.div key="stories" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }}>
                            <StoryBrowser languageId={languageId} />
                        </motion.div>
                    )}
                    {activeTab === 'books' && (
                        <motion.div key="books" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }}>
                            <BookLibrary languageId={languageId} onSelectBook={handleSelectBook} />
                        </motion.div>
                    )}
                    {activeTab === 'watch' && (
                        <motion.div key="watch" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }}>
                            <WatchBrowser languageId={languageId} onSelectVideo={handleSelectVideo} />
                        </motion.div>
                    )}
                    {activeTab === 'listen' && (
                        <motion.div key="listen" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }}>
                            <ListenBrowser languageId={languageId} onSelectEpisode={handleSelectEpisode} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
