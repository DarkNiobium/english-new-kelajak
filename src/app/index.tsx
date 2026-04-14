import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/Home';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { DashboardPage } from '@/pages/Dashboard';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { LoginPage } from '@/pages/Auth/Login';
import { RegisterPage } from '@/pages/Auth/Register';
import { AITutorPage } from '@/pages/AITutor';
import { CoursesPage } from '@/pages/Courses';
import { LeaderboardPage } from '@/pages/Leaderboard';
import { useUiStore } from '@/shared/store/ui';

export const App = () => {
  const isDarkMode = useUiStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[var(--background)]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomePage />} />
          
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/ai-tutor" element={<AITutorPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
