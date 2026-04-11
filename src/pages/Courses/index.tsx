import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, Star, ArrowRight, PlayCircle, Zap, Shield, Crown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useNavigate } from 'react-router-dom';

const curriculum = [
  {
    level: 'A1',
    name: 'Beginner',
    description: 'Learn the absolute basics of English vocabulary and grammar.',
    color: 'from-blue-400 to-blue-600',
    icon: Star,
    topics: [
      'The Verb "to be" (am, is, are)',
      'Present Simple Tense',
      'Personal & Possessive Pronouns',
      'Countable & Uncountable Nouns',
      'Basic Prepositions (in, on, at)'
    ]
  },
  {
    level: 'A2',
    name: 'Elementary',
    description: 'Build your foundation for everyday conversations.',
    color: 'from-emerald-400 to-emerald-600',
    icon: Trophy,
    topics: [
      'Past Simple Tense',
      'Present Continuous',
      'Comparatives & Superlatives',
      'Future with "going to"',
      'Basic Modal Verbs (can, must, should)'
    ]
  },
  {
    level: 'B1',
    name: 'Intermediate',
    description: 'Start expressing more complex thoughts and ideas.',
    color: 'from-yellow-400 to-orange-500',
    icon: Zap,
    topics: [
      'Present Perfect vs Past Simple',
      'Past Continuous',
      'First & Second Conditionals',
      'Passive Voice (Present & Past)',
      '"Used to" and Past Habits'
    ]
  },
  {
    level: 'B2',
    name: 'Upper Intermediate',
    description: 'Achieve fluency and understand native speakers better.',
    color: 'from-rose-400 to-rose-600',
    icon: BookOpen,
    topics: [
      'Present Perfect Continuous',
      'Third Conditional',
      'Reported Speech',
      'Future Perfect & Continuous',
      'Modal Verbs for Deduction'
    ]
  },
  {
    level: 'C1',
    name: 'Advanced',
    description: 'Master complex grammar and academic vocabulary.',
    color: 'from-purple-500 to-indigo-600',
    icon: Shield,
    topics: [
      'Mixed Conditionals',
      'Inversion for Emphasis',
      'Advanced Passive Structures',
      'Gerunds vs Infinitives',
      'Cleft Sentences'
    ]
  },
  {
    level: 'C2',
    name: 'Proficiency',
    description: 'Reach native-level mastery and extreme nuances.',
    color: 'from-slate-700 to-slate-900',
    icon: Crown,
    topics: [
      'The Subjunctive Mood',
      'Narrative Tenses (Advanced)',
      'Advanced Idioms & Expressions',
      'Complex Clauses & Participles',
      'Discourse Markers'
    ]
  }
];

export const CoursesPage = () => {
  const [activeLevel, setActiveLevel] = useState<string | null>('A1');
  const navigate = useNavigate();

  const handleStartLesson = (level: string, topic: string) => {
    // Navigate to AI Tutor and pass state so it can automatically generate
    // But since passing state requires modifying AI Tutor slightly, we will at least route there
    // For now we just route to AI tutor. A real app might pass query params.
    navigate(`/ai-tutor?level=${level}&topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-[calc(100vh-2rem)]">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
          Kelajak Curriculum
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          A properly structured, step-by-step roadmap to master the English language.
          Select any core topic to dynamically generate a lesson via Kelajak AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Levels Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          {curriculum.map((item) => (
            <div
              key={item.level}
              onClick={() => setActiveLevel(item.level)}
              className={cn(
                "p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 flex items-center gap-4",
                activeLevel === item.level
                  ? "border-transparent bg-white shadow-xl scale-[1.02]"
                  : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
              )}
            >
              <div className={cn(
                "flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-md transition-all",
                item.color,
                activeLevel !== item.level && "opacity-70 grayscale-[30%]"
              )}>
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {item.level} <span className="text-sm font-medium text-slate-400">({item.name})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Level Details & Topics */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {curriculum.map((item) => item.level === activeLevel && (
              <motion.div
                key={item.level}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full"
              >
                <div className="flex items-start gap-6 mb-8 pb-8 border-b border-slate-100">
                  <div className={cn("h-20 w-20 rounded-3xl flex items-center justify-center text-white shadow-xl bg-gradient-to-br", item.color)}>
                    <span className="text-3xl font-black">{item.level}</span>
                  </div>
                  <div className="flex-1 mt-2">
                    <h2 className="text-3xl font-bold text-slate-900">{item.name}</h2>
                    <p className="text-slate-500 mt-2 text-lg leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-slate-400" />
                  Core Lessons ({item.level})
                </h3>

                <div className="space-y-4">
                  {item.topics.map((topic, index) => (
                    <div
                      key={index}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 font-bold text-sm border border-slate-200">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-slate-700 text-lg">{topic}</span>
                      </div>

                      <button
                        onClick={() => handleStartLesson(item.level, topic)}
                        className={cn(
                          "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5",
                          "bg-gradient-to-r", item.color
                        )}
                      >
                        <PlayCircle className="h-4 w-4" />
                        Learn with AI
                        <ArrowRight className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
