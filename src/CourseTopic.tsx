
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourse } from '../context/CourseContext';
import { useSpace } from '../context/SpaceContext';
import { getLocalizedValue } from '../utils/languageUtils';
import { storage } from '../utils/storage';
import { GeneratedLessonSection, VocabularyItem, AppLanguage, MasteryTask } from '../types';
import { OpenAIService } from '../services/openaiService';
import { GeminiService } from '../services/geminiService';
import VisualEngine from '../components/VisualEngine/VisualEngine';
import AsyncVisualLoader from '../components/VisualEngine/AsyncVisualLoader';
import { LAB_TOOLS } from '../data/labTools';
import Confetti, { ConfettiRef } from '../components/Confetti';
import LessonMindmapSidebar from '../components/LessonMindmapSidebar';
import AdaptivePracticeMode from '../components/AdaptivePracticeMode';
import MasteryPath from '../components/MasteryPath';
import MasteryTaskView from '../components/MasteryTaskView';
import FlashcardOverlay from '../components/FlashcardOverlay';
import LessonAssistant from '../components/LessonAssistant';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

// --- TYPES & HELPERS ---

declare global {
    interface Window {
        katex: any;
    }
}

// Extensive Reading Preferences State
import { 
    MarkdownRenderer, 
    RichText, 
    ReadingPreferences, 
    DEFAULT_PREFS,
    MathRenderer,
    VocabularyTooltip
} from '../components/MarkdownRenderer';

// --- TYPES & HELPERS ---

const THEMES = {
    default: {
        bg: "bg-background-light dark:bg-background-dark",
        text: "text-graphite dark:text-white",
        panel: "bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-3xl"
    },
    paper: {
        bg: "bg-[#f4f1ea]",
        text: "text-[#2c2c2c]",
        panel: "bg-[#fffdfa]/90 backdrop-blur-xl"
    },
    dark: {
        bg: "bg-[#121212]",
        text: "text-gray-200",
        panel: "bg-[#1e1e1e]/90 backdrop-blur-xl"
    },
    midnight: {
        bg: "bg-[#05070a]",
        text: "text-blue-100",
        panel: "bg-[#0c1117]/90 backdrop-blur-xl"
    },
    mint: {
        bg: "bg-[#f0f7f4]",
        text: "text-[#1a2e26]",
        panel: "bg-[#ffffff]/90 backdrop-blur-xl"
    }
};

const HIGHLIGHT_COLORS = [
    { value: '#F59E0B', label: 'Amber' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Emerald' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Violet' }
];

const DEFAULT_TTS_PROMPT = 'TTS_DEFAULT_PROMPT';

const TTS_VOICES = ['Kore', 'Anna', 'Mark', 'Liam', 'Sera', 'Phoebe'] as const;
type TtsVoiceName = typeof TTS_VOICES[number];

// --- TYPES & HELPERS ---


