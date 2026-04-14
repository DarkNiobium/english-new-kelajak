import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronRight, 
  Layers, 
  Moon, 
  Sun, 
  Type, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookMarked,
  Globe,
  Volume2
} from 'lucide-react';

import { cn } from '@/utils';
import { GeneratedLesson, LessonSection } from '@/types';
import { Button } from '@/Button';
import { Card } from '@/Card';

interface AILessonViewerProps {
  lesson: GeneratedLesson;
  onAction?: (type: 'deep_dive' | 'simplify' | 'practice', section: LessonSection) => void;
  onClose?: () => void;
}

type Theme = 'modern' | 'paper' | 'midnight';

export const AILessonViewer: React.FC<AILessonViewerProps> = ({ lesson, onAction, onClose }) => {
  const [theme, setTheme] = useState<Theme>('modern');
  const [activeSection, setActiveSection] = useState(0);

  const themes: Record<Theme, { bg: string; text: string; card: string; accent: string }> = {
    modern: {
      bg: 'bg-slate-50',
      text: 'text-slate-900',
      card: 'bg-white border-slate-200',
      accent: 'text-indigo-600'
    },
    paper: {
      bg: 'bg-[#f4f1ea]',
      text: 'text-[#2c2c2c]',
      card: 'bg-[#fffdfa] border-[#e8e4d8]',
      accent: 'text-[#8b5e3c]'
    },
    midnight: {
      bg: 'bg-[#05070a]',
      text: 'text-indigo-50',
      card: 'bg-[#0c1117] border-white/10',
      accent: 'text-indigo-400'
    }
  };

  const currentTheme = themes[theme];

  const handleSpeak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  React.useEffect(() => {
    const contentArea = document.getElementById('lesson-content-area');
    if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  return (
    <div className={cn("min-h-[100vh] w-full h-full transition-colors duration-500 overflow-hidden flex flex-col", currentTheme.bg)}>
      
      {/* Viewer Header */}
      <div className={cn("px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md", currentTheme.card)}>
        <div className="flex items-center gap-4">
          {onClose && (
            <button 
              onClick={onClose}
              className={cn("p-2 rounded-full transition-all hover:bg-slate-100 dark:hover:bg-white/10", currentTheme.text)}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <BookOpen className={cn("h-5 w-5", currentTheme.accent)} />
            <h2 className={cn("font-bold text-sm tracking-tight", currentTheme.text)}>{lesson.topic}</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
            {(['modern', 'paper', 'midnight'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  theme === t ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {t === 'modern' && <Sun className="h-3.5 w-3.5" />}
                {t === 'paper' && <Type className="h-3.5 w-3.5" />}
                {t === 'midnight' && <Moon className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* Navigation Sidebar (Desktop) */}
        <div className={cn("hidden md:block w-64 border-r p-6 space-y-4 overflow-y-auto", currentTheme.card)}>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">Content</p>
            {lesson.sections.map((section, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSection(idx)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 group",
                  activeSection === idx 
                    ? cn("shadow-sm", currentTheme.accent, theme === 'midnight' ? 'bg-white/5' : 'bg-white border') 
                    : "text-slate-500 hover:bg-slate-50/50"
                )}
              >
                <span className={cn(
                  "h-5 w-5 rounded-md flex items-center justify-center text-[10px] border transition-colors",
                  activeSection === idx ? "border-indigo-600/20 bg-indigo-50/50" : "border-slate-200 group-hover:border-slate-300"
                )}>
                  {idx + 1}
                </span>
                <span className="truncate">{section.title}</span>
              </button>
            ))}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
             <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
                <p className="text-[10px] font-bold uppercase tracking-tighter opacity-80 mb-1">Current Goal</p>
                <p className="text-sm font-black capitalize flex items-center gap-2">
                   <Sparkles className="h-4 w-4" />
                   {lesson.goal} Focus
                </p>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div id="lesson-content-area" className="flex-1 overflow-y-auto p-6 md:p-12 relative scroll-smooth">
          
          {/* Confetti Particles (Framer Motion) */}
          <AnimatePresence>
            {activeSection === lesson.sections.length - 1 && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, y: 0, x: 200 + (Math.random() * 200), rotate: 0 }}
                    animate={{ 
                      opacity: 0, 
                      y: 400, 
                      x: 200 + (Math.random() * 400),
                      rotate: 360 
                    }}
                    transition={{ duration: 2, delay: Math.random() * 1 }}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{ backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'][i % 4] }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto space-y-10"
            >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter", 
                      theme === 'midnight' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                    )}>
                      {lesson.sections[activeSection].type}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleSpeak(lesson.sections[activeSection].content)}
                    className={cn("p-2 rounded-full transition-all hover:scale-110 active:scale-95", currentTheme.accent, theme === 'midnight' ? 'bg-white/5' : 'bg-slate-100')}
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                <h1 className={cn("text-3xl md:text-4xl font-black tracking-tight leading-tight", currentTheme.text)}>
                  {lesson.sections[activeSection].title}
                </h1>

              <div className={cn(
                "prose max-w-none transition-colors duration-500",
                theme === 'modern' ? 'prose-slate' : theme === 'paper' ? 'prose-stone' : 'prose-invert prose-indigo',
                "prose-p:text-lg prose-p:leading-relaxed prose-headings:font-black prose-strong:text-indigo-600 prose-blockquote:border-indigo-600 prose-blockquote:bg-indigo-50/10 prose-blockquote:py-1 prose-blockquote:rounded-r-lg"
              )}>
                <ReactMarkdown>{lesson.sections[activeSection].content}</ReactMarkdown>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-12 border-t border-slate-100/50">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAction?.('deep_dive', lesson.sections[activeSection])}
                  className="rounded-full bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-white flex items-center gap-2 font-bold text-xs"
                >
                  <Layers className="h-3.5 w-3.5" /> Deep Dive
                </Button>
                <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => onAction?.('simplify', lesson.sections[activeSection])}
                  className="rounded-full bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-white flex items-center gap-2 font-bold text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Simplify
                </Button>
                <Button 
                  variant="outline" 
                   size="sm"
                   onClick={() => onAction?.('practice', lesson.sections[activeSection])}
                  className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 font-bold text-xs border-transparent ml-auto"
                >
                  Practice <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Section Footer/Pagination */}
              <div className="flex items-center justify-between pt-12">
                <button 
                  disabled={activeSection === 0}
                  onClick={() => setActiveSection(prev => prev - 1)}
                  className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 flex items-center gap-2 font-bold text-xs transition-colors"
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  {lesson.sections.map((_, i) => (
                    <div key={i} className={cn("h-1.5 rounded-full transition-all", 
                      activeSection === i ? "w-4 bg-indigo-600" : "w-1.5 bg-slate-200"
                    )} />
                  ))}
                </div>
                {activeSection < lesson.sections.length - 1 ? (
                   <button 
                    onClick={() => setActiveSection(prev => prev + 1)}
                    className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 font-bold text-xs transition-colors"
                  >
                    Next Section <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> Lesson Complete
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Info Sidebar (Vocabulary) */}
        <div className={cn("hidden lg:block w-80 border-l p-8 space-y-8 overflow-y-auto", currentTheme.card)}>
          <div className="space-y-6">
            <h3 className={cn("font-black text-sm flex items-center gap-2 uppercase tracking-widest", currentTheme.text)}>
              <BookMarked className={cn("h-4 w-4", currentTheme.accent)} />
              Key Vocabulary
            </h3>
            <div className="space-y-4">
              {lesson.vocabulary.map((v, i) => (
                <div key={i} className="space-y-1.5 group">
                  <p className={cn("font-bold text-sm transition-colors group-hover:text-indigo-600", currentTheme.text)}>{v.term}</p>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{v.definition}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100">
             <h3 className={cn("font-black text-sm flex items-center gap-2 uppercase tracking-widest mb-6", currentTheme.text)}>
               <Globe className={cn("h-4 w-4", currentTheme.accent)} />
               References
             </h3>
             <ul className="space-y-3">
               {lesson.sources.map((s, i) => (
                 <li key={i} className="text-[10px] text-slate-400 font-medium italic leading-relaxed">
                   {s}
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
