import * as React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, Menu, User } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 backdrop-blur-md md:px-6">
      <div className="md:hidden flex items-center mr-4">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 items-center space-x-4">
        <div className="hidden max-w-md flex-1 md:block">
          <Input 
            icon={<Search className="h-4 w-4" />} 
            placeholder="Search courses, lessons..."
            className="h-10 bg-gray-50 dark:bg-gray-900 border-none"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--surface)]" />
        </Button>
        <div className="flex items-center space-x-2 rounded-full border border-[var(--border)] p-1 pr-3 hover:bg-[var(--surface-hover)] cursor-pointer transition-colors">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <span className="text-sm font-medium hidden sm:block">Anasxon</span>
        </div>
      </div>
    </header>
  );
};
