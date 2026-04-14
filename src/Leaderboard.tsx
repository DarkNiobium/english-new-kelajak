import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Flame, TrendingUp, Search, Crown } from 'lucide-react';
import { cn } from '@/utils';
import { Card } from '@/Card';
import { useUserStore } from '@/userStore';

// Mock data for the leaderboard to make it look active
// Mock data for the leaderboard to make it look active
const mockData = [
  { id: 2, name: 'Sardorbek Rahmonov', points: 4820, streak: 45, level: 'C1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sardor' },
  { id: 3, name: 'Elena Petrova', points: 4150, streak: 32, level: 'B2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
  { id: 4, name: 'Jasur Ismoilov', points: 3900, streak: 12, level: 'B2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasur' },
  { id: 5, name: 'Malika Karimova', points: 3640, streak: 21, level: 'B1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Malika' },
  { id: 6, name: 'Dmitry Volkov', points: 3430, streak: 8, level: 'B1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry' },
  { id: 7, name: 'Nigora Alimova', points: 3100, streak: 15, level: 'A2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nigora' },
  { id: 8, name: 'Artur Kim', points: 2950, streak: 4, level: 'A2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Artur' },
  { id: 9, name: 'Zahro Tuychieva', points: 2840, streak: 2, level: 'A1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zahro' },
  { id: 10, name: 'Anvar Sobirov', points: 2520, streak: 0, level: 'A1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anvar' },
];

export const LeaderboardPage = () => {
  const { user: currentUser } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState<'weekly' | 'all-time'>('weekly');

  // Combine real user with mock data
  const combinedData = [
    ...mockData,
    ...(currentUser ? [{
      id: 999,
      name: currentUser.name || 'You',
      points: currentUser.xp || 0,
      streak: currentUser.streak || 0,
      level: currentUser.level || 'B1',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name || 'You'}`,
      isCurrentUser: true
    }] : [])
  ].sort((a, b) => b.points - a.points)
   .map((item, index) => ({ ...item, rank: index + 1 }));

  const filteredData = combinedData.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-screen space-y-12">
      
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600">
            <Trophy className="h-3 w-3" />
            Top Learners
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-none">
            ENK <span className="text-indigo-600">Leaderboard</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl leading-tight">
            Celebrate your progress and see how you rank against other learners in the ENK community.
          </p>
        </div>

        {/* Timeframe Toggle */}
        <div className="bg-slate-50 p-1.5 rounded-lg flex items-center border border-slate-100 self-start">
          <button 
            onClick={() => setTimeframe('weekly')}
            className={cn(
              "px-6 py-3 rounded-xl text-xs font-bold transition-all font-semibold",
              timeframe === 'weekly' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            This Week
          </button>
          <button 
            onClick={() => setTimeframe('all-time')}
            className={cn(
              "px-6 py-3 rounded-xl text-xs font-bold transition-all font-semibold",
              timeframe === 'all-time' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Podium Section */}
      {!searchTerm && (
        <div className="grid grid-cols-3 gap-6 items-end px-4 md:px-12 mt-20">
          {/* 2nd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col items-center group"
          >
             <div className="relative mb-6">
                <div className="h-24 w-24 rounded-lg bg-slate-50 p-1 shadow-sm group-hover:-translate-y-2 transition-transform duration-500 overflow-hidden">
                  <img src={combinedData[1].avatar} alt={combinedData[1].name} className="h-full w-full object-cover rounded-lg" />
                </div>
                <div className="absolute -bottom-3 -right-2 h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                  02
                </div>
             </div>
             <h3 className="font-bold text-slate-900 text-lg">{combinedData[1].name}</h3>
             <p className="text-sm font-bold text-indigo-600 mt-1">{combinedData[1].points} XP</p>
             <div className="w-full h-32 bg-slate-50/50 rounded-t-[2.5rem] mt-6 border-t border-slate-100 flex items-start justify-center pt-6">
                <Medal className="h-8 w-8 text-slate-200" />
             </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col items-center relative z-10 group"
          >
             <div className="absolute -top-12 text-indigo-600 animate-bounce">
                <Crown className="h-10 w-10 fill-indigo-600" />
             </div>
             <div className="relative mb-6">
                <div className="h-32 w-32 rounded-xl bg-indigo-600 p-1.5 shadow-lg group-hover:-translate-y-4 transition-transform duration-700 overflow-hidden">
                  <img src={combinedData[0].avatar} alt={combinedData[0].name} className="h-full w-full object-cover rounded-[2.3rem]" />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-slate-900 border-[3px] border-white flex items-center justify-center text-xs font-bold text-white shadow-xl">
                  01
                </div>
             </div>
             <h3 className="font-bold text-slate-900 text-xl mt-4 flex items-center gap-2">
                {combinedData[0].name}
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
             </h3>
             <p className="text-lg font-bold text-indigo-600 mt-1">{combinedData[0].points} XP</p>
             <div className="w-full h-44 bg-indigo-50/50 rounded-t-[3rem] mt-8 flex items-start justify-center pt-8 border-t border-indigo-100">
                <Trophy className="h-10 w-10 text-indigo-200" />
             </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col items-center group"
          >
             <div className="relative mb-6">
                <div className="h-24 w-24 rounded-lg bg-slate-50 p-1 shadow-sm group-hover:-translate-y-2 transition-transform duration-500 overflow-hidden">
                  <img src={combinedData[2].avatar} alt={combinedData[2].name} className="h-full w-full object-cover rounded-lg" />
                </div>
                <div className="absolute -bottom-3 -left-2 h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                  03
                </div>
             </div>
             <h3 className="font-bold text-slate-900 text-lg">{combinedData[2].name}</h3>
             <p className="text-sm font-bold text-indigo-600 mt-1">{combinedData[2].points} XP</p>
             <div className="w-full h-24 bg-slate-50/50 rounded-t-[2.5rem] mt-6 border-t border-slate-100 flex items-start justify-center pt-6">
                <Medal className="h-8 w-8 text-slate-200" />
             </div>
          </motion.div>
        </div>
      )}

      {/* Main List Section */}
      <Card className="rounded-lg overflow-hidden bg-white border border-slate-100 shadow-sm relative z-20">
        
        {/* Search & Status Bar */}
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search for a learner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 h-14 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-600/10 font-bold text-sm text-slate-900 placeholder:text-slate-300"
            />
          </div>
          <div className="text-[10px] font-bold text-slate-400 font-semibold flex items-center gap-4">
             <TrendingUp className="h-4 w-4 text-emerald-500" /> Leaderboard is up to date
          </div>
        </div>

        {/* List Content */}
        <div className="divide-y divide-slate-50">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-6 p-6 px-10 text-[10px] font-bold text-slate-300 font-semibold bg-slate-50/30">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-11 grid grid-cols-11 gap-4">
               <div className="col-span-4">Learner</div>
               <div className="col-span-2 text-center">Level</div>
               <div className="col-span-2 text-center">Streak</div>
               <div className="col-span-3 text-right">Total XP</div>
            </div>
          </div>

          {filteredData.map((user) => (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              key={user.id} 
              className={cn(
                "grid grid-cols-12 gap-6 p-8 px-10 items-center transition-all hover:bg-slate-50 group",
                user.isCurrentUser ? "bg-indigo-50/30 ring-1 ring-inset ring-indigo-100" : ""
              )}
            >
              <div className="col-span-1 flex justify-center">
                <span className={cn(
                  "font-bold text-xl",
                  user.rank <= 3 ? "text-slate-900" : "text-slate-200"
                )}>
                  {user.rank.toString().padStart(2, '0')}
                </span>
              </div>

              <div className="col-span-11 grid grid-cols-11 gap-4 items-center">
                <div className="col-span-4 flex items-center gap-6">
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center font-black text-white shadow-lg transition-transform group-hover:scale-110 overflow-hidden",
                    user.rank === 1 ? "bg-indigo-600" :
                    user.rank === 2 ? "bg-indigo-500" :
                    user.rank === 3 ? "bg-indigo-400" : "bg-slate-100"
                  )}>
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-lg tracking-tight">
                      {user.name}
                    </span>
                    {user.isCurrentUser && <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-widest">You</span>}
                  </div>
                </div>

                <div className="col-span-2 flex justify-center">
                  <span className="px-4 py-1.5 bg-white border border-slate-100 text-slate-900 rounded-full text-xs font-semibold shadow-sm">
                    {user.level}
                  </span>
                </div>

                <div className="col-span-2 flex justify-center items-center gap-2">
                  <Flame className={cn("h-4 w-4", user.streak > 0 ? "text-orange-500 fill-orange-500" : "text-slate-100")} />
                  <span className={cn("font-bold text-sm", user.streak > 0 ? "text-slate-900" : "text-slate-200")}>
                    {user.streak}
                  </span>
                </div>

                <div className="col-span-3 text-right">
                  <span className="font-bold text-slate-900 text-lg">
                    {user.points.toLocaleString()} <span className="text-[10px] text-slate-300 font-bold font-semibold ml-1">XP</span>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};
