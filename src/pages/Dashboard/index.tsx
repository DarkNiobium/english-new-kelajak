import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Button } from '@/shared/ui/Button';
import { Play, Star, Flame, Trophy } from 'lucide-react';

export const DashboardPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Ready to continue your English journey?</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-[var(--border)] shadow-sm">
          <div className="flex items-center space-x-1.5 px-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-bold text-lg">12</span>
            <span className="text-sm text-gray-500">Days</span>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center space-x-1.5 px-3">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-bold text-lg">2450</span>
            <span className="text-sm text-gray-500">XP</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card hoverable className="col-span-1 lg:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none shadow-lg">
          <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-md">
                B1 Intermediate
              </div>
              <h2 className="text-2xl font-bold">Present Perfect Fast Track</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-100">
                  <span>Progress</span>
                  <span>65%</span>
                </div>
                <ProgressBar value={65} className="bg-blue-900/30" indicatorColor="bg-white" />
              </div>
            </div>
            <Button size="lg" className="shrink-0 bg-white text-blue-600 hover:bg-gray-50 w-full sm:w-auto shadow-xl">
              <Play className="mr-2 h-5 w-5" /> Continue Learning
            </Button>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="fill-none stroke-gray-200 dark:stroke-gray-800" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" className="fill-none stroke-primary" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="50.24" strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold">4/5</span>
                <span className="text-xs text-gray-500">lessons</span>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-gray-500">Almost there! Complete 1 more lesson to reach your goal.</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-bold">Recommended for you</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card hoverable key={i} className="cursor-pointer group">
              <div className="h-32 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <span className="text-white font-medium">Vocabulary Build #{i}</span>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">Learn essential business idioms to sound more professional.</p>
                <div className="flex items-center text-xs text-primary font-medium group-hover:underline">
                  Start lesson <Play className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