const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// --- PRINT COMPONENT ---
const PrintLessonContent: React.FC<{ lesson: any, language: AppLanguage, prefs: ReadingPreferences }> = ({ lesson, language, prefs }) => {
    const printPrefs: ReadingPreferences = {
        ...prefs,
        themeMode: 'default',
        contrast: 'normal',
        fontSize: 1.2,
        lineHeight: 1.6,
        screenMask: false,
        nightLightStrength: 0,
    };

    return (
        <div className="bg-white text-black p-16 w-[900px] font-sans">
            <style>{`
                .print-section { page-break-inside: avoid; break-inside: avoid; }
                .print-markdown-content p { margin-bottom: 2em; line-height: 1.8; }
                .print-markdown-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1.5em; margin: 1.5em 0; }
                .print-markdown-content strong { position: relative; top: 3px; vertical-align: baseline; display: inline-block; line-height: 1.2; padding: 1px 4px 3px 4px; border-radius: 4px; }
                .print-markdown-content code { position: relative; top: 4px; vertical-align: baseline; display: inline-block; line-height: 1.2; padding: 2px 5px; border-radius: 4px; }
            `}</style>
            {/* Title Slide */}
            <div className="mb-24 pt-10">
                <div className="flex gap-3 mb-6">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[11px] font-bold rounded uppercase tracking-wider">{lesson.level}</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[11px] font-bold rounded uppercase tracking-wider">{lesson.goal?.replace('_', ' ')}</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter leading-tight mb-8">
                    <RichText content={getLocalizedValue(lesson.topic, language)} />
                </h1>
                <div className="w-20 h-2 bg-primary rounded-full mb-12"></div>
            </div>

            {/* Sections */}
            {lesson.sections
                .filter((s: any) => s.type !== 'lab' && s.type !== 'visual')
                .map((section: any, idx: number) => (
                    <div key={idx} className="print-section mb-16 pb-12 border-b border-gray-50 last:border-0">
                        <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-4">
                            <span className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-sm font-bold text-gray-400 border border-gray-100">{idx + 1}</span>
                            <RichText content={getLocalizedValue(section.title, language)} />
                        </h2>
                        <div className="print-markdown-content text-gray-700 leading-relaxed text-lg">
                            <MarkdownRenderer text={getLocalizedValue(section.content, language)} prefs={printPrefs} vocabulary={lesson.vocabulary} language={language} />
                        </div>
                    </div>
                ))}

            {/* Vocabulary */}
            {lesson.vocabulary && lesson.vocabulary.length > 0 && (
                <div className="mb-20 pt-10">
                    <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-3xl">dictionary</span>
                        Lug'at
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {lesson.vocabulary.map((v: any, i: number) => (
                            <div key={i} className="print-section bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <p className="font-bold mb-2 text-xl text-primary">
                                    <RichText content={getLocalizedValue(v.term, language)} highlightColor={printPrefs.highlightColor} />
                                </p>
                                <div className="text-sm text-gray-600 leading-relaxed">
                                    <RichText content={getLocalizedValue(v.definition, language)} highlightColor={printPrefs.highlightColor} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sources */}
            {lesson.sources && lesson.sources.length > 0 && (
                <div className="mb-20 pt-10">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400">public</span>
                        Manbalar
                    </h2>
                    <ul className="space-y-3">
                        {lesson.sources.map((source: string, idx: number) => (
                            <li key={idx} className="flex gap-3 text-gray-500 text-sm italic">
                                <span>•</span>
                                <span>{source}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-20 pt-10 border-t border-gray-100 text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                IDROK AI - Zamonaviy Ta'lim Platformasi
            </div>
        </div>
    );
};

// --- TEXT TO SPEECH COMPONENT ---

const TextToSpeechBar: React.FC<{
    text: string,
    onClose: () => void
}> = ({ text, onClose }) => {
    const { t } = useCourse();
    const [isPlaying, setIsPlaying] = useState(false);
    const [rate, setRate] = useState(() => {
        const saved = storage.get('idrok-tts-rate');
        const val = saved ? parseFloat(saved) : 1;
        return isNaN(val) ? 1 : val;
    });
    const [progress, setProgress] = useState(0);
    const [selectedVoice, setSelectedVoice] = useState<TtsVoiceName>(() => {
        const saved = storage.get('idrok-tts-voice') as TtsVoiceName | null;
        return saved || 'Kore';
    });
    const defaultPrompt = t(DEFAULT_TTS_PROMPT);
    const [prompt, setPrompt] = useState(() => storage.get('idrok-tts-prompt') || defaultPrompt);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPromptEditor, setShowPromptEditor] = useState(false);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const startTimeRef = useRef(0);
    const offsetRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const lastParamsRef = useRef<{ text: string; voice: string; prompt: string } | null>(null);

    const cleanText = useMemo(() => {
        return text.replace(/[*`#$]/g, '').replace(/!\[.*?\]\(.*?\)/g, '');
    }, [text]);

    const clearRaf = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
    };

    const stopSource = () => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch { }
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
    };

    const closeContext = () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    const resetAll = () => {
        stopSource();
        closeContext();
        clearRaf();
        audioBufferRef.current = null;
        offsetRef.current = 0;
        setProgress(0);
        setIsPlaying(false);
    };

    useEffect(() => {
        resetAll();
        setError(null);
        lastParamsRef.current = null;
    }, [cleanText, selectedVoice, prompt]);

    useEffect(() => {
        storage.set('idrok-tts-rate', rate.toString());
    }, [rate]);

    useEffect(() => {
        const saved = storage.get('idrok-tts-prompt');
        if (!saved) {
            setPrompt(defaultPrompt);
        }
    }, [defaultPrompt]);

    useEffect(() => {
        storage.set('idrok-tts-voice', selectedVoice);
    }, [selectedVoice]);

    useEffect(() => {
        storage.set('idrok-tts-prompt', prompt);
    }, [prompt]);

    useEffect(() => {
        return () => resetAll();
    }, []);

    const updateProgress = () => {
        if (!audioContextRef.current || !audioBufferRef.current || !isPlaying) return;
        const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * rate;
        const total = audioBufferRef.current.duration;
        const current = Math.min(total, offsetRef.current + elapsed);
        setProgress(total > 0 ? (current / total) * 100 : 0);
        if (current >= total) {
            setIsPlaying(false);
            offsetRef.current = 0;
            setProgress(100);
            clearRaf();
            return;
        }
        rafRef.current = requestAnimationFrame(updateProgress);
    };

    const pausePlayback = () => {
        if (!isPlaying) return;
        if (audioContextRef.current && audioBufferRef.current) {
            const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * rate;
            offsetRef.current = Math.min(audioBufferRef.current.duration, offsetRef.current + elapsed);
        }
        stopSource();
        clearRaf();
        setIsPlaying(false);
    };

    const startPlayback = async () => {
        if (isLoading) return;
        setError(null);

        const needsNewAudio =
            !audioBufferRef.current ||
            !lastParamsRef.current ||
            lastParamsRef.current.text !== cleanText ||
            lastParamsRef.current.voice !== selectedVoice ||
            lastParamsRef.current.prompt !== prompt;

        if (needsNewAudio) {
            setIsLoading(true);
            stopSource();
            closeContext();
            clearRaf();
            audioBufferRef.current = null;
            offsetRef.current = 0;
            setProgress(0);
            lastParamsRef.current = { text: cleanText, voice: selectedVoice, prompt };

            const result = await OpenAIService.synthesizeSpeech(cleanText, {
                voiceName: selectedVoice,
                prompt
            });

            if ('error' in result) {
                setError(result.error);
                setIsLoading(false);
                return;
            }

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;

            const bin = window.atob(result.audioData);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const int16 = new Int16Array(bytes.buffer);
            const float32 = new Float32Array(int16.length);
            for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

            const buffer = ctx.createBuffer(1, float32.length, result.sampleRate);
            buffer.getChannelData(0).set(float32);
            audioBufferRef.current = buffer;
            setIsLoading(false);
        }

        if (!audioBufferRef.current) return;
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }

        const ctx = audioContextRef.current;
        const source = ctx.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.playbackRate.value = rate;
        source.connect(ctx.destination);
        startTimeRef.current = ctx.currentTime;
        source.onended = () => {
            if (!isPlaying) return;
            setIsPlaying(false);
            offsetRef.current = 0;
            setProgress(100);
            clearRaf();
        };
        sourceRef.current = source;
        source.start(0, offsetRef.current);
        setIsPlaying(true);
        rafRef.current = requestAnimationFrame(updateProgress);
    };

    useEffect(() => {
        if (isPlaying) {
            pausePlayback();
            startPlayback();
        }
    }, [rate]);

    const togglePlay = () => {
        if (isPlaying) {
            pausePlayback();
        } else {
            startPlayback();
        }
    };

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up w-[95%] max-w-2xl border border-white/10 ring-1 ring-white/10">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <button onClick={togglePlay} className="size-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-white/20">
                    <span className="material-symbols-outlined filled text-2xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                </button>

                <div className="flex-1 sm:hidden">
                    <div className="text-xs font-bold text-gray-400 mb-1">{t('Ovozli Yordamchi')}</div>
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full flex flex-col gap-2">
                <div className="hidden sm:flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <span>{t('Ovozli yordamchi')}</span>
                    <span>{rate}x {t('Tezlik')}</span>
                </div>
                <div className="hidden sm:block h-1.5 bg-gray-700 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value as TtsVoiceName)}
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-primary/50"
                    >
                        {TTS_VOICES.map(v => (
                            <option key={v} value={v} className="bg-gray-900 text-gray-300">
                                {v}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center bg-black/20 rounded-lg border border-white/10">
                        <button onClick={() => setRate(Math.max(0.5, rate - 0.25))} className="p-1.5 hover:text-primary"><span className="material-symbols-outlined text-sm">remove</span></button>
                        <span className="text-xs font-mono w-8 text-center">{rate}</span>
                        <button onClick={() => setRate(Math.min(3, rate + 0.25))} className="p-1.5 hover:text-primary"><span className="material-symbols-outlined text-sm">add</span></button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-400 mt-1">
                    <span>{isLoading ? t('Ovoz tayyorlanmoqda...') : error ? t('Xatolik') : t('Tayyor')}</span>
                    <button onClick={() => setShowPromptEditor(v => !v)} className="hover:text-white transition-colors">Prompt</button>
                </div>
                {error && (
                    <div className="text-[11px] text-red-300">{error}</div>
                )}
                {showPromptEditor && (
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-primary/50"
                    />
                )}
            </div>

            <button onClick={onClose} className="absolute -top-2 -right-2 sm:relative sm:top-0 sm:right-0 p-2 hover:bg-white/10 rounded-full sm:rounded-lg text-gray-400 hover:text-white transition-colors bg-gray-800 sm:bg-transparent border sm:border-none border-white/10">
                <span className="material-symbols-outlined text-lg">close</span>
            </button>
        </div>
    )
}



// --- MAIN COMPONENT ---

const CourseTopic: React.FC = () => {
    const {
        currentLesson: rawLesson,
        activeSubLessonId,
        savedLessons,
        setLesson,
        updateSectionContent,
        updateSectionVisualConfig,
        markSectionAsCompleted,
        setActiveLabTool,
        generationState,
        t,
        language,
        masteryData,
        generateMasteryPath,
        submitMasteryTask
    } = useCourse();
    const { setIsDrawerOpen, addItemToSpace, activeSpaceId } = useSpace();

    const localizeLesson = (lesson: any) => {
        if (!lesson) return null;
        return {
            ...lesson,
            topic: getLocalizedValue(lesson.topic, language),
            sections: (lesson.sections || []).map((s: any) => ({
                ...s,
                title: getLocalizedValue(s.title, language),
                content: getLocalizedValue(s.content, language),
                interactions: s.interactions?.map((i: any) => ({
                    ...i,
                    question: getLocalizedValue(i.question, language),
                    feedback: getLocalizedValue(i.feedback, language),
                    explanation: i.explanation ? getLocalizedValue(i.explanation, language) : undefined,
                    options: i.options?.map((o: any) => getLocalizedValue(o, language))
                }))
            })),
            vocabulary: (lesson.vocabulary || []).map((v: any) => ({
                term: getLocalizedValue(v.term, language),
                definition: getLocalizedValue(v.definition, language)
            })),
            recommendedLabTool: lesson.recommendedLabTool ? {
                ...lesson.recommendedLabTool,
                title: getLocalizedValue(lesson.recommendedLabTool.title, language),
                description: getLocalizedValue(lesson.recommendedLabTool.description, language)
            } : undefined
        };
    };

    const currentLesson = useMemo(() => localizeLesson(rawLesson), [rawLesson, language]);

    const activeSubLesson = useMemo(() => {
        if (!activeSubLessonId || !savedLessons) return null;
        const found = savedLessons.find(l => l.id === activeSubLessonId);
        return localizeLesson(found);
    }, [activeSubLessonId, savedLessons, language]);

    const displayedLesson = activeSubLesson || currentLesson;

    const [expandingSectionId, setExpandingSectionId] = useState<number | null>(null);
    const [simplifyingSectionId, setSimplifyingSectionId] = useState<number | null>(null);
    const [refiningSectionId, setRefiningSectionId] = useState<number | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResults, setVerificationResults] = useState<{ isValid: boolean, issues: any[], overallFeedback: string } | null>(null);
    const [interactionState, setInteractionState] = useState<{ [key: string]: { selected?: number, feedback?: string, showExplanation?: boolean } }>({});
    const [katexReady, setKatexReady] = useState(() => typeof window !== 'undefined' && Boolean((window as any).katex));

    // Scroll to top when lesson changes
    useEffect(() => {
        if (rawLesson?.id) {
            window.scrollTo(0, 0);
        }
    }, [rawLesson?.id]);

    // -- UI STATE --
    const [isVocabOpen, setIsVocabOpen] = useState(false);
    const [isPrefsOpen, setIsPrefsOpen] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [isPracticeModeOpen, setIsPracticeModeOpen] = useState(false);
    const [isMasteryOpen, setIsMasteryOpen] = useState(false);
    const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
    const [isMapAutoFullscreen, setIsMapAutoFullscreen] = useState(false);
    const [hasAutoOpenedMapOnce, setHasAutoOpenedMapOnce] = useState(false);
    const [chatInitialText, setChatInitialText] = useState<string | null>(null);

    const [prefs, setPrefs] = useState<ReadingPreferences>(() => {
        const isMobile = isMobileDevice();
        const dynamicDefaults = { ...DEFAULT_PREFS, fontSize: isMobile ? 1 : 1.4 };

        if (typeof window === 'undefined') return dynamicDefaults;
        const saved = storage.get('idrok-reading-prefs');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved prefs", e);
                return dynamicDefaults;
            }
        }
        return dynamicDefaults;
    });

    useEffect(() => {
        storage.set('idrok-reading-prefs', JSON.stringify(prefs));
    }, [prefs]);
    const [activeSection, setActiveSection] = useState(0);
    const [isToolbarVisible, setIsToolbarVisible] = useState(false);
    const [isTopNavVisible, setIsTopNavVisible] = useState(false);
    const [ttsActive, setTtsActive] = useState(false);
    const [activePracticeTask, setActivePracticeTask] = useState<MasteryTask | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const currentMastery = useMemo(() => {
        const selectedTopic = typeof displayedLesson?.topic === 'string' ? displayedLesson.topic : getLocalizedValue(displayedLesson?.topic || '', language);
        if (!displayedLesson?.id) return {
            topic: selectedTopic,
            voiceScore: 0,
            quizScore: 0,
            practiceScore: 0,
            isFullyMastered: false,
            masteryPath: undefined
        };
        return masteryData.find(m => m.lessonId === displayedLesson.id) || {
            topic: selectedTopic,
            voiceScore: 0,
            quizScore: 0,
            practiceScore: 0,
            isFullyMastered: false,
            masteryPath: undefined
        };
    }, [masteryData, displayedLesson, language]);

    // -- PERSISTENCE --
    // Load last viewed section
    useEffect(() => {
        if (currentLesson?.id) {
            const saved = storage.get(`idrok-last-section-${currentLesson.id}`);
            if (saved) {
                const idx = parseInt(saved, 10);
                if (!isNaN(idx) && idx >= 0 && idx < currentLesson.sections.length) {
                    setTimeout(() => {
                        scrollToSection(idx);
                        setActiveSection(idx);
                    }, 600);
                }
            }
        }
    }, [currentLesson?.id]);

    // Save current section
    useEffect(() => {
        if (currentLesson?.id && activeSection !== undefined) {
            storage.set(`idrok-last-section-${currentLesson.id}`, activeSection.toString());
        }
    }, [currentLesson?.id, activeSection]);

    // -- AI Context State --
    const [selectionRect, setSelectionRect] = useState<{ top: number, left: number } | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const [userQuery, setUserQuery] = useState('');
    const [contextualExplanation, setContextualExplanation] = useState<string | null>(null);
    const [isContextLoading, setIsContextLoading] = useState(false);

    // Popover ref to detect clicks inside
    const popoverRef = useRef<HTMLDivElement>(null);

    // -- Celebration & Routing --
    const confettiRef = useRef<ConfettiRef>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [isAtEndSection, setIsAtEndSection] = useState(false);
    const navigate = useNavigate();
    const titleSlideRef = useRef<HTMLDivElement>(null);
    const sourcesContainerRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const endSectionRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if ((window as any).katex) {
            if (!katexReady) setKatexReady(true);
            return;
        }
        const existingScript = document.querySelector('script[data-katex="true"]') as HTMLScriptElement | null;
        const existingLink = document.querySelector('link[data-katex="true"]') as HTMLLinkElement | null;
        const handleLoad = () => setKatexReady(true);
        if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            link.setAttribute('data-katex', 'true');
            document.head.appendChild(link);
        }
        if (existingScript) {
            existingScript.addEventListener('load', handleLoad);
            return () => existingScript.removeEventListener('load', handleLoad);
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.async = true;
        script.setAttribute('data-katex', 'true');
        script.addEventListener('load', handleLoad);
        document.head.appendChild(script);
        return () => script.removeEventListener('load', handleLoad);
    }, [katexReady]);

    // Auto-Fullscreen Map Logic
    useEffect(() => {
        if (currentLesson && currentLesson.childLessonIds && currentLesson.childLessonIds.length >= 5 && !hasAutoOpenedMapOnce) {
            setIsMapOpen(true);
            setIsMapAutoFullscreen(true);
            setHasAutoOpenedMapOnce(true);
        }
    }, [currentLesson, hasAutoOpenedMapOnce]);

    // Scroll Tracking
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Update isAtEndSection based on whether the actual end section is visible
                    if (entry.target === endSectionRef.current) {
                        setIsAtEndSection(true);
                        return;
                    }

                    // For any other section, ensure isAtEndSection is false
                    setIsAtEndSection(false);

                    if (entry.target === titleSlideRef.current) {
                        setActiveSection(0);
                        return;
                    }
                    if (entry.target === sourcesContainerRef.current) {
                        setActiveSection((displayedLesson.sections?.length || 0) + 1);
                        return;
                    }
                    const index = sectionRefs.current.findIndex(ref => ref === entry.target);
                    if (index !== -1) {
                        setActiveSection(index + 1);
                        markSectionAsCompleted(index, true);

                        if (currentLesson && index === currentLesson.sections.length - 1 && !isFinished) {
                            setIsFinished(true);
                        }
                    }
                }
            });
        }, { root: containerRef.current, threshold: 0.3 });

        if (titleSlideRef.current) observer.observe(titleSlideRef.current);
        if (sourcesContainerRef.current) observer.observe(sourcesContainerRef.current);
        if (endSectionRef.current) observer.observe(endSectionRef.current);
        sectionRefs.current.forEach(ref => ref && observer.observe(ref));
        return () => observer.disconnect();
    }, [currentLesson, displayedLesson.sections?.length, markSectionAsCompleted, isFinished]);



    // Handle Selection for Ask AI
    useEffect(() => {
        const handleSelection = (e: MouseEvent) => {
            // If clicking inside the popover, do NOT clear the selection
            if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
                return;
            }

            const selection = window.getSelection();
            if (document.activeElement?.tagName === 'INPUT' && !popoverRef.current?.contains(document.activeElement)) return;

            if (selection && selection.toString().length > 0 && containerRef.current?.contains(selection.anchorNode)) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                setSelectionRect({ top: rect.top - 60, left: rect.left + (rect.width / 2) });
                setSelectedText(selection.toString());
            } else if (!contextualExplanation && !isContextLoading) {
                setSelectionRect(null);
                setSelectedText('');
            }
        };
        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
    }, [contextualExplanation, isContextLoading]);

    // Helpers
    const scrollToSection = (index: number) => {
        if (index === 0) {
            titleSlideRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (index <= (displayedLesson.sections?.length || 0)) {
            sectionRefs.current[index - 1]?.scrollIntoView({ behavior: 'smooth' });
        } else if (index === (displayedLesson.sections?.length || 0) + 1) {
            sourcesContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDeepDive = async (index: number, section: GeneratedLessonSection) => {
        if (expandingSectionId !== null || simplifyingSectionId !== null) return;        setExpandingSectionId(index);
        try {
            const expanded = await GeminiService.expandSection(
                getLocalizedValue(currentLesson.topic, language),
                getLocalizedValue(section.title, language),
                getLocalizedValue(section.content, language)
            );
            if (expanded) {
                const updatedSections = [...displayedLesson.sections];
                updatedSections[index] = { ...section, content: expanded, isExpanded: true };
                setLesson({ ...displayedLesson, sections: updatedSections });
            }
        } catch (e) {
            console.error("Deep dive error:", e);
        } finally {
            setExpandingSectionId(null);
        }
    };


    const handleSimplify = async (index: number, section: GeneratedLessonSection) => {
        if (expandingSectionId !== null || simplifyingSectionId !== null || refiningSectionId !== null) return;        setSimplifyingSectionId(index);
        try {
            const simplified = await GeminiService.simplifySection(
                getLocalizedValue(currentLesson.topic, language),
                getLocalizedValue(section.title, language),
                getLocalizedValue(section.content, language)
            );
            if (simplified) {
                const updatedSections = [...displayedLesson.sections];
                updatedSections[index] = { ...section, content: simplified, isExpanded: true };
                setLesson({ ...displayedLesson, sections: updatedSections });
            }
        } catch (e) {
            console.error("Simplify error:", e);
        } finally {
            setSimplifyingSectionId(null);
        }
    };

    const handleRefineSection = async (index: number, section: GeneratedLessonSection) => {
        if (expandingSectionId !== null || simplifyingSectionId !== null || refiningSectionId !== null) return;
        setRefiningSectionId(index);
        try {
            const result = await GeminiService.refineSection(
                getLocalizedValue(displayedLesson.topic, language),
                displayedLesson,
                index
            );
            if (result.section) {
                const updatedSections = [...displayedLesson.sections];
                updatedSections[index] = { ...section, ...result.section };
                setLesson({ ...displayedLesson, sections: updatedSections });
            } else if (result.error) {
                alert(result.error);
            }
        } catch (e) {
            console.error("Refine section error:", e);
        } finally {
            setRefiningSectionId(null);
        }
    };

    const handleVerifyLesson = async () => {
        if (isVerifying) return;
        setIsVerifying(true);
        setVerificationResults(null);
        try {
            const result = await GeminiService.verifyFullLesson(displayedLesson);
            setVerificationResults(result);
            if (result.error) {
                alert(result.error);
            }
        } catch (e) {
            console.error("Verification error:", e);
        } finally {
            setIsVerifying(false);
        }
    };


    const handleAskIdrok = async () => {
        if (!selectedText) return;        setIsContextLoading(true);
        try {
            const explanation = await GeminiService.explainSelection(
                getLocalizedValue(currentLesson.topic, language),
                activeSection === 0 ? "" : (displayedLesson.sections[activeSection - 1]?.content || ''),
                selectedText,
                userQuery || undefined
            );
            setContextualExplanation(explanation);
        } catch (error) {
            setContextualExplanation(t("Tushuntirish yaratib bo'lmadi."));
        } finally {
            setIsContextLoading(false);
        }
    };

    const handleOpenMastery = () => {
        if (!displayedLesson?.id) return;
        const topicStr = typeof displayedLesson.topic === 'string' ? displayedLesson.topic : getLocalizedValue(displayedLesson.topic, language);
        const mastery = masteryData.find(m => m.lessonId === displayedLesson.id);
        if (!mastery || !mastery.masteryPath) {
            generateMasteryPath(displayedLesson.id, topicStr, displayedLesson.goal);
        }
        setIsMasteryOpen(true);
        setSelectedTaskId(null); // Reset selection to default (earliest uncompleted)
        setIsPracticeModeOpen(false);
        setIsVocabOpen(false);
        setIsMapOpen(false);
        setIsPrefsOpen(false);
    };


    const [isPdfLoading, setIsPdfLoading] = useState(false);

    const handleDownloadLesson = async () => {
        if (!currentLesson) return;
        setIsPdfLoading(true);
        setIsPrinting(true);

        try {
            // Wait for print view to be rendered and everything to settle (KaTeX, Images)
            await new Promise(r => setTimeout(r, 2000));

            const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
                import('jspdf'),
                import('html2canvas'),
            ]);

            if (!printRef.current) {
                throw new Error("Print container not found");
            }

            const canvas = await html2canvas(printRef.current, {
                scale: 2, // High resolution for print
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 900,
                windowWidth: 900,
                logging: false
            });

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentW = pageW - (margin * 2);

            const imgW = canvas.width;
            const imgH = canvas.height;
            const ratio = contentW / imgW;
            const finalImgH = imgH * ratio;

            let remainingH = finalImgH;
            let currentY = 0;
            let pageCount = 0;

            while (remainingH > 0) {
                if (pageCount > 0) pdf.addPage();
                pageCount++;

                const drawH = Math.min(remainingH, pageH - (margin * 2));

                // Effective height in canvas pixels for this page
                const sourceH = drawH / ratio;
                const sourceY = currentY / ratio;

                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = imgW;
                pageCanvas.height = sourceH;
                const ctx = pageCanvas.getContext('2d')!;

                // Fill white background for safety
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, imgW, sourceH);

                ctx.drawImage(canvas, 0, sourceY, imgW, sourceH, 0, 0, imgW, sourceH);

                const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.9);
                pdf.addImage(pageImgData, 'JPEG', margin, margin, contentW, drawH, undefined, 'FAST');

                // Page numbering
                pdf.setFontSize(8);
                pdf.setTextColor(180);
                pdf.text(`${pageCount}`, pageW - margin - 5, pageH - 5);

                remainingH -= drawH;
                currentY += drawH;
            }

            pdf.save(`${displayedLesson.topic.replace(/[\\/:*?"<>|]/g, '_')}_IDROK.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setIsPrinting(false);
            setIsPdfLoading(false);
        }
    };

    const handleSmartLabRouting = () => {
        if (!currentLesson) return;

        let targetTool = null;

        // 1. Try match from lesson recommendation (which is now an object)
        if (currentLesson.recommendedLabTool) {
            targetTool = currentLesson.recommendedLabTool;
        }

        // 2. Fallback: Try match by topic keywords if not already found
        if (!targetTool) {
            const topicLower = currentLesson.topic.toLowerCase();
            targetTool = LAB_TOOLS.find(t => {
                const toolTitle = getLocalizedValue(t.title, language).toLowerCase();
                return topicLower.includes(toolTitle) || t.tags.some(tag => topicLower.includes(tag.toLowerCase()));
            });
        }

        if (targetTool) {
            setActiveLabTool(targetTool);
            navigate('/lab', { state: { fromLesson: true } });
        } else {
            // Fallback to general lab page
            navigate('/lab', { state: { fromLesson: true } });
        }
    };

    if (!currentLesson) return <div className="p-10 text-center">Yuklanmoqda...</div>;

    const currentTheme = THEMES[prefs.themeMode];
    const popoverStyle = useMemo(() => {
        if (!selectionRect) return undefined;
        const padding = 12;
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
        const baseLeft = selectionRect.left;
        const popoverWidth = contextualExplanation || isContextLoading ? 320 : 240;
        if (!viewportWidth) return { top: selectionRect.top, left: baseLeft };
        const left = Math.min(viewportWidth - padding - popoverWidth / 2, Math.max(padding + popoverWidth / 2, baseLeft));
        const top = Math.max(padding, selectionRect.top);
        return { top, left };
    }, [selectionRect, contextualExplanation, isContextLoading]);

    return (
        <div
            className={`h-full relative overflow-hidden flex flex-col ${currentTheme.bg} ${currentTheme.text} transition-colors duration-500`}
            style={prefs.nightLightStrength > 0 ? { filter: `sepia(${prefs.nightLightStrength * 0.3}) saturate(${1 + prefs.nightLightStrength * 0.2})` } : undefined}
        >

            <Confetti ref={confettiRef} />

            {/* --- GLOBAL AI STATUS BAR --- */}
            <AnimatePresence>
                {(isVerifying || refiningSectionId !== null) && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-[150] h-1.5 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-primary/10 backdrop-blur-md"></div>
                        <motion.div
                            animate={{ 
                                x: ["-100%", "100%"]
                            }}
                            transition={{ 
                                repeat: Infinity, 
                                duration: 1.2,
                                ease: "easeInOut"
                            }}
                            className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                        />
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary/95 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 backdrop-blur-xl ring-1 ring-white/20">
                            <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                            {isVerifying ? t("Dars tahlil qilinmoqda...") : t("Qism yangilanmoqda...")}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- SCREEN MASK --- */}
            {prefs.screenMask && !isAtEndSection && (
                <>
                    <div className="fixed top-0 left-0 right-0 h-[30vh] bg-black/80 pointer-events-none z-40 backdrop-blur-sm"></div>
                    <div className="fixed bottom-0 left-0 right-0 h-[30vh] bg-black/80 pointer-events-none z-40 backdrop-blur-sm"></div>
                </>
            )}



            {/* --- CONTEXT AI POPOVER --- */}
            {selectionRect && (
                <div ref={popoverRef} className="fixed z-50 -translate-x-1/2" style={popoverStyle}>
                    {!contextualExplanation && !isContextLoading ? (
                        <div className="bg-gray-900 rounded-full shadow-xl p-1.5 flex items-center gap-1 animate-fade-in-up w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)]">
                            <input
                                type="text" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAskIdrok()}
                                placeholder="Idrokdan so'rang..." className="bg-transparent border-none outline-none text-sm w-full min-w-0 text-white px-2" autoFocus
                            />
                            <button onClick={handleAskIdrok} title={t("Tushuntirish olish")} className="size-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 shrink-0"><span className="material-symbols-outlined text-sm">arrow_upward</span></button>
                            <button onClick={() => {
                                setChatInitialText(`Ushbu matnni tushuntirib bering:\n"${selectedText}"`);
                                setSelectionRect(null);
                                setSelectedText('');
                            }} title={t("Chatda yordamchidan so'rash")} className="size-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 shrink-0"><span className="material-symbols-outlined text-sm">forum</span></button>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl w-[min(20rem,calc(100vw-2rem))] sm:w-80 text-sm border border-gray-200 dark:border-white/10 max-h-[400px] overflow-y-auto">
                            <div className="flex justify-between mb-2 pb-2 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-inherit">
                                <span className="font-bold">Idrok AI</span>
                                <button onClick={() => { setContextualExplanation(null); setSelectionRect(null); }}><span className="material-symbols-outlined text-sm">close</span></button>
                            </div>
                            {isContextLoading ? (
                                <div className="animate-pulse py-4 text-center text-gray-500">O'ylanmoqda...</div>
                            ) : (
                                <div className="leading-relaxed markdown-content">
                                    <MarkdownRenderer text={getLocalizedValue(contextualExplanation || '', language)} prefs={{ ...prefs, fontSize: 1 }} vocabulary={currentLesson.vocabulary} language={language} lessonInfo={{ id: currentLesson.id || '', title: getLocalizedValue(currentLesson.topic, language) }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            {/* --- FLOATING TOOLBAR --- */}
            <AnimatePresence>
                {!isAtEndSection && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed inset-y-0 right-6 z-40 flex items-center pointer-events-none"
                    >
                        <div className="flex flex-row-reverse items-center gap-2 pointer-events-auto">
                            {/* Unified Toggle Button */}
                            <motion.button
                                layout
                                style={{ transform: 'translateZ(0)' }}
                                animate={{ 
                                    height: isToolbarVisible ? 100 : 32,
                                    width: 20 
                                }}
                                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                onClick={() => setIsToolbarVisible(!isToolbarVisible)}
                                className="bg-white dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-white/10 flex items-center justify-center rounded-full transition-all shadow-lg shadow-black/5 pointer-events-auto"
                                title={isToolbarVisible ? t("Yashirish") : t("Ko'rsatish")}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <motion.span 
                                    animate={{ rotate: isToolbarVisible ? 0 : 180 }}
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    className="material-symbols-outlined text-lg leading-none"
                                >
                                    chevron_right
                                </motion.span>
                            </motion.button>


                            <AnimatePresence>
                                {isToolbarVisible && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col gap-3 items-end"
                                    >
                                        {/* Practice Mode Toggle */}
                                        <div className="relative">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                onClick={handleOpenMastery}
                                                className={`size-14 rounded-full shadow-xl border flex items-center justify-center transition-all ${isMasteryOpen ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}
                                                title={t('Imtihon topshirish')}
                                            >
                                                <span className="material-symbols-outlined text-2xl">quiz</span>
                                            </motion.button>
                                        </div>

                                        {/* Map Toggle */}
                                        <div className="relative">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setIsMapOpen(!isMapOpen);
                                                    setIsVocabOpen(false);
                                                    setIsPrefsOpen(false);
                                                    setIsPracticeModeOpen(false);
                                                    setIsMapAutoFullscreen(false);
                                                }}
                                                className={`size-14 rounded-full shadow-xl border flex items-center justify-center transition-all ${isMapOpen ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}
                                                title={t('Dars xaritasi')}
                                            >
                                                <span className="material-symbols-outlined text-2xl">hub</span>
                                            </motion.button>
                                        </div>

                                        {/* Flashcards Toggle */}
                                        <div className="relative">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setIsFlashcardsOpen(true);
                                                    setIsMapOpen(false);
                                                    setIsVocabOpen(false);
                                                    setIsPrefsOpen(false);
                                                }}
                                                className={`size-14 rounded-full shadow-xl border flex items-center justify-center transition-all ${isFlashcardsOpen ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}
                                                title={t('Flashcardlar')}
                                            >
                                                <span className="material-symbols-outlined text-2xl">style</span>
                                            </motion.button>
                                        </div>

                                        {/* Notes Spaces */}
                                        <div className="relative">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setIsDrawerOpen(true)}
                                                className={`size-14 rounded-full shadow-xl border flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10`}
                                                title={t('Notes Spaces')}
                                            >
                                                <span className="material-symbols-outlined text-2xl">bookmark</span>
                                            </motion.button>
                                        </div>

                                        {/* Vocab Toggle */}
                                        <div className="relative">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setIsVocabOpen(!isVocabOpen);
                                                    setIsMapOpen(false);
                                                    setIsPrefsOpen(false);
                                                    setIsPracticeModeOpen(false);
                                                }}
                                                className={`size-14 rounded-full shadow-xl border flex items-center justify-center transition-all ${isVocabOpen ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}
                                                title={t("Lug'at")}
                                            >
                                                <span className="material-symbols-outlined text-2xl">dictionary</span>
                                            </motion.button>


                                        </div>

                                                {/* Preferences Toggle */}
                                        <div className="relative">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setIsPrefsOpen(!isPrefsOpen);
                                                    setIsMapOpen(false);
                                                    setIsVocabOpen(false);
                                                }}
                                                className={`size-14 rounded-full shadow-xl border flex items-center justify-center transition-all ${isPrefsOpen ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}
                                                title={t("Sozlamalar")}
                                            >
                                                <span className="material-symbols-outlined text-2xl">settings</span>
                                            </motion.button>


                                        </div>

                                        {/* Download button */}
                                        <motion.button
                                            whileHover={!isPdfLoading ? { scale: 1.05 } : undefined}
                                            whileTap={!isPdfLoading ? { scale: 0.95 } : undefined}
                                            onClick={handleDownloadLesson}
                                            disabled={isPdfLoading}
                                            className={`size-14 rounded-full shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 flex items-center justify-center transition-colors ${isPdfLoading ? 'opacity-70 cursor-wait text-primary border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary'}`}
                                            title={isPdfLoading ? 'PDF tayyorlanmoqa...' : 'Darsni PDF saqla'}
                                        >
                                            {isPdfLoading
                                                ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                : <span className="material-symbols-outlined">picture_as_pdf</span>
                                            }
                                        </motion.button>

                                        {/* Verify accuracy button */}
                                        <motion.button
                                            whileHover={!isVerifying ? { scale: 1.05 } : undefined}
                                            whileTap={!isVerifying ? { scale: 0.95 } : undefined}
                                            onClick={handleVerifyLesson}
                                            disabled={isVerifying}
                                            className={`size-14 rounded-full shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 flex items-center justify-center transition-colors ${isVerifying ? 'opacity-70 cursor-wait text-primary border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary'}`}
                                            title={isVerifying ? t("Tekshirilmoqda...") : t("Darsni tekshirish")}
                                        >
                                            {isVerifying
                                                ? <span className="material-symbols-outlined animate-spin">history_edu</span>
                                                : <span className="material-symbols-outlined">fact_check</span>
                                            }
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* --- TTS BAR --- */}
            {
                ttsActive && (
                    <TextToSpeechBar
                        text={activeSection === 0 
                            ? `${getLocalizedValue(displayedLesson.topic, language)}. ${displayedLesson.level}. ${displayedLesson.goal?.replace('_', ' ')}` 
                            : activeSection === displayedLesson.sections.length + 1
                                ? `Manbalar: ${displayedLesson.sources?.join(', ') || ''}`
                                : displayedLesson.sections[activeSection - 1]?.content || ''}
                        onClose={() => setTtsActive(false)}
                    />
                )
            }

            {/* --- LESSON MINDMAP SIDEBAR --- */}
            <LessonMindmapSidebar
                lesson={currentLesson}
                isOpen={isMapOpen}
                onClose={() => { setIsMapOpen(false); setIsMapAutoFullscreen(false); }}
                onNavigateToLesson={(lessonToNavigate) => {
                    setIsMapOpen(false);
                    setIsMapAutoFullscreen(false);
                    setHasAutoOpenedMapOnce(false); // Reset so it can auto-open again if needed for the new lesson
                    setLesson(lessonToNavigate);
                    // scroll to top just in case
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (containerRef.current) {
                        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }}
                initialFullscreen={isMapAutoFullscreen}
            />

            {/* --- GLOBAL VERIFICATION OVERLAY --- */}
            <AnimatePresence>
                {isVerifying && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl bg-primary/20 dark:bg-primary/10 backdrop-blur-2xl border border-primary/30 shadow-2xl flex items-center gap-4"
                    >
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <div className="flex items-center justify-between text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                <span>{t("Dars tahlil qilinmoqda")}</span>
                                <div className="flex gap-1.5">
                                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="size-1.5 rounded-full bg-primary" />
                                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="size-1.5 rounded-full bg-primary" />
                                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="size-1.5 rounded-full bg-primary" />
                                </div>
                            </div>
                            <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ 
                                        x: ["-100%", "100%"]
                                    }}
                                    transition={{ 
                                        repeat: Infinity, 
                                        duration: 1.5,
                                        ease: "linear"
                                    }}
                                    className="h-full w-1/2 bg-primary"
                                />
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 truncate mt-1">
                                {t("AI darsdagi xatoliklarni tekshirmoqda...")}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- COMPACT LOADING ANIMATION --- */}
            <AnimatePresence>
                {generationState.isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center gap-4"
                    >
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <div className="flex items-center justify-between text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                <span>{t("Dars tayyorlanmoqda")}</span>
                                <span className="animate-pulse">{generationState.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${generationState.progress}%` }}
                                    className="h-full bg-primary"
                                />
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 truncate mt-1">
                                {generationState.step || t("Yangi bilimlar yuklanmoqda...")}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MAIN SCROLL CONTAINER --- */}
            <div ref={containerRef} className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth relative z-0 pb-32" style={{ willChange: 'transform', contain: 'layout style' }}>
                {!isAtEndSection && (
                    <div className="sticky top-1 z-30 flex justify-center w-full pointer-events-none">
                        <div className="flex flex-col items-center pointer-events-none relative">
                            {/* The Toggle Button is the anchor to prevent teleporting */}
                            <div className="flex items-center justify-center pointer-events-auto">
                                <motion.button
                                    layout
                                    style={{ transform: 'translateZ(0)' }}
                                    animate={{ 
                                        width: isTopNavVisible ? 100 : 32,
                                        height: 20 
                                    }}
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    onClick={() => setIsTopNavVisible(!isTopNavVisible)}
                                    className="bg-white/90 dark:bg-black/80 text-gray-400 border border-white/20 dark:border-white/10 flex items-center justify-center rounded-full transition-all shadow-lg shadow-black/5 backdrop-blur-xl"
                                    title={isTopNavVisible ? t("Yashirish") : t("Ko'rsatish")}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <motion.span 
                                        animate={{ rotate: isTopNavVisible ? -90 : 90 }}
                                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                        className="material-symbols-outlined text-lg leading-none"
                                    >
                                        chevron_right
                                    </motion.span>
                                </motion.button>
                            </div>

                            {/* The Nav Bar appears absolutely above the toggle */}
                            <AnimatePresence>
                                {isTopNavVisible && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 22, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full px-2 py-1.5 flex gap-1.5 shadow-lg max-w-[90vw] overflow-x-auto no-scrollbar ring-1 ring-black/5 dark:ring-white/5 pointer-events-auto"
                                    >
                                        <button
                                            onClick={() => scrollToSection(0)}
                                            className={`min-w-[2.25rem] h-8 px-2 rounded-full text-xs font-bold transition-all ${activeSection === 0
                                                ? 'bg-primary text-white shadow-md'
                                                : 'bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                }`}
                                            title={getLocalizedValue(displayedLesson.topic, language)}
                                        >
                                            0
                                        </button>
                                        {displayedLesson.sections.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => scrollToSection(i + 1)}
                                                className={`min-w-[2.25rem] h-8 px-2 rounded-full text-xs font-bold transition-all ${activeSection === i + 1
                                                    ? 'bg-primary text-white shadow-md'
                                                    : 'bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                    }`}
                                                title={getLocalizedValue(s.title, language)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        {displayedLesson.sources && displayedLesson.sources.length > 0 && (
                                            <button
                                                onClick={() => scrollToSection(displayedLesson.sections.length + 1)}
                                                className={`min-w-[2.25rem] h-8 px-2 rounded-full text-xs font-bold transition-all ${activeSection === displayedLesson.sections.length + 1
                                                    ? 'bg-primary text-white shadow-md'
                                                    : 'bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                    }`}
                                                title="Manbalar"
                                            >
                                                <span className="material-symbols-outlined text-sm">menu_book</span>
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                )}

                {/* Title Slide */}
                <div ref={titleSlideRef} className="min-h-screen snap-start flex flex-col justify-center max-w-[1200px] mx-auto px-8 py-20">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded uppercase tracking-wider">{displayedLesson.level}</span>
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded uppercase tracking-wider">{displayedLesson.goal?.replace('_', ' ')}</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight mb-8" style={{ fontFamily: prefs.fontFamily === 'dyslexic' ? '"Comic Sans MS", sans-serif' : 'inherit' }}><RichText content={getLocalizedValue(displayedLesson.topic, language)} /></h1>

                    {/* Sources Display */}
                    {displayedLesson.sources && displayedLesson.sources.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-8">
                            {displayedLesson.sources.map((source, idx) => (
                                <a key={idx} href={source.startsWith('http') ? source : `https://www.google.com/search?q=${encodeURIComponent(source)}`} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors">
                                    <span className="material-symbols-outlined text-[14px]">public</span>
                                    {source}
                                </a>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4 opacity-60 mb-12">
                        <span>{displayedLesson.sections.length} Qism</span>
                    </div>
                    <button onClick={() => scrollToSection(1)} className="self-start px-8 py-4 bg-primary text-white rounded-full font-bold animate-bounce mt-10 shadow-lg shadow-primary/30">O'qishni Boshlash</button>
                </div>

                {/* Content Sections */}
                {displayedLesson.sections.map((section, index) => {
                    const interactions = section.interactions || [];
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            key={index} ref={(el) => { sectionRefs.current[index] = el; }}
                            className="min-h-screen snap-start flex flex-col justify-center py-20 px-6 lg:px-16 w-full max-w-[1400px] mx-auto relative group/section"
                        >
                            {/* Section Loading Skeleton */}
                            <AnimatePresence>
                                {refiningSectionId === index && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-20 bg-white/60 dark:bg-[#101622]/60 backdrop-blur-sm flex flex-col p-12 gap-8 pointer-events-auto rounded-3xl m-2 border border-primary/10 shadow-inner"
                                    >
                                        {/* Skeleton Header */}
                                        <div className="w-1/3 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                                        
                                        {/* Skeleton Content */}
                                        <div className="space-y-4">
                                            <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                                            <div className="w-11/12 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse delay-75" />
                                            <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse delay-150" />
                                            <div className="w-4/5 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse delay-100" />
                                        </div>

                                        <div className="mt-auto flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                                <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">
                                                {t("AI mukammallashtirmoqda...")}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <span className="absolute top-10 right-10 text-[10rem] font-black opacity-5 select-none -z-10">{index + 1}</span>
                            <motion.h2
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl font-bold mb-10 opacity-90"
                            >
                                <RichText content={getLocalizedValue(section.title, language)} />
                            </motion.h2>

                            {section.type === 'visual' && section.visualConfig && (
                                <div className="my-8 h-[500px] md:h-[600px] w-full rounded-2xl overflow-hidden relative z-10">
                                    <AsyncVisualLoader
                                        visualConfig={section.visualConfig}
                                        topic={displayedLesson.topic}
                                        sectionContent={section.content}
                                        language={language}
                                        onUpdate={(newConfig) => updateSectionVisualConfig(index, newConfig)}
                                    />
                                </div>
                            )}

                            {section.type === 'lab' && section.labTool && (
                                <div className="my-8 flex flex-col gap-2">
                                    <div className="h-[500px] md:h-[600px] w-full border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900/50 relative z-10">
                                        <iframe
                                            src={section.labTool.embedUrl}
                                            className="w-full h-full border-0"
                                            allowFullScreen
                                            loading="lazy"
                                            title={typeof section.labTool.title === 'string' ? section.labTool.title : section.labTool.title?.uz || "Lab Tool"}
                                        />
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={() => {
                                                setActiveLabTool(section.labTool!);
                                                navigate('/lab', { state: { fromLesson: true } });
                                            }}
                                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                                            Kattaroq oynada ochish
                                        </button>
                                    </div>
                                </div>
                            )}

                            <MarkdownRenderer text={getLocalizedValue(section.content, language)} prefs={prefs} vocabulary={displayedLesson.vocabulary} language={language} lessonInfo={{ id: displayedLesson.id || '', title: getLocalizedValue(displayedLesson.topic, language) }} />

                            {/* Interaction & Deep Dive */}
                            <div className="mt-12 opacity-90">
                                {interactions.length > 0 && (
                                    <div className="bg-white/50 dark:bg-white/5 rounded-2xl p-8 border border-white/20 dark:border-white/10 backdrop-blur-sm shadow-sm">
                                        <div className="flex items-center gap-2 mb-6 font-bold text-primary"><span className="material-symbols-outlined">psychology_alt</span>Bilimni Sinash</div>
                                        <div className="space-y-6">
                                            {interactions.map((interaction, qIndex) => {
                                                const stateKey = `${index}-${qIndex}`;
                                                const state = interactionState[stateKey];
                                                return (
                                                    <div key={qIndex} className="rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                                                        <div className="text-lg font-medium mb-4">
                                                            <RichText content={getLocalizedValue(interaction.question, language)} highlightColor={prefs.highlightColor} />
                                                        </div>
                                                        {interaction.options?.map((opt, i) => {
                                                            const isSel = state?.selected === i;
                                                            const isCor = i === interaction.correctIndex;
                                                            let style = "bg-white dark:bg-white/5 border-transparent";
                                                            if (state) { style = isCor ? "bg-green-100 dark:bg-green-900/30 border-green-500" : isSel ? "bg-red-100 border-red-500" : "opacity-50"; }
                                                            return (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => !state && setInteractionState(p => ({ ...p, [stateKey]: { selected: i, feedback: i === interaction.correctIndex ? "To'g'ri!" : "Qayta urinib ko'ring." } }))}
                                                                    className={`w-full text-left p-4 rounded-xl border mb-2 transition-all ${style}`}
                                                                >
                                                                    <RichText content={getLocalizedValue(opt, language)} highlightColor={prefs.highlightColor} />
                                                                </button>
                                                            );
                                                        })}
                                                        {interactionState[stateKey]?.feedback && (
                                                            <div className="mt-4 p-4 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/5 animate-fade-in-up">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className={`font-bold ${interactionState[stateKey].feedback === "To'g'ri!" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                                                        {interactionState[stateKey].feedback}
                                                                    </div>
                                                                    {(interaction.explanation || (interaction.feedback && interaction.feedback.length > 20)) && (
                                                                        <button
                                                                            onClick={() => setInteractionState(p => ({ ...p, [stateKey]: { ...p[stateKey], showExplanation: !p[stateKey]?.showExplanation } }))}
                                                                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                                                        >
                                                                            <span className="material-symbols-outlined text-sm">help</span>
                                                                            Nimaga?
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {interactionState[stateKey]?.showExplanation && (
                                                                    <div className="text-sm opacity-80 mt-2 pt-2 border-t border-gray-200 dark:border-white/10 leading-relaxed">
                                                                        <RichText content={getLocalizedValue(interaction.explanation || interaction.feedback || t("Tushuntirish mavjud emas."), language)} highlightColor={prefs.highlightColor} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {!section.isExpanded ? (
                                    <div className="flex flex-wrap gap-3 mt-8">
                                        <button onClick={() => handleDeepDive(index, section)} disabled={expandingSectionId !== null} className="text-sm font-bold opacity-60 hover:opacity-100 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                            <span className="material-symbols-outlined">add_circle</span>
                                            {t("Chuqur o'rganish")} {expandingSectionId === index && '...'}
                                        </button>
                                        <button onClick={() => handleSimplify(index, section)} disabled={simplifyingSectionId !== null} className="text-sm font-bold opacity-60 hover:opacity-100 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                            <span className="material-symbols-outlined">child_care</span>
                                            {t("Soddaroq tushuntirish")} {simplifyingSectionId === index && '...'}
                                        </button>
                                    </div>
                                ) : <div className="mt-8 text-xs font-bold opacity-50 uppercase">{t("Qo'shimcha ma'lumot yuklandi")}</div>}
                            </div>

                            {/* Regenerate Section Button - Floating Bottom Right */}
                            <div className="absolute bottom-10 right-10 z-10 flex flex-col items-center">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleRefineSection(index, section)}
                                    disabled={refiningSectionId === index}
                                    className={`size-16 rounded-full bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30 backdrop-blur-xl border border-white/30 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-primary transition-all shadow-2xl ${refiningSectionId === index ? 'opacity-50 cursor-wait' : ''}`}
                                    title={t("Ushbu qismni qayta yaratish")}
                                >
                                    <span className={`material-symbols-outlined text-4xl ${refiningSectionId === index ? 'animate-pulse' : ''}`}>
                                        {refiningSectionId === index ? 'auto_awesome' : 'refresh'}
                                    </span>
                                </motion.button>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Sources Section */}
                {displayedLesson.sources && displayedLesson.sources.length > 0 && (
                    <div ref={sourcesContainerRef} className="min-h-screen snap-start flex flex-col justify-center py-20 px-6 lg:px-16 w-full max-w-[1400px] mx-auto">
                        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 opacity-90">
                            <span className="material-symbols-outlined text-primary">menu_book</span>
                            Manbalar
                        </h2>
                        <div className="bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 p-8 backdrop-blur-sm shadow-sm">
                            <ul className="space-y-3">
                                {displayedLesson.sources.map((source, idx) => (
                                    <li key={idx} className="flex gap-3 text-gray-600 dark:text-gray-300">
                                        <span className="text-primary font-bold">•</span>
                                        <span className="italic">{source}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* ═══════════ LESSON END: NEXT STEP ═══════════ */}
                <div ref={endSectionRef} className="min-h-[60vh] snap-start flex flex-col justify-center items-center px-6 py-16 relative overflow-hidden">

                    {/* Ambient Background Glow */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] dark:bg-primary/[0.06] blur-[120px]" />
                        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/[0.03] dark:bg-purple-400/[0.04] blur-[80px]" />
                    </div>

                    <div className="relative z-10 w-full max-w-md mx-auto">

                        {/* ── Step Progress ── */}
                        <div className="flex items-center justify-center gap-3 mb-10">
                            {/* Step 1: Done */}
                            <div className="flex items-center gap-2">
                                <div className="size-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
                                    <span className="material-symbols-outlined text-white text-sm">check</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline">{t('Material')}</span>
                            </div>
                            <div className="w-8 h-px bg-gray-300 dark:bg-white/15" />
                            {/* Step 2: Current */}
                            <div className="flex items-center gap-2">
                                <div className="size-7 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-md shadow-primary/30 ring-2 ring-primary/20 animate-pulse">
                                    <span className="material-symbols-outlined text-white text-sm">arrow_forward</span>
                                </div>
                                <span className="text-xs font-bold text-primary hidden sm:inline">{t('Imtihon')}</span>
                            </div>
                            <div className="w-8 h-px bg-gray-200 dark:bg-white/10" />
                            {/* Step 3: Locked */}
                            <div className="flex items-center gap-2">
                                <div className="size-7 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-sm">emoji_events</span>
                                </div>
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 hidden sm:inline">{t('Tugatish')}</span>
                            </div>
                        </div>

                        {/* ── Header ── */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4">
                                <span className="material-symbols-outlined text-sm">menu_book</span>
                                {displayedLesson.sections.length} {t("bo'lim o'qildi")}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">{t("Navbatdagi qadam")}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                                {t("Bilimingizni tekshirish uchun imtihon topshiring. Natijangiz darsni tugatish uchun hisobga olinadi.")}
                            </p>
                        </div>

                        {/* ── Exam CTA Card ── */}
                        <div className="relative group mb-5">
                            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity blur-[0.5px]" />
                            <button
                                onClick={handleOpenMastery}
                                className="relative flex items-center gap-5 px-7 py-6 rounded-2xl bg-white/80 dark:bg-[#1a1f2e]/80 backdrop-blur-2xl w-full group-hover:scale-[1.02] transition-all duration-500 overflow-hidden"
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                </div>

                                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25 group-hover:rotate-3 transition-transform">
                                    <span className="material-symbols-outlined text-white text-3xl">quiz</span>
                                </div>
                                <div className="flex-1 text-left relative z-10">
                                    <div className="font-black text-lg tracking-tight">{t('Imtihon topshirish')}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium italic opacity-80">{t("AI bilan bilimingizni tekshiring")}</div>
                                </div>
                                <span className="material-symbols-outlined text-primary text-2xl group-hover:translate-x-1.5 transition-transform">arrow_forward</span>
                            </button>
                        </div>

                        {/* ── Secondary Actions ── */}
                        <div className="grid grid-cols-2 gap-4 mb-10">
                            {/* User's Change: Create New Lesson */}
                            <Link
                                to="/create"
                                className="flex flex-col items-center gap-3.5 p-5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-white/40 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/20 transition-all hover:scale-[1.03] backdrop-blur-2xl group shadow-sm hover:shadow-lg"
                            >
                                <div className="size-12 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors shadow-inner">
                                    <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 text-2xl">add_circle</span>
                                </div>
                                <span className="text-sm font-black text-center leading-tight tracking-tight opacity-80 group-hover:opacity-100">{t("Yangi dars yaratish")}</span>
                            </Link>

                            {/* Colleague's Change: MindGraph */}
                            <button
                                onClick={() => { setIsMapOpen(true); setIsMapAutoFullscreen(true); }}
                                className="flex flex-col items-center gap-3.5 p-5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-white/40 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/20 transition-all hover:scale-[1.03] backdrop-blur-2xl group shadow-sm hover:shadow-lg"
                            >
                                <div className="size-12 rounded-xl bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors shadow-inner">
                                    <span className="material-symbols-outlined text-violet-500 dark:text-violet-400 text-2xl">hub</span>
                                </div>
                                <span className="text-sm font-black text-center leading-tight tracking-tight opacity-80 group-hover:opacity-100">MindGraph</span>
                            </button>
                        </div>

                        {/* ── Community Footer ── */}
                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/50 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.05] backdrop-blur-sm">
                            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-lg">forum</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold truncate">{t("Hamjamiyat va qo'llab-quvvatlash")}</div>
                            </div>
                            <a href="https://t.me/idrokchatsupport" target="_blank" rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/15 transition-colors flex-shrink-0">
                                Telegram
                            </a>
                        </div>
                    </div>
                </div>
                <div className="h-24"></div>
            </div>

            {/* --- VERIFICATION RESULTS --- */}
            <AnimatePresence>
                {verificationResults && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[125] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
                        onClick={() => setVerificationResults(null)}
                    >
                        <motion.div
                            className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-primary/5">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">fact_check</span>
                                    <h3 className="font-bold text-xl">{t("Dars tahlili")}</h3>
                                </div>
                                <button onClick={() => setVerificationResults(null)} className="size-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                            
                            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                    <p className="text-sm opacity-90 leading-relaxed italic">
                                        "{verificationResults.overallFeedback}"
                                    </p>
                                </div>

                                {verificationResults.issues.length > 0 ? (
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-sm text-red-500 uppercase tracking-wider flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">warning</span>
                                            {t("Aniqlangan kamchiliklar")}
                                        </h4>
                                        <div className="space-y-3">
                                            {verificationResults.issues.map((issue, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2">
                                                    <p className="text-sm font-bold opacity-90">{issue.description}</p>
                                                    <p className="text-xs opacity-70">
                                                        <span className="font-bold">{t("Tavsiya")}: </span>
                                                        {issue.suggestion}
                                                    </p>
                                                    {issue.sectionIndex !== undefined && (
                                                        <button 
                                                            onClick={() => {
                                                                scrollToSection(issue.sectionIndex);
                                                                setVerificationResults(null);
                                                            }}
                                                            className="text-[10px] font-black text-primary uppercase hover:underline"
                                                        >
                                                            {t("Bo'limga o'tish")} #{issue.sectionIndex + 1}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-6 text-center">
                                        <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                                            <span className="material-symbols-outlined text-4xl">verified</span>
                                        </div>
                                        <h4 className="font-bold text-lg text-green-500 mb-1">{t("Hammasi joyida!")}</h4>
                                        <p className="text-sm opacity-60">{t("Darsda jiddiy xatoliklar aniqlanmadi.")}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-black/5 dark:border-white/10 flex justify-end">
                                <button
                                    onClick={() => setVerificationResults(null)}
                                    className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
                                >
                                    {t("Tushunarli")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MASTERY SYSTEM OVERLAY --- */}
            <AnimatePresence>
                {isMasteryOpen && (
                    <motion.div
                        key={rawLesson?.id || 'no-lesson'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[110] bg-white dark:bg-[#0f172a] overflow-hidden flex flex-col"
                    >
                        {/* Ambient Background Glows - Optimized (no pulse, less blur) */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
                        </div>

                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-sm">
                            <div className="flex items-center gap-6">
                                {/* AI Badge Removed */}
                                <div>
                                    <h3 className="text-2xl font-black tracking-tighter leading-none">{t('Darsni o\'zlashtirish')}</h3>
                                    <p className="text-[10px] font-black text-gray-400 opacity-80 uppercase tracking-[0.2em] mt-2">
                                        {displayedLesson?.topic}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMasteryOpen(false)}
                                className="size-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:scale-95 transition-transform"
                            >
                                <span className="material-symbols-outlined font-bold">close</span>
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="max-w-6xl mx-auto space-y-12 py-8">

                                {/* Mastery Overview Card */}
                                <div className={`p-8 rounded-[3rem] border transition-all duration-500 relative overflow-hidden ${currentMastery?.isFullyMastered
                                    ? 'bg-gradient-to-br from-purple-600 via-indigo-700 to-purple-900 border-purple-400/30 text-white shadow-2xl shadow-purple-500/40'
                                    : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 shadow-xl'
                                    }`}>
                                    {currentMastery?.isFullyMastered && (
                                        <div className="absolute top-4 right-8 transform rotate-12">
                                            <div className="bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full border border-white/30 shadow-lg">
                                                <span className="text-xl font-black tracking-widest uppercase italic">MASTERED</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div>
                                            <h2 className={`text-3xl font-black mb-2 tracking-tight ${currentMastery?.isFullyMastered ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                {displayedLesson?.topic}
                                            </h2>
                                            <p className={`text-sm font-medium ${currentMastery?.isFullyMastered ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {currentMastery?.isFullyMastered
                                                    ? t("Ushbu mavzuni to'liq o'zlashtirdingiz. Ajoyib natija!")
                                                    : t("O'zlashtirish uchun barcha vazifalarni bajaring.")}
                                            </p>
                                        </div>

                                        <div className="flex gap-4">
                                            {[
                                                { label: 'Voice', score: (currentMastery as any)?.voiceScore || 0, icon: 'mic', color: 'bg-rose-500' },
                                                { label: 'Quiz', score: (currentMastery as any)?.quizScore || 0, icon: 'quiz', color: 'bg-cyan-500' },
                                                { label: 'Practice', score: (currentMastery as any)?.practiceScore || 0, icon: 'fitness_center', color: 'bg-amber-500' }
                                            ].map((stat, i) => (
                                                <div key={i} className="flex flex-col items-center gap-1">
                                                    <div className={`size-12 rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                                                        <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                                                    </div>
                                                    <span className={`text-xs font-black mt-1 ${currentMastery?.isFullyMastered ? 'text-white' : 'text-gray-500'}`}>{stat.score}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Mastery Path Visualization */}
                                {currentMastery?.masteryPath && (
                                    <section className="bg-white dark:bg-white/[0.04] p-10 rounded-[3.5rem] border border-gray-100 dark:border-white/10">
                                        <div className="flex items-center justify-between mb-10">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <span className="material-symbols-outlined">map</span>
                                                </div>
                                                <h4 className="font-black text-xl tracking-tight">{t('O\'zlashtirish yo\'li')}</h4>
                                            </div>
                                            <div className="px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider opacity-60">
                                                {Math.round((currentMastery?.masteryPath?.tasks?.filter(t => t.status === 'completed').length || 0) / (currentMastery?.masteryPath?.tasks?.length || 1) * 100)}% {t('Tugallandi')}
                                            </div>
                                        </div>
                                        <MasteryPath
                                            path={currentMastery?.masteryPath}
                                            onTaskClick={(t) => setSelectedTaskId(t.id)}
                                        />
                                    </section>
                                )}
                            </div>
                        </div>

                        {/* Full-screen Task View Overlay - Optimized Background */}
                        <AnimatePresence>
                            {selectedTaskId && currentMastery?.masteryPath?.tasks.find(t => t.id === selectedTaskId) && (
                                <motion.div
                                    key="mastery-task-overlay"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-[#020617]/60"
                                >
                                    <div
                                        className="absolute inset-0 z-0"
                                        onClick={() => setSelectedTaskId(null)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98, y: 5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98, y: 5 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="w-full max-w-2xl relative z-10"
                                    >
                                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden p-10">
                                            <MasteryTaskView
                                                lessonId={displayedLesson?.id || ''}
                                                topic={displayedLesson.topic}
                                                task={currentMastery?.masteryPath?.tasks.find(t => t.id === selectedTaskId)!}
                                                onClose={() => setSelectedTaskId(null)}
                                                onStartPractice={(task) => {
                                                    setSelectedTaskId(null);
                                                    setActivePracticeTask(task);
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer Celebration (Refined) */}
                        {currentMastery?.masteryPath?.isMastered && (
                            <motion.div
                                initial={{ y: 100 }}
                                animate={{ y: 0 }}
                                className="relative z-20 p-8 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white flex flex-col sm:flex-row items-center justify-between gap-8 shadow-[0_-20px_50px_rgba(245,158,11,0.2)]"
                            >
                                <div className="flex items-center gap-8">
                                    <div className="size-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl animate-bounce">
                                        <span className="material-symbols-outlined text-6xl">emoji_events</span>
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black italic tracking-tighter leading-none mb-2">{t('Ajoyib!')}</h3>
                                        <p className="font-black text-white/90 text-sm uppercase tracking-[0.3em]">{t('Dars to\'liq o\'zlashtirildi!')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMasteryOpen(false)}
                                    className="px-12 py-6 bg-white text-amber-600 rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
                                >
                                    {t('Darsga qaytish')}
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- PRACTICE MODE OVERLAY --- */}
            <AnimatePresence>
                {activePracticeTask && (
                    <AdaptivePracticeMode
                        lessonId={displayedLesson?.id || ''}
                        topic={displayedLesson.topic}
                        mode={activePracticeTask.type === 'knowledge_check' ? 'quiz' : 'practice'}
                        masteryTaskId={activePracticeTask.id}
                        isStage1={activePracticeTask.isStage1 || currentMastery?.masteryPath?.tasks[0]?.id === activePracticeTask.id}
                        onClose={() => setActivePracticeTask(null)}
                    />
                )}
            </AnimatePresence>

            {/* Hidden Print Container */}
            {isPrinting && (
                <div className="fixed top-0 left-0 -z-50 pointer-events-none opacity-0" style={{ width: '900px' }}>
                    <div ref={printRef}>
                        <PrintLessonContent lesson={currentLesson} language={language} prefs={prefs} />
                    </div>
                </div>
            )}

            {/* --- FLASHCARD OVERLAY --- */}
            <FlashcardOverlay
                isOpen={isFlashcardsOpen}
                onClose={() => setIsFlashcardsOpen(false)}
                lesson={displayedLesson}
            />
            {/* --- VOCABULARY MODAL --- */}
            <AnimatePresence>
                {isVocabOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                            onClick={() => setIsVocabOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`relative w-full max-w-xl ${currentTheme.panel} rounded-[3rem] shadow-2xl border border-primary/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh] z-10`}
                        >
                            <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        <span className="material-symbols-outlined">dictionary</span>
                                    </div>
                                    <h3 className="text-xl font-bold tracking-tight">{t("Mavzu lug'ati")}</h3>
                                </div>
                                <button onClick={() => setIsVocabOpen(false)} className="size-10 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:scale-95 transition-transform">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 gap-4">
                                    {displayedLesson.vocabulary.map((v, i) => {
                                        const handleSave = () => {
                                            if (!activeSpaceId) return;
                                            const userTitle = prompt(t("Sarlavha kiriting:"), v.term);
                                            if (userTitle === null) return;

                                            addItemToSpace(activeSpaceId, {
                                                type: 'vocabulary',
                                                content: v.definition,
                                                title: userTitle || v.term,
                                                definition: v.definition,
                                                sourceLessonId: displayedLesson?.id,
                                                sourceLessonTitle: displayedLesson?.topic
                                            });
                                        };

                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                key={i}
                                                className="bg-primary/5 dark:bg-white/5 p-6 rounded-[2rem] border border-primary/10 dark:border-white/5 hover:border-primary/30 transition-all group/vocab-item"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="font-bold text-xl" style={{ color: prefs.highlightColor }}>{v.term}</p>
                                                    {activeSpaceId && (
                                                        <button
                                                            onClick={handleSave}
                                                            className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover/vocab-item:opacity-100 transition-all hover:bg-primary hover:text-white"
                                                            title={t("Fazoga qo'shish")}
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">bookmark</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-sm opacity-80 leading-relaxed text-justify">
                                                    <RichText content={getLocalizedValue(v.definition, language)} highlightColor={prefs.highlightColor} />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- PREFERENCES MODAL --- */}
            <AnimatePresence>
                {isPrefsOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                            onClick={() => setIsPrefsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`relative w-full max-w-xl ${currentTheme.panel} rounded-[3rem] shadow-2xl border border-primary/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh] z-10`}
                        >
                            <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        <span className="material-symbols-outlined">settings</span>
                                    </div>
                                    <h3 className="text-xl font-bold tracking-tight">{t("Sozlamalar")}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            if (confirm(t("Barcha sozlamalarni tiklashni xohlaysizmi?"))) {
                                                const isMobile = isMobileDevice();
                                                setPrefs(isMobile ? { ...DEFAULT_PREFS, fontSize: 1 } : DEFAULT_PREFS);
                                            }
                                        }}
                                        className="size-10 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-primary transition-colors flex items-center justify-center"
                                        title={t("Tiklash")}
                                    >
                                        <span className="material-symbols-outlined">restart_alt</span>
                                    </button>
                                    <button onClick={() => setIsPrefsOpen(false)} className="size-10 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:scale-95 transition-transform">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar space-y-10">
                                {/* Section: Kognitiv Yuklama */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-gray-500/80 dark:text-gray-400/60 uppercase tracking-[0.15em] block">{t("Kognitiv yuklama")}</label>
                                    <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-6 border border-black/5 dark:border-white/5">
                                        <button
                                            onClick={() => setPrefs({ ...prefs, screenMask: !prefs.screenMask })}
                                            className="w-full flex items-center justify-between group/mask"
                                        >
                                            <div className="flex items-center gap-5 text-left">
                                                <div className="size-14 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm group-hover/mask:scale-105 transition-transform">
                                                    <span className="material-symbols-outlined text-3xl opacity-80">{prefs.screenMask ? 'visibility_off' : 'visibility'}</span>
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold">{t("Diqqat niqobi")}</p>
                                                    <p className="text-xs opacity-60 mt-0.5">{t("Tepani va pastni qoraytirish")}</p>
                                                </div>
                                            </div>
                                            <div className={`w-14 h-7 rounded-full relative transition-all duration-300 ${prefs.screenMask ? 'bg-primary shadow-[0_0_15px_-3px_rgba(59,130,246,0.5)]' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                                <div className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-all duration-300 ${prefs.screenMask ? 'left-8' : 'left-1'}`} />
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Section: Qog'oz va Rang */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-gray-500/80 dark:text-gray-400/60 uppercase tracking-[0.15em] block">{t("Qog'oz va Rang")}</label>
                                    <div className="grid grid-cols-5 gap-4">
                                        {Object.keys(THEMES).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setPrefs({ ...prefs, themeMode: mode as any })}
                                                className={`h-16 rounded-[2rem] border-2 transition-all duration-300 flex items-center justify-center ${prefs.themeMode === mode ? 'border-primary ring-4 ring-primary/10 scale-105' : 'border-transparent bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100 hover:scale-105'}`}
                                                style={{ backgroundColor: (THEMES as any)[mode].bg.includes('#') ? (THEMES as any)[mode].bg.split(' ')[0].replace('bg-[', '').replace(']', '') : undefined }}
                                                title={mode}
                                            >
                                                {prefs.themeMode === mode && <span className="material-symbols-outlined text-2xl text-primary">check</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Section: Ajratib ko'rsatish rangi */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-gray-500/80 dark:text-gray-400/60 uppercase tracking-[0.15em] block">{t("Ajratib ko'rsatish rangi")}</label>
                                    <div className="flex flex-wrap gap-4">
                                        {HIGHLIGHT_COLORS.map((c) => (
                                            <button
                                                key={c.value}
                                                onClick={() => setPrefs({ ...prefs, highlightColor: c.value })}
                                                className={`size-12 rounded-2xl border-2 transition-all duration-300 ${prefs.highlightColor === c.value ? 'border-white ring-4 ring-primary/20 scale-110 shadow-lg' : 'border-transparent opacity-80 hover:scale-110 hover:opacity-100'}`}
                                                style={{ backgroundColor: c.value }}
                                                title={c.label}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Section: Lug'at Uslubi */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-gray-500/80 dark:text-gray-400/60 uppercase tracking-[0.15em] block">{t("Lug'at Uslubi")}</label>
                                    <div className="bg-black/5 dark:bg-white/5 rounded-[2rem] p-1.5 flex border border-black/5 dark:border-white/5">
                                        {[
                                            { id: 'highlight', label: t('Fonli') },
                                            { id: 'underline', label: t('Chiziqli') }
                                        ].map(style => (
                                            <button
                                                key={style.id}
                                                onClick={() => setPrefs({ ...prefs, vocabStyle: style.id as any })}
                                                className={`flex-1 py-3.5 rounded-[1.5rem] text-sm font-black transition-all duration-300 ${prefs.vocabStyle === style.id ? 'bg-white dark:bg-gray-800 text-primary shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                {style.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Section: Tipografiya */}
                                <div className="space-y-8">
                                    <label className="text-[11px] font-black text-gray-500/80 dark:text-gray-400/60 uppercase tracking-[0.15em] block">{t("Tipografiya")}</label>

                                    <div className="grid grid-cols-4 gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5">
                                        {(['sans', 'serif', 'mono', 'dyslexic'] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setPrefs({ ...prefs, fontFamily: f })}
                                                className={`py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${prefs.fontFamily === f ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                {f === 'dyslexic' ? 'Dys' : f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-8 px-2">
                                        {/* Font Size Slider */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">text_fields</span>
                                                    <span>{t('Shrift o\'lchami')}</span>
                                                </div>
                                                <span className="text-primary">{Math.round((prefs.fontSize / 1.4) * 100)}%</span>
                                            </div>
                                            <input
                                                type="range" min="0.8" max="2.0" step="0.05" value={prefs.fontSize}
                                                onChange={(e) => setPrefs({ ...prefs, fontSize: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full appearance-none accent-primary transition-all hover:h-2.5 cursor-pointer"
                                            />
                                        </div>

                                        {/* Line Height Slider */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">format_line_spacing</span>
                                                    <span>{t('Qatorlar oralig\'i')}</span>
                                                </div>
                                                <span className="text-primary">{Math.round(prefs.lineHeight * 50)}%</span>
                                            </div>
                                            <input
                                                type="range" min="1.0" max="2.5" step="0.05" value={prefs.lineHeight}
                                                onChange={(e) => setPrefs({ ...prefs, lineHeight: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full appearance-none accent-primary transition-all hover:h-2.5 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Maxsus Imkoniyatlar */}
                                <div className="space-y-6">
                                    <label className="text-[11px] font-black text-gray-500/80 dark:text-gray-400/60 uppercase tracking-[0.15em] block">{t("Maxsus imkoniyatlar")}</label>

                                    <div className="space-y-6 px-1">
                                        <div className="flex items-center gap-5">
                                            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                                            </div>
                                            <button
                                                onClick={() => setPrefs({ ...prefs, bionicReading: !prefs.bionicReading })}
                                                className="flex-1 flex items-center justify-between group/bionic"
                                            >
                                                <div className="text-left">
                                                    <p className="text-lg font-bold">{t("Bionik o'qish")}</p>
                                                    <p className="text-xs opacity-60 uppercase font-black tracking-tighter">SDVG / Focus Mode</p>
                                                </div>
                                                <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${prefs.bionicReading ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                                    <div className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-all duration-300 ${prefs.bionicReading ? 'left-7' : 'left-1'}`} />
                                                </div>
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-5">
                                            <div className="size-14 rounded-2xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-orange-500 text-3xl">wb_sunny</span>
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                                                    <span>{t("Tungi rejim")}</span>
                                                    <span className="text-orange-500">{Math.round(prefs.nightLightStrength * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="1" step="0.1" value={prefs.nightLightStrength}
                                                    onChange={(e) => setPrefs({ ...prefs, nightLightStrength: parseFloat(e.target.value) })}
                                                    className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full appearance-none accent-orange-500 transition-all hover:h-2.5 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- LESSON ASSISTANT --- */}
            <LessonAssistant 
                lessonTitle={typeof displayedLesson.topic === 'string' ? displayedLesson.topic : getLocalizedValue(displayedLesson.topic, language)} 
                lessonContent={displayedLesson.sections?.map((s: any) => typeof s.content === 'string' ? s.content : getLocalizedValue(s.content, language)).join('\n') || ''} 
                initialText={chatInitialText}
                onInitialTextConsumed={() => setChatInitialText(null)}
            />
        </div>
    );
};

export default CourseTopic;
