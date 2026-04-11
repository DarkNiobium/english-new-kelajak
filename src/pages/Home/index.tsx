import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';
import { motion } from 'framer-motion';

export const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="flex h-20 items-center justify-between px-6 lg:px-12 backdrop-blur-md sticky top-0 z-50 border-b border-[var(--border)]/50 bg-[var(--surface)]/80">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white font-bold text-xl shadow-lg shadow-blue-500/20">
            K
          </div>
          <span className="text-2xl font-bold tracking-tight">Kelajak</span>
        </div>
        <nav className="flex items-center space-x-6">
          <Link to="/courses" className="text-sm font-medium hover:text-[var(--primary)] transition-colors hidden sm:block">Courses</Link>
          <Link to="/about" className="text-sm font-medium hover:text-[var(--primary)] transition-colors hidden sm:block">About</Link>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild className="rounded-full shadow-lg shadow-blue-500/30">
            <Link to="/dashboard">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[100px]" />
          
          <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-6xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mx-auto max-w-4xl"
            >
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200">
                Master English the <br className="hidden md:block"/>
                <span className="text-[var(--primary)]">Smart Way</span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                The next-generation learning platform tailored for your success. Interactive lessons, real-time feedback, and a community to grow with.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button size="lg" className="rounded-full h-14 px-8 text-lg w-full sm:w-auto shadow-xl shadow-blue-500/30" asChild>
                  <Link to="/dashboard">Start Learning Free</Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg w-full sm:w-auto bg-[var(--surface)] text-gray-900 dark:text-white border-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Link to="/courses">View Courses</Link>
                </Button>
              </div>
              
              <div className="mt-16 flex items-center justify-center space-x-8 text-sm font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center"><div className="mr-2 h-2 w-2 rounded-full bg-green-500" /> Active Community</div>
                <div className="flex items-center"><div className="mr-2 h-2 w-2 rounded-full bg-blue-500" /> Bite-sized Lessons</div>
                <div className="flex items-center"><div className="mr-2 h-2 w-2 rounded-full bg-yellow-500" /> Gamified Learning</div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
};
