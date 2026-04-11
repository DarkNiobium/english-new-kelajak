import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, LayoutGrid, BookOpen, PlusCircle, Trophy
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useUiStore } from '@/shared/store/ui';

const navItems = [
  { icon: LayoutGrid, label: 'Boshqaruv', href: '/dashboard' },
  { icon: BookOpen, label: 'Dars', href: '/courses' },
  { icon: PlusCircle, label: 'Yangi Dars', href: '/ai-tutor' },
  { icon: Trophy, label: 'Musobaqalar', href: '/leaderboard' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 hidden h-screen flex-col bg-white border-r border-slate-100 py-6 text-slate-500 transition-all duration-300 md:flex z-50",
        isSidebarCollapsed ? "w-[88px] items-center" : "w-[260px] px-4"
      )}
    >
      <div className={cn("flex items-center mb-10 w-full", isSidebarCollapsed ? "justify-center flex-col gap-6" : "justify-between px-3")}>
        {!isSidebarCollapsed && (
          <span className="text-3xl font-black tracking-tighter text-slate-900">ENK</span>
        )}
        
        <button 
          onClick={toggleSidebar} 
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <nav className={cn("flex-1 space-y-2", isSidebarCollapsed ? "w-full flex flex-col items-center" : "w-full")}>
        {navItems.map((item) => {
          // Because some are "#", only match active for real routes
          const isActive = item.href !== '#' && location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              to={item.href}
              title={isSidebarCollapsed ? item.label : undefined}
              className={cn(
                'group relative flex items-center transition-all duration-300',
                isSidebarCollapsed 
                  ? 'justify-center w-14 h-14 rounded-2xl'
                  : 'space-x-4 w-full px-4 py-3.5 rounded-xl',
                isActive 
                  ? 'bg-indigo-50/70' 
                  : 'hover:bg-slate-50'
              )}
            >
              {isActive && (
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 bg-indigo-500 rounded-r-full",
                  isSidebarCollapsed ? "w-1.5 h-8" : "w-1.5 h-3/4"
                )} />
              )}
              
              <item.icon 
                className={cn(
                  "flex-shrink-0 transition-colors duration-200", 
                  isSidebarCollapsed ? "h-6 w-6" : "h-[22px] w-[22px]",
                  isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              
              {!isSidebarCollapsed && (
                <span className={cn(
                  "font-bold text-[15px] transition-colors duration-200",
                  isActive ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-800"
                )}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
