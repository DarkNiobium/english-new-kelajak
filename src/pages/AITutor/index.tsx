import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader2, BrainCircuit, Terminal, Zap, Globe, Cpu, Star, Trophy } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PREMADE_LESSONS } from '@/shared/data/lessons';

// Type helper for Vite env
const VITE_GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const FOUNDATION_TOPICS: Record<string, string[]> = {
  'A1': ['Essential Verbs', 'Sentence Structure', 'Identity & Introductions', 'Numbers & Time'],
  'A2': ['Storytelling Basics', 'Daily Routines', 'Travel Vocabulary', 'Asking for Directions'],
  'B1': ['Business Fundamentals', 'Opinion & Debate', 'Workplace Etiquette', 'Technical English'],
  'B2': ['Advanced Negotiations', 'Abstract Concepts', 'Cultural Nuances', 'Complex Arguments'],
  'C1': ['Academic Writing', 'Public Speaking', 'Systemic Thinking', 'Philosophical Discourse'],
  'C2': ['Native Nuances', 'Creative Mastery', 'Professional Diplomacy', 'Lexical Precision']
};

export const AITutorPage = () => {
  const [searchParams] = useSearchParams();
  const initialLevel = searchParams.get('level') || 'B1';
  const initialTopic = searchParams.get('topic') || '';

  const [level, setLevel] = useState(initialLevel);
  const [topic, setTopic] = useState(initialTopic);
  const [language, setLanguage] = useState<'RU' | 'UZ'>('RU');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Gemini Setup
  const genAI = new GoogleGenerativeAI(VITE_GEMINI_API_KEY || '');
  
  const generateLesson = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic or question to start.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult('');

    // Check for Pre-made Instant Lesson
    const lessonKey = `${level}_${topic.trim()}`;
    if (PREMADE_LESSONS[lessonKey]) {
      await new Promise(r => setTimeout(r, 400));
      setResult((PREMADE_LESSONS[lessonKey] as any)[language]);
      setLoading(false);
      return;
    }

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction: `You are the ENK Tutor, a friendly and expert English language teacher. 
        Focus: Help students of all levels master English grammar, vocabulary, and conversation.
        Tone: Supportive, educational, and clear.
        STRUCTURE:
        - [LESSON] - Clear explanation in English.
        - [CONTEXT] - Helpful explanation in ${language === 'RU' ? 'Russian' : 'Uzbek'}.
        - [PRACTICE] - 2 useful examples + translations.
        - [EXERCISE] - 2 fill-in-the-blank questions and 1 short speaking prompt.
        ANSWERS: At the bottom.`,
      });

      const prompt = `level: "${level}", topic: "${topic}", language: "${language}"`;

      const result = await model.generateContentStream(prompt);
      
      let fullText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        setResult(fullText);
      }

      const { addXp } = useUserStore.getState();
      addXp(50);

    } catch (err: any) {
      console.error(err);
      setError('Connection issue. Please try again.');
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
    <div className="p-4 md:p-12 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col xl:flex-row gap-12 items-start">
        
        {/* Left Control Panel */}
        <div className="w-full xl:w-[400px] space-y-8 animate-in slide-in-from-left duration-700">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              AI Learning Assistant
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">ENK Tutor</h1>
            <p className="text-slate-500 font-medium text-lg leading-snug">Personalized English lessons powered by intelligence.</p>
          </div>

          <Card className="p-8 border-slate-100 shadow-sm rounded-[2.5rem] bg-white space-y-8">
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
                        ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-100"
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
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
                className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-600 rounded-2xl p-5 text-sm font-medium focus:outline-none min-h-[140px] resize-none transition-all placeholder:text-slate-400"
              />
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
              onClick={generateLesson}
              disabled={loading || !topic}
              size="lg"
              className="w-full rounded-2xl h-16 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-3" />
                  Start Lesson
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Output Area */}
        <div className="flex-1 w-full min-h-[600px] animate-in slide-in-from-bottom-4 duration-1000 delay-200">
          <Card className="h-full border-slate-100 shadow-sm rounded-[3rem] p-8 md:p-12 overflow-y-auto relative min-h-[700px] bg-white">
            <AnimatePresence mode="wait">
              {loading && !result ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                >
                  <div className="relative mb-8">
                    <div className="h-24 w-24 rounded-full border-4 border-slate-50 border-t-indigo-600 animate-spin" />
                    <Sparkles className="h-10 w-10 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="text-2xl font-black mb-2 text-slate-900 tracking-tight">PREPARING LESSON...</h3>
                  <p className="text-slate-400 font-medium max-w-sm mx-auto">Our AI is crafting a personalized lesson just for you.</p>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h1:text-4xl prose-p:text-slate-600 prose-p:text-lg prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-2 prose-code:rounded"
                >
                  <ReactMarkdown>{result}</ReactMarkdown>
                  
                  {loading && (
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mt-12 animate-pulse">
                      <div className="h-2 w-2 rounded-full bg-indigo-600" />
                      Tutor is writing...
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-20"
                >
                  <div className="h-32 w-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-8 border border-slate-100">
                    <Sparkles className="h-16 w-16 text-slate-200" />
                  </div>
                  <h2 className="text-4xl font-black mb-4 tracking-tight text-slate-900">Your AI Tutor</h2>
                  <p className="max-w-md text-slate-400 font-medium text-lg">Choose a topic and level on the left to start your personalized English lesson.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

      </div>
    </div>
  );
};
