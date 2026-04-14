import { Link } from 'react-router-dom';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useUiStore } from '@/shared/store/ui';
import { useUserStore } from '@/entities/user/store';

export const Navbar = () => {
  const { isDarkMode, toggleDarkMode } = useUiStore();
  const { user } = useUserStore();

  return (
    <header className="sticky top-0 z-40 w-full flex h-24 items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="flex flex-1 items-center space-x-12">
        <div className="hidden max-w-md flex-1 md:block relative group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
          <input 
            type="text"
            placeholder="Search network nodes..."
            className="h-10 w-full bg-transparent border-none pl-8 pr-4 text-xs font-bold focus:ring-0 outline-none transition-all placeholder:text-slate-300 text-slate-900"
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

        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full bg-slate-50">
          <Bell className="h-4 w-4 text-slate-400" />
          <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-indigo-600 ring-2 ring-white" />
        </Button>

        <div className="h-6 w-px bg-slate-100 mx-2" />

        <Link to="/profile" className="flex items-center space-x-5 group">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">{user?.name || 'Identity'}</span>
            <span className="text-[9px] font-bold text-slate-300 tracking-[0.2em] uppercase">Level {user?.level || 'Alpha'}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-slate-200 group-hover:scale-105 transition-transform">
            {user?.name?.[0] || 'K'}
          </div>
        </Link>
      </div>
    </header>
  );
};
