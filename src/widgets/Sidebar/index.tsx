import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, BookOpen, Sparkles, Trophy, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useUiStore } from '@/shared/store/ui';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Courses', href: '/courses' },
  { icon: Sparkles, label: 'AI Tutor', href: '/ai-tutor', badge: 'PRO' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 hidden h-screen flex-col bg-white border-r border-slate-100 py-10 transition-all duration-700 ease-[0.16, 1, 0.3, 1] md:flex z-50",
        isSidebarCollapsed ? "w-24 items-center" : "w-80 px-8"
      )}
    >
      <div className={cn("flex items-center mb-16 w-full", isSidebarCollapsed ? "justify-center px-0" : "justify-between px-2")}>
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed && (
            <motion.div 
              key="logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="h-9 w-11 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xl shadow-indigo-100">
                ENK
              </div>
              <span className="text-lg font-black tracking-tighter text-slate-900 leading-tight">English new<br/><span className="text-indigo-600">kelajak</span></span>
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
                'group relative flex items-center transition-all duration-500 ease-[0.16, 1, 0.3, 1]',
                isSidebarCollapsed 
                  ? 'justify-center w-14 h-14 rounded-2xl mx-auto'
                  : 'space-x-4 w-full px-5 py-4 rounded-2xl',
                isActive 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
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
                    "font-bold text-[13px] tracking-tight transition-colors duration-200",
                    isActive ? "text-white" : "text-inherit"
                  )}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={cn(
                      "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-[0.2em]",
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
        <button className={cn(
          "flex items-center w-full px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm",
          isSidebarCollapsed && "justify-center"
        )}>
          <LogOut className="h-5 w-5 shrink-0" />
          {!isSidebarCollapsed && <span className="ml-4">Log Out</span>}
        </button>
      </div>
    </aside>
  );
};
