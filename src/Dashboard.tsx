import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Card';
import { ProgressBar } from '@/ProgressBar';
import { Button } from '@/Button';
import { Play, Star, Flame, Trophy, TrendingUp, Calendar, Zap, Rocket, ChevronRight, Globe, Terminal } from 'lucide-react';
import { cn } from '@/utils';
import { useUserStore } from '@/userStore';

export const DashboardPage = () => {
  const { user } = useUserStore();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 md:p-10 space-y-12 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div variants={item} className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">
            Welcome back, <span className="text-indigo-600">{user?.name || 'Learner'}</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            {user?.xp && user.xp > 0 ? "You're making great progress! Keep it up." : "Ready to start your first lesson?"}
          </p>
        </motion.div>
        
        <motion.div variants={item} className="flex gap-4">
          <div className="bg-white border border-slate-200 px-5 py-3 rounded-xl flex items-center gap-4 shadow-sm">
             <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
             </div>
             <div>
                <div className="text-lg font-bold text-slate-900 leading-none">{user?.streak || 0}</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1">Day Streak</div>
             </div>
          </div>
          <div className="bg-white border border-slate-200 px-5 py-3 rounded-xl flex items-center gap-4 shadow-sm">
             <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Star className="h-5 w-5 text-indigo-600 fill-indigo-600" />
             </div>
             <div>
                <div className="text-lg font-bold text-slate-900 leading-none">{user?.xp?.toLocaleString() || 0}</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1">Total XP</div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-8 auto-rows-[200px]">
        
        {/* Featured Course Card */}
        <Card className="md:col-span-6 lg:col-span-8 row-span-2 relative overflow-hidden border-none shadow-2xl rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700">
          <CardContent className="h-full p-10 flex flex-col justify-between text-white relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-lg bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur-md border border-white/10">
                Current Level: {user?.level || 'B1'}
              </div>
              <h2 className="text-4xl font-bold max-w-sm leading-tight">Effective Business Writing</h2>
              <p className="text-white/80 font-medium max-w-xs text-base">Master the art of professional emails and reports.</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-end justify-between gap-8 pt-8 border-t border-white/10">
              <div className="w-full md:max-w-xs space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Progress</span>
                  <span className="text-lg font-bold">{Math.floor(((user?.xp || 0) % 1000) / 10)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-500" style={{ width: `${Math.floor(((user?.xp || 0) % 1000) / 10)}%` }} />
                </div>
              </div>
              <Button asChild className="bg-white text-indigo-600 hover:bg-white/90 h-12 px-8 rounded-lg text-base font-bold flex items-center gap-3">
                <Link to="/courses">
                  <Play className="h-4 w-4 fill-indigo-600" /> Continue
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Bento */}
        <Card className="md:col-span-3 lg:col-span-4 row-span-2 border-slate-200 shadow-sm p-8 flex flex-col justify-between rounded-2xl bg-white">
           <CardHeader className="p-0">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                 <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                 </div>
                 Activity
              </CardTitle>
           </CardHeader>
           
           <div className="flex-1 flex items-end gap-3 h-32 pt-8">
              {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className={cn(
                      "w-3 rounded-full transition-all duration-500",
                      i === 3 ? "bg-indigo-600" : "bg-slate-100 group-hover/bar:bg-slate-200"
                    )} 
                  />
                  <span className="text-[8px] font-black text-slate-300 uppercase">{['m','t','w','t','f','s','s'][i]}</span>
                </div>
              ))}
           </div>

           <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center text-[11px] font-semibold text-slate-400">
              <span>Weekly Average</span>

           </div>
        </Card>

        {/* Quick Actions */}
        <Card className="md:col-span-3 lg:col-span-4 row-span-1 border-slate-200 shadow-sm p-6 flex items-center gap-5 group hover:bg-slate-50 transition-all rounded-xl bg-white">
           <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform">
              <Zap className="h-6 w-6 fill-orange-600" />
           </div>
           <div>
              <div className="text-[11px] font-semibold text-slate-400 leading-none mb-1.5">Today's Focus</div>
              <div className="text-lg font-bold text-slate-900">Compound Tenses</div>
           </div>
        </Card>



        <Card className="md:col-span-3 lg:col-span-4 row-span-1 border-slate-200 shadow-sm p-6 flex items-center gap-5 group hover:bg-slate-50 transition-all rounded-xl bg-white">
           <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-105 transition-transform">
              <Trophy className="h-6 w-6" />
           </div>
           <div>
              <div className="text-[11px] font-semibold text-slate-400 leading-none mb-1.5">Rank</div>
              <div className="text-lg font-bold text-slate-900">{user?.level || 'Junior'}</div>
           </div>
        </Card>

        {/* Recommendations */}
        <div className="md:col-span-6 lg:col-span-12 mt-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">Recommended for You</h3>

          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Fluent Conversations', desc: 'Master daily dialogue and natural expressions.', icon: Globe, type: 'Speaking' },
              { title: 'Essential Grammar', desc: 'The foundation for professional communication.', icon: Zap, type: 'Grammar' },
              { title: 'Travel Vocabulary', desc: 'Everything you need for your next adventure.', icon: Rocket, type: 'Vocabulary' },
              { title: 'Professional English', desc: 'Writing and etiquette for the modern office.', icon: Terminal, type: 'Business' }
            ].map((node, i) => (
              <Link key={i} to="/courses" className="block">
                <Card className="border-slate-200 shadow-sm p-6 space-y-4 group cursor-pointer hover:bg-slate-50 transition-all rounded-xl bg-white h-full">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center transition-all group-hover:bg-indigo-50">
                    <node.icon className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">{node.type}</div>
                    <h4 className="font-bold text-lg text-slate-900 leading-tight">{node.title}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{node.desc}</p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    View Course <ChevronRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
