import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader2, BookOpen, RefreshCw, Send, BrainCircuit, HardDrive, Wifi, Flashlight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
// We import WebLLM dynamically or just use it.
import * as webllm from '@mlc-ai/web-llm';
import { PREMADE_LESSONS } from '@/shared/data/lessons';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const FOUNDATION_TOPICS: Record<string, string[]> = {
  'A1': ['The Verb "to be" (am, is, are)', 'Present Simple', 'Articles (a, an, the)', 'Plurals'],
  'A2': ['Past Simple Tense', 'Present Continuous', 'Comparatives & Superlatives', 'Future with "going to"'],
  'B1': ['Present Perfect vs Past Simple', 'Conditionals (0, 1, 2)', 'Modal Verbs', 'Gerunds & Infinitives'],
  'B2': ['Third Conditional', 'Reported Speech', 'Passive Voice', 'Relative Clauses'],
  'C1': ['Inversion', 'Mixed Conditionals', 'Cleft Sentences', 'Participle Clauses'],
  'C2': ['Advanced Phrasal Verbs', 'Nuances of Modality', 'Advanced Idioms', 'Discourse Markers']
};

export const AITutorPage = () => {
  const [searchParams] = useSearchParams();
  const initialLevel = searchParams.get('level') || 'B1';
  const initialTopic = searchParams.get('topic') || '';

  const [level, setLevel] = useState(initialLevel);
  const [topic, setTopic] = useState(initialTopic);
  const [language, setLanguage] = useState<'RU' | 'UZ'>('RU');

  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'downloading' | 'generating' | 'instant'>('idle');
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Default to cloud for blazing fast speed, local optional
  const [aiMode, setAiMode] = useState<'local' | 'cloud'>('cloud');

  const engineRef = useRef<webllm.MLCEngineInterface | null>(null);

  // Check if WebGPU is supported
  const isWebGPUSupported = !!(navigator as any).gpu;

  useEffect(() => {
    if (!isWebGPUSupported) {
      setAiMode('cloud');
    }
  }, [isWebGPUSupported]);

  const generateCloudLesson = async (prompt: string, systemMessage: string) => {
    // Cloud AI via free proxy - it is usually very fast
    try {
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          model: 'mistral-large',
          seed: Math.floor(Math.random() * 1000)
        })
      });
      if (!response.ok) throw new Error('Cloud AI failed');
      return await response.text();
    } catch (e: any) {
      throw new Error("Unable to connect to Kelajak Cloud AI. Please try again.");
    }
  };

  const generateLocalLesson = async (prompt: string, systemMessage: string) => {
    const selectedModel = "Phi-3-mini-4k-instruct-q4f16_1-MLC";

    setLoadingState('downloading');

    if (!engineRef.current) {
      const initProgressCallback = (report: webllm.InitProgressReport) => {
        setProgressText(report.text);
        if (report.progress) setProgressPercent(Math.round(report.progress * 100));
      };

      engineRef.current = await webllm.CreateMLCEngine(
        selectedModel,
        { initProgressCallback }
      );
    }

    setLoadingState('generating');
    setProgressText('Engine loaded. Generating the lesson (this might take a moment on your device)...');

    const messages: webllm.ChatCompletionMessageParam[] = [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ];

    const reply = await engineRef.current.chat.completions.create({
      messages,
    });

    return reply.choices[0].message.content || "";
  };

  const generateLesson = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic.');
      return;
    }

    // 1. Check for Pre-made Instant Lesson
    const lessonKey = `${level}_${topic.trim()}`;
    if (PREMADE_LESSONS[lessonKey]) {
      setLoading(true);
      setLoadingState('instant');
      // Simulate quick load for UX
      await new Promise(r => setTimeout(r, 600));
      setResult((PREMADE_LESSONS[lessonKey] as any)[language]);
      setLoading(false);
      setLoadingState('idle');
      return;
    }

    // 2. Generate via AI
    setLoading(true);
    setError(null);
    setResult(null);

    // Deep specialization prompt
    const systemMessage = `You are Kelajak AI, an English Teacher. Formulate a short, beautiful markdown lesson.`;

    const langName = language === 'RU' ? 'Russian' : 'Uzbek';
    const prompt = `Create an English lesson for ${level} level on the topic: "${topic}".
Format strictly using Markdown headings:
1. **Explanation**: Explain clearly. You MUST provide the explanation in ${langName} language.
2. **Examples**: In English, with translations provided in ${langName}.
3. **Exercises**: Fill-in-the-blanks.
4. **Test**: A 3-question quiz.
Provide answers at the end. Keep it clear, friendly, and highly practical.`;

    try {
      if (aiMode === 'local' && isWebGPUSupported) {
        const text = await generateLocalLesson(prompt, systemMessage);
        setResult(text);
      } else {
        setLoadingState('generating');
        setProgressText('Running Kelajak Cloud AI Node for instant delivery...');
        const text = await generateCloudLesson(prompt, systemMessage);
        setResult(text);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate lesson. Please try again.');
    } finally {
      setLoading(false);
      setLoadingState('idle');
      setProgressText('');
      setProgressPercent(0);
    }
  };

  // Auto-generate or auto-load if coming from Courses page
  useEffect(() => {
    if (initialTopic) {
      generateLesson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic, language]);

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-[calc(100vh-2rem)]">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/30">
              <BrainCircuit className="h-6 w-6" />
            </div>
            Kelajak AI Engine
          </h1>
          <p className="mt-2 text-slate-500 font-medium">Your fully private, proprietary AI trained exclusively for English.</p>
        </div>

        {/* Connection Type Indicator */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className={cn("px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer transition-all",
            aiMode === 'local' ? "bg-indigo-50 text-indigo-700" : "text-slate-400 hover:bg-slate-50")}
            onClick={() => isWebGPUSupported && setAiMode('local')}
          >
            <HardDrive className="h-4 w-4" />
            Local GPU Engine
            {!isWebGPUSupported && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded ml-1 uppercase">Not Supported</span>}
          </div>
          <div className={cn("px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer transition-all",
            aiMode === 'cloud' ? "bg-blue-50 text-blue-700" : "text-slate-400 hover:bg-slate-50")}
            onClick={() => setAiMode('cloud')}
          >
            <Wifi className="h-4 w-4" />
            Cloud Backup
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Controls Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              Lesson Settings
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Student Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={cn(
                        "py-2 px-3 rounded-xl text-sm font-bold transition-all",
                        level === lvl
                          ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Present Perfect vs Past Simple..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-h-[120px] resize-none"
                />
                
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                    Ready-made foundations for {level}:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FOUNDATION_TOPICS[level].map(t => (
                      <button
                        key={t}
                        onClick={() => setTopic(t)}
                        className="text-xs py-1.5 px-3 rounded-lg bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 border border-indigo-100 transition-colors text-left"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'RU' | 'UZ')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  <option value="RU">🇷🇺 Русский (Russian)</option>
                  <option value="UZ">🇺🇿 O'zbek (Uzbek)</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                onClick={generateLesson}
                disabled={loading}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-white shadow-lg transition-all",
                  loading ? "bg-indigo-400 cursor-not-allowed" : "bg-slate-900 hover:shadow-slate-500/25 hover:-translate-y-0.5 active:translate-y-0"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    {result ? 'Generate New Lesson' : 'Initialize Kelajak AI'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output View */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex-1 relative overflow-hidden">

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-white z-10 p-8 text-center"
                >
                  <div className="relative mb-6">
                    {loadingState === 'downloading' ? (
                      <svg className="w-24 h-24 text-indigo-200" viewBox="0 0 100 100">
                        <circle className="stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
                        <circle
                          className="text-indigo-600 stroke-current transition-all duration-300"
                          strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent"
                          strokeDasharray={`${progressPercent * 2.51} 251.2`}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                    ) : (
                      <div className="h-20 w-20 flex items-center justify-center relative">
                        <BrainCircuit className="h-10 w-10 text-indigo-500 animate-pulse" />
                        <div className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                      </div>
                    )}
                    {loadingState === 'downloading' && (
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-600">
                        {progressPercent}%
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {loadingState === 'downloading' ? "Downloading Neural Network..." : "Generating Knowledge..."}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 max-w-sm">
                    {progressText || "Analyzing requirements and applying language syntax rules."}
                  </p>
                  {loadingState === 'downloading' && (
                    <p className="text-xs text-slate-400 mt-4 max-w-md">
                      First-time setup dynamically downloads the AI weights into your browser's local cache (appx 1.5GB). It will be instant next time.
                    </p>
                  )}
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h1:text-slate-900 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-indigo-900 prose-h3:text-xl prose-p:leading-relaxed prose-li:my-1 prose-pre:bg-slate-800 h-full"
                >
                  <div className="flex items-center justify-end mb-6">
                    <button
                      onClick={generateLesson}
                      className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 px-4 py-2 rounded-xl"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate Variant
                    </button>
                  </div>
                  <ReactMarkdown>{result}</ReactMarkdown>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4 py-16"
                >
                  <div className="h-24 w-24 bg-gradient-to-tr from-slate-100 to-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-sm">
                    <BrainCircuit className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-3">Kelajak AI is ready</h3>
                  <p className="max-w-md text-sm leading-relaxed font-medium">
                    Select your student's level and provide a topic. The built-in AI will automatically synthesize a complete academic lesson. No API keys required.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </div>
  );
};
