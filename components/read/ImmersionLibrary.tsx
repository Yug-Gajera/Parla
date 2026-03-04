"use client";

// ============================================================
// Parlai — Immersion Library (5 tabs: Articles | Stories | Books | Watch | Listen)
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
    { id: 'articles', label: 'Articles', icon: Newspaper },
    { id: 'stories', label: 'Stories', icon: Sparkles },
    { id: 'books', label: 'Books', icon: Library },
    { id: 'watch', label: 'Watch', icon: MonitorPlay },
    { id: 'listen', label: 'Listen', icon: Headphones },
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
        <div className="min-h-[calc(100vh-80px)] pb-24">
            {/* Header */}
            <div className="px-4 sm:px-8 pt-6 pb-2 max-w-5xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-black">Read</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Immerse yourself in {languageName} content at your level
                </p>
            </div>

            {/* Tab bar */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="flex gap-0.5 px-4 sm:px-8 max-w-5xl mx-auto overflow-x-auto py-2">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab content */}
            <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'articles' && (
                        <motion.div key="articles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <ArticleBrowser languageId={languageId} userLevel={level} />
                        </motion.div>
                    )}
                    {activeTab === 'stories' && (
                        <motion.div key="stories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <StoryBrowser languageId={languageId} />
                        </motion.div>
                    )}
                    {activeTab === 'books' && (
                        <motion.div key="books" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <BookLibrary languageId={languageId} onSelectBook={handleSelectBook} />
                        </motion.div>
                    )}
                    {activeTab === 'watch' && (
                        <motion.div key="watch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <WatchBrowser languageId={languageId} onSelectVideo={handleSelectVideo} />
                        </motion.div>
                    )}
                    {activeTab === 'listen' && (
                        <motion.div key="listen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <ListenBrowser languageId={languageId} onSelectEpisode={handleSelectEpisode} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
