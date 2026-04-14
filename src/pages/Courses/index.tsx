import { useState } from 'react';
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
  const [activeLevel, setActiveLevel] = useState<string | null>('B1'); 
  const navigate = useNavigate();

  const handleStartLesson = (level: string, topic: string) => {
    navigate(`/ai-tutor?level=${level}&topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-screen space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black tracking-tight text-slate-900 leading-none">
          Your <span className="text-indigo-600">Courses</span>
        </h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
          Choose a level and start your journey to English fluency today. 
          Select a topic to begin a personalized lesson.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Levels Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {curriculum.map((item) => (
            <div
              key={item.level}
              onClick={() => setActiveLevel(item.level)}
              className={cn(
                "p-6 rounded-[2rem] cursor-pointer transition-all duration-500 border flex items-center gap-6",
                activeLevel === item.level
                  ? "bg-white border-indigo-200 shadow-xl shadow-indigo-100/50"
                  : "bg-white border-slate-100 hover:border-slate-300"
              )}
            >
              <div className={cn(
                "flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center transition-all",
                activeLevel === item.level ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-50 text-slate-300"
              )}>
                <item.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className={cn(
                  "text-xl font-black tracking-tight flex items-center gap-2",
                  activeLevel === item.level ? "text-indigo-600" : "text-slate-900"
                )}>
                  {item.level} <span className={cn("text-[10px] font-bold uppercase tracking-widest", activeLevel === item.level ? "text-indigo-400" : "text-slate-400")}>{item.name}</span>
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {curriculum.map((item) => item.level === activeLevel && (
              <motion.div
                key={item.level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm h-full space-y-12"
              >
                <div className="flex flex-col md:flex-row items-center gap-8 border-b border-slate-50 pb-12">
                  <div className="h-24 w-24 rounded-[2rem] flex items-center justify-center text-white bg-indigo-600 shadow-xl shadow-indigo-100">
                    <span className="text-4xl font-black">{item.level}</span>
                  </div>
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">{item.name} Level</h2>
                    <p className="text-slate-500 text-xl font-medium leading-tight max-w-xl">{item.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-3">
                        <BookOpen className="h-4 w-4" /> Available Lessons
                     </h3>
                     <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{item.topics.length} Lessons</span>
                   </div>

                  <div className="grid grid-cols-1 gap-4">
                    {item.topics.map((topic, index) => (
                      <div
                        key={index}
                        onClick={() => handleStartLesson(item.level, topic)}
                        className="group flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-6">
                           <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                             {(index + 1).toString().padStart(2, '0')}
                           </div>
                           <span className="font-bold text-xl text-slate-800 tracking-tight">{topic}</span>
                        </div>

                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all shadow-xl shadow-indigo-100">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
