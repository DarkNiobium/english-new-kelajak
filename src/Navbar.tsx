import { Link } from 'react-router-dom';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { Button } from '@/Button';
import { useUiStore } from '@/uiStore';
import { useUserStore } from '@/userStore';

export const Navbar = () => {
  const { isDarkMode, toggleDarkMode } = useUiStore();
  const { user } = useUserStore();

  return (
    <header className="sticky top-0 z-40 w-full flex h-16 items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="flex flex-1 items-center space-x-12">
        <div className="hidden max-w-md flex-1 md:block relative group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
          <input 
            type="text"
            placeholder="Search..."
            className="h-10 w-full bg-transparent border-none pl-8 pr-4 text-sm font-medium focus:ring-0 outline-none transition-all placeholder:text-slate-400 text-slate-900"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button
          onClick={toggleDarkMode}
          className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg bg-slate-50">
          <Bell className="h-4 w-4 text-slate-500" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-600 border-2 border-white" />
        </Button>

        <div className="h-6 w-px bg-slate-100 mx-2" />

        <Link to="/profile" className="flex items-center space-x-5 group">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{user?.name || 'Profile'}</span>
            <span className="text-[10px] font-medium text-slate-400">Level {user?.level || '1'}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm transition-all group-hover:bg-indigo-50 group-hover:text-indigo-600">
            {user?.name?.[0] || 'U'}
          </div>
        </Link>
      </div>
    </header>
  );
};
