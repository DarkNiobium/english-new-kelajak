import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Flame, TrendingUp, Search, Crown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// Mock data for the leaderboard to make it look active
const leaderboardData = [
  { id: 1, name: 'Anasxon', points: 3450, streak: 45, level: 'C1', avatar: 'A', rank: 1, isCurrentUser: true },
  { id: 2, name: 'Eleanor Pena', points: 3210, streak: 12, level: 'B2', avatar: 'E', rank: 2 },
  { id: 3, name: 'Guy Hawkins', points: 2950, streak: 28, level: 'B2', avatar: 'G', rank: 3 },
  { id: 4, name: 'Jacob Jones', points: 2800, streak: 5, level: 'B1', avatar: 'J', rank: 4 },
  { id: 5, name: 'Dianne Russell', points: 2640, streak: 14, level: 'A2', avatar: 'D', rank: 5 },
  { id: 6, name: 'Courtney Henry', points: 2430, streak: 3, level: 'B1', avatar: 'C', rank: 6 },
  { id: 7, name: 'Kathryn Murphy', points: 2100, streak: 8, level: 'A2', avatar: 'K', rank: 7 },
  { id: 8, name: 'Arlene McCoy', points: 1950, streak: 2, level: 'A1', avatar: 'A', rank: 8 },
  { id: 9, name: 'Bessie Cooper', points: 1840, streak: 1, level: 'A1', avatar: 'B', rank: 9 },
  { id: 10, name: 'Cody Fisher', points: 1520, streak: 0, level: 'A1', avatar: 'C', rank: 10 },
];

