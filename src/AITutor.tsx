import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Sparkles, BrainCircuit, Loader2, Zap } from 'lucide-react';
import { Card } from '@/Card';
import { Button } from '@/Button';
import { cn } from '@/utils';
import { parseJsonLoose } from '@/utils/aiParser';
import { AILessonViewer } from '@/components/AILessonViewer';
import { GeneratedLesson, LearningGoal, LessonSection } from '@/types';
import { useUserStore } from '@/userStore';
import { useLessonStore } from '@/lessonStore';

// Type helper for Vite env
const VITE_GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];



export const AITutorPage = () => {
  const [searchParams] = useSearchParams();
  const initialLevel = searchParams.get('level') || 'B1';
  const initialTopic = searchParams.get('topic') || '';

  const [level, setLevel] = useState(initialLevel);
  const [topic, setTopic] = useState(initialTopic);
  const [goal, setGoal] = useState<LearningGoal>('theoretical');
  const [language, setLanguage] = useState<'RU' | 'UZ'>('RU');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const { currentLesson, setCurrentLesson, updateLesson } = useLessonStore();
  const [error, setError] = useState<string | null>(null);

  // Gemini Setup
  const genAI = new GoogleGenerativeAI(VITE_GEMINI_API_KEY || '');

  const generateLesson = async (retryCount = 0) => {
    if (!topic.trim()) {
      setError('Please enter a topic or question to start.');
      return;
    }

    setLoading(true);
    setError(null);
    if (retryCount === 0) {
      setResult('');
      setCurrentLesson(null);
    }

    try {
      // Rotate models if demand is high
      const modelName = retryCount > 1 ? "gemini-3.1-lite" : "gemini-3-flash-preview";

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `You are the ENK Tutor, a friendly and expert English language teacher. 
        Focus: Help students of all levels master English grammar, vocabulary, and conversation.
        Adapt the teaching strategy based on the DIFFICULTY and GOAL.
        
        STRUCTURE RULES:
        1. NO GREETINGS. Start directly.
        2. Give 4-6 sections.
        3. Use Section Types: 'concept', 'exercise', 'summary', 'example'.
        4. Language: EXPLAIN things in ${language === 'RU' ? 'Russian' : 'Uzbek'} but keep technical terms and English exercises in English.
        5. Return ONLY a valid JSON object.
        
        {
          "topic": "string",
          "level": "string",
          "goal": "string",
          "sections": [{ "title": "string", "content": "markdown", "type": "concept|exercise|summary|example" }],
          "vocabulary": [{ "term": "string", "definition": "string" }],
          "sources": ["string"]
        }`,
      });

      const prompt = `Topic: "${topic}", Level: "${level}", Goal: "${goal}", Support Language: "${language === 'RU' ? 'Russian' : 'Uzbek'}"`;

      const res = await model.generateContent(prompt);
      const text = res.response.text();
      const parsed = parseJsonLoose<GeneratedLesson>(text);

      if (parsed && parsed.sections) {
        setCurrentLesson(parsed);
      } else {
        setResult(text);
      }

      const { addXp } = useUserStore.getState();
      addXp(50);

    } catch (err: any) {
      console.error(`Attempt ${retryCount + 1} failed:`, err);

      if ((err.message?.includes('503') || err.message?.includes('high demand')) && retryCount < 3) {
        const delay = (retryCount + 1) * 3000;
        setError(`Servers are busy. Retrying (Attempt ${retryCount + 1}/3) in ${delay / 1000}s...`);
        setTimeout(() => generateLesson(retryCount + 1), delay);
      } else {
        setError('Google servers are currently under heavy load. Please wait a minute and click "Try Again Now".');
        setLoading(false);
      }
    } finally {
      if (retryCount >= 3 || !loading) {
        setLoading(false);
      }
    }
  };

  const handleLessonAction = async (type: string, section: LessonSection) => {
    if (!currentLesson) return;

    // Logic for deep dive or simplification
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const actionPrompt = type === 'deep_dive'
        ? `Provide a deep dive explanation (rich details, expert nuances) for this specific topic: "${section.title}" in the context of "${currentLesson.topic}". Support language: ${language === 'RU' ? 'Russian' : 'Uzbek'}.`
        : `Simplify this explanation so it's very easy to understand even for a beginner: "${section.content}". Topic: "${section.title}". Support language: ${language === 'RU' ? 'Russian' : 'Uzbek'}.`;

      const res = await model.generateContent(actionPrompt);
      const text = res.response.text();

      // Update the section locally
      const updatedSections = currentLesson.sections.map(s => {
        if (s.title === section.title) {
          return { ...s, content: text };
        }
        return s;
      });
      updateLesson({ sections: updatedSections });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTopic) {
      generateLesson();
    }
  }, [initialTopic]);

  return (
    <div className={cn("p-4 md:p-8 mx-auto min-h-screen transition-all", currentLesson ? "max-w-[1800px] h-screen" : "max-w-7xl")}>
      <AnimatePresence mode="wait">
        {currentLesson ? (
          <motion.div
            key="fullscreen-lesson"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] h-screen w-screen bg-slate-50 overflow-hidden"
          >
            <AILessonViewer
              lesson={currentLesson}
              onAction={handleLessonAction}
              onClose={() => setCurrentLesson(null)}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="setup-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col xl:flex-row gap-8 items-start h-full"
          >
            {/* Left Control Panel */}
            <div className="w-full xl:w-[400px] space-y-8 animate-in slide-in-from-left duration-700">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  <Sparkles className="h-3 w-3" />
                  AI Learning Assistant
                </div>
                <h1 className="text-3xl font-bold text-slate-900">ENK Tutor</h1>
                <p className="text-slate-500 font-medium text-lg">Personalized English lessons powered by intelligence.</p>
              </div>

              <Card className="p-6 border-slate-200 shadow-sm rounded-xl bg-white space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {LEVELS.map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setLevel(lvl)}
                        className={cn(
                          "h-12 rounded-xl text-sm font-bold transition-all border",
                          level === lvl
                            ? "bg-indigo-600 text-white border-transparent shadow-md"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Topic or Question
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What would you like to learn today? (e.g., 'Past Simple' or 'Restaurant vocabulary')"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl p-4 text-sm font-medium focus:outline-none min-h-[120px] resize-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Learning Goal
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['theoretical', 'practical', 'professional'] as LearningGoal[]).map(g => (
                      <button
                        key={g}
                        onClick={() => setGoal(g)}
                        className={cn(
                          "py-2.5 rounded-xl text-[10px] font-bold transition-all border capitalize",
                          goal === g
                            ? "bg-emerald-600 text-white border-transparent shadow-md"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Support Language
                  </label>
                  <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    {(['RU', 'UZ'] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => setLanguage(l)}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all",
                          language === l ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                        )}
                      >
                        {l === 'RU' ? 'Russian' : 'Uzbek'}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => generateLesson()}
                  disabled={loading || !topic}
                  size="lg"
                  className="w-full rounded-xl h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-[0.98]"
                >
                  {loading && !currentLesson ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      Start Lesson
                    </>
                  )}
                </Button>
              </Card>
            </div>

            {/* Output Area */}
            <div className="flex-1 w-full min-h-[600px] animate-in slide-in-from-bottom-2 duration-500 delay-100">
              <Card className="h-full border-slate-200 shadow-sm rounded-2xl p-6 md:p-10 overflow-y-auto relative min-h-[700px] bg-white">
                <AnimatePresence mode="wait">
                  {error ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center p-8"
                    >
                      <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-500">
                        <Zap className="h-10 w-10" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-slate-900">Oops! We hit a snag</h3>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">{error}</p>
                      <Button onClick={() => generateLesson()} variant="outline" className="rounded-xl px-8 h-12 border-slate-200">
                        Try Again Now
                      </Button>
                    </motion.div>
                  ) : loading && !result ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                    >
                      <div className="relative mb-6">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-slate-900">Preparing Lesson...</h3>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto">Our AI is crafting a {goal} lesson specifically for your {level} level.</p>
                    </motion.div>
                  ) : result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:text-lg prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-2 prose-code:rounded p-8"
                    >
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center py-20"
                    >
                      <div className="h-24 w-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                        <BrainCircuit className="h-10 w-10 text-slate-300" />
                      </div>
                      <h2 className="text-2xl font-black mb-4 text-slate-900 tracking-tight">AI Smart Tutor</h2>
                      <p className="max-w-md text-slate-500 font-medium text-base">Select your level, define a goal, and enter a topic to begin a high-end, personalized English learning experience.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
