import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, BookOpen, Sparkles, Trophy, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/utils';
import { useUiStore } from '@/uiStore';
import { useUserStore } from '@/userStore';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Courses', href: '/courses' },
  { icon: Sparkles, label: 'Create Lesson', href: '/ai-tutor', },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();
  const logout = useUserStore(state => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 hidden h-screen flex-col bg-white border-r border-slate-200 py-8 transition-all duration-300 md:flex z-50",
        isSidebarCollapsed ? "w-20 items-center" : "w-64 px-4"
      )}
    >
      <div className={cn("flex items-center mb-16 w-full", isSidebarCollapsed ? "justify-center px-0" : "justify-between px-2")}>
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed && (
            <motion.div
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-2"
            >
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                E
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">ENK English</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleSidebar}
          className="h-10 w-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-3 w-full">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                'group relative flex items-center transition-all duration-200',
                isSidebarCollapsed
                  ? 'justify-center w-12 h-12 rounded-lg mx-auto'
                  : 'space-x-3 w-full px-4 py-3 rounded-lg',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 transition-all duration-300",
                  isSidebarCollapsed ? "h-6 w-6" : "h-5 w-5",
                  isActive ? "text-white" : "text-slate-300 group-hover:text-slate-900"
                )}
              />

              {!isSidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span className={cn(
                    "font-medium text-sm transition-colors duration-200",
                    isActive ? "text-white" : "text-inherit"
                  )}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      isActive ? "bg-white/20 text-white" : "bg-indigo-600 text-white"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 border-t border-slate-100 space-y-4">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center w-full px-4 py-3 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium text-sm",
            isSidebarCollapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isSidebarCollapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