export const LeaderboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState<'weekly' | 'all-time'>('weekly');

  const filteredData = leaderboardData.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-[calc(100vh-2rem)]">
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30">
              <Trophy className="h-7 w-7" />
            </div>
            Global Leaderboard
          </h1>
          <p className="text-lg text-slate-500 max-w-xl">
            Compete with learners around the world. Earn points by completing lessons, passing tests, and keeping your daily streak alive!
          </p>
        </div>

        {/* Timeframe Toggle */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner self-start md:self-end">
          <button 
            onClick={() => setTimeframe('weekly')}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
              timeframe === 'weekly' ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            This Week
          </button>
          <button 
            onClick={() => setTimeframe('all-time')}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
              timeframe === 'all-time' ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Top 3 Podium (Visible if no search) */}
      {!searchTerm && (
        <div className="grid grid-cols-3 gap-4 md:gap-6 mb-10 items-end px-4 md:px-12 mt-16">
          {/* 2nd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
             <div className="relative mb-4">
               <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 p-1 shadow-lg">
                 <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-2xl font-bold text-slate-600">
                   {leaderboardData[1].avatar}
                 </div>
               </div>
               <div className="absolute -bottom-3 -right-2 h-8 w-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-xs font-black text-slate-700 shadow-sm">
                 2
               </div>
             </div>
             <h3 className="font-bold text-slate-800 text-center line-clamp-1">{leaderboardData[1].name}</h3>
             <p className="text-sm font-semibold text-orange-500">{leaderboardData[1].points} pts</p>
             <div className="w-full h-32 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl mt-4 border border-b-0 border-slate-200 shadow-inner flex items-start justify-center pt-4">
                <Medal className="h-8 w-8 text-slate-400" />
             </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col items-center relative z-10"
          >
             <div className="absolute -top-10 text-amber-400 animate-bounce">
                <Crown className="h-10 w-10 fill-amber-400" />
             </div>
             <div className="relative mb-4">
               <div className="h-28 w-28 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 p-1.5 shadow-xl shadow-orange-500/30">
                 <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-4xl font-black text-orange-500">
                   {leaderboardData[0].avatar}
                 </div>
               </div>
               <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-amber-400 border-[3px] border-white flex items-center justify-center text-sm font-black text-white shadow-md">
                 1
               </div>
             </div>
             <h3 className="font-extrabold text-slate-900 text-lg mt-2 text-center line-clamp-1 flex items-center gap-2">
               {leaderboardData[0].name}
               {leaderboardData[0].isCurrentUser && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] rounded-md uppercase">You</span>}
             </h3>
             <p className="text-base font-black text-orange-500 mt-0.5">{leaderboardData[0].points} pts</p>
             <div className="w-full h-40 bg-gradient-to-t from-amber-100 to-orange-50 rounded-t-2xl mt-4 border border-b-0 border-orange-200 shadow-inner flex items-start justify-center pt-4">
                <Trophy className="h-10 w-10 text-amber-500 drop-shadow-sm" />
             </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
             <div className="relative mb-4">
               <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 p-1 shadow-lg">
                 <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-2xl font-bold text-amber-800">
                   {leaderboardData[2].avatar}
                 </div>
               </div>
               <div className="absolute -bottom-3 -left-2 h-8 w-8 rounded-full bg-amber-800 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-sm">
                 3
               </div>
             </div>
             <h3 className="font-bold text-slate-800 text-center line-clamp-1">{leaderboardData[2].name}</h3>
             <p className="text-sm font-semibold text-orange-500">{leaderboardData[2].points} pts</p>
             <div className="w-full h-24 bg-gradient-to-t from-amber-900/10 to-amber-900/5 rounded-t-2xl mt-4 border border-b-0 border-amber-900/20 shadow-inner flex items-start justify-center pt-4">
                <Medal className="h-8 w-8 text-amber-800/70" />
             </div>
          </motion.div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative z-20">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search learners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 font-medium text-sm"
            />
          </div>
        </div>

        {/* List Header */}
        <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/30 px-8">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5 md:col-span-4">Student</div>
          <div className="col-span-2 hidden md:block text-center">Level</div>
          <div className="col-span-3 text-center">Streak</div>
          <div className="col-span-3 text-right">Points</div>
        </div>

        {/* List Items */}
        <div className="divide-y divide-slate-100">
          {filteredData.map((user, index) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={user.id} 
              className={cn(
                "grid grid-cols-12 gap-4 p-4 px-8 items-center transition-colors hover:bg-slate-50",
                user.isCurrentUser ? "bg-orange-50/30" : ""
              )}
            >
              {/* Rank */}
              <div className="col-span-1 flex justify-center">
                <span className={cn(
                  "font-black text-lg",
                  user.rank === 1 ? "text-amber-500" :
                  user.rank === 2 ? "text-slate-400" :
                  user.rank === 3 ? "text-amber-700" : "text-slate-400"
                )}>
                  {user.rank}
                </span>
              </div>

              {/* User Data */}
              <div className="col-span-5 md:col-span-4 flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-white shadow-sm",
                  user.rank === 1 ? "bg-amber-500" :
                  user.rank === 2 ? "bg-slate-400" :
                  user.rank === 3 ? "bg-amber-800" : "bg-indigo-400"
                )}>
                  {user.avatar}
                </div>
                <div className="flex flex-col">
                  <span className={cn("font-bold text-sm", user.isCurrentUser ? "text-orange-700" : "text-slate-700")}>
                    {user.name}
                  </span>
                  {user.isCurrentUser && <span className="text-[10px] uppercase font-bold text-orange-500">You</span>}
                </div>
              </div>

              {/* CEFR Level */}
              <div className="col-span-2 hidden md:flex justify-center">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                  {user.level}
                </span>
              </div>

              {/* Streak */}
              <div className="col-span-3 flex justify-center items-center gap-1.5">
                <Flame className={cn("h-4 w-4", user.streak > 0 ? "text-orange-500 fill-orange-500" : "text-slate-300")} />
                <span className={cn("font-bold text-sm", user.streak > 0 ? "text-slate-700" : "text-slate-400")}>
                  {user.streak}
                </span>
              </div>

              {/* Points */}
              <div className="col-span-3 flex justify-end items-center gap-2">
                <span className="font-black text-slate-800">{user.points.toLocaleString()}</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
            </motion.div>
          ))}

          {filteredData.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-medium">
              No learners found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
