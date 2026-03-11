"use client";

// ============================================================
// Parlova — Story Reader (Redesigned)
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useStoryReader } from '@/hooks/useStoryReader';
import WordPopover from '@/components/shared/WordPopover';
import { TOPIC_CATEGORIES, CONTENT_TYPES } from '@/lib/data/story-topics';
import {
    ArrowLeft, Clock, BookOpen, Plus, Check,
    Loader2, ChevronUp, X, Sparkles, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StoryReaderProps {
    storyId: string;
    onClose: () => void;
}

type Phase = 'reading' | 'comprehension' | 'results';

export default function StoryReader({ storyId, onClose }: StoryReaderProps) {
    const {
        story, isLoading, error,
        wordPopover, isWordLoading, showVocabPanel, readingProgress,
        comprehensionResult, wordsTapped,
        fetchStory, tapWord, dismissPopover,
        toggleVocabPanel, submitComprehension,
        calculateReadingProgress,
    } = useStoryReader(storyId);

    const [phase, setPhase] = useState<Phase>('reading');
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showComprehensionButton, setShowComprehensionButton] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { fetchStory(storyId); }, [storyId, fetchStory]);

    // Track scroll — show comprehension at 90%
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const handler = () => {
            const percent = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
            calculateReadingProgress(percent);
            if (percent >= 90) setShowComprehensionButton(true);
        };
        el.addEventListener('scroll', handler);
        return () => el.removeEventListener('scroll', handler);
    }, [calculateReadingProgress]);

    const handleStartComprehension = () => {
        if (story?.comprehension_questions?.length) {
            setSelectedAnswers(new Array(story.comprehension_questions.length).fill(null));
            setCurrentQuestion(0);
            setPhase('comprehension');
        }
    };

    const handleSelectAnswer = (qIdx: number, optIdx: number) => {
        const a = [...selectedAnswers]; a[qIdx] = optIdx; setSelectedAnswers(a);
    };

    const handleCheckAnswer = () => setShowExplanation(true);

    const handleNextQuestion = () => {
        setShowExplanation(false);
        if (currentQuestion < (story?.comprehension_questions?.length || 0) - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            submitComprehension(selectedAnswers.filter((a): a is number => a !== null));
            setPhase('results');
        }
    };

    // ── Loading ──
    if (isLoading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-[#080808] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-[32px] h-[32px] text-[#c9a84c] animate-spin mb-[16px]" />
                    <p className="text-[#9a9590] text-[15px]">Loading story...</p>
                </div>
            </motion.div>
        );
    }

    if (error || !story) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-[#080808] flex items-center justify-center p-[24px]">
                <div className="parlova-card text-center max-w-[400px] w-full p-[32px]">
                    <p className="text-[#f87171] font-medium mb-[24px]">{error || 'Story not found'}</p>
                    <button onClick={onClose} className="btn btn-secondary w-full">Go Back</button>
                </div>
            </motion.div>
        );
    }

    const cat = TOPIC_CATEGORIES.find(c => c.id === story.topic_category);
    const typeLabel = CONTENT_TYPES.find(t => t.id === story.content_type)?.label || story.content_type;
    const isDialogue = story.content_type === 'dialogue';
    const isLetter = story.content_type === 'letter';
    const isJournal = story.content_type === 'journal';

    // ── Results ──
    if (phase === 'results' && comprehensionResult) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-[#080808] flex items-center justify-center p-[24px]">
                <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }} className="max-w-[400px] w-full">
                    <div className="parlova-card parlova-card-accent text-center p-[40px]">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="mx-auto mb-[24px] w-[64px] h-[64px] rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center text-[#c9a84c]">
                            <Award className="w-[32px] h-[32px]" />
                        </motion.div>

                        <h2 className="font-display text-[28px] font-semibold text-[#f0ece4] mb-[8px]">Story Complete</h2>
                        <p className="text-[15px] text-[#9a9590] mb-[32px]">{comprehensionResult.message}</p>

                        <div className="mb-[32px]">
                            <div className="font-mono-num text-[48px] font-semibold leading-none mb-[8px] text-[#c9a84c]">
                                {comprehensionResult.correct}<span className="text-[24px] text-[#5a5652]">/{comprehensionResult.total}</span>
                            </div>
                            <p className="text-[13px] text-[#5a5652] uppercase tracking-widest font-medium">
                                Score: {comprehensionResult.score}%
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-[16px] mb-[32px]">
                            <div className="bg-[#141414] border border-[#1e1e1e] p-[16px] rounded-xl flex flex-col items-center">
                                <span className="font-mono-num text-[20px] font-semibold text-[#4ade80] mb-[4px]">+{comprehensionResult.xp_earned}</span>
                                <span className="text-[11px] text-[#5a5652] uppercase tracking-widest">XP Earned</span>
                            </div>
                            <div className="bg-[#141414] border border-[#1e1e1e] p-[16px] rounded-xl flex flex-col items-center">
                                <span className="font-mono-num text-[20px] font-semibold text-[#f0ece4] mb-[4px]">{wordsTapped}</span>
                                <span className="text-[11px] text-[#5a5652] uppercase tracking-widest">Words Looked Up</span>
                            </div>
                        </div>

                        <button onClick={onClose} className="btn btn-primary w-full">
                            Back to Stories
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    // ── Comprehension (3 questions) ──
    if (phase === 'comprehension') {
        const q = story.comprehension_questions[currentQuestion];
        const selected = selectedAnswers[currentQuestion];
        const isCorrect = selected === q.correct;

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-[#080808] flex flex-col pt-safe-top">
                <div className="flex items-center justify-between px-[20px] h-[64px] border-b border-[#1e1e1e]">
                    <span className="text-[14px] font-semibold text-[#f0ece4]">Comprehension Check</span>
                    <div className="flex gap-[6px]">
                        {story.comprehension_questions.map((_: unknown, i: number) => (
                            <div key={i} className={`h-[4px] rounded-full transition-all duration-300 ${
                                i === currentQuestion ? 'w-[24px] bg-[#c9a84c]' :
                                i < currentQuestion ? 'w-[12px] bg-[#c9a84c] opacity-50' : 'w-[12px] bg-[#2a2a2a]'
                            }`} />
                        ))}
                    </div>
                    <span className="font-mono-num text-[13px] text-[#9a9590]">
                        {currentQuestion + 1}/{story.comprehension_questions.length}
                    </span>
                </div>

                <div className="flex-1 flex items-center justify-center p-[24px] overflow-y-auto">
                    <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-[500px] w-full py-[40px]">
                        <h3 className="font-display text-[22px] font-semibold mb-[32px] text-[#f0ece4] leading-snug">
                            {q.question}
                        </h3>
                        <div className="flex flex-col gap-[16px] mb-[32px]">
                            {q.options.map((opt: string, optIdx: number) => {
                                let optClass = 'border-[#2a2a2a] hover:border-[#1e1e1e] hover:bg-[#141414] text-[#9a9590]';
                                if (showExplanation) {
                                    if (optIdx === q.correct) optClass = 'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.05)] text-[#4ade80]';
                                    else if (optIdx === selected && !isCorrect) optClass = 'border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.05)] text-[#f87171]';
                                } else if (selected === optIdx) {
                                    optClass = 'border-[#c9a84c] bg-[rgba(201,168,76,0.05)] text-[#f0ece4]';
                                }
                                return (
                                    <button key={optIdx}
                                        onClick={() => !showExplanation && handleSelectAnswer(currentQuestion, optIdx)}
                                        disabled={showExplanation}
                                        className={`w-full p-[20px] rounded-[16px] border text-left text-[16px] transition-all duration-200 ${optClass}`}>
                                        <span className="font-mono text-[14px] opacity-60 mr-[12px]">{String.fromCharCode(65 + optIdx)}.</span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        <AnimatePresence>
                            {showExplanation && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-[32px] overflow-hidden">
                                     <div className={`p-[20px] rounded-[16px] border ${isCorrect ? 'border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.05)]' : 'border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.05)]'}`}>
                                        <p className={`text-[15px] font-semibold mb-[8px] ${isCorrect ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                                            {isCorrect ? 'Correct!' : 'Not quite'}
                                        </p>
                                        <p className="text-[14px] text-[#9a9590] leading-relaxed">{q.explanation}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {!showExplanation ? (
                            <button className="btn btn-primary w-full h-[56px] text-[16px]" disabled={selected === null} onClick={handleCheckAnswer}>Check Answer</button>
                        ) : (
                            <button className="btn btn-primary w-full h-[56px] text-[16px]" onClick={handleNextQuestion}>
                                {currentQuestion < story.comprehension_questions.length - 1 ? 'Next Question' : 'See Results'}
                            </button>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // ── Reading Phase ──
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#080808] flex flex-col">
            
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#141414] z-10">
                <motion.div className="h-full bg-[#c9a84c]"
                    animate={{ width: `${readingProgress}%` }} transition={{ ease: 'easeOut' }} />
            </div>

            {/* Header */}
            <header className="top-bar border-b border-[#1e1e1e]">
                <button onClick={onClose} className="w-[40px] h-[40px] rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[#9a9590]">
                    <ArrowLeft className="w-[20px] h-[20px]" />
                </button>
                <div className="flex-1 flex justify-center items-center gap-[12px] text-[12px] font-medium text-[#5a5652] uppercase tracking-widest">
                    <span>{typeLabel}</span>
                    <span>•</span>
                    <span className="flex items-center gap-[4px]"><Clock className="w-[12px] h-[12px]" /> {Math.max(1, Math.round((story.content || '').split(' ').length / 150))} min</span>
                </div>
                <button onClick={toggleVocabPanel} className="w-[40px] h-[40px] rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[#f0ece4] relative">
                    <BookOpen className="w-[18px] h-[18px]" />
                    {story.vocabulary_items?.length > 0 && (
                        <span className="absolute top-[8px] right-[8px] w-[8px] h-[8px] bg-[#c9a84c] rounded-full" />
                    )}
                </button>
            </header>

            {/* Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-[24px] py-[40px] sm:py-[64px] scroll-smooth pb-[160px]">
                <div className="max-w-[680px] mx-auto">
                    
                    {/* Meta Tags */}
                    <div className="flex items-center gap-[8px] flex-wrap mb-[24px]">
                        <span className="badge-gold">
                            Level {story.cefr_level}
                        </span>
                        {cat && (
                            <span className="px-[12px] py-[6px] rounded-full text-[11px] font-medium bg-[#141414] border border-[#1e1e1e] text-[#9a9590]">
                                {cat.emoji} {cat.name}
                            </span>
                        )}
                        <span className="px-[12px] py-[6px] rounded-full text-[11px] font-medium bg-[#141414] border border-[#1e1e1e] text-[#9a9590] capitalize">
                            {story.topic?.replace(/-/g, ' ')}
                        </span>
                    </div>

                    <h1 className="font-display text-[32px] sm:text-[40px] font-semibold leading-[1.1] text-[#f0ece4] mb-[40px]">{story.title}</h1>
                    
                    {/* Render based on content type */}
                    {isDialogue ? (
                        <DialogueContent content={story.content} onTapWord={tapWord} />
                    ) : isLetter ? (
                        <LetterContent content={story.content} onTapWord={tapWord} />
                    ) : isJournal ? (
                        <JournalContent content={story.content} onTapWord={tapWord} />
                    ) : (
                        <InteractiveText content={story.content} onTapWord={tapWord} />
                    )}
                </div>
            </div>

            {/* Comprehension button at 90% */}
            <AnimatePresence>
                {showComprehensionButton && phase === 'reading' && (
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-[40px] left-0 right-0 z-[40] flex justify-center pointer-events-none px-[24px]">
                        <button onClick={handleStartComprehension}
                            className="btn btn-primary h-[56px] px-[32px] pointer-events-auto shadow-2xl shadow-[rgba(201,168,76,0.2)]">
                            <Sparkles className="w-[18px] h-[18px] mr-[8px]" /> Check Understanding
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Word popover */}
            <AnimatePresence>
                {(wordPopover || isWordLoading) && (
                    <WordPopover
                        wordData={wordPopover}
                        isLoading={isWordLoading}
                        onDismiss={dismissPopover}
                    />
                )}
            </AnimatePresence>

            {/* Vocabulary Panel */}
            <AnimatePresence>
                {showVocabPanel && (
                     <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[64] bg-[#080808]/80 backdrop-blur-sm"
                            onClick={toggleVocabPanel}
                        />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute bottom-0 left-0 right-0 z-[65] max-h-[85vh] bg-[#0f0f0f] border-t border-[#1e1e1e] rounded-t-[24px] shadow-[0_-20px_40px_rgba(0,0,0,0.5)] flex flex-col">
                            
                            <div className="flex items-center justify-between px-[24px] h-[72px] border-b border-[#1e1e1e] shrink-0">
                                <h3 className="font-display text-[20px] font-semibold text-[#f0ece4]">Key Vocabulary</h3>
                                <button onClick={toggleVocabPanel} className="w-[32px] h-[32px] rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.05)] text-[#9a9590] hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                                    <X className="w-[16px] h-[16px]" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-[24px] flex flex-col gap-[16px]">
                                {story.vocabulary_items?.map((v: any, i: number) => (
                                    <div key={i} className="parlova-card p-[20px] flex flex-row items-start gap-[16px] justify-between group">
                                        <div className="flex flex-col gap-[4px] min-w-0">
                                            <div className="flex items-center gap-[8px]">
                                                <span className="font-display text-[20px] font-semibold text-[#f0ece4] leading-none">{v.word}</span>
                                                <span className="text-[10px] uppercase font-medium tracking-widest text-[#5a5652]">{v.part_of_speech}</span>
                                            </div>
                                            <p className="text-[15px] text-[#9a9590] truncate">{v.translation}</p>
                                        </div>
                                        <button className="w-[36px] h-[36px] shrink-0 rounded-full flex items-center justify-center border border-[#2a2a2a] text-[#c9a84c] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(201,168,76,0.1)] hover:border-[rgba(201,168,76,0.3)] transition-all">
                                            <Plus className="w-[16px] h-[16px]" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Standard interactive text (short_story) ──
function InteractiveText({ content, onTapWord }: { content: string; onTapWord: (word: string, ctx: string) => void }) {
    const paragraphs = content.split('\n\n').filter(Boolean);
    return (
        <div className="space-y-[24px]">
            {paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-[17px] leading-[1.8] text-[#f0ece4] font-light">
                    <WordTokens text={p} onTapWord={onTapWord} />
                </p>
            ))}
        </div>
    );
}

// ── Dialogue content ──
function DialogueContent({ content, onTapWord }: { content: string; onTapWord: (word: string, ctx: string) => void }) {
    const lines = content.split('\n').filter(Boolean);
    const speakers: string[] = [];
    const speakerColors = ['border-[#c9a84c]', 'border-[#4ade80]']; // Gold and a fresh green instead of neon violet/cyan

    return (
        <div className="space-y-[16px]">
            {lines.map((line, i) => {
                const match = line.match(/^([A-ZÁÉÍÓÚÜÑa-záéíóúüñ\s]+)\s*:\s*(.*)/);
                if (match) {
                    const speaker = match[1].trim();
                    const text = match[2];
                    if (!speakers.includes(speaker)) speakers.push(speaker);
                    const speakerIdx = speakers.indexOf(speaker);
                    const isRight = speakerIdx === 1;

                    return (
                        <div key={i} className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                            <span className="text-[11px] font-medium uppercase tracking-widest text-[#5a5652] mb-[6px] px-[8px]">{speaker}</span>
                            <div className={`inline-block max-w-[85%] p-[16px] rounded-[16px] bg-[#141414] border-l-[3px] border-y border-r border-[#1e1e1e] ${speakerColors[speakerIdx % 2]}`}>
                                <p className="text-[16px] leading-[1.7] text-[#f0ece4] font-light">
                                    <WordTokens text={text} onTapWord={onTapWord} />
                                </p>
                            </div>
                        </div>
                    );
                }
                // Non-dialogue line (narration)
                return (
                    <p key={i} className="text-[15px] text-[#9a9590] italic text-center py-[12px]">
                        <WordTokens text={line} onTapWord={onTapWord} />
                    </p>
                );
            })}
        </div>
    );
}

// ── Letter content ──
function LetterContent({ content, onTapWord }: { content: string; onTapWord: (word: string, ctx: string) => void }) {
    const paragraphs = content.split('\n\n').filter(Boolean);
    return (
        <div className="space-y-[24px] pl-[20px] border-l-[3px] border-[#c9a84c]/30">
            {paragraphs.map((p, i) => {
                const isFirst = i === 0;
                const isLast = i === paragraphs.length - 1;
                return (
                    <p key={i} className={`text-[17px] leading-[1.8] text-[#f0ece4] font-light ${isFirst || isLast ? 'italic font-medium text-[18px]' : ''}`}>
                        <WordTokens text={p} onTapWord={onTapWord} />
                    </p>
                );
            })}
        </div>
    );
}

// ── Journal content ──
function JournalContent({ content, onTapWord }: { content: string; onTapWord: (word: string, ctx: string) => void }) {
    const paragraphs = content.split('\n\n').filter(Boolean);
    return (
        <div className="space-y-[24px]">
            {paragraphs.map((p, i) => (
                <p key={i} className={`text-[17px] leading-[1.8] text-[#f0ece4] font-light ${i === 0 ? 'italic text-[#9a9590] font-medium' : ''}`}>
                    <WordTokens text={p} onTapWord={onTapWord} />
                </p>
            ))}
        </div>
    );
}

// ── Word tokenizer (shared across content types) ──
function WordTokens({ text, onTapWord }: { text: string; onTapWord: (word: string, ctx: string) => void }) {
    const tokens = text.split(/(\s+)/);
    return (
        <>
            {tokens.map((token, i) => {
                if (/^\s+$/.test(token)) return token;
                const cleanWord = token.replace(/[^a-záéíóúüñ]/gi, '').toLowerCase();
                if (!cleanWord) return token;
                return (
                    <span key={i}
                        onClick={() => onTapWord(cleanWord, text)}
                        className="cursor-pointer transition-colors duration-200 hover:text-[#c9a84c] rounded-[2px]">
                        {token}
                    </span>
                );
            })}
        </>
    );
}
