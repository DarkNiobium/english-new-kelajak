import { Link } from 'react-router-dom';
import { Button } from '@/Button';
import { Card, CardContent } from '@/Card';
import { motion } from 'framer-motion';
import { 
  Globe, 
  ChevronRight, CheckCircle2, Sparkles, BookOpen, TrendingUp
} from 'lucide-react';

export const HomePage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: any = {
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-600 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            E
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">ENK English</span>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Features</a>
          <a href="#about" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">About</a>
          <a href="#community" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Community</a>
        </div>

        <div className="flex items-center gap-6">
          <Button asChild variant="ghost" className="font-semibold text-slate-600">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild className="rounded-lg h-10 px-6 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-64 pb-48 px-6 bg-slate-50/50">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-indigo-600 shadow-sm">
                Next-Gen English Learning
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-[clamp(2.5rem,8vw,5rem)] font-bold text-slate-900 max-w-4xl mx-auto leading-tight">
                Unlock your Global <br/>
                <span className="text-indigo-600">Potential.</span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto">
                Discover a smarter way to master English. Designed for students and professionals 
                who want to achieve fluency with confidence and precision.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                  <Button size="lg" className="h-14 px-10 rounded-lg text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg group">
                    <Link to="/register" className="flex items-center gap-2">
                       Start Now <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="h-14 px-10 rounded-lg text-lg font-semibold border-slate-200 hover:bg-slate-50">
                    <Link to="/courses">View Courses</Link>
                  </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 pt-12">
                  <div className="flex -space-x-2">
                     {[1,2,3,4].map(i => (
                       <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100" />
                     ))}
                  </div>
                  <p className="text-sm font-bold text-slate-400">Master English with our global community</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Showcase */}
        <section id="features" className="py-40 bg-white">
           <div className="max-w-6xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                 <div className="space-y-10">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                       <Sparkles className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900 leading-tight">
                       Personalized AI<br/>
                       <span className="text-indigo-600">English Tutor.</span>
                    </h2>
                    <p className="text-lg text-slate-600 font-medium leading-relaxed">
                       Our intelligent platform adapts to your level, helping you build vocabulary, 
                       master grammar, and refine your speaking skills in real-time.
                    </p>
                    <div className="grid grid-cols-1 gap-5">
                       {[
                         'Adaptive Learning Paths',
                         'Real-time Grammar Correction',
                         'Conversational Practice Nodes'
                       ].map(text => (
                         <div key={text} className="flex items-center gap-4">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            <span className="text-lg font-bold text-slate-800">{text}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="relative">
                    <div className="absolute -inset-10 bg-indigo-50 rounded-full blur-[100px] opacity-40" />
                    <Card className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden relative bg-white">
                       <div className="h-10 bg-slate-50 flex items-center gap-1.5 px-6 border-b border-slate-200">
                          <div className="h-2 w-2 rounded-full bg-slate-300" />
                          <div className="h-2 w-2 rounded-full bg-slate-300" />
                          <div className="h-2 w-2 rounded-full bg-slate-300" />
                       </div>
                       <CardContent className="p-10 space-y-8">
                          <div className="space-y-2">
                             <div className="text-xs font-semibold text-slate-400">Example Input</div>
                             <div className="text-xl font-bold text-slate-800 leading-snug">"I want to improve my speaking for a job interview."</div>
                          </div>
                          
                          <div className="relative py-1">
                             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-100" />
                             <div className="relative mx-auto h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
                                <Sparkles className="h-5 w-5 text-white" />
                             </div>
                          </div>
 
                          <div className="p-6 rounded-xl bg-indigo-50 border border-indigo-100 space-y-3">
                             <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">AI Feedback</div>
                             <div className="text-indigo-950 font-semibold text-lg leading-tight">
                                "Excellent goal! Let's focus on <span className="text-indigo-600">Professional Etiquette</span> and <span className="text-indigo-600">Impactful Phrases</span>."
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 </div>
              </div>
           </div>
        </section>

        {/* Benefits Section */}
        <section className="py-40 bg-slate-50/30">
           <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-24 space-y-4">
                 <h2 className="text-4xl font-bold text-slate-900">Why choose <span className="text-indigo-600">ENK?</span></h2>
                 <p className="text-lg text-slate-600 font-medium">Built for modern learners in a globalized world.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 {[
                   { title: 'Interactive Lessons', desc: 'Bite-sized content that fits your schedule, from beginner to advanced.', icon: BookOpen },
                   { title: 'Cultural Context', desc: 'Go beyond grammar. Learn how to express yourself naturally in any situation.', icon: Globe },
                   { title: 'Real Growth', desc: 'Track your progress with detailed analytics and personal milestones.', icon: TrendingUp }
                 ].map((feature, i) => (
                   <Card key={i} className="p-10 border-none shadow-sm rounded-xl bg-white space-y-8 hover:shadow-xl transition-shadow duration-500">
                      <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                         <feature.icon className="h-7 w-7" />
                      </div>
                      <div className="space-y-4">
                         <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                         <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                      </div>
                   </Card>
                 ))}
              </div>
           </div>
        </section>

        {/* Call to Action */}
        <section className="py-64 px-6 text-center bg-white relative overflow-hidden">
           <div className="max-w-4xl mx-auto space-y-12 relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight text-slate-900">
                 Ready to speak <br/>
                 <span className="text-indigo-600">confidently?</span>
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                 <Button size="lg" className="h-18 px-14 rounded-full text-xl font-bold bg-indigo-600 text-white shadow-2xl shadow-indigo-100 hover:bg-indigo-700 w-full sm:w-auto">
                    <Link to="/register">Create Your Account</Link>
                 </Button>
              </div>
           </div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-[120px] opacity-30 -z-0" />
        </section>
      </main>

      <footer className="py-20 border-t border-slate-100 bg-white">
         <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="h-6 w-8 rounded bg-indigo-600 flex items-center justify-center text-white font-black text-[10px]">ENK</div>
               <span className="text-sm font-bold text-slate-800 tracking-tight">ENK English</span>
            </div>
            <div className="flex flex-col md:items-end gap-2">
                <p className="text-xs font-bold text-slate-400">Mastering English, naturally.</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2026 ENK English. All rights reserved.</p>
            </div>
         </div>
      </footer>
    </div>
  );
};
